<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import ThinkingIslandArt from '@/components/thinking/ThinkingIslandArt.vue'
import { thinkingIslands, thinkingMissions, findThinkingIsland } from '@/data/thinking/islands'
import { useThinkingProfile } from '@/composables/useThinkingProfile'
import '@/styles/thinking.css'

const route = useRoute()
const { thinking } = useThinkingProfile()
const islandId = computed(() => String(route.params.islandId ?? ''))
const island = computed(() => findThinkingIsland(islandId.value))
const missions = computed(() => thinkingMissions.filter((m) => m.islandId === islandId.value))
const done = (id: string) => thinking.completed(id).length
const islandDone = (id: string) =>
  thinkingMissions.filter((m) => m.islandId === id).reduce((n, m) => n + done(m.id), 0)
</script>
<template>
  <AppShell context="课外探索 · 思维训练" :show-bottom-nav="true">
    <div class="thinking-page content-container">
      <nav class="thinking-breadcrumb" aria-label="探索导航">
        <RouterLink to="/home">首页</RouterLink><RouterLink to="/learning-map">教材地图</RouterLink
        ><RouterLink v-if="islandId" to="/thinking-islands">全部思维岛</RouterLink>
      </nav>
      <template v-if="!islandId || island">
        <header
          class="thinking-hero"
          :style="
            island ? { '--thinking-color': island.color, '--thinking-soft': island.softColor } : {}
          "
        >
          <div>
            <p class="thinking-eyebrow">
              {{ island ? '新的线索，等你发现' : '课本之外的好奇心探险' }}
            </p>
            <h1>{{ island?.title ?? '欢迎来到思维群岛' }}</h1>
            <p>
              {{
                island?.description ??
                '这里不用选教材。和团子一起找规律、解线索、走小路，把一个问题想得更清楚。'
              }}
            </p>
            <div class="thinking-chips">
              <span>原创小游戏</span><span>不限时</span><span>可以反复试</span>
            </div>
          </div>
          <ThinkingIslandArt v-if="island" :island-id="island.id" />
          <KnowledgeDangoPlaceholder v-else size="lg" state="encourage" />
        </header>
        <p v-if="thinking.warning" class="thinking-warning" role="status">{{ thinking.warning }}</p>
        <template v-if="!island">
          <div class="thinking-section-title">
            <h2>今天想练哪一种思考？</h2>
            <p>可以从入门开始，也可以自由选择挑战。</p>
          </div>
          <div class="thinking-islands-grid">
            <article
              v-for="item in thinkingIslands"
              :key="item.id"
              class="thinking-island-card"
              :style="{ '--thinking-color': item.color, '--thinking-soft': item.softColor }"
            >
              <ThinkingIslandArt :island-id="item.id" />
              <div class="thinking-island-card__copy">
                <p class="thinking-eyebrow">{{ item.skill }}</p>
                <h3>{{ item.title }}</h3>
                <p>{{ item.subtitle }}</p>
                <p class="thinking-muted">
                  3 条训练路线 · 已完成 {{ islandDone(item.id) }} / 12 个任务
                </p>
                <RouterLink :to="'/thinking-islands/' + item.id" class="thinking-button"
                  >进入{{ item.title }}<AppIcon name="arrow-right" :size="18" decorative
                /></RouterLink>
              </div>
            </article>
          </div>
        </template>
        <template v-else>
          <div class="thinking-section-title">
            <h2>挑一条路线出发</h2>
            <p>每条路线 4 个任务。进度只记录完成情况，不是能力评分。</p>
          </div>
          <ol
            class="thinking-mission-map"
            :style="{ '--thinking-color': island.color, '--thinking-soft': island.softColor }"
          >
            <li
              v-for="(mission, index) in missions"
              :key="mission.id"
              class="thinking-mission-stop"
            >
              <span class="thinking-stop-number" aria-hidden="true">{{ index + 1 }}</span>
              <div>
                <span class="thinking-level">{{ mission.level }}</span>
                <h3>{{ mission.title }}</h3>
                <p>{{ mission.description }}</p>
                <p class="thinking-muted">
                  已完成 {{ done(mission.id) }} / {{ mission.puzzles.length }} 个任务
                </p>
                <RouterLink
                  :to="`/thinking-islands/${island.id}/${mission.id}`"
                  class="thinking-button"
                  >{{
                    done(mission.id) === mission.puzzles.length
                      ? '回看与再挑战'
                      : done(mission.id)
                        ? '继续训练'
                        : '开始训练'
                  }}<span class="sr-only">：{{ mission.title }}</span
                  ><AppIcon name="arrow-right" :size="18" decorative
                /></RouterLink>
              </div>
            </li>
          </ol>
        </template>
        <p class="thinking-note">
          每个学习档案的小脚印分别保存在这个浏览器，与课本练习分开记录。这不是智力测评。
        </p>
      </template>
      <section v-else class="thinking-empty">
        <h1>这座小岛还没有开放</h1>
        <p>回到群岛，选一座已经开放的小岛吧。</p>
        <RouterLink to="/thinking-islands" class="thinking-button">返回思维群岛</RouterLink>
      </section>
    </div>
  </AppShell>
</template>
