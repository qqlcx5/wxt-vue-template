<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Switch,
  Input,
  Textarea,
  Badge,
  Card,
  Slider,
  Tooltip,
  TooltipProvider,
  SegmentedControl,
  Toast,
  Kbd,
  MarkdownViewer,
} from '@/components/ui';
import { useSettingsStore } from '@/stores';
import { sendMessage, useExtensionStorage } from '@/core';
import { streamChat, type StreamChatHandle } from '@/services/ai';
import { captureVisibleScreenshot, downloadScreenshot } from '@/services/screenshot';
import { browser } from 'wxt/browser';

// 深浅模式无缝切换
const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();

// 精简为两个核心视窗: workbench (快捷工作台) | lab (核心能力实验室)
const currentTab = ref<'workbench' | 'lab'>('workbench');

// 当前活动标签页信息
const activeTabInfo = ref<{ id?: number; url?: string; title?: string }>({});

async function refreshActiveTab() {
  try {
    const tab = await sendMessage('get-current-tab');
    if (tab) {
      activeTabInfo.value = tab;
    }
  } catch {}
}

onMounted(() => {
  refreshActiveTab();
});

// ================= AI 快速问答 =================
const aiPrompt = ref('');
const aiAnswer = ref('');
const isAiStreaming = ref(false);
let activeAiStream: StreamChatHandle | null = null;

function handleAiAsk(customPrompt?: string) {
  const q = (customPrompt || aiPrompt.value).trim();
  if (!q || isAiStreaming.value) return;

  aiPrompt.value = q;
  aiAnswer.value = '';
  isAiStreaming.value = true;
  activeAiStream?.abort();

  activeAiStream = streamChat({
    feature: 'selection',
    messages: [
      { role: 'system', content: settingsStore.currentSystemPrompt },
      { role: 'user', content: q },
    ],
    onChunk: (_delta, acc) => {
      aiAnswer.value = acc;
    },
    onFinish: (full) => {
      aiAnswer.value = full;
      isAiStreaming.value = false;
    },
    onError: (err) => {
      aiAnswer.value = `❌ 出错: ${err.message}`;
      isAiStreaming.value = false;
    },
  });
}

function handleStopAi() {
  activeAiStream?.abort();
  isAiStreaming.value = false;
  triggerToast('已停止生成', 'info');
}

function handleCopyAi() {
  if (!aiAnswer.value) return;
  navigator.clipboard.writeText(aiAnswer.value);
  triggerToast('回答已复制到剪贴板！', 'success');
}

function handleClearAi() {
  activeAiStream?.abort();
  aiAnswer.value = '';
  aiPrompt.value = '';
  isAiStreaming.value = false;
}

// ================= 页面路由与快捷操作 =================
async function openChatStudio() {
  await sendMessage('open-chat');
}

async function openReaderStudio() {
  await sendMessage('open-reader');
}

async function openSidePanel() {
  const sidePanelApi = (globalThis as any).chrome?.sidePanel;
  if (sidePanelApi?.open) {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const win = await (globalThis as any).chrome?.windows?.getLastFocused?.();
      const targetWindowId = tab?.windowId || win?.id;

      if (targetWindowId) {
        await sidePanelApi.open({ windowId: targetWindowId });
        window.close();
        return;
      }
    } catch (err) {
      console.warn('[Popup] Direct sidePanel.open failed:', err);
    }
  }

  try {
    const res = await sendMessage('open-sidepanel');
    if (res?.success) {
      window.close();
    } else {
      triggerToast(res?.error || '呼出侧边栏失败，可使用快捷键 ⌘⇧S', 'warning');
    }
  } catch (err: any) {
    triggerToast('呼出侧边栏异常: ' + err.message, 'error');
  }
}

async function openOptions() {
  await sendMessage('open-options');
}

async function handleTakeScreenshot() {
  try {
    triggerToast('正在截取可视区域...', 'info');
    const dataUrl = await captureVisibleScreenshot();
    downloadScreenshot(dataUrl, `snapshot-${Date.now()}.png`);
    triggerToast('截图已保存至下载目录！', 'success');
  } catch (e: any) {
    triggerToast('截屏失败: ' + e.message, 'error');
  }
}

// ================= Toast 提示 =================
const toastVisible = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'info' | 'warning' | 'error'>('success');

