<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

import type { LiteracyTableGroup, LiteracyTablePresentation } from '@/types'

const props = defineProps<{ table: LiteracyTablePresentation }>()
const search = ref('')
const selectedGroup = ref('')
const controlId = useId()
watch(
  () => props.table,
  () => {
    search.value = ''
    selectedGroup.value = ''
  },
)

function searchable(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim()
}
const filteredGroups = computed(() => {
  const query = searchable(search.value)
  return props.table.groups.flatMap((group, index) => {
    if (selectedGroup.value && selectedGroup.value !== String(index)) return []
    const entries = query
      ? group.entries.filter((entry) =>
          searchable(
            typeof entry === 'string' ? entry : `${entry.character} ${entry.pinyin}`,
          ).includes(query),
        )
      : group.entries
    return entries.length ? [{ ...group, entries }] : []
  })
})
const isFiltered = computed(() => Boolean(search.value.trim() || selectedGroup.value))
const visibleEntryCount = computed(() =>
  filteredGroups.value.reduce((total, group) => total + group.entries.length, 0),
)
function resetFilters() {
  search.value = ''
  selectedGroup.value = ''
}
function groupLabel(group: LiteracyTableGroup): string {
  if (/^\d+$/.test(group.heading)) return `第${group.heading}课`
  if (group.heading === '语文园地' && group.gardenNumber !== null)
    return `语文园地${group.gardenNumber}`
  return group.heading
}

const countDescription = computed(() => {
  if (props.table.tableKind === 'recognition') {
    return `${props.table.declaredCount}个生字 · ${props.table.polyphonicCount}个蓝色多音字条目 · 共展示${props.table.entryCount}条`
  }

  const unit = props.table.tableKind === 'writing' ? '个字' : '个词'
  return `共${props.table.entryCount}${unit}`
})
</script>

<template>
  <section
    class="literacy-table"
    :class="`literacy-table--${props.table.tableKind}`"
    :aria-label="props.table.title"
  >
    <header class="literacy-table__header">
      <h3 class="literacy-table__title">{{ props.table.title }}</h3>
      <p class="literacy-table__count">{{ countDescription }}</p>
    </header>

    <div class="literacy-table__filters">
      <label :for="`${controlId}-search`">
        查找字词或拼音
        <input
          :id="`${controlId}-search`"
          v-model="search"
          type="search"
          placeholder="输入生字、拼音或词语"
          autocomplete="off"
          :spellcheck="false"
        />
      </label>
      <label :for="`${controlId}-group`">
        按课号查看
        <select :id="`${controlId}-group`" v-model="selectedGroup">
          <option value="">全部课号</option>
          <option v-for="(group, index) in props.table.groups" :key="index" :value="String(index)">
            {{ groupLabel(group) }}
          </option>
        </select>
      </label>
      <button v-if="isFiltered" type="button" @click="resetFilters">显示全部</button>
    </div>
    <p v-if="isFiltered" class="literacy-table__filter-result" role="status">
      找到 {{ visibleEntryCount }} 条，分布在 {{ filteredGroups.length }} 组。
    </p>
    <p v-if="!filteredGroups.length" class="literacy-table__empty">
      没有找到对应内容。可以换个字词或拼音，或选择“显示全部”。
    </p>
    <dl class="literacy-table__groups">
      <div
        v-for="(group, groupIndex) in filteredGroups"
        :key="`${group.sourceImage}-${groupIndex}`"
        class="literacy-table__group"
      >
        <dt class="literacy-table__label">{{ group.heading }}</dt>
        <dd class="literacy-table__entries">
          <template v-for="(entry, entryIndex) in group.entries" :key="entryIndex">
            <span v-if="typeof entry === 'string'" class="literacy-table__entry">
              {{ entry }}
            </span>
            <span
              v-else
              class="literacy-table__entry literacy-table__entry--recognition"
              :class="{ 'literacy-table__entry--polyphonic': entry.polyphonic }"
            >
              <ruby>
                {{ entry.character }}<rp>（</rp><rt>{{ entry.pinyin }}</rt
                ><rp>）</rp>
              </ruby>
            </span>
          </template>
        </dd>
      </div>
    </dl>

    <details v-if="props.table.sourcePages.length" class="literacy-table__sources">
      <summary>对照教材图片</summary>
      <p class="literacy-table__source-note">按提供的图片录入，保留原表的课号和条目顺序。</p>
      <figure
        v-for="page in props.table.sourcePages"
        :key="page.url"
        class="literacy-table__source-page"
      >
        <img :src="page.url" :alt="page.title" loading="lazy" decoding="async" />
        <figcaption>{{ page.title }}</figcaption>
      </figure>
    </details>
  </section>
</template>

