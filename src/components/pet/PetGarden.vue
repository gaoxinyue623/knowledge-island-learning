<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { usePetStore } from '@/stores/petStore'
import {
  PET_DAILY_LIMIT,
  petDay,
  petEarningRules,
  petFoods,
  petStages,
  petCompanions,
  petDecorations,
} from '@/services/pet/petPolicy'
import PetCollection from './PetCollection.vue'
import PetCloudPanel from './PetCloudPanel.vue'
import { describePetEvent, petEventAmount } from '@/services/pet/petPresentation'
import '@/styles/pet.css'
const pet = usePetStore()
const { profileId } = useLearningProfile()
const name = ref('团团'),
  renameOpen = ref(false),
  historyLimit = ref(8),
  affection = ref(false)
const characterId = computed(
  () => petCompanions.find((p) => p.id === pet.summary.activePetId)?.characterId,
)
const ornament = computed(() => petDecorations.find((d) => d.id === pet.summary.equipped.ornament))
watch(
  () => pet.summary.activePetId,
  () => {
    renameOpen.value = false
    affection.value = false
  },
)
const stage = computed(() => petStages[pet.summary.stageIndex]!)
const nextStage = computed(() => petStages[pet.summary.stageIndex + 1])
const today = computed(() => {
  void pet.account
  return petDay(new Date().toISOString())
})
const todayEarned = computed(() => pet.summary.dailyEarned[today.value] ?? 0)
const history = computed(() => [...(pet.account?.events ?? [])].reverse())
const disabled = computed(() => pet.loading || pet.busy || Boolean(pet.error) || !pet.account)
watch(
  profileId,
  (id) => {
    name.value = '团团'
    renameOpen.value = false
    historyLimit.value = 8
    affection.value = false
    void pet.sync(id)
  },
  { immediate: true },
)
async function saveName() {
  if (!name.value.trim() || name.value.trim().length > 12) return
  if (
    await pet.act(
      pet.summary.activePetId
        ? { kind: 'name-pet', petId: pet.summary.activePetId, name: name.value }
        : { kind: 'adopt', name: name.value },
    )
  )
    renameOpen.value = false
}
function editName() {
  name.value = pet.summary.name ?? '团团'
  renameOpen.value = true
}
function dateLabel(at: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(at))
}
</script>
<template>
  <section
    class="pet-garden"
    aria-labelledby="pet-garden-title"
    :aria-busy="pet.busy || pet.loading"
  >
    <header class="pet-garden-heading">
      <div>
        <p class="pet-eyebrow">学习的收获，陪伙伴长大</p>
        <h2 id="pet-garden-title">我的宠物小屋</h2>
        <p>学一点，喂一口。每次回来，都有人等你分享新发现。</p>
      </div>
      <button
        type="button"
        class="pet-button pet-button--light"
        :disabled="pet.loading || pet.busy"
        @click="pet.sync(profileId)"
      >
        刷新积分
      </button>
    </header>
    <div v-if="pet.error" class="pet-notice" role="alert">
      <p>{{ pet.error }}</p>
      <p>读取成功后才能兑换和喂养。</p>
    </div>
    <p v-if="pet.warning" class="pet-notice" role="status">{{ pet.warning }}</p>
    <p v-if="pet.loading && !pet.account" role="status">正在打开宠物小屋……</p>
    <template v-if="pet.account">
      <div class="pet-balance-grid" aria-label="积分概览">
        <div>
          <span>可用积分</span><strong>{{ pet.summary.balance }}</strong
          ><small>兑换食物、伙伴和装饰</small>
        </div>
        <div>
          <span>累计学习积分</span><strong>{{ pet.summary.totalEarned }}</strong
          ><small>喂养不会减少</small>
        </div>
        <div>
          <span>今日获得</span
          ><strong
            >{{ todayEarned }}<small> / {{ PET_DAILY_LIMIT }}</small></strong
          ><small>北京时间，每日额度</small>
        </div>
      </div>
      <div class="pet-home-layout">
        <div
          class="pet-home-scene"
          :class="[
            `pet-home-scene--${pet.summary.stageIndex}`,
            `pet-landscape--${pet.summary.equipped.landscape ?? 'default'}`,
          ]"
        >
          <span class="pet-scene-cloud pet-scene-cloud--one" aria-hidden="true">☁</span
          ><span class="pet-scene-cloud pet-scene-cloud--two" aria-hidden="true">☁</span>
          <div
            :key="pet.feedAnimation"
            class="pet-character"
            :class="{ 'pet-character--fed': pet.feedAnimation > 0 }"
          >
            <span class="pet-character-crown" aria-hidden="true">{{
              pet.summary.name ? stage.symbol : '🌱'
            }}</span>
            <KnowledgeDangoPlaceholder
              size="lg"
              :character-id="characterId"
              :state="affection ? 'happy' : 'idle'"
              :label="pet.summary.name ?? '等待领养的团子'"
            />
          </div>
          <span v-if="ornament" class="pet-scene-ornament" :aria-label="ornament.name">{{
            ornament.symbol
          }}</span>
          <div class="pet-scene-caption">
            <strong>{{ pet.summary.name ?? '你好，我是团子' }}</strong
            ><span>{{ pet.summary.name ? stage.title : '想和你一起探索知识岛' }}</span>
          </div>
        </div>
        <div class="pet-companion-panel">
          <template v-if="!pet.summary.name || renameOpen">
            <h3>{{ pet.summary.name ? '给伙伴换个名字' : '领养你的学习伙伴' }}</h3>
            <p>领养免费。以后每次学习，都可以为它攒一点食物。</p>
            <form class="pet-name-form" @submit.prevent="saveName">
              <label for="pet-name">宠物名字（1～12个字符）</label>
              <input
                id="pet-name"
                v-model="name"
                maxlength="12"
                autocomplete="off"
                :disabled="disabled"
              />
              <button class="pet-button" type="submit" :disabled="disabled || !name.trim()">
                {{ pet.summary.name ? '保存名字' : '领养伙伴' }}
              </button>
              <button
                v-if="renameOpen"
                class="pet-button pet-button--light"
                type="button"
                @click="renameOpen = false"
              >
                取消
              </button>
            </form>
          </template>
          <template v-else>
            <p class="pet-eyebrow">伙伴成长 · 第 {{ pet.summary.stageIndex + 1 }} 阶段</p>
            <h3>{{ stage.title }}</h3>
            <p>{{ stage.description }}</p>
            <label for="pet-experience"
              >宠物经验 {{ pet.summary.experience
              }}{{ nextStage ? ` / ${nextStage.threshold}` : '' }}</label
            >
            <progress id="pet-experience" :value="pet.summary.progress" max="100" />
            <p>
              {{
                nextStage
                  ? `再获得${nextStage.threshold - pet.summary.experience}点经验，成为${nextStage.title}。`
                  : '所有形态都已解锁，仍可以继续喂养和陪伴。'
              }}
            </p>
            <p>累计喂养 {{ pet.summary.feedCount }} 次 · 离开时会休息，不掉级。</p>
            <div class="pet-actions">
              <button type="button" class="pet-button" @click="affection = !affection">
                摸摸伙伴</button
              ><button
                type="button"
                class="pet-button pet-button--light"
                :disabled="disabled"
                @click="editName"
              >
                修改名字
              </button>
            </div>
            <p v-if="affection" role="status">“见到你就很开心！今天有什么新发现？”</p>
          </template>
        </div>
      </div>
      <p v-if="pet.message" role="status" class="pet-message">{{ pet.message }}</p>
      <section class="pet-food-section" aria-labelledby="pet-food-title">
        <div class="pet-section-heading">
          <h3 id="pet-food-title">食物小铺与背包</h3>
          <p>兑换后放进背包，再选择喂给伙伴。</p>
        </div>
        <p v-if="!pet.summary.name" class="pet-muted">先完成免费领养，就能兑换和喂养啦。</p>
        <div class="pet-food-grid">
          <article v-for="food in petFoods" :key="food.id" class="pet-food-card">
            <span class="pet-food-symbol" aria-hidden="true">{{ food.symbol }}</span>
            <h4>{{ food.name }}</h4>
            <p>{{ food.description }}</p>
            <p>
              <strong>{{ food.cost }} 积分</strong> · 喂养 +{{ food.experience }} 经验
            </p>
            <p class="pet-inventory" :aria-label="`${food.name}库存`">
              背包里有 {{ pet.summary.inventory[food.id] }} 份
            </p>
            <div class="pet-actions">
              <button
                class="pet-button pet-button--light"
                type="button"
                :aria-label="`兑换${food.name}`"
                :disabled="disabled || !pet.summary.name || pet.summary.balance < food.cost"
                @click="pet.act({ kind: 'buy', foodId: food.id })"
              >
                {{ pet.summary.balance < food.cost ? '积分不足' : '兑换一份' }}</button
              ><button
                class="pet-button"
                type="button"
                :aria-label="`喂食${food.name}`"
                :disabled="disabled || !pet.summary.name || !pet.summary.inventory[food.id]"
                @click="
                  pet.summary.activePetId &&
                  pet.act({ kind: 'feed-pet', petId: pet.summary.activePetId, foodId: food.id })
                "
              >
                喂给{{ pet.summary.name ?? '伙伴' }}
              </button>
            </div>
          </article>
        </div>
      </section>
      <PetCollection />
      <section aria-labelledby="pet-album-title">
        <div class="pet-section-heading">
          <h3 id="pet-album-title">成长相册</h3>
          <p>{{ pet.summary.name ?? '伙伴' }}的成长纪念；切换伙伴可查看各自相册。</p>
        </div>
        <ol class="pet-album">
          <li
            v-for="(item, i) in petStages"
            :key="item.title"
            :class="{ 'is-unlocked': pet.summary.stageReachedAt[i] }"
          >
            <span aria-hidden="true">{{ item.symbol }}</span
            ><strong>{{ item.title }}</strong
            ><small>{{
              pet.summary.stageReachedAt[i]
                ? `已解锁 · ${dateLabel(pet.summary.stageReachedAt[i]!)}`
                : `${item.threshold} 经验解锁`
            }}</small>
          </li>
        </ol>
      </section>
      <section class="pet-learning-guide" aria-labelledby="pet-earn-title">
        <h3 id="pet-earn-title">怎样获得积分？</h3>
        <p>
          <span v-for="rule in petEarningRules" :key="rule.title"
            >{{ rule.title }} +{{ rule.points }}；</span
          >
        </p>
        <p>
          课程和练习按内容首次奖励；复习和错题按同一内容每天一次。不同奖励可以叠加，每天最多获得
          {{ PET_DAILY_LIMIT }} 积分。使用提示、改正后完成，不扣奖励。
        </p>
        <p v-if="todayEarned >= PET_DAILY_LIMIT">
          今天的积分额度已经用完，学习进度仍会正常记录。休息一下也很好。
        </p>
        <div class="pet-actions">
          <RouterLink to="/learning-map" class="pet-button">去教材地图</RouterLink
          ><RouterLink to="/thinking-islands" class="pet-button pet-button--light"
            >去思维群岛</RouterLink
          ><RouterLink to="/reading-islands" class="pet-button pet-button--light"
            >去阅读群岛</RouterLink
          >
        </div>
        <details>
          <summary>历史记录和积分规则</summary>
          <p>
            符合来源规则且成功保存的学习才会结算。旧课程奖励按原完成日期结算；没有日期的旧思维记录和闯关记录按首次结算日计算。超过当天额度的部分不在次日补发，重玩、换题版本和重复刷新不会重复领取。同一知识点的课程、练习和闯关是不同完成目标，各自只领一次。
          </p>
          <p>
            积分用于陪伴和喂养，不代表学科掌握程度；教材成长能量在下方单独展示。积分、背包和宠物保存在这个浏览器，可在下方由家长登录，备份或恢复宠物小屋。
          </p>
        </details>
      </section>
      <section aria-labelledby="pet-ledger-title">
        <div class="pet-section-heading">
          <h3 id="pet-ledger-title">积分与喂养记录</h3>
          <p>
            累计获得 {{ pet.summary.totalEarned }} − 累计消费 {{ pet.summary.totalSpent }} = 可用
            {{ pet.summary.balance }}
          </p>
        </div>
        <p v-if="!history.length" class="pet-muted">还没有记录。领养伙伴，完成第一次学习吧。</p>
        <ol v-else class="pet-ledger">
          <li v-for="event in history.slice(0, historyLimit)" :key="event.id">
            <div>
              <strong>{{ describePetEvent(event) }}</strong
              ><small
                >{{ dateLabel(event.at)
                }}{{ event.kind === 'credit' ? ` · 计入${event.day}额度` : '' }}</small
              >
            </div>
            <span>{{ petEventAmount(event) }}</span>
          </li>
        </ol>
        <button
          v-if="history.length > historyLimit"
          type="button"
          class="pet-button pet-button--light"
          @click="historyLimit += 20"
        >
          查看更多记录
        </button>
      </section>
      <PetCloudPanel />
    </template>
  </section>
</template>
