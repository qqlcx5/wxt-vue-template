<script lang="ts" setup>
import { ref } from 'vue';

const expanded = ref(false);
const message = ref('WXT Shadow Root UI 注入成功！');
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[999999] font-sans antialiased select-none">
    <!-- 浮动折叠卡片 -->
    <div
      v-if="expanded"
      class="mb-3 w-80 rounded-2xl bg-zinc-900/95 p-4 text-white shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95"
    >
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <div class="flex items-center gap-2">
          <i class="i-lucide-sparkles text-emerald-400 text-lg" />
          <span class="font-bold text-sm">扩展 Content UI</span>
        </div>
        <button
          class="rounded-md p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          @click="expanded = false"
        >
          <i class="i-lucide-x text-sm" />
        </button>
      </div>

      <div class="py-3 text-xs text-white/70 leading-relaxed">
        {{ message }}
        <p class="mt-2 text-white/40 text-[11px]">
          基于 Shadow DOM 隔离挂载，不受宿主网页样式污染，UnoCSS 样式独立生效。
        </p>
      </div>

      <button
        class="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition-all cursor-pointer"
        @click="message = `已触发操作：${new Date().toLocaleTimeString()}`"
      >
        触发操作
      </button>
    </div>

    <!-- 浮动悬浮球触发器 -->
    <button
      class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
      :class="{ 'rotate-45': expanded }"
      @click="expanded = !expanded"
    >
      <i class="i-lucide-layers text-xl" />
    </button>
  </div>
</template>
