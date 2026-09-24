<script setup lang="ts">
import type { AdaptivePlanReport } from '@/services/learning-agent/adaptivePlanReport'
import type { LearningAction } from '@/types/learning-agent'

defineProps<{ report: AdaptivePlanReport }>()

const actions: Record<LearningAction, string> = {
  CONTINUE: '继续学习',
  REINFORCE: '巩固练习',
  SIMPLIFY: '降低难度',
  REMEDIATE: '补充前置知识',
  REVIEW: '到期复习',
  NEXT: '学习下一知识点',
  CHALLENGE: '挑战练习',
}
function score(value: number) {
  return `${Number(value.toFixed(1))}%`
}
</script>

<template>
  <section class="plan-report" aria-label="计划学习复盘">
    <h3>{{ report.completedTasks === report.taskLimit ? '本次学习复盘' : '阶段学习复盘' }}</h3>
    <p class="summary" role="status">
      已完成 {{ report.completedTasks }} / {{ report.taskLimit }} 组，答对
      {{ report.correctAnswers }} / {{ report.totalAnswers }} 题，新增
      {{ report.evidenceCount }} 条学习证据。
    </p>
    <ul class="mastery-changes" aria-label="掌握度变化">
      <li v-for="point in report.masteryChanges" :key="point.knowledgePointId">
        <strong>{{ point.name }}</strong>
        <p class="score">
          {{ point.before ? score(point.before.masteryScore) : '暂无证据' }}
          <span aria-label="变化为">→</span>
          {{ point.after ? score(point.after.masteryScore) : '暂无证据' }}
        </p>
        <p>本次新增 {{ point.evidenceCount }} 条证据</p>
        <p v-if="point.after" class="note">
          当前共 {{ point.after.evidenceCount }} 条证据 · 证据充分度
          {{ score(point.after.confidence * 100) }}
        </p>
      </li>
    </ul>
    <p class="note">
      掌握度由历史与本次作答证据共同计算，可能上升或下降；证据充分度反映已有证据量。
    </p>
    <details v-if="report.wrongAnswers.length" class="wrong-answers">
      <summary>回顾本计划 {{ report.incorrectAnswers }} 道错题</summary>
      <p class="note">这里只记录答案差异；仅凭最终答案不能确定具体错误原因。</p>
      <ol>
        <li v-for="item in report.wrongAnswers" :key="`${item.taskNumber}:${item.questionId}`">
          <strong>第 {{ item.taskNumber }} 组 · {{ item.stem }}</strong>
          <p>你的答案：{{ item.submittedAnswer }} · 正确答案：{{ item.expectedAnswer }}</p>
          <p>{{ item.explanation }}</p>
        </li>
      </ol>
    </details>
    <p v-else class="summary">本计划已提交的题目全部答对，暂无错题需要回顾。</p>
    <section v-if="report.recommendation" class="recommendation" aria-label="后续学习建议">
      <h4>建议下一步：{{ actions[report.recommendation.action] }}</h4>
      <p>{{ report.recommendationTargetName }}</p>
      <ul>
        <li v-for="reason in report.recommendation.reasons" :key="reason.code">
          {{ reason.message }}
        </li>
      </ul>
      <p class="note">建议基于已提交作答；开始下一组时再准备并校验题目。</p>
      <details>
        <summary>查看决策依据</summary>
        <p>算法：{{ report.recommendation.algorithmVersion }}</p>
        <p>目标难度：{{ report.recommendation.difficulty }}</p>
        <ul>
          <li v-for="reason in report.recommendation.reasons" :key="reason.code">
            {{ reason.code }} · {{ reason.evidenceType }}
          </li>
        </ul>
        <p>证据及课程引用：</p>
        <ul>
          <li v-for="id in report.recommendation.evidenceRefs" :key="id">{{ id }}</li>
        </ul>
      </details>
    </section>
    <p v-else role="status">{{ report.recommendationError }}</p>
  </section>
</template>

<style scoped>
.plan-report {
  border-top: 1px solid #cddfd7;
  margin-top: 24px;
  padding-top: 20px;
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
h3 {
  font-size: 20px;
  font-weight: 750;
}
h4 {
  font-size: 16px;
  font-weight: 700;
}
.summary {
  margin-block: 12px;
}
.mastery-changes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
  padding: 0;
  list-style: none;
}
.mastery-changes li,
.recommendation {
  padding: 16px;
  border-radius: 12px;
  background: white;
  border: 1px solid #d9e8e1;
  min-width: 0;
}
.score {
  font-size: 23px;
  font-weight: 700;
  color: #23765b;
  margin-block: 6px;
}
.note {
  color: #526777;
  font-size: 12px;
  margin-block: 10px;
}
.recommendation,
.wrong-answers {
  margin-block: 16px;
}
summary {
  cursor: pointer;
  padding-block: 8px;
}
ol,
.recommendation ul {
  padding-left: 20px;
}
.wrong-answers li {
  margin-block: 12px;
}
.recommendation details {
  font-size: 12px;
}
</style>
