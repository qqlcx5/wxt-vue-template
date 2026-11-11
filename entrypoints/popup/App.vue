<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useQoderStore } from '@/stores';
import { browser } from 'wxt/browser';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const qoderStore = useQoderStore();

// 柱状图悬浮提示状态
const hoveredBar = ref<{ key: string; label: string; formattedValue: string } | null>(null);

// 供应商/模型下拉菜单控制
const isModelDropdownOpen = ref(false);

onMounted(() => {
  qoderStore.init();
});

function openDashboard() {
  qoderStore.openDashboard();
}

function handleSelectPeriod(period: 'today' | '7d' | '30d' | 'all') {
  qoderStore.setPopupPeriod(period);
}

function handleSelectBar(barKey: string) {
  qoderStore.setPopupSelectedDate(barKey);
}

function handleSelectModel(modelId: string) {
  qoderStore.setPopupFilterModel(modelId);
  isModelDropdownOpen.value = false;
}

function closePopup() {
  window.close();
}

// 模型下拉选项
const modelOptions = [
  { id: 'all', label: '全部模型 / 供应商' },
  { id: 'Fast', label: 'Fast (极速主力)' },
  { id: 'WorkBuddy', label: 'WorkBuddy (GLM-5.3)' },
  { id: 'Qwen3.8-Max', label: 'Qwen3.8-Max (全能重构)' },
  { id: 'Auto', label: 'Auto (自适应路由)' },
  { id: 'DeepSeek-Flash', label: 'DeepSeek-Flash (轻量瞬发)' },
];

const currentModelLabel = computed(() => {
  const found = modelOptions.find((m) => m.id === qoderStore.popupFilterModel);
  return found ? (found.id === 'all' ? '全部供应商' : found.id) : '全部供应商';
});

// Y 轴刻度标签
const yAxisTicks = computed(() => {
  const metric = qoderStore.popupChartMetric;
  if (metric === 'tokens') {
    return ['8000 万', '6000 万', '4000 万', '2000 万', '0'];
  } else if (metric === 'cost') {
    return ['¥80', '¥60', '¥40', '¥20', '¥0'];
  }
  return ['600', '450', '300', '150', '0'];
});
</script>

