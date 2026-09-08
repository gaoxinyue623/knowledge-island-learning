<script setup lang="ts">
import { productionConfig } from '@/config/production'
import { useId } from 'vue'
defineProps<{ modelValue: 'browser' | 'doubao' }>()
const emit = defineEmits<{ 'update:modelValue': [value: 'browser' | 'doubao'] }>()
const id = useId()
</script>
<template>
  <div class="speech-provider">
    <label :for="`${id}-provider`"
      >朗读声音
      <select
        :id="`${id}-provider`"
        :value="modelValue"
        @change="
          emit(
            'update:modelValue',
            ($event.target as HTMLSelectElement).value === 'doubao' ? 'doubao' : 'browser',
          )
        "
      >
        <option value="browser">浏览器语音（默认）</option>
        <option v-if="!productionConfig.isProduction" value="doubao">豆包语音（联网合成）</option>
      </select>
    </label>
    <p v-if="modelValue === 'browser'">
      先用设备声音听一听，不满意可以切换豆包。切换本身不发起合成。
    </p>
    <p v-else role="status">
      AI
      合成语音，不是教材原声。点击朗读会把当前英文发送给火山引擎，新音频可能计费，相同内容复用本地缓存。连续听读会逐句生成；停止不能撤销已发出的计费请求。请由家长确认后使用。
    </p>
  </div>
</template>
<style scoped>
.speech-provider {
  margin: 16px 0;
  padding: 14px;
  border: 1px solid #bbcbbb;
  border-radius: 16px;
  background: #f4f8ed;
  color: #304c43;
}
.speech-provider label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-weight: 700;
}
.speech-provider select {
  min-height: 44px;
  max-width: 100%;
  min-width: 0;
  border: 1px solid #8ca58e;
  border-radius: 10px;
  background: white;
  padding: 8px;
  font: inherit;
  color: inherit;
}
.speech-provider p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
}
.speech-provider select:focus-visible {
  outline: 3px solid #397562;
  outline-offset: 2px;
}
</style>
