<script setup lang="ts">
withDefaults(
  defineProps<{
    read?: boolean
    checked?: boolean
    practiceAvailable?: boolean | null
    hasChallenge?: boolean
  }>(),
  { read: false, checked: false, practiceAvailable: null, hasChallenge: true },
)
</script>
<template>
  <ol class="learning-path" aria-label="学习路径">
    <li :class="{ done: read }">
      <span>{{ read ? '✓' : '1' }}</span
      ><strong>先学一学</strong><small>{{ read ? '已读完课程' : '读懂方法和例子' }}</small>
    </li>
    <li :class="{ done: checked }">
      <span>{{ checked ? '✓' : '2' }}</span
      ><strong>{{ practiceAvailable === false ? '回想与表达' : '检查理解' }}</strong
      ><small>{{
        checked
          ? '已留下答题记录'
          : practiceAvailable === false
            ? '读完后说说自己的理解'
            : '做几道教材练习'
      }}</small>
    </li>
    <li>
      <span>3</span><strong>{{ hasChallenge ? '巩固与拓展' : '回看与复习' }}</strong
      ><small>{{ hasChallenge ? '按需要选择闯关和再练' : '回看内容，复习易忘的地方' }}</small>
    </li>
  </ol>
</template>
<style scoped>
.learning-path {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
  list-style: none;
}
.learning-path li {
  display: grid;
  gap: 5px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface, #fff);
}
.learning-path span {
  color: var(--color-primary);
  font-weight: 800;
}
.learning-path small {
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.learning-path .done {
  background: var(--color-primary-50, #edf4e7);
}
@media (max-width: 480px) {
  .learning-path li {
    padding: 10px 7px;
  }
  .learning-path strong {
    font-size: 13px;
  }
  .learning-path small {
    font-size: 11px;
  }
}
</style>
