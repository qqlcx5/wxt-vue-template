<script lang="ts" setup>
import type { ClippedElementInfo } from '../composables/useElementClipper';

interface Props {
  active: boolean;
  hovered: ClippedElementInfo | null;
  selected: ClippedElementInfo | null;
}

const props = defineProps<Props>();
const emits = defineEmits<{
  (e: 'save', info: ClippedElementInfo): void;
  (e: 'cancel'): void;
}>();

const current = () => props.selected || props.hovered;

function handleCopy(text: string) {
  navigator.clipboard.writeText(text);
}
</script>

<template>
  <div v-if="active" class="select-none font-sans text-xs">
    <!-- 1. 目标 DOM 节点实时半透明高亮选框 -->
    <div
      v-if="current()"
      class="fixed pointer-events-none z-[9999990] transition-all duration-100 ease-out"
      :style="{
        top: `${current()!.rect.top}px`,
        left: `${current()!.rect.left}px`,
        width: `${current()!.rect.width}px`,
        height: `${current()!.rect.height}px`,
        outline: '2px solid #007AFF',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        boxShadow: '0 0 0 4px rgba(0, 122, 255, 0.15)',
      }"
    >
      <!-- 节点标签名称与尺寸徽章 -->
      <span
        class="absolute -top-5.5 left-0 px-2 py-0.5 rounded bg-[#007AFF] text-white text-[10px] font-mono font-medium shadow whitespace-nowrap"
      >
        &lt;{{ current()!.tagName }}&gt;
        <span class="opacity-75 ml-1">{{ Math.round(current()!.rect.width) }}×{{ Math.round(current()!.rect.height) }}</span>
      </span>
    </div>

    <!-- 2. 屏幕底部沉浸式操作胶囊控制栏 -->
    <div
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999999] flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] border border-black/10 dark:border-white/10 text-neutral-850 dark:text-neutral-100 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#007AFF] text-white">
          <i class="i-lucide-crop text-xs" />
        </span>
        <span class="text-xs font-medium">
          {{ selected ? '已选定区块，可直接保存或复制' : '悬停选择区块，点击锁定截取' }}
        </span>
      </div>

      <div class="h-3.5 w-px bg-black/10 dark:bg-white/10 mx-1" />

      <!-- 操作按钮组 -->
      <button
        v-if="selected"
        type="button"
        class="flex items-center gap-1.5 h-6.5 px-3 rounded-full text-xs font-medium bg-[#007AFF] text-white hover:bg-[#007AFF]/90 transition-all cursor-pointer border-0"
        @click="emits('save', selected)"
      >
        <i class="i-lucide-archive text-xs" />
        <span>存入文库</span>
      </button>

      <button
        v-if="selected"
        type="button"
        class="flex items-center gap-1.5 h-6.5 px-2.5 rounded-full text-xs font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-all cursor-pointer border-0 text-neutral-700 dark:text-neutral-300"
        @click="handleCopy(selected.text)"
      >
        <i class="i-lucide-copy text-xs" />
        <span>复制文本</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-1 h-6.5 px-2.5 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-all cursor-pointer border-0"
        @click="emits('cancel')"
      >
        <span>退出</span>
        <span class="text-[10px] opacity-60 font-mono">Esc</span>
      </button>
    </div>
  </div>
</template>
