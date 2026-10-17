<script lang="ts" setup>
import { type TocEntry } from '@/utils/markdown/pipeline';

interface Props {
  open: boolean;
  headings: TocEntry[];
  activeId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  headings: () => [],
  activeId: '',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'jump', heading: TocEntry): void;
}>();
</script>

<template>
  <div>
    <!-- 遮罩层（在小窗抽屉状态下） -->
    <div
      v-if="props.open"
      class="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity"
      @click="emit('close')"
    />

    <!-- TOC 抽屉面板 -->
    <aside
      class="fixed right-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-200 ease-out select-none"
      :class="props.open ? 'translate-x-0' : 'translate-x-full'"
      @click.stop
    >
      <!-- 抽屉顶栏 -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div class="flex items-center gap-1.5">
          <i class="i-lucide-list text-[#007AFF] text-sm" />
          <span class="text-xs font-bold text-neutral-900 dark:text-neutral-100">文档目录大纲</span>
          <span class="text-[10px] text-neutral-400 font-mono">({{ props.headings.length }})</span>
        </div>

        <button
          type="button"
          class="flex items-center justify-center w-6 h-6 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
          @click="emit('close')"
        >
          <i class="i-lucide-x text-xs" />
        </button>
      </div>

      <!-- 目录层级列表 -->
      <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        <template v-if="props.headings.length > 0">
          <button
            v-for="entry in props.headings"
            :key="entry.id"
            type="button"
            class="w-full text-left py-1.5 px-2.5 rounded-lg text-xs transition-all border-0 bg-transparent cursor-pointer truncate flex items-center gap-1.5"
            :class="
              props.activeId === entry.id
                ? 'bg-[#007AFF]/10 text-[#007AFF] font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'
            "
            :style="{ paddingLeft: `${(entry.level - 1) * 12 + 10}px` }"
            :title="entry.text"
            @click="emit('jump', entry)"
          >
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="props.activeId === entry.id ? 'bg-[#007AFF]' : 'bg-neutral-300 dark:bg-neutral-600'"
            />
            <span class="truncate">{{ entry.text }}</span>
          </button>
        </template>

        <div v-else class="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
          <i class="i-lucide-file-text text-2xl text-neutral-300 dark:text-neutral-600 mb-2" />
          <span class="text-xs">本文未提取到标题层级</span>
        </div>
      </div>
    </aside>
  </div>
</template>
