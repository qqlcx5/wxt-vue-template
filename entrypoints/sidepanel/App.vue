<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useQoderStore } from '@/stores';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const qoderStore = useQoderStore();

// 筛选与时间范围
const activeRange = ref<number>(7);

onMounted(() => {
  qoderStore.init();
});

async function switchDays(days: number) {
  activeRange.value = days;
  await qoderStore.changeDays(days);
}

// 柱状图数据处理
const maxDailyCredit = computed(() => {
  if (!qoderStore.dailyTrend?.trend?.length) return 100;
  const max = Math.max(...qoderStore.dailyTrend.trend.map((t) => t.credits));
  return max > 0 ? max : 100;
});

// 导出 CSV 功能
function exportCSV() {
  if (!qoderStore.histories.length) return;
  const headers = ['时间', '客户端', '操作', '模型分类', '真实耗时(秒)', '扣减积分', '会话ID'];
  const rows = qoderStore.histories.map((h) => [
    new Date(h.begin_at).toLocaleString(),
    h.source,
    h.operation,
    h.model_category,
    h.duration_sec,
    h.credits,
    h.session_id,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `qoder-usage-histories-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200"
  >
    <!-- 顶部状态栏 -->
    <header
      class="px-5 py-3.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20 shadow-xs"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm"
        >
          Q
        </div>
        <div>
          <div class="text-sm font-semibold flex items-center gap-2">
            Qoder 效率与用量全景大屏
            <span
              v-if="qoderStore.authStatus === 'authenticated'"
              class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-200 dark:border-emerald-800/40"
            >
              已连接
            </span>
          </div>
          <div class="text-[11px] text-slate-400 dark:text-zinc-500">
            原生 IDE 性能洞察 · 耗时分布 · 积分消耗趋势
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- 时间跨度选择器 -->
        <div class="bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg flex items-center text-xs font-medium">
          <button
            @click="switchDays(1)"
            :class="activeRange === 1 ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'"
            class="px-2.5 py-1 rounded-md transition"
          >
            1天
          </button>
          <button
            @click="switchDays(7)"
            :class="activeRange === 7 ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'"
            class="px-2.5 py-1 rounded-md transition"
          >
            7天
          </button>
          <button
            @click="switchDays(30)"
            :class="activeRange === 30 ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'"
            class="px-2.5 py-1 rounded-md transition"
          >
            30天
          </button>
        </div>

        <!-- 刷新数据 -->
        <button
          @click="qoderStore.refresh()"
          :disabled="qoderStore.isRefreshing"
          title="重新抓取最新数据"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition"
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
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition"
        >
          <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </header>

    <!-- 主屏内容区域 -->
    <main class="p-5 flex-1 flex flex-col gap-5 max-w-6xl w-full mx-auto">
      <!-- 异常情况: 未登录 -->
      <div
        v-if="qoderStore.authStatus === 'unauthorized'"
        class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 text-center max-w-md mx-auto my-12 shadow-sm"
      >
        <div class="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">未检测到 Qoder 登录凭证</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
          请在浏览器中登录 Qoder 官方账号。登录完成后，本侧边栏将自动获取并更新您的用量数据与原生 IDE 耗时分析。
        </p>
        <button
          @click="qoderStore.login()"
          class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
        >
          打开新标签页登录 Qoder
        </button>
        <button
          @click="qoderStore.init()"
          class="w-full mt-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs transition"
        >
          重新检测
        </button>
      </div>

      <!-- 正常情况: 渲染仪表盘 -->
      <template v-else-if="qoderStore.authStatus === 'authenticated'">
        <!-- 第一行: 四个核心指标卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <!-- 卡片 1: 周期累计积分 -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 dark:text-zinc-500 text-xs">
              <span>周期总消耗</span>
              <span class="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                {{ activeRange }} 天
              </span>
            </div>
            <div class="my-2">
              <span class="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">{{ qoderStore.totalPeriodCredits }}</span>
              <span class="text-xs text-slate-400 ml-1">Credits</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>峰值单日:</span>
              <span class="font-mono font-medium text-slate-700 dark:text-zinc-300">
                {{ qoderStore.peakInfo.peak }} ({{ qoderStore.peakInfo.date }})
              </span>
            </div>
          </div>

          <!-- 卡片 2: 原生 IDE 响应速度 -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 dark:text-zinc-500 text-xs">
              <span>单次交互耗时</span>
              <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">平均耗时</span>
            </div>
            <div class="my-2 flex items-baseline gap-1">
              <span class="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">{{ qoderStore.avgDurationSec }}</span>
              <span class="text-xs text-slate-400">秒 / 次</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>每次会话平均:</span>
              <span class="font-mono font-medium text-slate-700 dark:text-zinc-300">
                {{ Math.round((qoderStore.dailyTrend?.avgCreditsPerSession || 0) * 10) / 10 }} Credits
              </span>
            </div>
          </div>

          <!-- 卡片 3: AI 代码贡献率 -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 dark:text-zinc-500 text-xs">
              <span>AI 代码贡献率</span>
              <span class="text-[10px] font-mono text-blue-600 dark:text-blue-400">工程效能</span>
            </div>
            <div class="my-2 flex items-baseline gap-1">
              <span class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ qoderStore.aiContributionRate }}</span>
              <span class="text-xs text-slate-400">%</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>采纳代码行数:</span>
              <span class="font-mono font-medium text-slate-700 dark:text-zinc-300">
                {{ qoderStore.overview?.acceptedLinesEdit?.toLocaleString() || '--' }} 行
              </span>
            </div>
          </div>

          <!-- 卡片 4: 连续活跃与消息 -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 dark:text-zinc-500 text-xs">
              <span>活跃天数 & 消息</span>
              <span class="text-[10px] font-mono text-slate-400">Streak</span>
            </div>
            <div class="my-2 flex items-baseline gap-1">
              <span class="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                {{ qoderStore.overview?.cumulativeActiveDays || 0 }}
              </span>
              <span class="text-xs text-slate-400">天连续活跃</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>总修改代码:</span>
              <span class="font-mono font-medium text-slate-700 dark:text-zinc-300">
                {{ qoderStore.overview?.aiLinesChanged?.toLocaleString() || '--' }} / {{ qoderStore.overview?.totalLinesChanged?.toLocaleString() || '--' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 第二行: 每日用量趋势柱状图 -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">每日消耗趋势分布</div>
              <div class="text-xs text-slate-400 dark:text-zinc-500">柱高反映单日消耗积分，悬浮可查看详细消息吞吐</div>
            </div>
            <div class="flex items-center gap-3 text-xs font-mono">
              <span class="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span class="w-3 h-3 rounded bg-blue-500 inline-block"></span> 消耗积分
              </span>
            </div>
          </div>

          <!-- 趋势图表区 -->
          <div class="h-48 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100 dark:border-zinc-800 overflow-x-auto">
            <div
              v-for="item in qoderStore.dailyTrend?.trend || []"
              :key="item.date"
              class="flex-1 min-w-[36px] flex flex-col items-center gap-2 group relative h-full justify-end"
            >
              <!-- 悬停气泡 (Tooltip) -->
              <div
                class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-md whitespace-nowrap shadow-md z-20"
              >
                {{ item.date }}: {{ Math.round(item.credits * 10) / 10 }} Credits ({{ item.messageCount }} 条)
              </div>

              <!-- 柱体 -->
              <div
                class="w-full max-w-[32px] rounded-t-lg bg-blue-500/80 hover:bg-blue-600 transition-all duration-300 cursor-pointer"
                :style="{ height: `${Math.max(4, Math.min(100, (item.credits / maxDailyCredit) * 100))}%` }"
              ></div>

              <!-- 日期标签 -->
              <span class="text-[10px] text-slate-400 dark:text-zinc-500 font-mono scale-90">
                {{ item.date.slice(5) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 第三行: 模型分布卡片与流水记录明细 -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-sm font-bold text-slate-900 dark:text-zinc-100">原生 IDE / CLI 调用明细表</div>
              <div class="text-xs text-slate-400 dark:text-zinc-500">每笔会话真实毫秒级起止耗时与积分明细</div>
            </div>
            <button
              @click="exportCSV"
              class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出 CSV
            </button>
          </div>

          <!-- 模型分布胶囊 -->
          <div class="flex flex-wrap gap-2 mb-4">
            <div
              v-for="(stat, model) in qoderStore.modelDistribution"
              :key="model"
              class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex items-center gap-2 text-xs font-mono"
            >
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span class="font-semibold text-slate-800 dark:text-zinc-200">{{ model }}</span>
              <span class="text-slate-400">·</span>
              <span class="text-slate-600 dark:text-zinc-400">{{ stat.count }} 次</span>
              <span class="text-slate-400">·</span>
              <span class="text-blue-600 dark:text-blue-400">{{ stat.credits }} Credits</span>
              <span class="text-slate-400">·</span>
              <span class="text-emerald-600 dark:text-emerald-400">均耗 {{ stat.avgSec }}s</span>
            </div>
          </div>

          <!-- 历史流水列表 -->
          <div class="overflow-x-auto max-h-[380px] border border-slate-100 dark:border-zinc-800/80 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-500 font-mono uppercase text-[10px] sticky top-0 border-b border-slate-200/60 dark:border-zinc-800">
                <tr>
                  <th class="py-2.5 px-3 font-semibold">触发时间</th>
                  <th class="py-2.5 px-3 font-semibold">客户端</th>
                  <th class="py-2.5 px-3 font-semibold">模型分类</th>
                  <th class="py-2.5 px-3 font-semibold">真实耗时</th>
                  <th class="py-2.5 px-3 font-semibold">消耗积分</th>
                  <th class="py-2.5 px-3 font-semibold">会话标识</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono text-[11px]">
                <tr
                  v-for="item in qoderStore.histories"
                  :key="item.business_id || item.time"
                  class="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition"
                >
                  <td class="py-2.5 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                    {{ new Date(item.begin_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
                  </td>
                  <td class="py-2.5 px-3">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {{ item.source }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-zinc-200">
                    {{ item.model_category }}
                  </td>
                  <td class="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                    {{ item.duration_sec }}s
                  </td>
                  <td class="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                    {{ item.credits }} Credits
                  </td>
                  <td class="py-2.5 px-3 text-slate-400 dark:text-zinc-500 text-[10px] truncate max-w-[150px]" :title="item.session_id">
                    {{ item.session_id ? item.session_id.slice(0, 8) + '...' : '--' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