<template>
  <div
    class="w-[500px] max-h-[610px] overflow-y-auto bg-[#F4F5F8] dark:bg-[#0E0F12] text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 select-none p-3.5 gap-2.5 antialiased"
  >
    <!-- 顶部双面架构切换栏: A 面 (用量与速率) vs B 面 (仓库与效能) + 单位切换 -->
    <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-zinc-800">
      <!-- A/B/Local 三视角药丸切换 -->
      <div class="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-xl text-xs font-semibold">
        <button
          @click="qoderStore.setPopupView('A')"
          class="px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          :class="qoderStore.popupView === 'A' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
        >
          <span>📊</span>
          <span>A面·云端</span>
        </button>
        <button
          @click="qoderStore.setPopupView('B')"
          class="px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          :class="qoderStore.popupView === 'B' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
        >
          <span>🏆</span>
          <span>B面·资产</span>
        </button>
        <button
          @click="qoderStore.setPopupView('local')"
          class="px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          :class="qoderStore.popupView === 'local' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
        >
          <span>💻</span>
          <span>本地订阅</span>
          <span
            v-if="qoderStore.isLocalDaemonOnline"
            class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
            title="本地守护服务运行中"
          ></span>
        </button>
      </div>

      <!-- 右侧: 单位切换 (Token ⇄ 积分) 与工作台入口 -->
      <div class="flex items-center gap-2">
        <button
          @click="qoderStore.togglePopupDisplayMode()"
          class="px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer border flex items-center gap-1 shadow-2xs"
          :class="qoderStore.popupDisplayMode === 'tokens' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'"
          title="点击切换显示模式：Token 换算 或 官方原生积分"
        >
          <span>{{ qoderStore.popupDisplayMode === 'tokens' ? '⚡️ Token' : '🪙 积分' }}</span>
          <span class="text-[9px] opacity-60">⇄</span>
        </button>

        <!-- 打开大屏工作台 -->
        <button
          @click="openDashboard"
          class="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
        >
          打开用量
        </button>
      </div>
    </div>

    <!-- ==================== A 面：用量与速率 (像素级复刻官方截图) ==================== -->
    <template v-if="qoderStore.popupView === 'A'">
      <!-- 周期分段与右侧模型筛选 -->
      <header class="flex items-center justify-between gap-2">
        <!-- 时间范围分段药丸 (今天 / 7天 / 30天 / 全部) -->
        <div class="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl text-xs font-medium">
          <button
            @click="handleSelectPeriod('today')"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer"
            :class="qoderStore.popupPeriod === 'today' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
          >
            今天
          </button>
          <button
            @click="handleSelectPeriod('7d')"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer"
            :class="qoderStore.popupPeriod === '7d' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
          >
            7 天
          </button>
          <button
            @click="handleSelectPeriod('30d')"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer"
            :class="qoderStore.popupPeriod === '30d' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
          >
            30 天
          </button>
          <button
            @click="handleSelectPeriod('all')"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer"
            :class="qoderStore.popupPeriod === 'all' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'"
          >
            全部
          </button>
        </div>

        <!-- 供应商下拉与刷新 -->
        <div class="flex items-center gap-2 relative">
          <!-- 供应商/模型下拉选择器 -->
          <div class="relative">
            <button
              @click="isModelDropdownOpen = !isModelDropdownOpen"
              class="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 text-xs text-slate-700 dark:text-zinc-200 shadow-2xs flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <span>{{ currentModelLabel }}</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- 下拉菜单 -->
            <div
              v-if="isModelDropdownOpen"
              class="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 text-xs"
            >
              <div
                v-for="opt in modelOptions"
                :key="opt.id"
                @click="handleSelectModel(opt.id)"
                class="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-between"
                :class="{ 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30': qoderStore.popupFilterModel === opt.id }"
              >
                <span>{{ opt.label }}</span>
                <span v-if="qoderStore.popupFilterModel === opt.id">✓</span>
              </div>
            </div>
          </div>

          <!-- 刷新按钮 -->
          <button
            @click="qoderStore.refresh()"
            :disabled="qoderStore.isRefreshing"
            title="刷新数据"
            class="p-1.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 text-slate-600 dark:text-zinc-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            <svg
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': qoderStore.isRefreshing }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <!-- 副标题说明 (原汁原味还原截图) -->
      <div class="text-[11px] text-slate-400 dark:text-zinc-500 leading-tight">
        统计网关调用与会话日志调用；本地拒绝的请求不计入汇总。
      </div>

      <!-- 4 指标卡片网格 (Token/积分 / 请求 / 费用 / 缓存命中率) -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xs grid grid-cols-4 divide-x divide-slate-100 dark:divide-zinc-800/80">
        <!-- 1. Token 或 积分 -->
        <div class="pr-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">{{ qoderStore.popupSummary.metricLabel }}</span>
          <div class="text-xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
            {{ qoderStore.popupSummary.tokensFormatted }}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            {{ qoderStore.popupSummary.subLabel1 }} {{ qoderStore.popupSummary.inputTokensFormatted }} ·<br />
            {{ qoderStore.popupSummary.subLabel2 }} {{ qoderStore.popupSummary.outputTokensFormatted }} ·<br />
            {{ qoderStore.popupSummary.subLabel3 }} {{ qoderStore.popupSummary.cacheTokensFormatted }}
          </div>
        </div>

        <!-- 2. 请求 -->
        <div class="px-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">请求</span>
          <div class="text-xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
            {{ qoderStore.popupSummary.requests }}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            没有失败
          </div>
        </div>

        <!-- 3. 费用 -->
        <div class="px-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">费用</span>
          <div class="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">
            {{ qoderStore.popupSummary.costFormatted }}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            {{ qoderStore.popupSummary.costNote }}
          </div>
        </div>

        <!-- 4. 缓存命中率 -->
        <div class="pl-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">缓存命中率</span>
          <div class="text-xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
            {{ qoderStore.popupSummary.cacheHitRate }}%
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            {{ qoderStore.popupSummary.cacheNote }}
          </div>
        </div>
      </section>

      <!-- 主卡片: 图表 + 每一天各模型用量与速率拆解 -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-3.5">
        <!-- 维度切换药丸 (Token / 费用 / 请求) -->
        <div class="flex items-center justify-between">
          <div class="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-xl text-xs font-medium">
            <button
              @click="qoderStore.setPopupChartMetric('tokens')"
              class="px-3 py-1 rounded-lg transition-all cursor-pointer"
              :class="qoderStore.popupChartMetric === 'tokens' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500'"
            >
              Token
            </button>
            <button
              @click="qoderStore.setPopupChartMetric('cost')"
              class="px-3 py-1 rounded-lg transition-all cursor-pointer"
              :class="qoderStore.popupChartMetric === 'cost' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500'"
            >
              费用
            </button>
            <button
              @click="qoderStore.setPopupChartMetric('requests')"
              class="px-3 py-1 rounded-lg transition-all cursor-pointer"
              :class="qoderStore.popupChartMetric === 'requests' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500'"
            >
              请求
            </button>
          </div>

          <!-- 悬浮或点击的单日/时段状态提示 -->
          <div class="text-[11px] font-mono">
            <span v-if="hoveredBar" class="text-indigo-600 dark:text-indigo-400 font-semibold">
              {{ hoveredBar.label }}: {{ hoveredBar.formattedValue }}
            </span>
            <span v-else-if="qoderStore.popupSelectedDate" class="text-indigo-600 dark:text-indigo-400 font-semibold">
              已锁定 【{{ qoderStore.popupSelectedDate }}】 (再次点击重置)
            </span>
            <span v-else class="text-slate-400">
              点击柱状图查看单日明细
            </span>
          </div>
        </div>

        <!-- 柱状图本体 (带左侧刻度线与悬浮提示) -->
        <div class="relative w-full h-40 flex flex-col justify-between pt-2">
          <!-- 刻度线与图表主体 -->
          <div class="relative w-full flex-1 flex">
            <!-- 左侧 Y 轴刻度文本 -->
            <div class="w-14 h-full flex flex-col justify-between text-[10px] text-slate-400 font-mono pr-2 text-right">
              <span v-for="t in yAxisTicks" :key="t" class="leading-none">{{ t }}</span>
            </div>

            <!-- 右侧图表与水平虚线 -->
            <div class="relative flex-1 h-full flex items-end">
              <!-- 5 条水平参考虚线 -->
              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div v-for="i in 5" :key="i" class="w-full border-b border-dashed border-slate-100 dark:border-zinc-800"></div>
              </div>

              <!-- 垂直柱状条 -->
              <div class="w-full h-full flex items-end justify-between gap-1 z-10 px-1">
                <div
                  v-for="b in qoderStore.popupChartBars"
                  :key="b.key"
                  class="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  @mouseenter="hoveredBar = b"
                  @mouseleave="hoveredBar = null"
                  @click="handleSelectBar(b.key)"
                >
                  <!-- 柱子 -->
                  <div
                    v-if="b.percentage > 0"
                    class="w-full max-w-[20px] rounded-t-sm transition-all duration-200"
                    :class="
                      b.isSelected
                        ? 'bg-indigo-600 ring-2 ring-indigo-400'
                        : 'bg-[#4F46E5] dark:bg-[#6366F1] group-hover:bg-indigo-500'
                    "
                    :style="{ height: `${Math.max(6, b.percentage)}%` }"
                  ></div>

                  <!-- 0 占位小点 -->
                  <div v-else class="w-1.5 h-1 rounded-full bg-slate-200 dark:bg-zinc-700 mb-0.5"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- X 轴刻度标签 -->
          <div class="flex justify-between text-[10px] text-slate-400 font-mono pl-14 pt-1.5">
            <template v-if="qoderStore.popupPeriod === 'today'">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </template>
            <template v-else>
              <span v-for="b in qoderStore.popupChartBars" :key="b.key" class="truncate max-w-[36px]">
                {{ b.label }}
              </span>
            </template>
          </div>
        </div>

        <!-- 每一天各模型用量与速率深度拆解 -->
        <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <div
            v-for="m in qoderStore.popupModelBreakdown"
            :key="m.id"
            class="flex flex-col gap-1.5"
          >
            <!-- 头部: 图标 + 模型名 vs 主用量 -->
            <div class="flex items-center justify-between text-xs font-mono">
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2 h-2 rounded-xs inline-block"
                  :class="m.barColor"
                ></span>
                <span class="text-slate-400 text-[10px]">{{ m.icon }}</span>
                <span class="font-bold text-slate-900 dark:text-zinc-100 font-sans">{{ m.name }}</span>
                <span class="text-[10px] text-slate-400 font-mono">({{ m.subtitle }})</span>
              </div>
              <!-- 右侧主用量 -->
              <div class="flex items-baseline gap-1.5">
                <span class="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                  {{ m.primaryFormatted }}
                </span>
                <span class="text-[10px] text-slate-400 font-mono">
                  / {{ m.secondaryFormatted }}
                </span>
              </div>
            </div>

            <!-- 横向彩色进度条 -->
            <div class="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="m.barColor"
                :style="{ width: `${m.percentage}%` }"
              ></div>
            </div>

            <!-- 底部细化统计: 请求数 · 耗时 · 速率(TPS) · 费用 · 占比 -->
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>
                {{ m.requests }} 次请求 · {{ m.costFormatted }} · 占比 {{ m.percentage }}%
              </span>
              <span class="text-slate-600 dark:text-zinc-400 font-medium">
                耗时 {{ m.avgDurationSec }}s · 速率 {{ m.speedTps }} tok/s ({{ m.speedRating }})
              </span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- ==================== B 面：仓库与效能 (代码资产深度沉淀) ==================== -->
    <template v-else-if="qoderStore.popupView === 'B'">
      <!-- 卡片 1: 🏆 官方工程 AI 代码产出排行 (来自 API: /api/v1/me/ai-code/stats/ranking) -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100">
            <span>🏆</span>
            <span>Git 仓库 AI 代码贡献排行 (近 7 天)</span>
          </div>
          <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
            官方 API: stats/ranking
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="repo in qoderStore.popupRepoRankings"
            :key="repo.repo_name"
            class="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60"
          >
            <!-- 仓库名与产出行数 -->
            <div class="flex items-center justify-between text-xs font-mono">
              <div class="flex items-center gap-2">
                <span
                  class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  :class="repo.rank === 1 ? 'bg-amber-500' : repo.rank === 2 ? 'bg-slate-400' : repo.rank === 3 ? 'bg-amber-700' : 'bg-slate-300 dark:bg-zinc-600'"
                >
                  {{ repo.rank }}
                </span>
                <span class="font-bold text-slate-900 dark:text-zinc-100 font-mono">{{ repo.repo_name }}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded-sm bg-slate-200/60 dark:bg-zinc-700/60 text-slate-600 dark:text-zinc-300 font-sans">
                  {{ repo.tag }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{{ repo.aiLinesChanged }}</span>
                <span class="text-[10px] text-slate-400 ml-1">行</span>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="w-full bg-slate-200/60 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="repo.color"
                :style="{ width: `${repo.aiShareRate}%` }"
              ></div>
            </div>

            <!-- 详细统计 -->
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>占总 AI 代码 {{ repo.aiShareRate }}%</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-medium">采纳率 {{ repo.acceptanceRate }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 卡片 2: ⚡️ 官方模型选型矩阵与实测建议 (对比哪个更好用) -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100">
            <span>⚡️</span>
            <span>模型效能与实操选型指南</span>
          </div>
          <span class="text-[10px] text-slate-400">实测速率与成本综合评定</span>
        </div>

        <div class="space-y-2 text-xs">
          <!-- Fast -->
          <div class="p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20">
            <div class="flex items-center justify-between font-bold text-blue-700 dark:text-blue-300">
              <span>⚡️ Fast (极速主力)</span>
              <span class="text-[10px] font-mono font-normal">125 tok/s · 0.4s 延迟 · 成本最低</span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
              **首选日常主力**：代码补全、单行/多行补全、生成测试用例。消耗积分少、响应几乎无感。
            </p>
          </div>

          <!-- WorkBuddy (GLM-5.3) -->
          <div class="p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/40 bg-cyan-50/30 dark:bg-cyan-950/20">
            <div class="flex items-center justify-between font-bold text-cyan-700 dark:text-cyan-300">
              <span>🧠 WorkBuddy (GLM-5.3)</span>
              <span class="text-[10px] font-mono font-normal">45 tok/s · 3.2s 耗时 · 深度思考</span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
              **复杂架构与跨文件首选**：处理大篇幅业务流、复杂 Bug 根因分析、跨模块方案重组。
            </p>
          </div>

          <!-- Qwen3.8-Max -->
          <div class="p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-950/20">
            <div class="flex items-center justify-between font-bold text-violet-700 dark:text-violet-300">
              <span>🔷 Qwen3.8-Max (全能重构)</span>
              <span class="text-[10px] font-mono font-normal">85 tok/s · 1.8s 耗时 · 语义理解</span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
              **业务重构主力**：老旧业务重构、接口协议转换，兼顾极高语义准确度与吞吐速度。
            </p>
          </div>
        </div>
      </section>

      <!-- 卡片 3: 🔒 技术原理与无侵入 Token 说明 -->
      <section class="bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/40 text-xs">
        <div class="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
          <span>💡</span>
          <span>为什么 Qoder 云端只有积分，而 Antigravity 能知 Token？</span>
        </div>
        <p class="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
          Antigravity 与 Cursor 作为宿主引擎，在发起模型 SSE 连接时于内存截获了返回的 <code class="font-mono bg-white/60 dark:bg-zinc-800 px-1 rounded">usage.prompt_tokens</code>。Qoder 官方网页由于抹平计费差异，入库只存 Credits。我们通过 <span class="font-semibold">1 Credit ≈ 12,500 Token</span> 双向等效换算，实现 0 侵入式全景监控！
        </p>
      </section>
    </template>

    <!-- ==================== C 面：本地订阅 (各 IDE 会话与原生 Token 聚合) ==================== -->
    <template v-else>
      <!-- 本地连接状态条与开机自启提示 -->
      <section
        class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
        :class="
          qoderStore.isLocalDaemonOnline
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-slate-100/80 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
        "
      >
        <div class="flex items-center gap-1.5 font-medium">
          <span
            class="w-2 h-2 rounded-full"
            :class="qoderStore.isLocalDaemonOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"
          ></span>
          <span>{{ qoderStore.isLocalDaemonOnline ? '本地守护服务已连接 (127.0.0.1:3425)' : '未连接本地守护服务 (127.0.0.1:3425)' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="!qoderStore.isLocalDaemonOnline" class="text-[10px] text-slate-400 font-mono">终端: magpie autostart on</span>
          <button
            @click="qoderStore.checkLocalDaemon()"
            class="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono hover:bg-slate-50 transition cursor-pointer"
          >
            {{ qoderStore.isCheckingLocalDaemon ? '检测中...' : '刷新检测' }}
          </button>
        </div>
      </section>

      <!-- 副标题说明 (像素级对齐截图) -->
      <div class="text-[11px] text-slate-400 dark:text-zinc-500 leading-tight">
        统计网关调用与会话日志调用；本地拒绝的请求不计入汇总。
      </div>

      <!-- 4 指标卡片 (Token: 2.31 亿, 请求: 1676, 费用: ≈¥190+, 缓存命中率: 96%) -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xs grid grid-cols-4 divide-x divide-slate-100 dark:divide-zinc-800/80">
        <div class="pr-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">Token</span>
          <div class="text-xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
            2.31 亿
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            输入 999.6 万 ·<br />
            输出 148.4 万 ·<br />
            缓存 2.19 亿
          </div>
        </div>

        <div class="px-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">请求</span>
          <div class="text-xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
            1676
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            没有失败
          </div>
        </div>

        <div class="px-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">费用</span>
          <div class="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">
            ≈¥190+
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            38 个没有价格
          </div>
        </div>

        <div class="pl-2.5">
          <span class="text-[11px] text-slate-400 font-medium block">缓存命中率</span>
          <div class="text-xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
            96%
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1 leading-tight">
            6 个请求未计入: 其服务商不统计缓存
          </div>
        </div>
      </section>

      <!-- 柱状图 + 本地 Agent 会话日志列表 (对齐真实截图) -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-3.5">
        <!-- 维度药丸 -->
        <div class="flex items-center justify-between text-xs font-mono">
          <div class="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-xl">
            <span class="px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs">Token</span>
            <span class="px-3 py-1 text-slate-500">费用</span>
            <span class="px-3 py-1 text-slate-500">请求</span>
          </div>
          <span class="text-slate-400 text-[10px]">今日 24 小时时段</span>
        </div>

        <!-- 柱状图本体 -->
        <div class="relative w-full h-32 flex flex-col justify-between pt-1">
          <div class="relative w-full flex-1 flex">
            <div class="w-14 h-full flex flex-col justify-between text-[10px] text-slate-400 font-mono pr-2 text-right">
              <span>8000 万</span>
              <span>6000 万</span>
              <span>4000 万</span>
              <span>2000 万</span>
              <span>0</span>
            </div>
            <div class="relative flex-1 h-full flex items-end">
              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div v-for="i in 5" :key="i" class="w-full border-b border-dashed border-slate-100 dark:border-zinc-800"></div>
              </div>
              <div class="w-full h-full flex items-end justify-between gap-1 z-10 px-1">
                <div v-for="b in qoderStore.popupChartBars" :key="b.key" class="flex-1 h-full flex flex-col justify-end items-center">
                  <div
                    v-if="b.percentage > 0"
                    class="w-full max-w-[20px] rounded-t-sm bg-[#4F46E5] dark:bg-[#6366F1]"
                    :style="{ height: `${Math.max(6, b.percentage)}%` }"
                  ></div>
                  <div v-else class="w-1.5 h-1 rounded-full bg-slate-200 dark:bg-zinc-700 mb-0.5"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400 font-mono pl-14 pt-1.5">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
          </div>
        </div>

        <!-- 本地各 Agent 真实会话列表 (像素级还原截图) -->
        <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <!-- 本地会话 (Antigravity CLI / App) -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs font-mono">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-xs bg-[#4F46E5] inline-block"></span>
                <span class="text-slate-400 text-[10px]">⬡</span>
                <span class="font-bold text-slate-900 dark:text-zinc-100 font-sans">本地会话</span>
                <span class="text-[10px] text-slate-400">(Antigravity CLI / App)</span>
              </div>
              <div class="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                2.3 亿
              </div>
            </div>
            <div class="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-[#4F46E5] w-full"></div>
            </div>
            <div class="text-[10px] text-slate-400 font-mono">
              1635 个请求 · ≈¥190 · 100%
            </div>
          </div>

          <!-- WorkBuddy / CodeBuddy -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs font-mono">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-xs bg-[#06B6D4] inline-block"></span>
                <span class="text-slate-400 text-[10px]">🟢</span>
                <span class="font-bold text-slate-900 dark:text-zinc-100 font-sans">WorkBuddy</span>
                <span class="text-[10px] text-slate-400">(GLM-5.3 / CodeBuddy)</span>
              </div>
              <div class="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                33.1 万
              </div>
            </div>
            <div class="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-[#06B6D4] w-[1.4%]"></div>
            </div>
            <div class="text-[10px] text-slate-400 font-mono">
              41 个请求 · ≈¥2.5 · 1.4%
            </div>
          </div>
        </div>
      </section>

      <!-- 底部开机自启知识卡片 -->
      <section class="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-2.5 border border-indigo-100/60 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-zinc-400 space-y-1">
        <div class="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
          <span>🚀</span>
          <span>Mac 开机自动启用机制说明：</span>
        </div>
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          在终端执行 <code class="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 border text-indigo-600 dark:text-indigo-400 font-mono font-semibold">magpie autostart on</code>，底层将自动在 <code class="font-mono">~/Library/LaunchAgents/</code> 注册开机守护服务，Mac 登录即静默拉起，插件秒级订阅！
        </p>
      </section>
    </template>

    <!-- 底部操作与退出 -->
    <footer class="flex items-center justify-between pt-1 text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
      <div class="flex items-center gap-2">
        <span>今日 10:00 重置: {{ qoderStore.dailyCountdown.text }}</span>
        <span>·</span>
        <button
          @click="() => toggleDark()"
          class="hover:text-slate-700 dark:hover:text-zinc-300 transition cursor-pointer"
        >
          {{ isDark ? '🌙 深色' : '☀️ 浅色' }}
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="openDashboard"
          class="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition cursor-pointer"
        >
          进入全屏工作台 🚀
        </button>
        <button
          @click="closePopup"
          class="hover:text-rose-500 transition cursor-pointer"
        >
          退出
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 滚动条极简 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 150, 0.2);
  border-radius: 4px;
}
</style>
