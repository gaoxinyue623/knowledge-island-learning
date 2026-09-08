<script setup lang="ts">
import { computed } from 'vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import { petCompanions, petDecorations } from '@/services/pet/petPolicy'
import { usePetStore } from '@/stores/petStore'
const pet = usePetStore()
const disabled = computed(() => pet.loading || pet.busy || Boolean(pet.error) || !pet.summary.name)
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
      <p>每件只需兑换一次。背景和摆件可自由搭配，不影响经验。</p>
    </div>
    <div class="pet-decoration-grid">
      <article v-for="item in petDecorations" :key="item.id" class="pet-food-card">
        <span class="pet-food-symbol" aria-hidden="true">{{ item.symbol }}</span>
        <h4>{{ item.name }}</h4>
        <p>{{ item.slot === 'landscape' ? '背景' : '摆件' }} · {{ item.cost }} 积分</p>
        <button
          v-if="!pet.summary.decorations.includes(item.id)"
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled || pet.summary.balance < item.cost"
          @click="pet.act({ kind: 'decorate-buy', decorationId: item.id })"
        >
          兑换{{ item.name }}
        </button>
        <button
          v-else-if="pet.summary.equipped[item.slot] !== item.id"
          type="button"
          class="pet-button"
          :disabled="disabled"
          @click="pet.act({ kind: 'decorate-equip', decorationId: item.id })"
        >
          布置{{ item.name }}
        </button>
        <button
          v-else
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="pet.act({ kind: 'decorate-clear', slot: item.slot })"
        >
          收起{{ item.name }}
        </button>
      </article>
    </div>
  </section>
</template>