<style scoped>
.literacy-table {
  --literacy-table-accent: #ab602c;
  --literacy-table-line: #e8d2bb;
  color: #263742;
  border: 1px solid var(--literacy-table-line);
  border-radius: 12px;
  background: #fffdf8;
  padding: 1em;
  font-family: var(--reader-font, 'Songti SC', 'STSong', 'SimSun', serif);
  font-size: var(--reader-text-size, 22px);
}

.literacy-table--writing {
  --literacy-table-accent: #286b8b;
  --literacy-table-line: #c8e0ea;
}

.literacy-table--words {
  --literacy-table-accent: #397653;
  --literacy-table-line: #cee2d2;
}

.literacy-table__header {
  margin-bottom: 1.25em;
  text-align: center;
}

.literacy-table__title {
  margin: 0;
  color: var(--literacy-table-accent);
  font-size: 1.2em;
  font-weight: 600;
  line-height: 1.5;
}

.literacy-table__count {
  margin: 0.55em 0 0;
  color: #54616a;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.62em;
  line-height: 1.8;
}

.literacy-table__groups {
  margin: 0;
}

.literacy-table__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;
  margin-bottom: 1em;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
}

.literacy-table__filters label {
  display: grid;
  flex: 1 1 160px;
  gap: 6px;
  min-width: 0;
}

.literacy-table__filters input,
.literacy-table__filters select,
.literacy-table__filters button {
  min-width: 0;
  min-height: 44px;
  max-width: 100%;
  border: 1px solid var(--literacy-table-line);
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
  color: #263742;
  font-size: 16px;
}

.literacy-table__filters :is(input, select, button):focus-visible {
  outline: 2px solid var(--literacy-table-accent);
  outline-offset: 2px;
}

.literacy-table__filter-result,
.literacy-table__empty {
  margin: 0 0 1em;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.8;
}

.literacy-table__group {
  display: grid;
  grid-template-columns: 4.2em minmax(0, 1fr);
  gap: 0.6em;
  align-items: start;
  padding: 0.7em 0;
  border-top: 1px solid var(--literacy-table-line);
}

.literacy-table__group:first-child {
  border-top: 0;
}

.literacy-table__label {
  padding-top: 0.3em;
  color: #47545b;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.7em;
  line-height: 1.8;
  white-space: nowrap;
}

.literacy-table__entries {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4em 0.8em;
  min-width: 0;
  margin: 0;
}

.literacy-table__entry {
  display: inline-block;
  flex: 0 0 auto;
  line-height: 1.8;
  white-space: nowrap;
}

.literacy-table--recognition .literacy-table__entries {
  align-items: flex-end;
  gap: 0.65em 0.35em;
}

.literacy-table__entry--recognition {
  min-width: 2.6em;
  padding-top: 0.65em;
  text-align: center;
  font-size: 1.1em;
  line-height: 1.55;
}

.literacy-table__entry--recognition ruby {
  ruby-position: over;
  ruby-align: center;
}

.literacy-table__entry--recognition rt {
  color: inherit;
  font-family: 'Avenir Next', 'Segoe UI', 'PingFang SC', sans-serif;
  font-size: 0.54em;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: 0;
}

.literacy-table__entry--polyphonic {
  color: #0879bb;
}

.literacy-table__sources {
  margin-top: 1.2em;
  padding-top: 0.7em;
  border-top: 1px solid var(--literacy-table-line);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.68em;
  line-height: 1.8;
}

.literacy-table__sources summary {
  width: fit-content;
  color: var(--literacy-table-accent);
  cursor: pointer;
}

.literacy-table__sources summary:focus-visible {
  outline: 2px solid var(--literacy-table-accent);
  outline-offset: 4px;
  border-radius: 2px;
}

.literacy-table__source-note {
  margin: 0.8em 0;
  color: #54616a;
}

.literacy-table__source-page {
  margin: 1em 0;
  text-align: center;
}

.literacy-table__source-page img {
  display: block;
  width: 100%;
  max-width: 640px;
  height: auto;
  margin: 0 auto;
  border: 1px solid var(--literacy-table-line);
  border-radius: 4px;
}

.literacy-table__source-page figcaption {
  margin-top: 0.4em;
  color: #54616a;
}

@media (max-width: 600px) {
  .literacy-table {
    padding: 0.75em 0.6em;
  }

  .literacy-table__group {
    grid-template-columns: 3.3em minmax(0, 1fr);
    column-gap: 0.35em;
  }

  .literacy-table__label {
    font-size: 0.65em;
  }

  .literacy-table__entries {
    column-gap: 0.65em;
  }
}

@media print {
  .literacy-table {
    border-radius: 0;
    background: #fff;
    padding: 0.5em;
    font-size: 16pt;
    print-color-adjust: exact;
  }

  .literacy-table__header,
  .literacy-table__group {
    break-inside: avoid;
  }

  .literacy-table__sources {
    display: none;
  }

  .literacy-table__filters {
    display: none;
  }
}
</style>
