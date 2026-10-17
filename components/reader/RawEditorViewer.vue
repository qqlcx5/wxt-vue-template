<script lang="ts" setup>
import { ref, computed } from 'vue';
import { countWords, estimateTokens, estimateReadingTime } from '@/utils/markdown/pipeline';

interface Props {
  content: string;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
});

const emit = defineEmits<{
  (e: 'update:content', val: string): void;
}>();

const wrapLines = ref(true);
const copied = ref(false);

const lines = computed(() => (props.content ? props.content.split('\n') : []));
const words = computed(() => countWords(props.content));
const tokens = computed(() => estimateTokens(props.content));
const readTime = computed(() => estimateReadingTime(words.value));

function handleCopy() {
  if (!props.content) return;
  navigator.clipboard.writeText(props.content);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1600);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs">
    <!-- 状态与操作顶栏 -->
    <div class="px-3 py-1.5 bg-[#252526] border-b border-white/[0.08] flex items-center justify-between select-none text-[11px] text-neutral-400">
      <div class="flex items-center gap-3">
        <span>行数: <strong class="text-white">{{ lines.length }}</strong></span>
        <span>字数: <strong class="text-white">{{ words }}</strong></span>
        <span>预估 Token: <strong class="text-white">{{ tokens }}</strong></span>
        <span>预计阅读: <strong class="text-white">{{ readTime }} 分钟</strong></span>
      </div>

      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1 cursor-pointer hover:text-white">
          <input v-model="wrapLines" type="checkbox" class="w-3 h-3 accent-[#007AFF]">
          <span>自动换行</span>
        </label>

        <button
          type="button"
          class="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors border-0 cursor-pointer"
          @click="handleCopy"
        >
          <i :class="copied ? 'i-lucide-check text-green-400' : 'i-lucide-copy'" class="text-xs" />
          <span>{{ copied ? '已复制' : '复制源码' }}</span>
        </button>
      </div>
    </div>

    <!-- 源码行号与内容展示区 -->
    <div class="flex-1 overflow-auto flex select-text leading-relaxed">
      <!-- 行号列 -->
      <div class="select-none py-3 px-2 bg-[#1e1e1e] border-r border-white/[0.06] text-right text-neutral-500 shrink-0 font-mono text-[11px]">
        <div v-for="(_, idx) in lines" :key="idx" class="h-5">
          {{ idx + 1 }}
        </div>
      </div>

      <!-- 源码内容 -->
      <pre
        class="flex-1 p-3 m-0 font-mono text-xs overflow-x-auto text-[#d4d4d4]"
        :class="wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'"
      ><code>{{ props.content }}</code></pre>
    </div>
  </div>
</template>
