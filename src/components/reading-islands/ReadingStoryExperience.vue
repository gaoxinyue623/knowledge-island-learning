<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import LessonReadingPanel from '@/components/lesson-player/LessonReadingPanel.vue'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import EvidenceWorkshop from '@/components/hands-on/EvidenceWorkshop.vue'
import ListenPlaceWorkshop from '@/components/hands-on/ListenPlaceWorkshop.vue'
import { storyEvidencePractice } from '@/services/content-expansion/evidencePractice'
import {
  createStoryPractice,
  readingStoryBlocks,
  readingStorySpeechBlocks,
} from '@/services/reading-islands/readingStoryAdapter'
import type { ReadingStory } from '@/types/reading-islands'

const props = defineProps<{ story: ReadingStory; profileId: string; muted: boolean }>()
const blocks = computed(() => readingStoryBlocks(props.story))
const speechBlocks = computed(() => readingStorySpeechBlocks(props.story))
const quest = computed(() => createStoryPractice(props.story))
const evidencePractice = computed(() => storyEvidencePractice(props.story))
const selfChecks = ref<string[]>([])
const showSample = ref(false)
watch(
  () => [props.story.id, props.profileId],
  () => {
    selfChecks.value = []
    showSample.value = false
  },
)
</script>
<template>
  <div class="reading-experience">
    <aside class="reading-before" aria-labelledby="reading-before-title">
      <AppIcon name="lightbulb" :size="26" decorative />
      <div>
        <h2 id="reading-before-title">出发前，猜一猜</h2>
        <p>{{ story.beforeReading }}</p>
        <small>先保留你的猜想，读完再看看有没有新发现。</small>
      </div>
    </aside>
    <nav class="reading-steps" aria-label="阅读活动导航">
      <a href="#knowledge-reading">01 读故事</a><a href="#reading-word-bank">02 认词语</a
      ><a href="#reading-challenges">03 闯关练习</a>
      <a v-if="evidencePractice || story.language === 'english'" href="#reading-hands-on"
        >04 动手练习</a
      >
      <a href="#reading-expression">05 开口表达</a>
    </nav>
    <div class="reading-story-text">
      <LessonReadingPanel
        :blocks="blocks"
        :speech-blocks="speechBlocks"
        :subject="story.language"
        :muted="muted"
        heading="故事时间"
      >
        <template #note
          >原创课外短文，不是教材原文。段落序号可以帮助你回找线索。{{
            story.language === 'english'
              ? '可以先听一句，再停下来跟读；中文帮助在故事下方。'
              : '不必赶时间，遇到不懂的词，先看看下面的词语袋。'
          }}</template
        >
      </LessonReadingPanel>
    </div>
    <details v-if="story.translations" class="reading-help">
      <summary>需要帮助？展开逐段中文参考</summary>
      <ol>
        <li v-for="(translation, index) in story.translations" :key="index">{{ translation }}</li>
      </ol>
    </details>
    <section
      id="reading-word-bank"
      class="reading-pocket"
      aria-labelledby="reading-word-bank-title"
    >
      <div class="reading-section-heading">
        <div>
          <p class="reading-eyebrow">带走四个新朋友</p>
          <h2 id="reading-word-bank-title">
            {{ story.language === 'english' ? 'Word pocket · 单词袋' : '词语袋' }}
          </h2>
        </div>
        <AppIcon name="book-marked" :size="30" decorative />
      </div>
      <p class="reading-small">
        先猜意思，再翻开词卡。{{
          story.language === 'english'
            ? '上方跟读角还可以选择「单词」听读。'
            : '想一想，还能在哪句话里用到它？'
        }}
      </p>
      <div class="reading-word-grid">
        <details v-for="word in story.vocabulary" :key="word.word" class="reading-word">
          <summary>
            <strong :lang="story.language === 'english' ? 'en' : 'zh-CN'">{{ word.word }}</strong
            ><span>翻开词卡</span>
          </summary>
          <p>{{ word.meaning }}</p>
        </details>
      </div>
    </section>
    <section
      id="reading-challenges"
      aria-labelledby="reading-challenges-title"
      class="reading-challenges"
    >
      <div class="reading-section-heading">
        <div>
          <p class="reading-eyebrow">找到线索，再说理由</p>
          <h2 id="reading-challenges-title">阅读闯关 · {{ quest.stages.length }} 关</h2>
        </div>
      </div>
      <ReadingQuest
        :key="quest.id + ':' + profileId"
        :quest="quest"
        :profile-id="profileId"
        reading-label="回看故事"
        note="这是独立的课外练习，不计入教材掌握度或正式错题本。通过的关卡保存在这台设备，刷新后可以继续；未提交的答案不保存。"
      />
    </section>
    <EvidenceWorkshop
      v-if="evidencePractice"
      id="reading-hands-on"
      :key="story.id + ':' + profileId + ':evidence'"
      :practice="evidencePractice"
      :profile-id="profileId"
    />
    <ListenPlaceWorkshop
      v-if="story.language === 'english'"
      id="reading-hands-on"
      :key="story.id + ':' + profileId + ':listen-place'"
      :profile-id="profileId"
      :context-id="story.id"
      :muted="muted"
    />
    <section
      id="reading-expression"
      class="reading-expression"
      aria-labelledby="reading-expression-title"
    >
      <p class="reading-eyebrow">最后，把自己的想法说出来</p>
      <h2 id="reading-expression-title">
        {{ story.language === 'english' ? 'Your turn · 轮到你说' : '小小分享家' }}
      </h2>
      <p>{{ story.expression.prompt }}</p>
      <blockquote :lang="story.language === 'english' ? 'en' : 'zh-CN'">
        {{ story.expression.frame }}
      </blockquote>
      <p class="reading-small">
        可以对同伴或家人说，也可以先自己练一遍。这一环节不录音、不自动评分。
      </p>
      <fieldset class="reading-self-check">
        <legend>说完以后，我来检查</legend>
        <label v-for="item in story.expression.checklist" :key="item"
          ><input v-model="selfChecks" type="checkbox" :value="item" /><span>{{
            item
          }}</span></label
        >
      </fieldset>
      <button
        class="reading-link reading-link--soft"
        :aria-expanded="showSample"
        aria-controls="reading-expression-sample"
        @click="showSample = !showSample"
      >
        {{ showSample ? '收起表达示例' : '看一个表达示例' }}
      </button>
      <div v-if="showSample" id="reading-expression-sample" class="reading-sample">
        <p :lang="story.language === 'english' ? 'en' : 'zh-CN'">{{ story.expression.sample }}</p>
        <small>这只是一个例子，你可以有不同的想法。</small>
      </div>
    </section>
  </div>
</template>
