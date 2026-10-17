<script lang="ts" setup>
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/utils/markdown/highlighter';

interface Props {
  visible: boolean;
  x: number;
  y: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select-color', color: HighlightColor): void;
  (e: 'ask-ai'): void;
  (e: 'add-note'): void;
  (e: 'copy-text'): void;
}>();
</script>

<template>
  <div
    v-if="props.visible"
    class="fixed z-50 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.18)] select-none animate-in fade-in zoom-in-95 duration-150"
    :style="{ left: `${props.x}px`, top: `${props.y}px`, transform: 'translate(-50%, -100%)' }"
    @mousedown.prevent
  >
    <!-- 5 色高亮圆点 -->
    <div class="flex items-center gap-1 pr-1 border-r border-black/[0.08] dark:border-white/[0.1]">
      <button
        v-for="c in HIGHLIGHT_COLORS"
        :key="c.color"
        type="button"
        class="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 transition-all hover:scale-120 active:scale-95 cursor-pointer p-0"
        :style="{ background: c.bg }"
        :title="`以「${c.label}」高亮`"
        @click="emit('select-color', c.color)"
      />
    </div>

    <!-- 快捷动作按钮组 -->
    <button
      type="button"
      class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
      title="将选中内容发送至 AI 提问"
      @click="emit('ask-ai')"
    >
      <i class="i-lucide-sparkles text-[#007AFF] text-xs" />
      <span>问 AI</span>
    </button>

    <button
      type="button"
      class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
      title="高亮并添加思考批注"
      @click="emit('add-note')"
    >
      <i class="i-lucide-file-edit text-[#34C759] text-xs" />
      <span>批注</span>
    </button>

    <button
      type="button"
      class="flex items-center justify-center w-6 h-6 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
      title="复制选中文字"
      @click="emit('copy-text')"
    >
      <i class="i-lucide-copy text-xs" />
    </button>
  </div>
</template>
