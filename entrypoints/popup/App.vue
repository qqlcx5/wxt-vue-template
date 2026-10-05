<script lang="ts" setup>
import { ref } from 'vue';
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
  Popover,
  AccordionItem,
  DialogContent,
  SegmentedControl,
  Select,
  DropdownMenu,
  RadioGroup,
  Toast,
  Kbd,
  Skeleton,
  Avatar,
  Empty,
  AccordionRoot,
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TooltipProvider,
  MarkdownViewer,
} from '@/components/ui';
import { useSettingsStore, useArticlesStore } from '@/stores';
import { sendToBackground } from '@/utils/messaging';
import { streamChat, type StreamChatHandle } from '@/services/ai';

// 浅色为主，支持丝滑切换深色
const isDark = useDark({
  initialValue: 'light',
});
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();
const articlesStore = useArticlesStore();

// 当前导航分段
const currentTab = ref('ai');

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
    model: settingsStore.selectedModel,
    messages: [
      { role: 'system', content: settingsStore.systemPrompt || '你是一位严谨专业、富有洞察力的智能助手。' },
      { role: 'user', content: q },
    ],
    temperature: settingsStore.temperature,
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
  settingsStore.memoNote = (settingsStore.memoNote || '') + `\n\n### AI 回答 (${settingsStore.selectedModel}):\n${aiAnswer.value}`;
  triggerToast('已追加存入便笺！', 'success');
}

async function openChatStudio() {
  await sendToBackground('OPEN_CHAT');
}

const searchInput = ref('');
const volume = ref([65]);
const progress = ref(78);

const checkMeta = ref(true);
const checkIndex = ref(true);
const checkHighlight = ref(false);

// Toast 状态提示
const toastVisible = ref(false);
const toastMessage = ref('已成功同步到本地缓存');
const toastType = ref<'success' | 'info' | 'warning' | 'error'>('success');

function triggerToast(msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, 2200);
}

// 侧边栏与独立设置跳转
async function openSidePanel() {
  const sidePanelApi = (globalThis as any).chrome?.sidePanel;

  // 1. 如果存在 Chrome 原生 sidePanel API，在当前直接点击事件（用户手势）上下文中直接打开（Chrome 116+ 推荐）
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
      if (tab?.id) {
        await sidePanelApi.open({ tabId: tab.id });
        window.close();
        return;
      }
    } catch (err: any) {
      console.warn('[Popup] Direct sidePanel.open failed:', err);
    }
  }

  // 2. 兜底通过 Background Service Worker 唤醒
  try {
    const res = await sendToBackground('OPEN_SIDEPANEL');
    if (res?.success) {
      window.close();
    } else {
      triggerToast(res?.error || '呼出侧边栏失败，请尝试快捷键 ⌘⇧S 或在网页上右键打开', 'warning');
    }
  } catch (err: any) {
    triggerToast('呼出侧边栏异常: ' + err.message, 'error');
  }
}

async function openOptions() {
  await sendToBackground('OPEN_OPTIONS');
}

// Select 下拉选单
const modelOptions = [
  { value: 'gpt-6.1-sol', label: 'gpt-6.1-sol (当前专属推理通道)', icon: 'i-lucide-sparkles' },
  { value: 'gpt4o', label: 'gpt-6.1-sol (Omni)', icon: 'i-lucide-zap' },
  { value: 'claude35', label: 'Claude 3.5 Sonnet', icon: 'i-lucide-bot' },
  { value: 'gemini15', label: 'Gemini 1.5 Pro', icon: 'i-lucide-layers' },
  { value: 'deepseek', label: 'DeepSeek-V3', icon: 'i-lucide-cpu' },
];

// RadioGroup 单选框组
const storageMode = ref('local');
const storageOptions = [
  { value: 'local', label: '本地离线 IndexedDB', description: '数据严格保存在当前浏览器沙箱中，保护隐私' },
  { value: 'cloud', label: '端到端加密云备份', description: '跨设备自动同步收藏夹与快照记录' },
];

