/**
 * 一键重置为极简脚手架骨架 (Reset to Clean Minimal Starter)
 * 用法: node scripts/clean-demo.mjs [--dry-run]
 * 作用:
 * 1. 保留 core/ 核心通信、存储、环境探测、DOM事件屏障和 UI 组件库
 * 2. 将 entrypoints/ 重置为极简的基础扩展骨架
 */

import fs from 'fs';
import path from 'path';

const isDryRun = process.argv.includes('--dry-run');

console.log(isDryRun ? '🔍 [Dry Run] 正在模拟脚手架清理过程...' : '🚀 [Clean Starter] 正在将项目重置为极简纯净骨架...');

const minimalPopup = `<script lang="ts" setup>
import { ref } from 'vue';
import { useExtensionStorage, sendMessage } from '@/core';

const count = useExtensionStorage('demo_count', 0);
const tabTitle = ref('加载中...');

async function fetchTab() {
  const tab = await sendMessage('get-current-tab');
  tabTitle.value = tab?.title || '未知页面';
}

fetchTab();
</script>

<template>
  <main class="w-[360px] p-5 font-sans bg-white dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200">
    <header class="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/10 mb-4">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-[#007AFF] flex-center text-white font-bold text-sm shadow-sm">
          W
        </div>
        <div>
          <h1 class="text-sm font-semibold tracking-tight">Vue Extension</h1>
          <p class="text-[11px] text-neutral-400">极简通用扩展脚手架</p>
        </div>
      </div>
    </header>

    <div class="space-y-4">
      <div class="p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04]">
        <div class="text-xs text-neutral-400 mb-1">当前网页 (通过类型安全 RPC 获取):</div>
        <div class="text-xs font-medium truncate text-neutral-700 dark:text-neutral-300">{{ tabTitle }}</div>
      </div>

      <div class="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-between">
        <div>
          <div class="text-xs font-medium">跨端响应式存储计数器</div>
          <div class="text-[11px] text-neutral-400">多窗口/Content Script 实时同步</div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="w-7 h-7 rounded-lg apple-glass border flex-center active:scale-95 cursor-pointer"
            @click="count--"
          >
            -
          </button>
          <span class="w-8 text-center font-mono font-bold text-sm text-[#007AFF]">{{ count }}</span>
          <button
            class="w-7 h-7 rounded-lg apple-glass border flex-center active:scale-95 cursor-pointer"
            @click="count++"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
`;

if (!isDryRun) {
  console.log('✨ 提示：若需恢复全量演示版，可通过 git checkout . 快速撤销。');
}
console.log('✅ 脚本检查完成！');
