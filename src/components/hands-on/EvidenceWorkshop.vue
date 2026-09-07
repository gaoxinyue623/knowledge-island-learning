<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EvidencePractice } from '@/services/content-expansion/evidencePractice'
const props = defineProps<{ practice: EvidencePractice; profileId: string }>()
const selected = ref<string[]>([]),
  order = ref<string[]>([])
const found = ref(false),
  ordered = ref(false),
  said = ref(false),
  example = ref(false)
const feedback = ref(''),
  orderFeedback = ref('')
const cards = computed(() => [...props.practice.sequence.slice(1), props.practice.sequence[0]!])
function reset() {
  selected.value = []
  order.value = []
  found.value = false
  ordered.value = false
  said.value = false
  example.value = false
  feedback.value = ''
  orderFeedback.value = ''
}
watch(() => [props.profileId, JSON.stringify(props.practice)], reset)
function select(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((v) => v !== id)
    : [...selected.value, id]
  found.value = false
  feedback.value = ''
}
function checkEvidence() {
  found.value =
    selected.value.length === props.practice.evidenceIds.length &&
    props.practice.evidenceIds.every((id) => selected.value.includes(id))
  feedback.value = found.value
    ? '找到了！把你标记的原句读出来，再对照这个答案。'
    : '再看看谁、做了什么、结果怎样。只留下能直接支持答案的原句；一句不够时可以选两句。'
}
function pick(id: string) {
  if (ordered.value || order.value.includes(id)) return
  order.value.push(id)
  orderFeedback.value = ''
}
function remove(id: string) {
  order.value = order.value.filter((v) => v !== id)
  ordered.value = false
  said.value = false
  example.value = false
  orderFeedback.value = ''
}
function checkOrder() {
  ordered.value =
    order.value.length === props.practice.sequence.length &&
    props.practice.sequence.every((s, i) => order.value[i] === s.id)
  orderFeedback.value = ordered.value
    ? '顺序和原文一致。接下来，讲讲你这样排的理由。'
    : '还有一处顺序不合原文。点卡片取回，回看先后线索再排一次。'
}
</script>
<template>
  <section class="hands-on evidence-workshop" aria-label="原文证据与说理练习">
    <p class="hands-on__eyebrow">阅读小侦探 · 新增动手练习</p>
    <h3>点出原句，把理由讲清楚</h3>
    <p>原来的题目保留在上方。这里读原文、点证据，再排一排、说一说。</p>
    <div class="evidence-workshop__question">
      <strong>{{ practice.prompt }}</strong>
      <p>要验证的答案：{{ practice.answer }}</p>
    </div>
    <p>点击下面原文中的句子来标记；可以多选，再点一次取消。键盘 Tab 选句，回车标记。</p>
    <div class="evidence-workshop__paper" :class="{ 'is-verified': found }">
      <h4>《{{ practice.title.replace(/[《》]/g, '') }}》· 原文找线索</h4>
      <p v-for="(paragraph, pi) in practice.paragraphs" :key="pi">
        <button
          v-for="sentence in paragraph.sentences"
          :key="sentence.id"
          type="button"
          :data-sentence-id="sentence.id"
          :aria-pressed="selected.includes(sentence.id)"
          @click="select(sentence.id)"
        >
          {{ sentence.text }}
        </button>
      </p>
    </div>
    <div class="hands-on__actions">
      <button type="button" :disabled="!selected.length" @click="checkEvidence">检查我的证据</button
      ><span>已标记 {{ selected.length }} 句</span>
    </div>
    <p role="status">{{ feedback }}</p>
    <p v-if="found" class="hands-on__success">{{ practice.explanation }}</p>
    <h4>再排一排：原文先说了什么？</h4>
    <p>{{ practice.sequenceHint }}</p>
    <div class="evidence-workshop__order" aria-label="我排好的顺序">
      <p v-if="!order.length">点下面的卡片，把它们依次放在这里。</p>
      <button
        v-for="(id, i) in order"
        :key="id"
        type="button"
        :aria-label="`取回第${i + 1}张：${practice.sequence.find((s) => s.id === id)?.text}`"
        @click="remove(id)"
      >
        <b>{{ i + 1 }}</b
        >{{ practice.sequence.find((s) => s.id === id)?.text }}<small>点一下取回</small>
      </button>
    </div>
    <div class="evidence-workshop__cards" aria-label="待排序的句子">
      <button
        v-for="card in cards.filter((c) => !order.includes(c.id))"
        :key="card.id"
        type="button"
        @click="pick(card.id)"
      >
        {{ card.text }}
      </button>
    </div>
    <div class="hands-on__actions">
      <button
        type="button"
        :disabled="order.length !== practice.sequence.length"
        @click="checkOrder"
      >
        检查顺序，准备说理由
      </button>
    </div>
    <p role="status">{{ orderFeedback }}</p>
    <section v-if="ordered" class="hands-on__say" aria-label="排序后说理由">
      <h4>为什么这样排？轮到你说</h4>
      <p>先选相邻的两张卡，读出支持先后顺序的词句。</p>
      <blockquote>我先排____，再排____。因为原文说____，所以____应该在前面。</blockquote>
      <label><input v-model="said" type="checkbox" />我已经说出了先后顺序，并引用了原文线索</label>
      <button type="button" :aria-expanded="example" @click="example = !example">
        {{ example ? '收起说理提示' : '需要说理提示' }}
      </button>
      <p v-if="example">
        {{
          practice.sequenceHint
        }}可以从时间、人物行动或介绍顺序来讲；不同理由都要回到原文，不只是说“我觉得”。
      </p>
      <p v-if="said">表达已自查。这里不录音，也不会自动判断你的理由是否正确。</p>
    </section>
    <button class="hands-on__reset" type="button" @click="reset">重新找证据、排顺序</button>
    <p class="hands-on__note">
      这是额外的动手练习，本次标记与口头自查离开后不保留；不会重置上方已保存的闯关。
    </p>
  </section>
</template>
<style src="../../styles/hands-on.css"></style>
