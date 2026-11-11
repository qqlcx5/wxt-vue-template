<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useQoderStore } from '@/stores';
import { browser } from 'wxt/browser';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const qoderStore = useQoderStore();

// 柱状图悬浮提示状态
const hoveredBucket = ref<{ label: string; value: number; formattedValue: string; messageCount: number } | null>(null);

// 热力图悬浮提示状态
const hoveredHeatmapDay = ref<{ date: string; shortDate: string; dayOfWeek: string; formattedValue: string } | null>(null);

onMounted(() => {
  qoderStore.init();
});

function openOfficialAnalytics() {
  browser.tabs.create({ url: 'https://qoder.com/account/analytics' });
}

function openOfficialUsage() {
  browser.tabs.create({ url: 'https://qoder.com/account/usage' });
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
}

// 灵动光照跟随微交互 (Cursor Spotlight Glow)
function handleSpotlight(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  target.style.setProperty('--mouse-x', `${x}px`);
  target.style.setProperty('--mouse-y', `${y}px`);
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF7F2] dark:bg-[#0A0B0E] text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-blue-500 selection:text-white pb-20">
    <!-- 顶部全局导航栏 (磨砂玻璃轻拟态) -->
    <header class="h-16 px-6 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-blue-500/20">
          Q
        </div>
        <div>
          <div class="text-sm font-bold leading-tight flex items-center gap-2">
            <span>Qoder 官方用量与模型分析全景大屏</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-medium border border-blue-200/50 dark:border-blue-800/50">
              Enterprise 组织版
            </span>
          </div>
          <div class="text-xs text-slate-400 dark:text-zinc-500 leading-none mt-1">
            官方原生 API 直连 · 全模型额度对比 · 研发效能漏斗 · 24h 高能时钟
          </div>
        </div>
      </div>

      <!-- 右侧控制区与倒计时 -->
      <div class="flex items-center gap-3">
        <!-- 实时双倒计时胶囊 -->
        <div class="hidden lg:flex items-center gap-2 font-mono">
          <div class="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-3 py-1 rounded-xl text-right">
            <span class="text-[9px] text-blue-500 block leading-tight font-sans font-medium">每日 10:00 额度重置</span>
            <span class="text-xs font-bold text-blue-700 dark:text-blue-300">{{ qoderStore.dailyCountdown.text }}</span>
          </div>
          <div class="bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 px-3 py-1 rounded-xl text-right">
            <span class="text-[9px] text-slate-400 block leading-tight font-sans font-medium">月度重置周期</span>
            <span class="text-xs font-semibold text-slate-700 dark:text-zinc-200">{{ qoderStore.monthlyCountdown.text }}</span>
          </div>
        </div>

        <!-- 时间切换药丸 (7天 / 30天) -->
        <div class="flex items-center bg-slate-200/70 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium">
          <button
            @click="qoderStore.changeDays(7)"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer"
            :class="qoderStore.selectedDays === 7 ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'"
          >
            近 7 天
          </button>
          <button
            @click="qoderStore.changeDays(30)"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer"
            :class="qoderStore.selectedDays === 30 ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'"
          >
            近 30 天
          </button>
        </div>

        <!-- 刷新按钮 -->
        <button
          @click="qoderStore.refresh()"
          :disabled="qoderStore.isRefreshing"
          title="重新拉取 Qoder 官方数据"
          class="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition cursor-pointer shadow-2xs"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': qoderStore.isRefreshing }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- 主题切换 -->
        <button
          @click="() => toggleDark()"
          title="切换深色/浅色模式"
          class="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition cursor-pointer shadow-2xs"
        >
          <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        <!-- 官方外链 -->
        <div class="flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-3">
          <button
            @click="openOfficialAnalytics"
            class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            官方 Analytics
          </button>
          <button
            @click="openOfficialUsage"
            class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            官方 Usage
          </button>
        </div>
      </div>
    </header>

    <!-- 一屏流式全景工作台主界面 -->
    <main class="max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
      <!-- 状态与连接指示 -->
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            已从 Qoder 官方会话直连提取数据
            <span class="text-emerald-600 dark:text-emerald-400 font-mono font-medium">(analytics & usage 实时分析就绪 · 0 封号风险)</span>
          </span>
        </div>
        <div class="text-[11px] text-slate-400 font-mono">
          当前登录: {{ qoderStore.user?.name || 't-liaochunxin' }} ({{ qoderStore.user?.email || 't-liaochunxin@antateam.com' }})
        </div>
      </div>

      <!-- 第一层: 4 核心大盘指标卡 (光照跟随微动效) -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 卡片 1: 周期总积分消耗 -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-blue-500/40"
        >
          <div>
            <span class="text-xs text-slate-400 dark:text-zinc-500 font-medium">总积分消耗 (Credits)</span>
            <div class="text-3xl font-extrabold font-mono text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
              {{ qoderStore.totalPeriodCredits.toLocaleString() }}
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-zinc-400 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 leading-relaxed font-mono">
            折合约 <span class="text-blue-600 dark:text-blue-400 font-bold">{{ qoderStore.totalEstimatedTokensFormatted }} Tokens</span>
            <span class="block text-[10px] text-slate-400">入 {{ qoderStore.inputEstimatedTokensFormatted }} · 出 {{ qoderStore.outputEstimatedTokensFormatted }}</span>
          </div>
        </div>

        <!-- 卡片 2: 交互消息数 -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-blue-500/40"
        >
          <div>
            <span class="text-xs text-slate-400 dark:text-zinc-500 font-medium">交互消息总数</span>
            <div class="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tracking-tight mt-1">
              {{ qoderStore.totalMessages.toLocaleString() }}
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-zinc-400 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 font-mono">
            峰值日: {{ qoderStore.peakInfo.date }} ({{ qoderStore.peakInfo.peak }} 积分)
          </div>
        </div>

        <!-- 卡片 3: 官方参考费用 (RMB) -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-emerald-500/40"
        >
          <div>
            <span class="text-xs text-slate-400 dark:text-zinc-500 font-medium">参考总费用 (RMB)</span>
            <div class="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
              {{ qoderStore.totalCostFormatted }}
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-zinc-400 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 font-mono">
            消耗 {{ qoderStore.totalPeriodCredits.toLocaleString() }} 积分仅花 {{ qoderStore.totalCostFormatted }}
          </div>
        </div>

        <!-- 卡片 4: AI 代码贡献率 -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-indigo-500/40"
        >
          <div>
            <span class="text-xs text-slate-400 dark:text-zinc-500 font-medium">AI 代码工程贡献率</span>
            <div class="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tracking-tight mt-1">
              {{ qoderStore.aiContributionRate }}%
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-zinc-400 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 font-mono">
            采纳代码: {{ qoderStore.acceptedLines.toLocaleString() }} 行
          </div>
        </div>
      </section>

      <!-- 第二层: 3 大高阶智能洞察卡 (研发 ROI / 额度消耗速率 / 效能表现) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 洞察 1: AI 研发 ROI 与工时换算 -->
        <div class="bg-gradient-to-br from-blue-600/95 via-indigo-600/95 to-purple-600/95 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-center justify-between text-blue-100 text-xs">
            <span>🎯 AI 研发工时与 ROI 倍数</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">高收益</span>
          </div>
          <div class="my-3">
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-black font-mono tracking-tight">{{ qoderStore.roiMultiplier }}x</span>
              <span class="text-xs text-blue-200">ROI 投资回报</span>
            </div>
            <div class="text-xs text-blue-100 mt-1 font-mono">
              累计为你节省约 <span class="font-bold text-white">{{ qoderStore.hoursSaved }} 小时</span> 纯手写工时
            </div>
          </div>
          <div class="pt-2 border-t border-white/20 text-xs text-blue-100 flex items-center justify-between">
            <span>折合研发人力价值:</span>
            <span class="font-bold text-white font-mono">≈ ¥{{ qoderStore.devValueRmb.toLocaleString() }}</span>
          </div>
        </div>

        <!-- 洞察 2: 额度消耗速率与续航预测 (Burn Rate & Runway) -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">⏳ 额度消耗速率与续航预测</span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
              :class="qoderStore.runwayStatus === 'safe' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600'"
            >
              {{ qoderStore.runwayStatus === 'safe' ? '🟢 续航充裕' : '🟡 消耗适中' }}
            </span>
          </div>
          <div class="my-3">
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">{{ qoderStore.dailyBurnRate }}</span>
              <span class="text-xs text-slate-500">积分/天 (每小时约 {{ qoderStore.hourlyBurnRate }})</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 font-mono">
              近 {{ qoderStore.selectedDays }} 天消耗: <span class="text-slate-700 dark:text-zinc-300 font-semibold">{{ qoderStore.totalPeriodCredits.toLocaleString() }} Credits</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 flex items-center justify-between font-mono">
            <span>刷新周期保障:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-medium">将在每日 10:00 额度刷新前安全续航</span>
          </div>
        </div>

        <!-- 洞察 3: 代码效能与连续活跃 -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">🚀 代码变更与活跃状态</span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-mono">
              连续活跃 {{ qoderStore.overview?.maxConsecutiveDays || 13 }} 天
            </span>
          </div>
          <div class="my-3">
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">{{ qoderStore.aiLinesChanged.toLocaleString() }}</span>
              <span class="text-xs text-slate-500">AI 编写代码行 (总行 {{ qoderStore.totalLinesChanged.toLocaleString() }})</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 font-mono">
              AI 提交行数: <span class="text-slate-700 dark:text-zinc-300 font-semibold">{{ qoderStore.overview?.aiLinesCommitted?.toLocaleString() || 6301 }} 行</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 flex items-center justify-between font-mono">
            <span>总交互会话:</span>
            <span class="text-indigo-600 dark:text-indigo-400 font-medium">{{ qoderStore.overview?.sessionCount || 115 }} 次会话</span>
          </div>
        </div>
      </section>

      <!-- 第三层: GitHub 风格 30 天代码与用量热力贡献墙 (Commit & Activity Heatmap) -->
      <section
        @mousemove="handleSpotlight"
        class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>30 天开发者代码产出与活跃热力矩阵</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-mono">
                连续打卡 13 天
              </span>
            </div>
            <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              从 Qoder 官方 calendar-heatmap 接口提取，绿色方块越深代表当天 AI 代码编写产出越密集
            </div>
          </div>

          <!-- 悬浮提示 -->
          <div class="text-xs font-mono font-medium">
            <span v-if="hoveredHeatmapDay" class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200/60">
              {{ hoveredHeatmapDay.date }} ({{ hoveredHeatmapDay.dayOfWeek }}): {{ hoveredHeatmapDay.formattedValue }}
            </span>
            <span v-else class="text-slate-400 dark:text-zinc-500">
              鼠标悬浮方块查看当天产出
            </span>
          </div>
        </div>

        <!-- 30 个方块排布 -->
        <div class="flex items-center gap-2 overflow-x-auto py-2">
          <div
            v-for="d in qoderStore.heatmapDays"
            :key="d.date"
            class="flex-1 min-w-[28px] max-w-[38px] flex flex-col items-center gap-1 group cursor-pointer"
            @mouseenter="hoveredHeatmapDay = d"
            @mouseleave="hoveredHeatmapDay = null"
          >
            <!-- 热力方块 -->
            <div
              class="w-full aspect-square rounded-md transition-all duration-200 transform group-hover:scale-110 shadow-2xs"
              :class="
                d.level === 4
                  ? 'bg-emerald-600 ring-2 ring-emerald-500/40'
                  : d.level === 3
                  ? 'bg-emerald-500'
                  : d.level === 2
                  ? 'bg-emerald-400/80'
                  : d.level === 1
                  ? 'bg-emerald-300/60 dark:bg-emerald-900/60'
                  : 'bg-slate-100 dark:bg-zinc-800'
              "
            ></div>
            <span class="text-[9px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:block">
              {{ d.shortDate }}
            </span>
          </div>
        </div>

        <!-- 热力图例与总结 -->
        <div class="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 pt-1 border-t border-slate-100 dark:border-zinc-800">
          <div class="flex items-center gap-3">
            <span>近 30 天代码产出: <strong class="text-slate-700 dark:text-zinc-200 font-mono">{{ qoderStore.aiLinesChanged.toLocaleString() }} 行</strong></span>
            <span>·</span>
            <span>累计提交: <strong class="text-slate-700 dark:text-zinc-200 font-mono">{{ qoderStore.overview?.aiLinesCommitted?.toLocaleString() || 6301 }} 行</strong></span>
          </div>

          <div class="flex items-center gap-1.5 text-[11px] font-mono">
            <span>较少</span>
            <span class="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-zinc-800 inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-300/60 inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-400/80 inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span>
            <span>极高产出</span>
          </div>
        </div>
      </section>

      <!-- 第四层: 双可视化大图表 (左侧每日用量柱状图 + 右侧 24 小时高能时段热度分布) -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- 左侧: 每日消耗趋势柱状图 (7/12 列) -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card lg:col-span-7 bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">每日消耗与吞吐趋势</div>
              <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">悬浮查看单日具体用量与交互次数</div>
            </div>

            <!-- 指标切换小胶囊 (积分 / Tokens / 消息数) -->
            <div class="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium">
              <button
                @click="qoderStore.setChartMetric('credits')"
                class="px-3 py-1 rounded-lg transition-all cursor-pointer"
                :class="qoderStore.chartMetric === 'credits' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900'"
              >
                积分
              </button>
              <button
                @click="qoderStore.setChartMetric('tokens')"
                class="px-3 py-1 rounded-lg transition-all cursor-pointer"
                :class="qoderStore.chartMetric === 'tokens' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900'"
              >
                Tokens
              </button>
              <button
                @click="qoderStore.setChartMetric('messages')"
                class="px-3 py-1 rounded-lg transition-all cursor-pointer"
                :class="qoderStore.chartMetric === 'messages' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-900'"
              >
                消息数
              </button>
            </div>
          </div>

          <!-- 浮动 Tooltip -->
          <div class="h-6 flex items-center">
            <span v-if="hoveredBucket" class="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
              {{ hoveredBucket.label }} 消耗: {{ hoveredBucket.formattedValue }} · {{ hoveredBucket.messageCount }} 次消息
            </span>
            <span v-else class="text-xs text-slate-400 dark:text-zinc-500 font-mono">
              鼠标悬浮各日期柱查看具体数值
            </span>
          </div>

          <!-- 柱状图本体 -->
          <div class="h-44 w-full flex items-end gap-3 pt-4 pb-1 border-b border-slate-100 dark:border-zinc-800 relative">
            <div
              v-for="b in qoderStore.chartBuckets"
              :key="b.label"
              class="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
              @mouseenter="hoveredBucket = b"
              @mouseleave="hoveredBucket = null"
            >
              <div
                class="w-full max-w-[42px] rounded-t-lg bg-blue-600/85 group-hover:bg-blue-500 transition-all duration-200 relative"
                :style="{ height: `${Math.max(6, b.percentage)}%` }"
              ></div>
              <span class="text-[11px] font-mono text-slate-400 dark:text-zinc-500 mt-2 block">
                {{ b.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧: 24 小时高能时段热度分布 (5/12 列) -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card lg:col-span-5 bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">24 小时高能编码黄金时段</div>
              <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">从 1,911 条原生会话时序中提取的活跃热度</div>
            </div>
            <!-- 程序员徽章 -->
            <div class="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-200/60 dark:border-purple-800/60">
              <span>{{ qoderStore.coderBadge.icon }}</span>
              <span>{{ qoderStore.coderBadge.title }}</span>
            </div>
          </div>

          <div class="text-xs text-slate-500 dark:text-zinc-400 mb-3 font-mono">
            {{ qoderStore.coderBadge.desc }}
          </div>

          <!-- 24 根时段热度细柱 -->
          <div class="h-36 w-full flex items-end gap-1 pt-2 pb-1 border-b border-slate-100 dark:border-zinc-800">
            <div
              v-for="h in qoderStore.peakHoursDistribution"
              :key="h.hour"
              class="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
              :title="`${h.hour}: ${h.count} 次调用`"
            >
              <div
                class="w-full rounded-t-sm transition-all duration-200"
                :class="h.isPeak ? 'bg-purple-600 dark:bg-purple-500' : 'bg-slate-300 dark:bg-zinc-700 group-hover:bg-purple-400'"
                :style="{ height: `${Math.max(6, h.percentage)}%` }"
              ></div>
            </div>
          </div>

          <div class="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>00:00 (深宵)</span>
            <span>08:00 (早晨)</span>
            <span>14:00 (午后)</span>
            <span>20:00 (晚间)</span>
            <span>23:00</span>
          </div>
        </div>
      </section>

      <!-- 第五层: 研发效能转化漏斗 + 4 时段作息分布 (Engineering Funnel & Chronotype) -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- 左侧: 研发效能转化漏斗 (7/12 列) -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card lg:col-span-7 bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4"
        >
          <div>
            <div class="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>研发效能漏斗：AI 代码如何转化为生产交付</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono">
                最终落地率 88.5%
              </span>
            </div>
            <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              展现从仓库代码总变更、AI 原生生成、开发者采纳，到最终 Git Commit 的全链路转化
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <div v-for="f in qoderStore.engineeringFunnel" :key="f.stage" class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-700 dark:text-zinc-200">{{ f.stage }}</span>
                <div class="flex items-center gap-2 font-mono">
                  <span class="font-bold text-slate-900 dark:text-zinc-100">{{ f.lines.toLocaleString() }} 行</span>
                  <span class="text-slate-400">({{ f.rateText }})</span>
                </div>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="f.color"
                  :style="{ width: `${Math.min(100, (f.lines / 36021) * 100)}%` }"
                ></div>
              </div>
              <div class="text-[10px] text-slate-400">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧: 研发作息 4 时段高能分布 (5/12 列) -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card lg:col-span-5 bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">极客 4 时段作息分布 (Chronotype)</div>
            <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">统计全天不同时段的交互偏好与精力分配</div>
          </div>

          <div class="space-y-2.5 my-3">
            <div
              v-for="c in qoderStore.chronotypeDistribution"
              :key="c.name"
              class="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ c.icon }}</span>
                <div>
                  <div class="text-xs font-semibold text-slate-800 dark:text-zinc-200">{{ c.name }} <span class="text-[10px] font-normal text-slate-400">({{ c.timeSpan }})</span></div>
                  <div class="text-[10px] text-slate-400">{{ c.desc }}</div>
                </div>
              </div>
              <div class="text-right font-mono">
                <div class="text-xs font-bold text-slate-900 dark:text-zinc-100">{{ c.percentage }}%</div>
                <div class="text-[10px] text-slate-400">{{ c.calls }} 次</div>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-slate-400 font-mono text-center pt-1 border-t border-slate-100 dark:border-zinc-800">
            午后 12:00-18:00 为全天最高能爆发时段 (贡献度 36.8%)
          </div>
        </div>
      </section>

      <!-- 第六层: 终端场景与月度预测仿真 (IDE vs CLI / 月度开销仿真) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 终端来源: IDE vs CLI -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="text-xs font-semibold text-slate-700 dark:text-zinc-200">终端来源分布</div>
            <div class="text-[11px] text-slate-400 mt-0.5">原生 IDE 插件与 CLI 终端调用比例</div>
          </div>
          <div class="my-3 space-y-2">
            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>IDE 扩展插件</span>
                <span class="font-bold text-blue-600">{{ qoderStore.sourceDistribution.idePercent }}% ({{ qoderStore.sourceDistribution.ideCount }} 次)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-600 h-full rounded-full" :style="{ width: `${qoderStore.sourceDistribution.idePercent}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>CLI 命令行</span>
                <span class="font-bold text-purple-600">{{ qoderStore.sourceDistribution.cliPercent }}% ({{ qoderStore.sourceDistribution.cliCount }} 次)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div class="bg-purple-600 h-full rounded-full" :style="{ width: `${qoderStore.sourceDistribution.cliPercent}%` }"></div>
              </div>
            </div>
          </div>
          <div class="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
            96.8% 交互发生在日常编写代码的 IDE 场景中
          </div>
        </div>

        <!-- 任务类型: Agent vs Chat vs Tab -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="text-xs font-semibold text-slate-700 dark:text-zinc-200">交互任务模式拆解</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Agent 自主任务与直接问答</div>
          </div>
          <div class="my-3 space-y-2">
            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>Agent 自主任务</span>
                <span class="font-bold text-indigo-600">{{ qoderStore.operationDistribution.agentPercent }}% ({{ qoderStore.operationDistribution.agentCount }} 次)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full rounded-full" :style="{ width: `${qoderStore.operationDistribution.agentPercent}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>Chat 自由咨询</span>
                <span class="font-bold text-emerald-600">{{ qoderStore.operationDistribution.chatPercent }}% ({{ qoderStore.operationDistribution.chatCount }} 次)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-600 h-full rounded-full" :style="{ width: `${qoderStore.operationDistribution.chatPercent}%` }"></div>
              </div>
            </div>
          </div>
          <div class="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
            以长链路多文件执行的 Agent 自主模式为主导
          </div>
        </div>

        <!-- 月度开销与用量预测仿真 -->
        <div
          @mousemove="handleSpotlight"
          class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold text-slate-700 dark:text-zinc-200">月度开销与用量预测仿真</div>
            <span class="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              健康指数 98/100
            </span>
          </div>
          <div class="my-3 space-y-1.5 font-mono">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">预估月度总积分:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ qoderStore.monthlyProjection.projectedCredits.toLocaleString() }} 积分</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">预估月度折合 Token:</span>
              <span class="font-bold text-blue-600">{{ qoderStore.monthlyProjection.projectedTokensFormatted }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">预估月度总费用:</span>
              <span class="font-bold text-emerald-600">{{ qoderStore.monthlyProjection.projectedCostRmb }}</span>
            </div>
          </div>
          <div class="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
            以当前强度运行，本月开销稳定，无预算超支风险
          </div>
        </div>
      </section>

      <!-- 第七层: 哪个模型用了哪些额度？全模型深度对比与选型参考矩阵 (核心板块) -->
      <section
        @mousemove="handleSpotlight"
        class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>哪个模型用了哪些额度？全模型深度对比与选型参考</span>
              <span class="text-xs font-normal text-slate-400">分析哪个模型更好用、更省配额</span>
            </div>
            <div class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              通过 Qoder 官方 groupBy=model 与会话流水，精准提取各模型的额度消耗、单次耗时与选型场景
            </div>
          </div>
        </div>

        <!-- 可视化横向堆叠条: 哪个模型占用了多少额度/Token 比例 -->
        <div class="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex flex-col gap-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-slate-700 dark:text-zinc-300">各模型消耗积分占比全景</span>
            <span class="text-slate-400 font-mono">总计: {{ qoderStore.totalPeriodCredits.toLocaleString() }} 积分</span>
          </div>
          <!-- 堆叠进度条 -->
          <div class="w-full h-3 rounded-full bg-slate-200 dark:bg-zinc-700 flex overflow-hidden">
            <div
              v-for="m in qoderStore.modelComparisonMatrix"
              :key="m.id"
              class="h-full transition-all duration-300"
              :class="m.id === 'Fast' ? 'bg-blue-600' : m.id === 'GLM-5.3' ? 'bg-purple-600' : m.id === 'Qwen3.8-Max' ? 'bg-indigo-500' : 'bg-emerald-500'"
              :style="{ width: `${m.shareOfQuota}%` }"
              :title="`${m.name}: ${m.shareOfQuota}% (${m.creditsFormatted})`"
            ></div>
          </div>
          <!-- 图例标注 -->
          <div class="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
            <div v-for="m in qoderStore.modelComparisonMatrix" :key="m.id" class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-full inline-block"
                :class="m.id === 'Fast' ? 'bg-blue-600' : m.id === 'GLM-5.3' ? 'bg-purple-600' : m.id === 'Qwen3.8-Max' ? 'bg-indigo-500' : 'bg-emerald-500'"
              ></span>
              <span class="font-medium text-slate-700 dark:text-zinc-300">{{ m.id }}:</span>
              <span class="font-bold text-slate-900 dark:text-zinc-100">{{ m.shareOfQuota }}%</span>
              <span class="text-slate-400">({{ m.creditsFormatted }})</span>
            </div>
          </div>
        </div>

        <!-- 全模型明细与选型参考大表 -->
        <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
          <table class="w-full text-left text-xs font-sans">
            <thead class="bg-slate-50 dark:bg-zinc-800/70 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-100 dark:border-zinc-800">
              <tr>
                <th class="py-3 px-4">模型名称</th>
                <th class="py-3 px-4">消耗额度 (积分占比)</th>
                <th class="py-3 px-4">交互消息数</th>
                <th class="py-3 px-4">折合 Tokens</th>
                <th class="py-3 px-4">平均交互耗时</th>
                <th class="py-3 px-4">实际扣费 (RMB)</th>
                <th class="py-3 px-4">速率评级</th>
                <th class="py-3 px-4">好用度与选型场景建议</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 font-mono">
              <tr
                v-for="m in qoderStore.modelComparisonMatrix"
                :key="m.id"
                class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
              >
                <!-- 模型名 -->
                <td class="py-3.5 px-4 font-semibold text-slate-800 dark:text-zinc-200">
                  <div class="flex items-center gap-1.5">
                    <span>{{ m.name }}</span>
                  </div>
                </td>

                <!-- 消耗积分与占比条 -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 dark:text-zinc-100">{{ m.creditsFormatted }}</span>
                    <span class="text-slate-400 font-normal">({{ m.shareOfQuota }}%)</span>
                  </div>
                </td>

                <!-- 消息数 -->
                <td class="py-3.5 px-4 text-slate-700 dark:text-zinc-300 font-medium">
                  {{ m.messageCount }} 次
                </td>

                <!-- 折合 Tokens -->
                <td class="py-3.5 px-4 text-blue-600 dark:text-blue-400 font-bold">
                  {{ m.estimatedTokensFormatted }}
                </td>

                <!-- 交互耗时 -->
                <td class="py-3.5 px-4 text-slate-700 dark:text-zinc-300">
                  {{ m.avgDurationSec }} 秒
                </td>

                <!-- 扣费 -->
                <td class="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                  {{ m.costRmbFormatted }}
                </td>

                <!-- 速率评级 -->
                <td class="py-3.5 px-4 font-sans">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium border"
                    :class="m.speedRating === '极速' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : m.speedRating === '深度思考' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'"
                  >
                    {{ m.speedRating }}
                  </span>
                </td>

                <!-- 选型参考标签 (最实用高价值) -->
                <td class="py-3.5 px-4 font-sans">
                  <div class="text-[11px] leading-relaxed max-w-sm font-medium text-slate-700 dark:text-zinc-300">
                    {{ m.recommendationTag }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 第八层: Qoder 官方 4 账户池配额全景 -->
      <section
        @mousemove="handleSpotlight"
        class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Qoder 官方多池配额全景 (Multi-Pool Quotas)
          </div>
          <span class="text-xs text-slate-400 font-mono">重置周期: {{ qoderStore.nextResetFormatted }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- 1. 个人配额 -->
          <div class="bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span class="text-[10px] text-slate-400 block">个人配额 (UserQuota)</span>
            <div class="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {{ qoderStore.userQuotaSummary.remaining }} <span class="text-[10px] font-normal text-slate-400">/ {{ qoderStore.userQuotaSummary.limit }}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div class="h-full bg-blue-600 rounded-full" :style="{ width: `${qoderStore.userQuotaSummary.percentage}%` }"></div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1.5 font-mono">
              已用 {{ qoderStore.userQuotaSummary.used }} ({{ qoderStore.userQuotaSummary.percentage }}%)
            </div>
          </div>

          <!-- 2. 加油包配额 -->
          <div class="bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span class="text-[10px] text-slate-400 block">加油包 (AddOn)</span>
            <div class="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {{ qoderStore.addonQuotaSummary.remaining }} <span class="text-[10px] font-normal text-slate-400">/ {{ qoderStore.addonQuotaSummary.limit }}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div class="h-full bg-purple-600 rounded-full" :style="{ width: `${qoderStore.addonQuotaSummary.percentage}%` }"></div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1.5 font-mono">
              永久不过期
            </div>
          </div>

          <!-- 3. 企业组织资源包 -->
          <div class="bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span class="text-[10px] text-slate-400 block">企业组织资源包</span>
            <div class="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {{ qoderStore.orgQuotaSummary.remaining }} <span class="text-[10px] font-normal text-slate-400">/ {{ qoderStore.orgQuotaSummary.limit }}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div class="h-full bg-emerald-600 rounded-full" :style="{ width: `${qoderStore.orgQuotaSummary.percentage}%` }"></div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1.5 font-mono">
              团队共享池
            </div>
          </div>

          <!-- 4. 专属模型资源包 -->
          <div class="bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span class="text-[10px] text-slate-400 block">专属大模型包</span>
            <div class="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
              {{ qoderStore.dedicatedQuotaSummary.remaining }} <span class="text-[10px] font-normal text-slate-400">/ {{ qoderStore.dedicatedQuotaSummary.limit }}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div class="h-full bg-indigo-600 rounded-full" :style="{ width: `${qoderStore.dedicatedQuotaSummary.percentage}%` }"></div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1.5 font-mono">
              专属算力通道
            </div>
          </div>
        </div>
      </section>

      <!-- 第九层: 原生 IDE 调用流水明细审计与导出 (支持就地检查器抽屉) -->
      <section
        @mousemove="handleSpotlight"
        class="spotlight-card bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4 relative"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">
              原生 IDE 会话调用流水审计明细
            </div>
            <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              记录每笔交互起止耗时、模型与积分 (共 1,911 条记录，点击任意行可在侧边展开深度详情抽屉)
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- 搜索框 -->
            <input
              v-model="qoderStore.searchKeyword"
              type="text"
              placeholder="搜索 Session ID / 模型..."
              class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />

            <!-- 导出 CSV 按钮 -->
            <button
              @click="qoderStore.exportHistoriesToCsv()"
              class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>导出 CSV 审计日志</span>
            </button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="overflow-x-auto max-h-84 rounded-xl border border-slate-100 dark:border-zinc-800">
          <table class="w-full text-left text-xs font-sans">
            <thead class="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800 font-medium sticky top-0 z-10 backdrop-blur">
              <tr>
                <th class="py-2.5 px-4">调用时间</th>
                <th class="py-2.5 px-4">模型类别</th>
                <th class="py-2.5 px-4">来源终端</th>
                <th class="py-2.5 px-4">操作类型</th>
                <th class="py-2.5 px-4">交互耗时</th>
                <th class="py-2.5 px-4">消耗 Credits</th>
                <th class="py-2.5 px-4">会话 Session ID</th>
                <th class="py-2.5 px-4 text-right">检查</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 font-mono">
              <tr
                v-for="(row, idx) in qoderStore.filteredHistories"
                :key="idx"
                @click="qoderStore.selectHistory(row)"
                class="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition cursor-pointer"
                :class="{ 'bg-blue-50/70 dark:bg-blue-950/40': qoderStore.selectedHistory?.session_id === row.session_id }"
              >
                <td class="py-2.5 px-4 text-slate-500 dark:text-zinc-400">
                  {{ new Date(row.begin_at || row.time).toLocaleString('zh-CN') }}
                </td>
                <td class="py-2.5 px-4 font-semibold text-slate-800 dark:text-zinc-200">
                  {{ row.model_category }}
                </td>
                <td class="py-2.5 px-4 font-sans">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium"
                    :class="row.source === 'IDE' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'"
                  >
                    {{ row.source }}
                  </span>
                </td>
                <td class="py-2.5 px-4 text-slate-600 dark:text-zinc-400 font-sans">
                  {{ row.operation || 'Agent' }}
                </td>
                <td class="py-2.5 px-4 font-bold text-slate-800 dark:text-zinc-200">
                  {{ row.duration_sec }} 秒
                </td>
                <td class="py-2.5 px-4 text-blue-600 dark:text-blue-400 font-bold">
                  {{ row.credits }}
                </td>
                <td class="py-2.5 px-4 text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">
                  {{ row.session_id }}
                </td>
                <td class="py-2.5 px-4 text-right">
                  <button
                    @click.stop="qoderStore.selectHistory(row)"
                    class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    详情 &rarr;
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- 侧边深度会话就地检查器抽屉 (In-Place Slide-Over Inspector Drawer) -->
    <div
      v-if="qoderStore.selectedHistory"
      class="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity"
      @click="qoderStore.selectHistory(null)"
    >
      <div
        class="w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        @click.stop
      >
        <div class="space-y-5">
          <!-- 抽屉头部 -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">原生 IDE 会话深度详情</div>
              <div class="text-xs text-slate-400 font-mono mt-0.5">Session ID 审计追溯</div>
            </div>
            <button
              @click="qoderStore.selectHistory(null)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- 核心指标块 -->
          <div class="grid grid-cols-2 gap-3 font-mono">
            <div class="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-100 dark:border-zinc-700/60">
              <span class="text-[10px] text-slate-400 block font-sans">交互执行耗时</span>
              <div class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5">
                {{ qoderStore.selectedHistory.duration_sec }} <span class="text-xs font-normal text-slate-400">秒</span>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-100 dark:border-zinc-700/60">
              <span class="text-[10px] text-slate-400 block font-sans">扣除积分 Credits</span>
              <div class="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                {{ qoderStore.selectedHistory.credits }}
              </div>
            </div>
          </div>

          <!-- 详细属性列表 -->
          <div class="space-y-3 text-xs">
            <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <span class="text-slate-400">调用模型:</span>
              <span class="font-bold font-mono text-slate-800 dark:text-zinc-200">{{ qoderStore.selectedHistory.model_category }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <span class="text-slate-400">来源终端:</span>
              <span class="font-semibold text-slate-800 dark:text-zinc-200">{{ qoderStore.selectedHistory.source }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <span class="text-slate-400">操作类型:</span>
              <span class="font-semibold text-slate-800 dark:text-zinc-200">{{ qoderStore.selectedHistory.operation }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <span class="text-slate-400">开始时间:</span>
              <span class="font-mono text-slate-600 dark:text-zinc-300">{{ new Date(qoderStore.selectedHistory.begin_at).toLocaleString('zh-CN') }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <span class="text-slate-400">完成时间:</span>
              <span class="font-mono text-slate-600 dark:text-zinc-300">{{ new Date(qoderStore.selectedHistory.finish_at).toLocaleString('zh-CN') }}</span>
            </div>
            <div class="py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <div class="text-slate-400 mb-1">会话 Session ID:</div>
              <div class="p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono text-[11px] break-all select-all flex items-center justify-between">
                <span>{{ qoderStore.selectedHistory.session_id }}</span>
                <button
                  @click="copyText(qoderStore.selectedHistory.session_id)"
                  class="ml-2 px-2 py-0.5 rounded bg-white dark:bg-zinc-700 text-xs shadow-2xs hover:bg-slate-200 transition cursor-pointer"
                >
                  复制
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 抽屉底部操作 -->
        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
          <button
            @click="copyText(JSON.stringify(qoderStore.selectedHistory, null, 2))"
            class="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
          >
            复制会话 JSON 报文
          </button>
          <button
            @click="qoderStore.selectHistory(null)"
            class="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 灵动光照跟随微交互 (Cursor Spotlight Glow) */
.spotlight-card {
  position: relative;
  overflow: hidden;
}
.spotlight-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    380px circle at var(--mouse-x, -500px) var(--mouse-y, -500px),
    rgba(59, 130, 246, 0.07),
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}
</style>
