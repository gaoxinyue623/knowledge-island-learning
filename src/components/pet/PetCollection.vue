<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import {
  petCompanions,
  petDecorations,
  petDecorationSlots,
  decorationSlotName,
  type DecorationSlot,
  type PetCommand,
} from '@/services/pet/petPolicy'
import { usePetStore } from '@/stores/petStore'
const pet = usePetStore()
const disabled = computed(() => pet.loading || pet.busy || Boolean(pet.error) || !pet.summary.name)
const emit = defineEmits<{ 'show-home': [] }>()
const decorationMessage = ref('')
const decorationSaved = ref(false)
const pendingDecoration = ref('')
const decorationCategory = ref<'all' | DecorationSlot>('all')
const ownedOnly = ref(false)
const decorationLimit = ref(8)
const filteredDecorations = computed(() =>
  petDecorations.filter(
    (item) =>
      (decorationCategory.value === 'all' || item.slot === decorationCategory.value) &&
      (!ownedOnly.value || pet.summary.decorations.includes(item.id)),
  ),
)
const visibleDecorations = computed(() => filteredDecorations.value.slice(0, decorationLimit.value))
const equippedDecorations = computed(() =>
  petDecorations.filter((item) => pet.summary.equipped[item.slot] === item.id),
)
watch([decorationCategory, ownedOnly], () => {
  decorationLimit.value = 8
})
watch(
  () => pet.profileId,
  () => {
    decorationMessage.value = ''
    decorationSaved.value = false
    pendingDecoration.value = ''
    decorationCategory.value = 'all'
    ownedOnly.value = false
    decorationLimit.value = 8
  },
)
async function decorate(item: (typeof petDecorations)[number], kind: 'buy' | 'equip' | 'clear') {
  const profile = pet.profileId
  pendingDecoration.value = item.id
  decorationSaved.value = false
  decorationMessage.value = `正在${kind === 'buy' ? '兑换' : kind === 'equip' ? '布置' : '收起'}${item.name}…`
  const command: PetCommand =
    kind === 'clear'
      ? { kind: 'decorate-clear', slot: item.slot }
      : { kind: kind === 'buy' ? 'decorate-buy' : 'decorate-equip', decorationId: item.id }
  const saved = await pet.act(command)
  if (pet.profileId !== profile) return
  pendingDecoration.value = ''
  decorationSaved.value = saved && kind !== 'buy'
  decorationMessage.value = saved
    ? kind === 'buy'
      ? `${item.name}已放入收藏，点击布置即可使用。`
      : kind === 'equip'
        ? `${item.name}已布置，小屋预览已更新。`
        : `${item.name}已收起，小屋预览已更新。`
    : pet.message || '小屋正在刷新，请稍后再试。'
}
</script>
<template>
  <section aria-labelledby="pet-collection-title" class="pet-food-section">
    <div class="pet-section-heading">
      <h3 id="pet-collection-title">伙伴收藏</h3>
      <p>各自成长，共享食物。新伙伴兑换后会来到小屋。</p>
    </div>
    <div class="pet-food-grid">
      <article v-for="item in petCompanions" :key="item.id" class="pet-food-card">
        <KnowledgeDangoPlaceholder :character-id="item.characterId" size="sm" />
        <h4>{{ item.name }}</h4>
        <template v-if="pet.summary.companions[item.id]">
          <p>
            {{ pet.summary.companions[item.id]!.name }} ·
            {{ pet.summary.companions[item.id]!.experience }} 经验
          </p>
          <button
            type="button"
            class="pet-button"
            :disabled="disabled || pet.summary.activePetId === item.id"
            @click="pet.act({ kind: 'select', petId: item.id })"
          >
            {{ pet.summary.activePetId === item.id ? '正在陪伴' : `选择${item.name}` }}
          </button>
        </template>
        <template v-else>
          <p>{{ item.cost ? `${item.cost} 积分 · 从 0 经验开始` : '在上方免费领养' }}</p>
          <button
            v-if="item.cost"
            type="button"
            class="pet-button pet-button--light"
            :disabled="disabled || pet.summary.balance < item.cost"
            @click="pet.act({ kind: 'collect', petId: item.id, name: item.name })"
          >
            兑换{{ item.name }}
          </button>
        </template>
      </article>
    </div>
  </section>
  <section aria-labelledby="pet-decorations-title" class="pet-food-section">
    <div class="pet-section-heading">
      <h3 id="pet-decorations-title">布置家园</h3>
      <p>
        {{ petDecorations.length }} 种装饰，每件只需兑换一次。7
        个布置位置可以一起搭配，同一位置更换时会替换原来的装饰。
      </p>
    </div>
    <div class="pet-home-arrangement">
      <div class="pet-section-heading">
        <p>当前布置 · {{ equippedDecorations.length }} / {{ petDecorationSlots.length }} 个位置</p>
        <button type="button" class="pet-button pet-button--light" @click="emit('show-home')">
          查看小屋
        </button>
      </div>
      <ul v-if="equippedDecorations.length" class="pet-equipped-list" aria-label="当前布置的装饰">
        <li v-for="item in equippedDecorations" :key="item.id">
          <img :src="item.image" alt="" /><span
            >{{ decorationSlotName(item.slot) }} · {{ item.name }}</span
          ><button
            type="button"
            :disabled="disabled"
            :aria-label="`收起${item.name}`"
            @click="decorate(item, 'clear')"
          >
            收起
          </button>
        </li>
      </ul>
      <p v-else class="pet-muted">小屋还没有布置装饰，先从喜欢的背景开始吧。</p>
    </div>
    <div class="pet-catalog-filters" aria-label="装饰分类">
      <button
        type="button"
        :aria-pressed="decorationCategory === 'all'"
        @click="decorationCategory = 'all'"
      >
        全部
      </button>
      <button
        v-for="slot in petDecorationSlots"
        :key="slot.id"
        type="button"
        :aria-pressed="decorationCategory === slot.id"
        @click="decorationCategory = slot.id"
      >
        {{ slot.name }}
      </button>
    </div>
    <label class="pet-catalog-toggle"
      ><input v-model="ownedOnly" type="checkbox" />只看已收藏的装饰（{{
        pet.summary.decorations.length
      }}
      件）</label
    >
    <div v-if="decorationMessage" class="pet-decoration-feedback" role="status" aria-live="polite">
      <p>{{ decorationMessage }}</p>
      <button
        v-if="decorationSaved"
        type="button"
        class="pet-button pet-button--light"
        @click="emit('show-home')"
      >
        查看小屋
      </button>
    </div>
    <p v-if="!filteredDecorations.length" class="pet-catalog-empty">
      还没有收藏这类装饰，取消筛选就能看看小铺里的新选择。
    </p>
    <div class="pet-decoration-grid">
      <article
        v-for="item in visibleDecorations"
        :key="item.id"
        class="pet-food-card"
        :class="{ 'pet-decoration-card--equipped': pet.summary.equipped[item.slot] === item.id }"
        :aria-busy="pendingDecoration === item.id"
      >
        <img
          class="pet-item-art"
          :class="{ 'pet-item-art--landscape': item.slot === 'landscape' }"
          :src="item.image"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <h4>{{ item.name }}</h4>
        <p v-if="pet.summary.equipped[item.slot] === item.id" class="pet-decoration-state">
          正在使用
        </p>
        <p>{{ decorationSlotName(item.slot) }} · {{ item.cost }} 积分</p>
        <p
          v-if="
            pet.summary.decorations.includes(item.id) && pet.summary.equipped[item.slot] !== item.id
          "
          class="pet-muted"
        >
          已收藏，可随时布置
        </p>
        <button
          v-if="!pet.summary.decorations.includes(item.id)"
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled || pet.summary.balance < item.cost"
          @click="decorate(item, 'buy')"
        >
          {{
            pendingDecoration === item.id
              ? '正在兑换…'
              : !pet.summary.name
                ? '先领养伙伴'
                : pet.summary.balance < item.cost
                  ? `还差 ${item.cost - pet.summary.balance} 积分`
                  : `兑换${item.name}`
          }}
        </button>
        <button
          v-else-if="pet.summary.equipped[item.slot] !== item.id"
          type="button"
          class="pet-button"
          :disabled="disabled"
          @click="decorate(item, 'equip')"
        >
          {{ pendingDecoration === item.id ? '正在布置…' : `布置${item.name}` }}
        </button>
        <button
          v-else
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="decorate(item, 'clear')"
        >
          {{ pendingDecoration === item.id ? '正在收起…' : `收起${item.name}` }}
        </button>
        <button
          v-if="pet.summary.equipped[item.slot] === item.id"
          type="button"
          class="pet-button pet-button--light"
          @click="emit('show-home')"
        >
          查看小屋
        </button>
      </article>
    </div>
    <div v-if="filteredDecorations.length" class="pet-catalog-footer">
      <span>已展示 {{ visibleDecorations.length }} / {{ filteredDecorations.length }} 件</span>
      <button
        v-if="visibleDecorations.length < filteredDecorations.length"
        type="button"
        class="pet-button pet-button--light"
        @click="decorationLimit += 8"
      >
        查看更多装饰
      </button>
    </div>
  </section>
</template>