function triggerToast(msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, 2200);
}

// ================= 跨端能力实验室 (Scaffold Lab) =================
// 1. 全局响应式存储 (Vitesse-style reactive counter)
const liveCounter = useExtensionStorage('demo_shared_counter', 42);

// 2. 强类型 RPC 通信 Ping
const pingLatency = ref<number | null>(null);
const isPinging = ref(false);

async function handlePingBackground() {
  if (isPinging.value) return;
  isPinging.value = true;
  const start = performance.now();
  try {
    await sendMessage('ping', { timestamp: Date.now() });
    pingLatency.value = Math.round(performance.now() - start);
    triggerToast(`Service Worker 通信正常 (${pingLatency.value}ms)`, 'success');
  } catch (err: any) {
    triggerToast(`通信异常: ${err.message}`, 'error');
  } finally {
    isPinging.value = false;
  }
}

// 3. 极简控件交互状态
const volume = ref([65]);
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="w-[370px] max-h-[580px] overflow-y-auto flex flex-col font-sans transition-colors duration-200 select-none antialiased relative"
      :class="isDark ? 'bg-[#000000] text-[#F5F5F7]' : 'bg-[#F2F2F7] text-[#1D1D1F]'"
    >
      <!-- 动态 Toast 提示 -->
      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- ==================== 顶部视窗导航栏 ==================== -->
      <header
        class="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl transition-colors"
        :class="isDark ? 'bg-[#1C1C1E]/85' : 'bg-white/85'"
      >
        <!-- 品牌标识 -->
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#007AFF] via-[#5856D6] to-[#AF52DE] flex items-center justify-center text-white shadow-sm shadow-blue-500/20"
          >
            <i class="i-lucide-sparkles text-xs" />
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5 leading-none">
              <span class="text-[13px] font-semibold tracking-tight text-neutral-900 dark:text-white">
                WXT Studio
              </span>
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MV3
              </span>
            </div>
          </div>
        </div>

        <!-- 顶部快捷操作 -->
        <div class="flex items-center gap-1">
          <Tooltip content="在侧边栏中打开 (⌘⇧S)">
            <button
              type="button"
              class="flex items-center justify-center h-7 w-7 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-all cursor-pointer border-0 bg-transparent"
              @click="openSidePanel"
            >
              <i class="i-lucide-panel-right text-sm" />
            </button>
          </Tooltip>

          <Tooltip content="系统偏好设置">
            <button
              type="button"
              class="flex items-center justify-center h-7 w-7 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-all cursor-pointer border-0 bg-transparent"
              @click="openOptions"
            >
              <i class="i-lucide-settings text-sm" />
            </button>
          </Tooltip>

          <div class="w-px h-3.5 bg-black/[0.08] dark:bg-white/[0.1] mx-0.5" />

          <!-- 明暗切换 -->
          <Tooltip :content="isDark ? '切换浅色模式' : '切换暗黑模式'">
            <button
              type="button"
              class="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-all cursor-pointer border-0 bg-transparent"
              @click="toggleDark()"
            >
              <i
                :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'"
                class="text-sm transition-transform active:rotate-45"
              />
            </button>
          </Tooltip>
        </div>
      </header>

      <!-- ==================== 主体区域 ==================== -->
      <main class="p-3.5 flex flex-col gap-3">
        <!-- 核心双分段控制器 -->
        <SegmentedControl
          v-model="currentTab"
          :options="[
            { value: 'workbench', label: '快捷工作台', icon: 'i-lucide-layout-grid' },
            { value: 'lab', label: '核心能力 Lab', icon: 'i-lucide-cpu' },
          ]"
        />

        <!-- ==================== VIEW 1: 快捷工作台 (Workbench) ==================== -->
        <div v-if="currentTab === 'workbench'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <!-- 当前活动页面状态卡片 -->
          <div
            class="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div class="flex items-center gap-2 overflow-hidden mr-2">
              <div
                class="w-6 h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center shrink-0 text-neutral-500"
              >
                <i class="i-lucide-globe text-xs" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-medium truncate text-neutral-900 dark:text-neutral-100">
                  {{ activeTabInfo.title || '正在探测标签页...' }}
                </span>
                <span class="text-[10px] text-neutral-400 font-mono truncate">
                  {{ activeTabInfo.url || 'chrome-extension://' }}
                </span>
              </div>
            </div>

            <Tooltip content="截取当前可视区域快照">
              <button
                type="button"
                class="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-700 dark:text-neutral-200 text-xs font-medium cursor-pointer border-0 transition-colors shrink-0"
                @click="handleTakeScreenshot"
              >
                <i class="i-lucide-camera text-xs" />
                <span>快照</span>
              </button>
            </Tooltip>
          </div>

          <!-- 4 宫格快捷入口 (Clean Apple Squircle Tiles) -->
          <div class="grid grid-cols-2 gap-2">
            <!-- 侧边栏工作台 -->
            <div
              class="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] hover:border-blue-500/40 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              @click="openSidePanel"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div
                  class="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <i class="i-lucide-panel-right text-xs" />
                </div>
                <Kbd class="text-[9px]">⌘⇧S</Kbd>
              </div>
              <div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">侧边栏工作台</div>
                <div class="text-[10px] text-neutral-400 mt-0.5">右侧常驻协同</div>
              </div>
            </div>

            <!-- AI 智能研读 Studio -->
            <div
              class="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] hover:border-indigo-500/40 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              @click="openChatStudio"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div
                  class="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <i class="i-lucide-bot text-xs" />
                </div>
                <span class="text-[9px] text-neutral-400 font-mono">Studio</span>
              </div>
              <div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">AI 研读工坊</div>
                <div class="text-[10px] text-neutral-400 mt-0.5">多轮对话研读</div>
              </div>
            </div>

            <!-- 文稿阅读器 -->
            <div
              class="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              @click="openReaderStudio"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div
                  class="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <i class="i-lucide-book-open text-xs" />
                </div>
                <span class="text-[9px] text-neutral-400 font-mono">KaTeX</span>
              </div>
              <div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">文稿深度阅读</div>
                <div class="text-[10px] text-neutral-400 mt-0.5">双语对照与公式</div>
              </div>
            </div>

            <!-- 偏好设置 -->
            <div
              class="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] hover:border-neutral-500/40 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              @click="openOptions"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div
                  class="w-6 h-6 rounded-lg bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <i class="i-lucide-sliders text-xs" />
                </div>
                <span class="text-[9px] text-neutral-400 font-mono">Config</span>
              </div>
              <div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">系统偏好设置</div>
                <div class="text-[10px] text-neutral-400 mt-0.5">模型与快捷键配置</div>
              </div>
            </div>
          </div>

          <!-- AI 随身轻助理 (极简自适应提问框) -->
          <Card title="即时提问 (AI Quick Ask)">
            <div class="flex flex-col gap-2">
              <Textarea
                v-model="aiPrompt"
                placeholder="向 AI 快速提问... (↵ 发送)"
                :rows="2"
                class="text-xs"
                @keydown.enter.exact.prevent="handleAiAsk()"
              />

              <!-- 快捷 Prompts 胶囊 -->
              <div class="flex items-center gap-1.5 text-[10px] overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.04] dark:border-white/[0.04] cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                  @click="handleAiAsk('请简要解释什么是 Manifest V3 核心机制？')"
                >
                  ⚡️ MV3 架构解析
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.04] dark:border-white/[0.04] cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                  @click="handleAiAsk('请写一个 Vue 3 防抖 composable 示例。')"
                >
                  💡 Vue 3 防抖示例
                </button>
              </div>

              <!-- 底部操作按钮 -->
              <div class="flex items-center justify-between pt-1">
                <span class="text-[10px] text-neutral-400 font-mono">
                  {{ settingsStore.selectedModel }}
                </span>
                <div class="flex items-center gap-1.5">
                  <Button
                    v-if="isAiStreaming"
                    variant="destructive"
                    size="sm"
                    icon="i-lucide-square"
                    @click="handleStopAi"
                  >
                    停止
                  </Button>
                  <Button
                    v-else
                    variant="primary"
                    size="sm"
                    :disabled="!aiPrompt.trim()"
                    icon="i-lucide-send"
                    @click="handleAiAsk()"
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <!-- AI 流式回答结果卡片 (有回答或生成时才显现) -->
          <Card v-if="aiAnswer || isAiStreaming" title="AI 回答结果">
            <div class="flex flex-col gap-2">
              <div
                v-if="!aiAnswer && isAiStreaming"
                class="flex items-center gap-2 text-xs text-neutral-400 py-3 justify-center"
              >
                <i class="i-lucide-loader-2 text-sm animate-spin text-[#007AFF]" />
                <span>正在推理生成...</span>
              </div>
              <div v-else class="max-h-44 overflow-y-auto pr-1 text-xs">
                <MarkdownViewer :content="aiAnswer" />
                <span
                  v-if="isAiStreaming"
                  class="inline-block w-1.5 h-3 bg-[#007AFF] ml-0.5 animate-pulse align-middle"
                />
              </div>

              <div class="flex items-center justify-between pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                <button
                  type="button"
                  class="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer border-0 bg-transparent"
                  @click="handleClearAi"
                >
                  清空
                </button>
                <Button variant="secondary" size="sm" icon="i-lucide-copy" @click="handleCopyAi">
                  复制
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <!-- ==================== VIEW 2: 核心能力实验室 (Lab) ==================== -->
        <div v-if="currentTab === 'lab'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <!-- 1. 全局跨端响应式存储演示 (useExtensionStorage) -->
          <Card title="跨端响应式存储 (Storage Sync)">
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.025] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06]">
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    共享计数器
                  </span>
                  <span class="text-[10px] text-neutral-400 font-mono">
                    demo_shared_counter
                  </span>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    class="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.1] flex items-center justify-center font-bold text-xs cursor-pointer border-0 active:scale-95 transition-all"
                    @click="liveCounter--"
                  >
                    -
                  </button>
                  <span class="w-8 text-center font-mono font-bold text-sm text-[#007AFF]">
                    {{ liveCounter }}
                  </span>
                  <button
                    type="button"
                    class="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.1] flex items-center justify-center font-bold text-xs cursor-pointer border-0 active:scale-95 transition-all"
                    @click="liveCounter++"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-neutral-500">
                <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Popup ⇋ Background 实时同步
                </span>
                <button
                  type="button"
                  class="text-[10px] text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer"
                  @click="liveCounter = 0"
                >
                  重置为 0
                </button>
              </div>
            </div>
          </Card>

          <!-- 2. 强类型 RPC 通信 (sendMessage) -->
          <Card title="强类型 RPC 通信 (Messaging)">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Service Worker 探活
                </span>
                <span class="text-[10px] text-neutral-400 font-mono">
                  sendMessage('ping')
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                :loading="isPinging"
                icon="i-lucide-activity"
                @click="handlePingBackground"
              >
                {{ pingLatency !== null ? `${pingLatency}ms` : 'Ping' }}
              </Button>
            </div>
          </Card>

          <!-- 3. Apple HIG 设计系统核心控件 -->
          <Card title="Apple HIG 设计控件精粹">
            <div class="flex flex-col gap-2.5">
              <!-- 按钮规范 -->
              <div class="flex items-center gap-2">
                <Button variant="primary" size="sm" icon="i-lucide-sparkles">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>

              <div class="h-px bg-black/[0.04] dark:bg-white/[0.04] my-0.5" />

              <!-- 开关与滑块 -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium">自动云端状态备份</span>
                <Switch v-model:checked="settingsStore.autoSync" />
              </div>

              <div class="flex flex-col gap-1">
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-neutral-400">音量 / 缩放</span>
                  <span class="font-mono text-[#007AFF] font-medium">{{ volume[0] }}%</span>
                </div>
                <Slider v-model="volume" :max="100" accent="blue" />
              </div>
            </div>
          </Card>
        </div>
      </main>

      <!-- ==================== 底部状态栏 ==================== -->
      <footer
        class="sticky bottom-0 px-3.5 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[10px] text-neutral-400 transition-colors"
        :class="isDark ? 'bg-[#1C1C1E]/90' : 'bg-white/90'"
      >
        <span class="flex items-center gap-1">
          <i class="i-lucide-check-circle text-emerald-500 text-xs" />
          <span>WXT • Vue 3 • UnoCSS</span>
        </span>
        <button
          type="button"
          class="hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer border-0 bg-transparent"
          @click="openSidePanel"
        >
          快捷键 ⌘⇧S 展开侧边栏
        </button>
      </footer>
    </div>
  </TooltipProvider>
</template>

<style scoped>
/* 滚动条轻量化 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
:root.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
</style>