// 下拉菜单操作项定义
const menuGroups = [
  {
    actions: [
      { label: '在侧边栏中打开', icon: 'i-lucide-panel-right', kbd: '⌘⇧S', onSelect: openSidePanel },
      { label: '打开系统偏好设置', icon: 'i-lucide-settings', onSelect: openOptions },
      { label: '复制快照链接', icon: 'i-lucide-copy', kbd: '⌘C', onSelect: () => triggerToast('链接已复制到剪贴板') },
    ],
  },
  {
    actions: [
      { label: '清除当前页面快照', icon: 'i-lucide-trash-2', destructive: true, onSelect: () => triggerToast('页面快照已清除', 'warning') },
    ],
  },
];

// 骨架屏演示切换
const showSkeleton = ref(false);

let progressTimer: ReturnType<typeof setInterval>;
function replayProgress() {
  progress.value = 0;
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (progress.value >= 100) {
      clearInterval(progressTimer);
    } else {
      progress.value += 2;
    }
  }, 30);
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="w-[410px] max-h-[640px] overflow-y-auto flex flex-col font-sans transition-colors duration-200 select-none antialiased relative"
      :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
    >
      <!-- 动态灵动岛 Toast 提示 -->
      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- macOS 风格应用视窗顶栏 -->
      <div
        class="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl transition-colors"
        :class="isDark ? 'bg-[#1c1c1e]/85' : 'bg-white/85'"
      >
        <!-- 视窗红黄绿交通灯控制点 + 标题 -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
          </div>
          <span class="text-[13px] font-semibold ml-1 text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            Apple UI Starter
          </span>
        </div>

        <!-- 右侧操作栏：侧边栏按钮 + 选项设置 + 明暗模式切换 -->
        <div class="flex items-center gap-1.5">
          <Tooltip content="在侧边栏中打开 (⌘⇧S)">
            <button
              type="button"
              class="flex items-center justify-center h-6 w-6 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
              @click="openSidePanel"
            >
              <i class="i-lucide-panel-right text-xs" />
            </button>
          </Tooltip>

          <Tooltip content="打开全屏 AI 智能助手 (Studio)">
            <button
              type="button"
              class="flex items-center justify-center h-6 w-6 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-[#007AFF] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
              @click="openChatStudio"
            >
              <i class="i-lucide-bot text-xs" />
            </button>
          </Tooltip>

          <Tooltip content="系统偏好设置">
            <button
              type="button"
              class="flex items-center justify-center h-6 w-6 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
              @click="openOptions"
            >
              <i class="i-lucide-settings text-xs" />
            </button>
          </Tooltip>

          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
            @click="toggleDark()"
          >
            <i :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'" class="text-xs" />
            <span>{{ isDark ? '暗黑' : '浅色' }}</span>
          </button>
        </div>
      </div>

      <!-- 主体内容区域 -->
      <div class="p-3.5 flex flex-col gap-4">
        <!-- 苹果标志性分段控制器 (Segmented Control) - 纯净无边框 -->
        <SegmentedControl
          v-model="currentTab"
          :options="[
            { value: 'ai', label: 'AI 随身问', icon: 'i-lucide-bot' },
            { value: 'featured', label: '常用控件', icon: 'i-lucide-layout-grid' },
            { value: 'forms', label: '表单输入', icon: 'i-lucide-edit-3' },
            { value: 'cards', label: '视窗浮层', icon: 'i-lucide-layers' },
          ]"
        />

        <!-- ==================== TAB 0: AI 随身问 (AI COPILOT) ==================== -->
        <div v-if="currentTab === 'ai'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Card title="专属 AI 推理助手">
            <div class="flex items-center justify-between py-1">
              <div class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007AFF] text-white shadow-sm">
                  <i class="i-lucide-sparkles text-sm" />
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-mono font-semibold">{{ settingsStore.selectedModel }}</span>
                    <Badge variant="success" class="scale-85 origin-left">就绪</Badge>
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
          </Card>

          <!-- 提问输入卡片 -->
          <Card title="即时提问与分析">
            <div class="flex flex-col gap-2.5 py-0.5">
              <Textarea
                v-model="aiPrompt"
                placeholder="在此输入任何问题，或从下方快捷 Prompt 点击开始..."
                :rows="2"
                @keydown.enter.exact.prevent="handlePopupAiAsk()"
              />

              <!-- 快捷 Prompt 标签 -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
                  @click="handlePopupAiAsk('请简要解释什么是 Manifest V3，并列出 3 个重大架构变化。')"
                >
                  💡 MV3 架构解释
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
                  @click="handlePopupAiAsk('请写一个 Vue 3 Composition API 的防抖 Debounce 函数示例。')"
                >
                  💻 Vue3 防抖函数
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
                  @click="handlePopupAiAsk('请提供几个提高代码可维护性与测试覆盖率的工程化最佳实践。')"
                >
                  🛠️ 工程化最佳实践
                </button>
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span class="text-[11px] text-neutral-400">Enter 发送</span>
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
            <div class="flex flex-col gap-2 py-0.5">
              <div v-if="!aiAnswer && isAiStreaming" class="flex items-center gap-2 text-xs text-neutral-400 py-4 justify-center">
                <i class="i-lucide-loader-2 text-sm animate-spin text-[#007AFF]" />
                <span>正在组织推理生成...</span>
              </div>
              <div v-else class="max-h-56 overflow-y-auto pr-1">
                <MarkdownViewer :content="aiAnswer" />
                <span v-if="isAiStreaming" class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle" />
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
        </div>

        <!-- ==================== TAB 1: 常用控件 (FEATURED) ==================== -->
        <div v-if="currentTab === 'featured'" class="flex flex-col gap-4 animate-in fade-in duration-150">
          <!-- 侧边栏工作台呼出入口卡片 (重点展示) -->
          <Card title="工作台侧边栏 (Side Panel)">
            <div class="flex items-center justify-between py-1">
              <div class="flex items-center gap-3">
                <div class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[#007AFF] text-white">
                  <i class="i-lucide-panel-right text-base" />
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[13px] font-medium leading-tight">呼出右侧长驻工作台</span>
                    <Badge variant="primary" class="scale-85 origin-left">常驻模式</Badge>
                  </div>
                  <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">支持全局快捷键 ⌘⇧S 或右键菜单</span>
                </div>
              </div>

              <Button variant="primary" size="sm" icon="i-lucide-external-link" @click="openSidePanel">
                立即打开
              </Button>
            </div>
          </Card>

          <!-- 账户与快捷键卡片 (Avatar + Kbd) -->
          <Card title="用户账户与快捷键">
            <div class="flex items-center justify-between py-1">
              <div class="flex items-center gap-3">
                <Avatar
                  fallback="AP"
                  shape="squircle"
                  size="default"
                  class="bg-[#007AFF]/10 text-[#007AFF] font-semibold"
                />
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[13px] font-medium leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Apple Developer</span>
                    <Badge variant="primary" class="scale-90 origin-left">Pro</Badge>
                  </div>
                  <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">developer@apple.com</span>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <Tooltip content="唤醒全局搜索">
                  <Kbd>⌘K</Kbd>
                </Tooltip>
                <Tooltip content="呼出侧边栏">
                  <Kbd>⌘⇧S</Kbd>
                </Tooltip>
              </div>
            </div>

            <!-- Inset Divider -->
            <div class="ml-[48px] my-2 border-b border-black/[0.05] dark:border-white/[0.06]" />

            <div class="flex items-center justify-between py-0.5">
              <span class="text-[12px] text-[#6c6c70] dark:text-[#8e8e93]">灵动岛状态通知演示</span>
              <Button
                variant="secondary"
                size="sm"
                icon="i-lucide-bell-ring"
                @click="triggerToast('通知：当前书签已同步至 Dexie 本地库', 'success')"
              >
                弹出 Toast
              </Button>
            </div>
          </Card>

          <!-- iOS 设置分组卡片 (Grouped Inset List) 绑定 Pinia 全局状态 -->
          <Card title="系统偏好设置 (Pinia 持久化)">
            <div class="flex flex-col">
              <!-- Row 1: 云端同步 -->
              <div class="flex items-center justify-between py-1.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#007AFF] text-white">
                    <i class="i-lucide-cloud text-xs" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[13px] font-normal leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">云端自动备份</span>
                    <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">跨端多设备实时数据同步</span>
                  </div>
                </div>
                <Switch v-model:checked="settingsStore.autoSync" />
              </div>

              <!-- Inset Divider -->
              <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />

              <!-- Row 2: 网页正文提取 -->
              <div class="flex items-center justify-between py-1.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#34C759] text-white">
                    <i class="i-lucide-book-open text-xs" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[13px] font-normal leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Defuddle 网页提取</span>
                    <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">自动过滤网页广告与杂讯</span>
                  </div>
                </div>
                <Switch v-model:checked="settingsStore.extractorEnabled" />
              </div>

              <!-- Inset Divider -->
              <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />

              <!-- Row 3: 桌面通知 -->
              <div class="flex items-center justify-between py-1.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#FF3B30] text-white">
                    <i class="i-lucide-bell text-xs" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[13px] font-normal leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">重要变动通知</span>
                    <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">任务执行完毕后发出系统提醒</span>
                  </div>
                </div>
                <Switch v-model:checked="settingsStore.notificationEnabled" />
              </div>
            </div>
          </Card>

          <!-- 苹果系统按钮展厅 (零外部边框、标准胶囊圆角) -->
          <Card title="系统操作按钮">
            <div class="flex flex-wrap gap-2 py-0.5">
              <Button variant="primary" icon="i-lucide-sparkles">主要操作</Button>
              <Button variant="secondary" icon="i-lucide-folder">次要操作</Button>
              <Button variant="success" icon="i-lucide-check">确认完成</Button>
              <Button variant="destructive" icon="i-lucide-trash-2">删除</Button>
              <Button variant="outline" icon="i-lucide-share">分享</Button>
              <Button variant="ghost" size="icon" icon="i-lucide-more-horizontal" />
            </div>
          </Card>

          <!-- 滑块与任务进度 -->
          <Card title="滑杆与进度条">
            <div class="flex flex-col gap-3.5 py-0.5">
              <!-- Slider -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-[12px]">
                  <span class="text-[#6c6c70] dark:text-[#8e8e93] flex items-center gap-1.5">
                    <i class="i-lucide-volume-2 text-xs text-[#007AFF]" />
                    音量控制
                  </span>
                  <span class="font-mono text-[#007AFF] font-semibold">{{ volume[0] }}%</span>
                </div>
                <Slider v-model="volume" :max="100" accent="blue" />
              </div>

              <!-- Progress -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-[12px]">
                  <span class="text-[#6c6c70] dark:text-[#8e8e93] flex items-center gap-1.5">
                    <i class="i-lucide-activity text-xs text-[#34C759]" />
                    后台同步进度
                  </span>
                  <span class="font-mono text-[#34C759] font-semibold">{{ progress }}%</span>
                </div>
                <Progress :model-value="progress" accent="green" />
                <Button
                  variant="secondary"
                  size="sm"
                  class="self-start mt-0.5"
                  icon="i-lucide-rotate-ccw"
                  @click="replayProgress"
                >
                  重新演示
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <!-- ==================== TAB 2: 表单与输入 (FORMS) ==================== -->
        <div v-if="currentTab === 'forms'" class="flex flex-col gap-4 animate-in fade-in duration-150">
          <Card title="文本搜索与持久化便笺">
            <div class="flex flex-col gap-2.5 py-0.5">
              <Input
                v-model="searchInput"
                placeholder="搜索已保存的书签、页面或记录..."
                icon="i-lucide-search"
                clearable
              />
              <Textarea
                v-model="settingsStore.memoNote"
                placeholder="在此记录速记或随想，跨端实时同步..."
                :rows="3"
              />
            </div>
          </Card>

          <!-- 下拉选择器 (Select) -->
          <Card title="下拉列表选择器 (Select)">
            <div class="flex flex-col gap-2 py-0.5">
              <label class="text-[12px] text-[#6c6c70] dark:text-[#8e8e93]">默认智能分析模型 (Pinia 状态持久化)</label>
              <Select
                v-model="settingsStore.selectedModel"
                :options="modelOptions"
                placeholder="选择语言模型..."
              />
            </div>
          </Card>

          <!-- 单选列表 (RadioGroup) -->
          <Card title="单选框组 (RadioGroup)">
            <div class="py-0.5">
              <RadioGroup v-model="storageMode" :options="storageOptions" />
            </div>
          </Card>

          <Card title="多选选项列表 (Checkbox)">
            <div class="flex flex-col gap-2.5 py-0.5">
              <div class="flex items-center gap-2.5">
                <Checkbox v-model:checked="checkMeta" id="check-1" />
                <label for="check-1" class="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  自动提取网页 OpenGraph 与 Twitter 封面图
                </label>
              </div>
              <div class="flex items-center gap-2.5">
                <Checkbox v-model:checked="checkIndex" id="check-2" />
                <label for="check-2" class="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  使用 MiniSearch 在本地构建毫秒级全文索引
                </label>
              </div>
              <div class="flex items-center gap-2.5">
                <Checkbox v-model:checked="checkHighlight" id="check-3" />
                <label for="check-3" class="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  提取代码块时启用高保真语法高亮解析
                </label>
              </div>
            </div>
          </Card>

          <Card title="色彩徽章胶囊 (Badge)">
            <div class="flex flex-wrap gap-2 py-0.5">
              <Badge variant="primary" icon="i-lucide-sparkles">精选推荐</Badge>
              <Badge variant="success" icon="i-lucide-check-circle-2">已就绪</Badge>
              <Badge variant="warning" icon="i-lucide-alert-circle">待确认</Badge>
              <Badge variant="destructive" icon="i-lucide-x-circle">异常</Badge>
              <Badge variant="purple" icon="i-lucide-zap">AI 赋能</Badge>
              <Badge variant="secondary">标准标签</Badge>
            </div>
          </Card>
        </div>

        <!-- ==================== TAB 3: 卡片与弹窗 (CARDS & MODALS) ==================== -->
        <div v-if="currentTab === 'cards'" class="flex flex-col gap-4 animate-in fade-in duration-150">
          <!-- 弹窗与弹出菜单操作 -->
          <Card title="macOS 视窗与菜单浮层">
            <div class="grid grid-cols-3 gap-2 py-0.5">
              <!-- Dialog Modal -->
              <DialogRoot>
                <DialogTrigger as-child>
                  <Button variant="primary" size="sm" icon="i-lucide-app-window">
                    工作表
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div class="flex items-center gap-3 mb-2">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF]">
                      <i class="i-lucide-shield-alert text-lg" />
                    </div>
                    <DialogTitle class="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
                      系统操作确认
                    </DialogTitle>
                  </div>
                  <DialogDescription class="text-[12px] text-[#6c6c70] dark:text-[#98989d] leading-relaxed">
                    这是一个遵循 macOS Human Interface Guidelines 的工作表弹窗，具备柔和模糊背景与 Esc 快捷退出。
                  </DialogDescription>
                  <div class="flex justify-end gap-2 mt-4 pt-1">
                    <DialogClose as-child>
                      <Button variant="neutral" size="sm">取消</Button>
                    </DialogClose>
                    <DialogClose as-child>
                      <Button variant="primary" size="sm">确认执行</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </DialogRoot>

              <!-- DropdownMenu 苹果操作菜单 -->
              <DropdownMenu :groups="menuGroups">
                <template #trigger>
                  <Button variant="secondary" size="sm" icon="i-lucide-more-vertical">
                    更多菜单
                  </Button>
                </template>
              </DropdownMenu>

              <!-- Popover 气泡菜单 -->
              <Popover>
                <template #trigger>
                  <Button variant="secondary" size="sm" icon="i-lucide-sliders">
                    气泡面板
                  </Button>
                </template>
                <div class="flex flex-col gap-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[13px] font-semibold">快速筛选选项</span>
                    <Badge variant="primary">3 项已选</Badge>
                  </div>
                  <p class="text-[11px] text-[#8e8e93]">在不打断主流程的情况下微调弹窗内表单参数。</p>
                  <Button variant="primary" size="sm" class="w-full mt-1">应用筛选</Button>
                </div>
              </Popover>
            </div>
          </Card>

          <!-- 骨架屏与空状态演示 (Skeleton & Empty) -->
          <Card title="空状态与加载骨架 (Empty & Skeleton)">
            <div class="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06] mb-2">
              <span class="text-[12px] text-[#6c6c70] dark:text-[#8e8e93]">切换数据加载骨架屏</span>
              <Switch v-model:checked="showSkeleton" />
            </div>

            <!-- 骨架屏态 -->
            <div v-if="showSkeleton" class="flex flex-col gap-2.5 py-1">
              <div class="flex items-center gap-3">
                <Skeleton class="h-9 w-9 rounded-full" />
                <div class="flex flex-col gap-1.5 flex-1">
                  <Skeleton class="h-3.5 w-3/4" />
                  <Skeleton class="h-2.5 w-1/2" />
                </div>
              </div>
              <Skeleton class="h-16 w-full rounded-xl mt-1" />
            </div>

            <!-- 空状态展示 -->
            <Empty
              v-else
              icon="i-lucide-folder-search"
              title="暂无保存的网页快照"
              description="点击浏览器工具栏图标或快捷键 ⌘⇧S 开启侧边栏并立即捕获当前页面的纯净 Markdown 正文"
            >
              <Button
                variant="primary"
                size="sm"
                icon="i-lucide-panel-right"
                @click="openSidePanel"
              >
                在侧边栏中开启
              </Button>
            </Empty>
          </Card>

          <!-- iOS 折叠手风琴 -->
          <Card title="分组说明折叠面板">
            <AccordionRoot type="single" collapsible class="w-full rounded-[10px] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
              <AccordionItem value="item-1" title="什么是 Apple 风格规范？" icon="i-lucide-apple">
                以纯净浅色画布（#F2F2F7）、系统强调蓝（#007AFF）、通透毛玻璃、无冗余黑边与高灵敏微动效为核心的现代设计系统。
              </AccordionItem>
              <AccordionItem value="item-2" title="如何使用纯 CSS 矢量图标？" icon="i-lucide-feather">
                只需添加类名（如 i-lucide-sparkles），由 UnoCSS 自动编译为纯 CSS 遮罩，0kb JS 运行时开销。
              </AccordionItem>
              <AccordionItem value="item-3" title="组件如何快速引入新页面？" icon="i-lucide-box">
                所有组件均统一从 @/components/ui 导出，支持像标准 Vue 组件一样直接传参与使用 v-model。
              </AccordionItem>
            </AccordionRoot>
          </Card>
        </div>
      </div>

      <!-- 底部苹果极简标注 -->
      <div class="mt-auto px-4 py-3 text-center border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015]">
        <p class="text-[11px] text-[#8e8e93]">
          Apple Human Interface Guidelines • WXT + UnoCSS
        </p>
      </div>
    </div>
  </TooltipProvider>
</template>
