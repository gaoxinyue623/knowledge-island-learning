<script setup lang="ts">
import { ref } from 'vue'

import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBottomSheet from '@/components/common/AppBottomSheet.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppToast from '@/components/common/AppToast.vue'
import AppShell from '@/layouts/AppShell.vue'

const modalOpen = ref(false)
const sheetOpen = ref(false)
const toastOpen = ref(false)
const selectedCard = ref(false)
</script>

<template>
  <AppShell :show-bottom-nav="false">
    <div class="content-container dev-ui">
      <header class="dev-ui__intro">
        <p class="dev-placeholder__eyebrow">DEVELOPMENT ONLY</p>
        <h1>基础组件 Demo</h1>
        <p>用于检查 Design Token、交互状态与响应式基础能力，不是正式用户页面。</p>
      </header>

      <section class="dev-ui__section" aria-labelledby="token-title">
        <h2 id="token-title">Design Token</h2>
        <div class="dev-ui__token-grid">
          <div class="dev-ui__swatch dev-ui__swatch--primary">Primary</div>
          <div class="dev-ui__swatch dev-ui__swatch--math">Math</div>
          <div class="dev-ui__swatch dev-ui__swatch--success">Success</div>
          <div class="dev-ui__swatch dev-ui__swatch--warning">Warning</div>
          <div class="dev-ui__swatch dev-ui__swatch--error">Error</div>
          <div class="dev-ui__swatch dev-ui__swatch--character">Character</div>
        </div>
        <div class="dev-ui__type-sample">
          <strong>标题层级</strong>
          <span>正文与儿童端关键说明</span>
          <small>辅助信息、状态与来源</small>
        </div>
      </section>

      <section class="dev-ui__section" aria-labelledby="button-title">
        <h2 id="button-title">AppButton / AppIcon</h2>
        <div class="dev-ui__row">
          <AppButton>主操作</AppButton>
          <AppButton variant="secondary" icon-left="book-open">次操作</AppButton>
          <AppButton variant="soft" icon-right="arrow-right">柔和操作</AppButton>
          <AppButton variant="ghost">文字操作</AppButton>
          <AppButton variant="danger">危险操作</AppButton>
          <AppButton loading>加载中</AppButton>
        </div>
        <div class="dev-ui__icon-row" aria-label="图标示例">
          <AppIcon name="map-pin" :size="24" aria-label="地区" />
          <AppIcon name="book-marked" :size="24" aria-label="教材" />
          <AppIcon name="check-circle" :size="24" color="var(--color-success)" aria-label="完成" />
          <AppIcon name="lock" :size="24" color="var(--color-locked)" aria-label="锁定" />
          <AppIcon name="lightbulb" :size="24" color="var(--color-warning)" aria-label="提示" />
        </div>
      </section>

      <section class="dev-ui__section" aria-labelledby="card-title">
        <h2 id="card-title">AppCard / AppProgress / AppAvatar</h2>
        <div class="dev-ui__card-grid">
          <AppCard
            variant="elevated"
            clickable
            :selected="selectedCard"
            @click="selectedCard = !selectedCard"
          >
            <div class="dev-ui__card-heading">
              <AppAvatar kind="character" size="sm" />
              <div>
                <h3>可交互卡片</h3>
                <p>点击检查 Selected 状态</p>
              </div>
            </div>
            <AppProgress :value="68" label="组件完成度" show-value />
          </AppCard>
          <AppCard variant="soft" loading />
        </div>
      </section>

      <section class="dev-ui__section" aria-labelledby="state-title">
        <h2 id="state-title">Loading / Empty / Error</h2>
        <div class="dev-ui__state-grid">
          <AppLoading label="正在准备组件" />
          <AppEmptyState
            title="还没有内容"
            description="完成基础配置后，这里会出现下一步动作。"
            action-label="返回设置"
          />
          <AppErrorState title="组件暂时打不开" description="这是一个可恢复的演示错误。" />
        </div>
      </section>

      <section class="dev-ui__section" aria-labelledby="overlay-title">
        <h2 id="overlay-title">Modal / BottomSheet / Toast</h2>
        <div class="dev-ui__row">
          <AppButton variant="secondary" @click="modalOpen = true">打开 Modal</AppButton>
          <AppButton variant="secondary" @click="sheetOpen = true">打开 BottomSheet</AppButton>
          <AppButton variant="soft" @click="toastOpen = true">显示 Toast</AppButton>
        </div>
        <AppToast
          :open="toastOpen"
          type="success"
          title="状态已保存"
          message="这是短暂反馈示例。"
        />
        <AppModal
          :open="modalOpen"
          title="离开当前设置？"
          description="Modal 支持 Escape、关闭按钮和焦点回收。"
          primary-label="确认"
          secondary-label="再看看"
          @close="modalOpen = false"
          @primary="modalOpen = false"
          @secondary="modalOpen = false"
        >
          <p>基础 Modal 不包含业务逻辑，只提供通用交互边界。</p>
        </AppModal>
        <AppBottomSheet
          :open="sheetOpen"
          title="移动端操作面板"
          primary-label="完成"
          secondary-label="取消"
          @close="sheetOpen = false"
          @primary="sheetOpen = false"
          @secondary="sheetOpen = false"
        >
          <p>BottomSheet 保留拖拽把手、键盘焦点和安全区。</p>
        </AppBottomSheet>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.dev-ui {
  display: grid;
  gap: var(--space-8);
}

.dev-ui__intro {
  display: grid;
  gap: var(--space-3);
}

.dev-ui__intro h1 {
  font-size: clamp(28px, 5vw, 40px);
  line-height: 1.2;
}

.dev-ui__intro p:last-child {
  color: var(--color-text-secondary);
}

.dev-ui__section {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.dev-ui__section h2 {
  font-size: 20px;
}

.dev-ui__row,
.dev-ui__icon-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.dev-ui__icon-row {
  gap: var(--space-4);
  padding-top: var(--space-2);
}

.dev-ui__token-grid,
.dev-ui__card-grid,
.dev-ui__state-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.dev-ui__swatch {
  min-height: 64px;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.dev-ui__swatch--primary {
  background: var(--color-primary);
}

.dev-ui__swatch--math {
  color: var(--color-text-primary);
  background: var(--color-subject-math-soft);
}

.dev-ui__swatch--success {
  background: var(--color-success);
}

.dev-ui__swatch--warning {
  color: var(--color-text-primary);
  background: var(--color-warning-soft);
}

.dev-ui__swatch--error {
  background: var(--color-error);
}

.dev-ui__swatch--character {
  background: var(--color-character-base);
}

.dev-ui__type-sample {
  display: grid;
  gap: var(--space-2);
}

.dev-ui__type-sample span,
.dev-ui__type-sample small {
  color: var(--color-text-secondary);
}

.dev-ui__card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dev-ui__card-heading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.dev-ui__card-heading h3 {
  font-size: 18px;
}

.dev-ui__card-heading p {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.dev-ui__state-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 767px) {
  .dev-ui__section {
    padding: var(--space-4);
  }

  .dev-ui__token-grid,
  .dev-ui__card-grid,
  .dev-ui__state-grid {
    grid-template-columns: 1fr;
  }

  .dev-ui__row .app-button {
    flex: 1 1 140px;
  }
}
</style>
