<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Switch,
  Checkbox,
  Input,
  Textarea,
  Badge,
  Card,
  Slider,
  Progress,
  Tooltip,
  TooltipProvider,
  SegmentedControl,
  Select,
  DropdownMenu,
  Toast,
  Kbd,
  Avatar,
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  MarkdownViewer,
} from '@/components/ui';
import { useSettingsStore, useArticlesStore } from '@/stores';
import { sendMessage, useExtensionStorage } from '@/core';
import { streamChat, type StreamChatHandle } from '@/services/ai';
import { captureVisibleScreenshot, downloadScreenshot } from '@/services/screenshot';
import { browser } from 'wxt/browser';

// 浅色/深色无缝平滑切换
const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();
const articlesStore = useArticlesStore();

// 导航分段: ai (AI 随身助手) | hub (快捷工作台) | components (控件展厅) | storage (响应式存储)
const currentTab = ref('ai');

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

// ================= AI 随身问状态 =================
const aiPrompt = ref('');
const aiAnswer = ref('');
const isAiStreaming = ref(false);
let activePopupAiStream: StreamChatHandle | null = null;

function handlePopupAiAsk(customPrompt?: string) {
  const q = (customPrompt || aiPrompt.value).trim();
  if (!q || isAiStreaming.value) return;

  aiPrompt.value = q;
  aiAnswer.value = '';
  isAiStreaming.value = true;
  activePopupAiStream?.abort();

  activePopupAiStream = streamChat({
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

function handleStopPopupAi() {
  activePopupAiStream?.abort();
  isAiStreaming.value = false;
  triggerToast('已停止生成', 'info');
}

function handleCopyPopupAi() {
  if (!aiAnswer.value) return;
  navigator.clipboard.writeText(aiAnswer.value);
  triggerToast('AI 回答已复制！', 'success');
}

function handleSaveAiToMemo() {
  if (!aiAnswer.value) return;
  settingsStore.memoNote =
    (settingsStore.memoNote || '') +
    `\n\n### AI 回答 (${settingsStore.selectedModel}):\n${aiAnswer.value}`;
  triggerToast('已追加存入便笺！', 'success');
}

// 快速跳转与窗口唤醒
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
      triggerToast(res?.error || '呼出侧边栏失败，可使用快捷键 ⌘⇧S 或右键菜单', 'warning');
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

// ================= 跨端响应式存储演示 =================
const liveCounter = useExtensionStorage('demo_shared_counter', 42);

// ================= 控件库演示交互状态 =================
const searchInput = ref('');
const volume = ref([65]);
const progress = ref(78);
const checkMeta = ref(true);
const checkIndex = ref(true);

const modelOptions = [
  { value: 'gpt-6.1-sol', label: 'gpt-6.1-sol (专属推理通道)' },
  { value: 'gpt-4o', label: 'GPT-4o (通用旗舰)' },
  { value: 'deepseek-chat', label: 'DeepSeek-V3' },
  { value: 'claude-3-5', label: 'Claude 3.5 Sonnet' },
];

const menuGroups = [
  {
    actions: [
      { label: '在侧边栏中打开', icon: 'i-lucide-panel-right', kbd: '⌘⇧S', onSelect: openSidePanel },
      { label: '打开系统偏好设置', icon: 'i-lucide-settings', onSelect: openOptions },
      {
        label: '复制网页链接',
        icon: 'i-lucide-copy',
        kbd: '⌘C',
        onSelect: () => {
          if (activeTabInfo.value.url) {
            navigator.clipboard.writeText(activeTabInfo.value.url);
            triggerToast('网页链接已复制到剪贴板');
          }
        },
      },
    ],
  },
];
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="w-[416px] max-h-[630px] overflow-y-auto flex flex-col font-sans transition-colors duration-200 select-none antialiased relative"
      :class="isDark ? 'bg-[#000000] text-[#F5F5F7]' : 'bg-[#F2F2F7] text-[#1D1D1F]'"
    >
      <!-- 动态灵动岛 Toast 提示 -->
      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- ==================== 顶部视窗导航栏 ==================== -->
      <header
        class="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl transition-colors"
        :class="isDark ? 'bg-[#1C1C1E]/85' : 'bg-white/85'"
      >
        <!-- 品牌标识与微型状态胶囊 -->
        <div class="flex items-center gap-2.5">
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
                MV3 Ready
              </span>
            </div>
            <span class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">
              Vue 3 • UnoCSS • Core
            </span>
          </div>
        </div>

        <!-- 顶部操作矩阵 -->
        <div class="flex items-center gap-1">
          <Tooltip content="呼出侧边栏工作台 (⌘⇧S)">
            <button
              type="button"
              class="flex items-center justify-center h-7 w-7 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-all cursor-pointer border-0 bg-transparent"
              @click="openSidePanel"
            >
              <i class="i-lucide-panel-right text-sm" />
            </button>
          </Tooltip>

          <Tooltip content="全屏 AI 对话实验室 (Chat Studio)">
            <button
              type="button"
              class="flex items-center justify-center h-7 w-7 rounded-lg text-[#007AFF] hover:bg-blue-500/10 transition-all cursor-pointer border-0 bg-transparent"
              @click="openChatStudio"
            >
              <i class="i-lucide-bot text-sm" />
            </button>
          </Tooltip>

          <Tooltip content="文稿阅读器实验室 (Reader Studio)">
            <button
              type="button"
              class="flex items-center justify-center h-7 w-7 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer border-0 bg-transparent"
              @click="openReaderStudio"
            >
              <i class="i-lucide-book-open text-sm" />
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
      <main class="p-3.5 flex flex-col gap-3.5">
        <!-- 苹果标志性分段切换器 -->
        <SegmentedControl
          v-model="currentTab"
          :options="[
            { value: 'ai', label: 'AI 随身问', icon: 'i-lucide-sparkles' },
            { value: 'hub', label: '快捷工作台', icon: 'i-lucide-layout-grid' },
            { value: 'components', label: 'UI 展厅', icon: 'i-lucide-component' },
            { value: 'storage', label: '响应式存储', icon: 'i-lucide-database' },
          ]"
        />

        <!-- ==================== TAB 0: AI 随身问 ==================== -->
        <section v-if="currentTab === 'ai'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <!-- 模型通道指示卡片 -->
          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#007AFF]/20"
              >
                <i class="i-lucide-cpu text-base" />
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                    {{ settingsStore.selectedModel }}
                  </span>
                  <span
                    class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md"
                  >
                    实时推理
                  </span>
                </div>
                <span class="text-[11px] text-neutral-400 mt-0.5">高速 SSE 打字机流式输出</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" icon="i-lucide-panel-right" @click="openSidePanel">
                侧边栏
              </Button>
              <Button variant="primary" size="sm" icon="i-lucide-external-link" @click="openChatStudio">
                全屏
              </Button>
            </div>
          </div>

          <!-- 提问输入卡片 -->
          <Card title="即时提问与分析">
            <div class="flex flex-col gap-2.5">
              <!-- 自适应平滑输入框 -->
              <Textarea
                v-model="aiPrompt"
                placeholder="在此输入任何问题，或从下方快捷 Prompt 点击开始..."
                :rows="2"
                class="text-xs"
                @keydown.enter.exact.prevent="handlePopupAiAsk()"
              />

              <!-- 快捷 Prompt 胶囊 -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border border-black/[0.04] dark:border-white/[0.04] cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                  @click="handlePopupAiAsk('请简要解释什么是 Manifest V3，并列出 3 个重大架构变化。')"
                >
                  <i class="i-lucide-lightbulb text-amber-500 text-xs" />
                  <span>MV3 架构解析</span>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border border-black/[0.04] dark:border-white/[0.04] cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                  @click="handlePopupAiAsk('请写一个 Vue 3 Composition API 的防抖 Debounce 函数示例。')"
                >
                  <i class="i-lucide-code-2 text-blue-500 text-xs" />
                  <span>Vue3 防抖函数</span>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border border-black/[0.04] dark:border-white/[0.04] cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                  @click="handlePopupAiAsk('请提供几个提高代码可维护性与测试覆盖率的工程化最佳实践。')"
                >
                  <i class="i-lucide-wrench text-emerald-500 text-xs" />
                  <span>工程化最佳实践</span>
                </button>
              </div>

              <!-- 底部操作条 -->
              <div class="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span class="text-[11px] text-neutral-400">Enter 发送 • ⇧Enter 换行</span>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="isAiStreaming"
                    variant="destructive"
                    size="sm"
                    icon="i-lucide-square"
                    @click="handleStopPopupAi"
                  >
                    停止
                  </Button>
                  <Button
                    v-else
                    variant="primary"
                    size="sm"
                    :disabled="!aiPrompt.trim()"
                    icon="i-lucide-send"
                    @click="handlePopupAiAsk()"
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <!-- AI 流式回答结果卡片 -->
          <Card v-if="aiAnswer || isAiStreaming" title="AI 流式生成结果">
            <div class="flex flex-col gap-2">
              <div
                v-if="!aiAnswer && isAiStreaming"
                class="flex items-center gap-2 text-xs text-neutral-400 py-4 justify-center"
              >
                <i class="i-lucide-loader-2 text-sm animate-spin text-[#007AFF]" />
                <span>正在组织推理生成...</span>
              </div>
              <div v-else class="max-h-56 overflow-y-auto pr-1">
                <MarkdownViewer :content="aiAnswer" />
                <span
                  v-if="isAiStreaming"
                  class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle"
                />
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <Button variant="secondary" size="sm" icon="i-lucide-file-text" @click="handleSaveAiToMemo">
                  存入便笺
                </Button>
                <Button variant="primary" size="sm" icon="i-lucide-copy" @click="handleCopyPopupAi">
                  复制回答
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <!-- ==================== TAB 1: 快捷工作台 ==================== -->
        <section v-if="currentTab === 'hub'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <!-- 4 宫格快捷入口 -->
          <div class="grid grid-cols-2 gap-2.5">
            <!-- 侧边栏工作台 -->
            <div
              class="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col justify-between"
              @click="openSidePanel"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div
                    class="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                  >
                    <i class="i-lucide-panel-right text-sm" />
                  </div>
                  <Kbd class="text-[10px]">⌘⇧S</Kbd>
                </div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">侧边栏工作台</div>
                <div class="text-[11px] text-neutral-400 mt-0.5 leading-tight">长驻右侧屏幕协同操作</div>
              </div>
              <div class="text-[11px] text-blue-500 font-medium mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>立即打开</span>
                <i class="i-lucide-arrow-right text-xs" />
              </div>
            </div>

            <!-- 全屏 AI Studio -->
            <div
              class="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-indigo-500/30 transition-all cursor-pointer group flex flex-col justify-between"
              @click="openChatStudio"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div
                    class="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                  >
                    <i class="i-lucide-bot text-sm" />
                  </div>
                  <span class="text-[10px] text-neutral-400 font-mono">Studio</span>
                </div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">AI 智能对话</div>
                <div class="text-[11px] text-neutral-400 mt-0.5 leading-tight">全屏大语言模型多轮研读</div>
              </div>
              <div class="text-[11px] text-indigo-500 font-medium mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>开启全屏</span>
                <i class="i-lucide-external-link text-xs" />
              </div>
            </div>

            <!-- Reader 阅读器实验室 -->
            <div
              class="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer group flex flex-col justify-between"
              @click="openReaderStudio"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div
                    class="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                  >
                    <i class="i-lucide-book-open text-sm" />
                  </div>
                  <span class="text-[10px] text-neutral-400 font-mono">KaTeX</span>
                </div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">文稿深度阅读器</div>
                <div class="text-[11px] text-neutral-400 mt-0.5 leading-tight">双语对照、公式与划词高亮</div>
              </div>
              <div class="text-[11px] text-emerald-500 font-medium mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>进入展厅</span>
                <i class="i-lucide-arrow-right text-xs" />
              </div>
            </div>

            <!-- 快照截图 -->
            <div
              class="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-amber-500/30 transition-all cursor-pointer group flex flex-col justify-between"
              @click="handleTakeScreenshot"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div
                    class="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform"
                  >
                    <i class="i-lucide-camera text-sm" />
                  </div>
                  <span class="text-[10px] text-neutral-400 font-mono">PNG</span>
                </div>
                <div class="text-xs font-semibold text-neutral-900 dark:text-neutral-100">可视区域快照</div>
                <div class="text-[11px] text-neutral-400 mt-0.5 leading-tight">一键无损截取当前页面</div>
              </div>
              <div class="text-[11px] text-amber-500 font-medium mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>立即截屏</span>
                <i class="i-lucide-arrow-down text-xs" />
              </div>
            </div>
          </div>

          <!-- 当前活动标签页检查卡片 -->
          <Card title="当前标签页上下文">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 overflow-hidden">
                <div class="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center shrink-0">
                  <i class="i-lucide-globe text-xs text-neutral-500" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-medium truncate text-neutral-900 dark:text-neutral-100">
                    {{ activeTabInfo.title || '正在探测标签页...' }}
                  </span>
                  <span class="text-[11px] text-neutral-400 font-mono truncate">
                    {{ activeTabInfo.url || 'chrome-extension://' }}
                  </span>
                </div>
              </div>

              <Tooltip content="刷新标签页状态">
                <button
                  type="button"
                  class="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer border-0 bg-transparent shrink-0"
                  @click="refreshActiveTab"
                >
                  <i class="i-lucide-refresh-cw text-xs" />
                </button>
              </Tooltip>
            </div>
          </Card>
        </section>

        <!-- ==================== TAB 2: UI 控件展厅 ==================== -->
        <section v-if="currentTab === 'components'" class="flex flex-col gap-3.5 animate-in fade-in duration-150">
          <!-- 基础操作按钮 -->
          <Card title="操作按钮族谱 (Button Variants)">
            <div class="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon="i-lucide-sparkles">Primary</Button>
              <Button variant="secondary" size="sm" icon="i-lucide-folder">Secondary</Button>
              <Button variant="success" size="sm" icon="i-lucide-check">Success</Button>
              <Button variant="destructive" size="sm" icon="i-lucide-trash-2">Delete</Button>
              <Button variant="outline" size="sm" icon="i-lucide-share">Outline</Button>
              <Button variant="ghost" size="sm" icon="i-lucide-more-horizontal">Ghost</Button>
            </div>
          </Card>

          <!-- 表单交互控件 -->
          <Card title="表单交互控件 (Inputs & Switches)">
            <div class="flex flex-col gap-3">
              <Input v-model="searchInput" placeholder="搜索或输入关键字..." icon="i-lucide-search" clearable />

              <div class="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div class="flex flex-col">
                  <span class="text-xs font-medium">云端自动备份</span>
                  <span class="text-[11px] text-neutral-400">Pinia 状态持久化同步</span>
                </div>
                <Switch v-model:checked="settingsStore.autoSync" />
              </div>

              <div class="flex items-center justify-between py-1">
                <div class="flex flex-col">
                  <span class="text-xs font-medium">智能正文提取</span>
                  <span class="text-[11px] text-neutral-400">过滤网页杂讯</span>
                </div>
                <Switch v-model:checked="settingsStore.extractorEnabled" />
              </div>
            </div>
          </Card>

          <!-- 滑块与任务进度 -->
          <Card title="滑杆与进度条 (Slider & Progress)">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-neutral-500">音量控制</span>
                  <span class="font-mono text-apple-blue font-semibold">{{ volume[0] }}%</span>
                </div>
                <Slider v-model="volume" :max="100" accent="blue" />
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-neutral-500">后台构建进度</span>
                  <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{{ progress }}%</span>
                </div>
                <Progress :model-value="progress" accent="green" />
              </div>
            </div>
          </Card>
        </section>

        <!-- ==================== TAB 3: 跨端响应式存储 ==================== -->
        <section v-if="currentTab === 'storage'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Card title="全上下文响应式存储 (useExtensionStorage)">
            <div class="flex flex-col gap-3">
              <div class="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/15 flex items-start gap-2.5">
                <i class="i-lucide-info text-apple-blue text-sm shrink-0 mt-0.5" />
                <span class="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  底层基于 <code class="font-mono font-bold text-apple-blue">chrome.storage.local</code> 与
                  <code class="font-mono font-bold text-apple-blue">storage.onChanged</code> 全局广播。在此处修改计数，Background、Content Script 与其他所有扩展窗口将实时响应式同步！
                </span>
              </div>

              <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.025] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06]">
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">全局多端共享计数器</span>
                  <span class="text-[10px] text-neutral-400 mt-0.5 font-mono">key: demo_shared_counter</span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="w-7 h-7 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.1] flex items-center justify-center font-bold text-sm cursor-pointer border-0 active:scale-95 transition-all"
                    @click="liveCounter--"
                  >
                    -
                  </button>
                  <span class="w-10 text-center font-mono font-bold text-base text-apple-blue">
                    {{ liveCounter }}
                  </span>
                  <button
                    type="button"
                    class="w-7 h-7 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.1] flex items-center justify-center font-bold text-sm cursor-pointer border-0 active:scale-95 transition-all"
                    @click="liveCounter++"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <Button variant="outline" size="sm" icon="i-lucide-rotate-ccw" @click="liveCounter = 0">
                  重置为 0
                </Button>
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  两向自动广播就绪
                </span>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <!-- ==================== 底部极简状态栏 ==================== -->
      <footer
        class="sticky bottom-0 px-3.5 py-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400 transition-colors"
        :class="isDark ? 'bg-[#1C1C1E]/90' : 'bg-white/90'"
      >
        <span class="flex items-center gap-1">
          <i class="i-lucide-shield-check text-xs text-apple-blue" />
          <span>WXT Vue Template • MV3</span>
        </span>
        <span class="font-mono text-[10px]">Apple HIG Design System</span>
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
