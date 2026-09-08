<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePetStore } from '@/stores/petStore'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { petDay, type PetSourceKind } from '@/services/pet/petPolicy'
import { petSourceLabels } from '@/services/pet/petPresentation'
import '@/styles/pet.css'
const pet = usePetStore(),
  { profileId } = useLearningProfile()
const range = ref('7'),
  source = ref<PetSourceKind | ''>('')
watch(
  profileId,
  (id) => {
    void pet.sync(id)
  },
  { immediate: true },
)
const credits = computed(() => {
  const now = new Date().toISOString()
  const firstDay =
    range.value === 'all'
      ? ''
      : petDay(new Date(Date.now() - (Number(range.value) - 1) * 86400000).toISOString())
  return (pet.account?.events ?? [])
    .filter((e) => e.kind === 'credit')
    .filter(
      (e) =>
        (range.value === 'all' || (e.day >= firstDay && e.day <= petDay(now))) &&
        (!source.value || e.sourceKind === source.value),
    )
})
const totals = computed(() =>
  Object.entries(petSourceLabels)
    .filter(([key]) => !source.value || source.value === key)
    .map(([key, title]) => {
      const items = credits.value.filter((e) => e.sourceKind === key)
      return {
        title,
        count: items.length,
        amount: items.reduce((n, e) => n + e.amount, 0),
        capped: items.reduce((n, e) => n + e.requested - e.amount, 0),
      }
    }),
)
</script>
<template>
  <section class="pet-garden" aria-labelledby="pet-parent-title">
    <h2 id="pet-parent-title">学习积分来源</h2>
    <p>
      当前档案累计获得 {{ pet.summary.totalEarned }}，消费 {{ pet.summary.totalSpent }}，可用
      {{ pet.summary.balance }}。积分反映参与记录，不代表掌握程度。
    </p>
    <p v-if="pet.error" role="alert">{{ pet.error }}</p>
    <p v-if="pet.warning" role="status">{{ pet.warning }}</p>
    <div class="pet-actions">
      <label
        >时间
        <select v-model="range">
          <option value="7">最近7天</option>
          <option value="30">最近30天</option>
          <option value="all">全部</option>
        </select></label
      ><label
        >来源
        <select v-model="source">
          <option value="">全部来源</option>
          <option v-for="(title, key) in petSourceLabels" :key="key" :value="key">
            {{ title }}
          </option>
        </select></label
      >
    </div>
    <div class="pet-table-wrap">
      <table class="pet-source-table">
        <caption>
          按奖励计入日统计（北京时间）
        </caption>
        <thead>
          <tr>
            <th scope="col">来源</th>
            <th scope="col">记录数</th>
            <th scope="col">实得积分</th>
            <th scope="col">上限未发</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in totals" :key="item.title">
            <th scope="row">{{ item.title }}</th>
            <td>{{ item.count }}</td>
            <td>{{ item.amount }}</td>
            <td>{{ item.capped }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!credits.length">所选范围还没有积分记录。</p>
    <p>一项学习可能达到多个奖励目标，记录数不等于题数。没有日期的旧记录按首次结算日统计。</p>
    <RouterLink to="/achievements" class="pet-button pet-button--light"
      >查看小屋与完整收支</RouterLink
    >
  </section>
</template>
