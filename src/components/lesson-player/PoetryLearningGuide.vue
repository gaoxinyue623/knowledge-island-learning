<script setup lang="ts">
const sections = [
  {
    title: '读懂词语',
    body: '纸鸢（zhǐ yuān）就是风筝；散学就是放学。莺（yīng）是一种鸟；绿丝绦（tāo）是绿色丝带，诗中用它形容细长的柳条。',
  },
  {
    title: '边读边想象',
    body: '读《村居》，先找春天的景物，再找孩子们的动作。“草长莺飞”让我们看到草生长、听到鸟鸣；“忙趁东风”写出孩子们急着放风筝的快乐。你能用自己的话说出这幅画面吗？',
  },
  {
    title: '看懂一个比喻',
    body: '《咏柳》把柳条比作绿色丝带，把春风比作剪刀。春风并不是真的剪刀；诗人想象春风裁出了细细的柳叶。读最后两句，先听到一个问题，再找到诗人的回答。',
  },
  {
    title: '把发现说出来',
    body: '示范：我从“忙趁东风放纸鸢”知道孩子们在放风筝，觉得他们很快乐。换你来：选另一句，说说你看到了什么、从哪个词看出来。也可以把诗中的春天画下来，再讲给家人听。',
  },
]
</script>
<template>
  <section class="poetry-guide" aria-label="古诗学习帮手">
    <h3>学习帮手 · 看懂诗意</h3>
    <p>项目原创的讲解与表达示范，帮助你从读出诗句走到理解画面。</p>
    <details v-for="(section, index) in sections" :key="section.title" :open="index === 0">
      <summary>{{ section.title }}</summary>
      <p>{{ section.body }}</p>
    </details>
  </section>
</template>
<style scoped>
.poetry-guide {
  padding: 18px;
  margin-top: 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: #f6f8eb;
  text-align: left;
}
.poetry-guide p {
  line-height: 1.9;
}
.poetry-guide details {
  border-top: 1px solid var(--color-border);
  padding-block: 10px;
}
.poetry-guide summary {
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  font-weight: 700;
}
</style>
