<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import PetStoryCard from '@/components/pet-stories/PetStoryCard.vue'
import AppShell from '@/layouts/AppShell.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import {
  petStoryService,
  type PetStory,
} from '@/services/pet-stories/petStoryService'
import {
  createReviewLaunchHref,
  spacedReviewService,
} from '@/services/student-growth/spacedReview'
import { resolveCurrentQuestRevision } from '@/services/student-growth/currentQuestResolver'

const router = useRouter()
const { profileId } = useLearningProfile()
const stories = ref<PetStory[]>([])
const loading = ref(false)
const warning = ref<string | null>(null)
let requestToken = 0

async function load() {
  const token = ++requestToken
  const requestedProfileId = profileId.value
  loading.value = true
  warning.value = null
  stories.value = []

  try {
    const evidence = spacedReviewService.listEvidence(requestedProfileId)
    const evidenceWarning = spacedReviewService.getLastWarning()
    if (evidenceWarning) throw new Error(evidenceWarning)
    const unique = new Map(evidence.map(item => [item.questId, item]))
    const resolvedRevisions = await Promise.all([...unique.values()].map(async (item) => ([
      item.questId,
      await resolveCurrentQuestRevision(item.courseHref),
    ] as const)))

    if (token !== requestToken || requestedProfileId !== profileId.value) return

    const currentRevisionByQuest: Record<string, string | null> = {}
    for (const [questId, revision] of resolvedRevisions) {
      currentRevisionByQuest[questId] = revision?.questId === questId
        ? revision.contentRevision
        : null
    }

    stories.value = petStoryService.list(
      requestedProfileId,
      evidence,
      currentRevisionByQuest,
    )
    warning.value = petStoryService.getLastWarning()
  } catch (caught) {
    if (token === requestToken && requestedProfileId === profileId.value) {
      stories.value = []
      warning.value = caught instanceof Error ? caught.message : '故事暂时无法整理，请稍后再试。'
    }
  } finally {
    if (token === requestToken && requestedProfileId === profileId.value) loading.value = false
  }
}

function evidenceFor(story: PetStory) {
  return spacedReviewService.listEvidence(profileId.value).find((item) => (
    `${item.questId}:${item.contentRevision}` === story.key
  ))
}

async function open(story: PetStory) {
  const evidence = evidenceFor(story)
  if (!evidence) return
  if (!petStoryService.open(profileId.value, evidence)) {
    warning.value = petStoryService.getLastWarning()
    return
  }
  await load()
}

function review(story: PetStory) {
  const evidence = evidenceFor(story)
  if (!evidence || !petStoryService.open(profileId.value, evidence)) {
    warning.value = spacedReviewService.getLastWarning() || petStoryService.getLastWarning() || '故事暂时无法打开，请重试。'
    return
  }
  const href = createReviewLaunchHref(story.courseHref, crypto.randomUUID())
  if (href) void router.push(href)
}

async function selfReport(story: PetStory, chapter: 'expression' | 'discovery') {
  const evidence = evidenceFor(story)
  if (!evidence) return
  if (!petStoryService.selfReport(
    profileId.value,
    evidence.questId,
    evidence.contentRevision,
    chapter,
  )) {
    warning.value = petStoryService.getLastWarning()
    return
  }
  await load()
}

watch(profileId, () => void load(), { immediate: true })
onBeforeUnmount(() => { requestToken++ })
</script>

<template>
  <AppShell context="团子的知识小故事">
    <div class="content-container pet-stories">
      <header>
        <p class="curriculum-eyebrow">和团子一起，把知识写进旅行手册</p>
        <h1>团子的知识小故事</h1>
        <p>复习章节需要完成打开故事后的新一轮练习；表达和发现由你自己记录，不会增加奖励或掌握度。</p>
      </header>

      <AppLoading v-if="loading" label="正在整理故事" />
      <div v-else-if="warning" role="status"><p>{{ warning }}</p><button type="button" @click="load">重新读取</button></div>
      <AppEmptyState
        v-else-if="!stories.length"
        title="还没有可讲述的故事"
        description="完成可验证的课程练习后，团子会带着真实题目来找你。"
      />
      <PetStoryCard
        v-for="story in stories"
        v-else
        :key="story.key"
        :story="story"
        @open="open(story)"
        @review="review(story)"
        @self-report="selfReport(story, $event)"
      />
    </div>
  </AppShell>
</template>

<style scoped>
.pet-stories { display: grid; gap: 1rem; padding-block: 1.5rem; }
.pet-stories header p { color: var(--color-text-secondary, #4b5563); }
</style>
