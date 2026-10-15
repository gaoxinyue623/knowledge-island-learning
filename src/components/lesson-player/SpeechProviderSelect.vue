<script setup lang="ts">
import { productionConfig } from '@/config/production'
import { useId } from 'vue'
defineProps<{ modelValue: 'browser' | 'bundled' | 'doubao' }>()
const emit = defineEmits<{ 'update:modelValue': [value: 'browser' | 'bundled' | 'doubao'] }>()
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
            ($event.target as HTMLSelectElement).value === 'doubao'
              ? 'doubao'
              : ($event.target as HTMLSelectElement).value === 'bundled'
                ? 'bundled'
                : 'browser',
          )
        "
      >
        <option value="browser">基础音频与设备声音（默认）</option>
        <option value="bundled">基础英语音频</option>
        <option v-if="!productionConfig.isProduction" value="doubao">豆包语音（联网合成）</option>
      </select>
    </label>
    <p v-if="modelValue === 'browser'">
      优先使用设备声音。设备没有英语声音时，已配套的基础内容可以直接播放音频。
    </p>
    <p v-else-if="modelValue === 'bundled'">
      播放随应用提供的基础英语音频，不需要设备安装英语声音。未配套的句子仍可以使用设备声音或文字辅助。
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
