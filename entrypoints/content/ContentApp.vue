<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useQoderStore } from '@/stores';
import { sendToBackground } from '@/utils/messaging';

const qoderStore = useQoderStore();
const expanded = ref(false);
const visible = ref(true);

onMounted(() => {
  qoderStore.init();
});

async function openSidePanel() {
  await sendToBackground('OPEN_SIDEPANEL');
  expanded.value = false;
}
</script>

<template>
  <div v-if="visible" class="fixed bottom-6 right-6 z-[9999999] font-sans antialiased text-slate-800 select-none">
    <!-- 展开悬浮卡片 -->
    <div
      v-if="expanded"
      class="mb-3 w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 flex flex-col gap-3 transition-all duration-300 animate-in fade-in zoom-in-95"
    >
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            Q
          </div>
          <div>
            <div class="text-xs font-bold leading-tight">Qoder 效率监视器</div>
            <div class="text-[10px] text-slate-400">实时度量胶囊</div>
          </div>
        </div>
        <button
          @click="expanded = false"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-md"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-700/60">
          <div class="text-[10px] text-slate-400 mb-0.5">今日消耗</div>
          <div class="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
            {{ qoderStore.todayCredits }} <span class="text-[10px] font-normal">C</span>
          </div>
        </div>
        <div class="bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-700/60">
          <div class="text-[10px] text-slate-400 mb-0.5">平均交互耗时</div>
          <div class="text-base font-bold font-mono text-slate-800 dark:text-zinc-200">
            {{ qoderStore.avgDurationSec }} <span class="text-[10px] font-normal">s</span>
          </div>
        </div>
      </div>

      <button
        @click="openSidePanel"
        class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
      >
        <span>打开侧边栏完整看板</span>
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- 极简收起胶囊按钮 (Floating Pill) -->
    <div
      @click="expanded = !expanded"
      class="cursor-pointer group flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white dark:bg-zinc-100/95 dark:hover:bg-white dark:text-zinc-900 px-3.5 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 border border-white/20 dark:border-zinc-300"
    >
      <div class="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">
        Q
      </div>
      <div class="text-xs font-mono font-medium flex items-center gap-2">
        <span>今日: {{ qoderStore.todayCredits }} C</span>
        <span class="opacity-40">|</span>
        <span class="text-emerald-400 dark:text-emerald-600">{{ qoderStore.avgDurationSec }}s 均耗</span>
      </div>
    </div>
  </div>
</template>
