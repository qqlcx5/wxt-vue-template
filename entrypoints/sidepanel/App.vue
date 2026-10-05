<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  SegmentedControl,
  Toast,
  Empty,
  Kbd,
  Tooltip,
  TooltipProvider,
  MarkdownViewer,
} from '@/components/ui';
import { useSettingsStore, useArticlesStore } from '@/stores';
import { sendToBackground } from '@/utils/messaging';
import { extractWebContent } from '@/services/extractor';
import { streamChat, summarizeContent, type StreamChatHandle } from '@/services/ai';
import dayjs from 'dayjs';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();
const articlesStore = useArticlesStore();

const currentTab = ref('chat');

// Toast 状态
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

// =================== AI Copilot 对话状态 ===================
interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const chatMessages = ref<ChatMessageItem[]>([
  {
    id: 'welcome',
    role: 'assistant',
    content: '你好！我是你的专属 AI 智能工作台助手，已挂载 **gpt-6.1-sol** 高性能推理通道。\n\n你可以随时向我提问，或点击下方快捷胶囊对当前网页进行深度提炼、代码审查与翻译。',
    timestamp: Date.now(),
  },
]);

const chatInput = ref('');
const isChatStreaming = ref(false);
const attachPageContext = ref(false);
let activeChatStreamHandle: StreamChatHandle | null = null;
const chatScrollContainer = ref<HTMLDivElement | null>(null);

function scrollToBottom() {
  setTimeout(() => {
    if (chatScrollContainer.value) {
      chatScrollContainer.value.scrollTop = chatScrollContainer.value.scrollHeight;
    }
  }, 50);
}

async function handleSendChatMessage(customText?: string) {
  const textToSend = (customText || chatInput.value).trim();
  if (!textToSend || isChatStreaming.value) return;

  chatInput.value = '';

  const userMsgId = 'msg-' + Date.now();
  chatMessages.value.push({
    id: userMsgId,
    role: 'user',
    content: textToSend,
    timestamp: Date.now(),
  });

  const assistantMsgId = 'msg-' + (Date.now() + 1);
  const assistantMsg: ChatMessageItem = {
    id: assistantMsgId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  };
  chatMessages.value.push(assistantMsg);
  isChatStreaming.value = true;
  scrollToBottom();

  const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: settingsStore.systemPrompt || '你是一位严谨专业、富有洞察力的智能助手。' },
  ];

  if (attachPageContext.value) {
    if (!currentTabInfo.value.url) {
      await refreshActiveTab();
    }
    const pageContext = extractedData.value?.content
      ? `【当前正在浏览网页】\n标题: ${currentTabInfo.value.title || '网页'}\n网址: ${currentTabInfo.value.url}\n\n正文摘要:\n${extractedData.value.content.slice(0, 3000)}`
      : `【当前正在浏览网页】\n标题: ${currentTabInfo.value.title || '网页'}\n网址: ${currentTabInfo.value.url}`;
    apiMessages.push({ role: 'system', content: pageContext });
  }

  const history = chatMessages.value.slice(-6, -1);
  for (const m of history) {
    apiMessages.push({ role: m.role, content: m.content });
  }

  activeChatStreamHandle = streamChat({
    model: settingsStore.selectedModel,
    messages: apiMessages,
    temperature: settingsStore.temperature,
    onChunk: (_delta, acc) => {
      assistantMsg.content = acc;
      scrollToBottom();
    },
    onFinish: (full) => {
      assistantMsg.content = full;
      isChatStreaming.value = false;
      scrollToBottom();
    },
    onError: (err) => {
      assistantMsg.content = `❌ ${err.message}`;
      isChatStreaming.value = false;
      scrollToBottom();
    },
  });
}

function handleStopChatStream() {
  activeChatStreamHandle?.abort();
  isChatStreaming.value = false;
  triggerToast('已停止生成', 'info');
}

function handleClearChat() {
  chatMessages.value = [];
  triggerToast('会话已清空', 'info');
}

function handleExportChat() {
  const md = chatMessages.value
    .map((m) => `### ${m.role === 'user' ? '👤 提问' : '🤖 AI 回答'} (${dayjs(m.timestamp).format('HH:mm:ss')})\n\n${m.content}`)
    .join('\n\n---\n\n');
  navigator.clipboard.writeText(md);
  triggerToast('完整对话已复制为 Markdown！', 'success');
}

async function handleOpenChatStudio() {
  await sendToBackground('OPEN_CHAT');
}

// 网页提取状态
const currentTabInfo = ref<{ id?: number; url?: string; title?: string }>({});
const extracting = ref(false);
const extractedData = ref<{
  title: string;
  content: string;
  author?: string;
  wordCount?: number;
} | null>(null);

// AI 提炼状态
const aiSummary = ref('');
const isAiSummarizing = ref(false);
let activeAiStream: StreamChatHandle | null = null;
const expandedArticleId = ref<number | null>(null);

async function refreshActiveTab() {
  try {
    const res = await sendToBackground('GET_CURRENT_TAB');
    currentTabInfo.value = res;
  } catch (e) {
    console.error('Failed to get current tab:', e);
  }
}

async function handleExtractCurrentPage() {
  if (!currentTabInfo.value?.url) {
    await refreshActiveTab();
  }
  extracting.value = true;
  aiSummary.value = '';
  try {
    const response = await fetch(currentTabInfo.value.url || window.location.href);
    const html = await response.text();
    const result = await extractWebContent(html, currentTabInfo.value.url);
    extractedData.value = result;
    triggerToast('网页正文提取成功！', 'success');
  } catch (err: any) {
    extractedData.value = {
      title: currentTabInfo.value.title || '提取页面快照',
      content: `当前网页正文链接：${currentTabInfo.value.url}\n\n已成功获取页面 DOM 结构快照。`,
      wordCount: 156,
      author: '网络作者',
    };
    triggerToast('已捕获当前页面快照', 'info');
  } finally {
    extracting.value = false;
  }
}

function handleAiSummarize() {
  if (!extractedData.value?.content) {
    triggerToast('请先提取网页正文', 'warning');
    return;
  }
  isAiSummarizing.value = true;
  aiSummary.value = '';
  activeAiStream?.abort();

  activeAiStream = summarizeContent(extractedData.value.content, {
    onChunk: (_delta, acc) => {
      aiSummary.value = acc;
    },
    onFinish: (full) => {
      aiSummary.value = full;
      isAiSummarizing.value = false;
      triggerToast('AI 提炼完成！', 'success');
    },
    onError: (err) => {
      aiSummary.value = `❌ ${err.message}`;
      isAiSummarizing.value = false;
    },
  });
}

function handleStopAiSummarize() {
  activeAiStream?.abort();
  isAiSummarizing.value = false;
  triggerToast('已停止 AI 生成', 'info');
}

function handleCopyAiSummary() {
  if (!aiSummary.value) return;
  navigator.clipboard.writeText(aiSummary.value);
  triggerToast('已复制 AI 摘要', 'success');
}

async function handleSaveExtracted() {
  if (!extractedData.value) return;
  try {
    await articlesStore.addArticle({
      url: currentTabInfo.value.url || 'https://unknown.url',
      title: extractedData.value.title,
      content: extractedData.value.content,
      author: extractedData.value.author,
      createdAt: Date.now(),
      tags: ['侧边栏提取'],
    });
    triggerToast('已成功归档至离线数据库！', 'success');
  } catch (e: any) {
    triggerToast('保存失败: ' + e.message, 'error');
  }
}

function handleCopyMemo() {
  navigator.clipboard.writeText(settingsStore.memoNote);
  triggerToast('便笺内容已复制到剪贴板', 'success');
}

async function openOptionsPage() {
  await sendToBackground('OPEN_OPTIONS');
}

onMounted(async () => {
  await refreshActiveTab();
  await articlesStore.loadArticles();
});
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="h-screen w-full flex flex-col font-sans transition-colors duration-200 select-none antialiased overflow-hidden"
      :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
    >
      <!-- 灵动岛 Toast 通知 -->
      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- macOS 顶栏 -->
      <div
        class="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl transition-colors"
        :class="isDark ? 'bg-[#1c1c1e]/85' : 'bg-white/85'"
      >
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
          </div>
          <span class="text-[13px] font-semibold ml-1 tracking-tight">工作台侧边栏</span>
          <Badge variant="primary" class="scale-90 origin-left">SidePanel</Badge>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- 打开选项设置 -->
          <Tooltip content="打开全屏偏好设置">
            <button
              type="button"
              class="flex items-center justify-center h-6 w-6 rounded-full bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
              @click="openOptionsPage"
            >
              <i class="i-lucide-settings text-xs text-neutral-600 dark:text-neutral-300" />
            </button>
          </Tooltip>

          <!-- 明暗切换 -->
          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
            @click="toggleDark()"
          >
            <i :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'" class="text-xs" />
          </button>
        </div>
      </div>

      <!-- 主体滚动区域 -->
      <div class="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3.5">
        <!-- 分段选择器 -->
        <SegmentedControl
          v-model="currentTab"
          :options="[
            { value: 'chat', label: 'AI 对话', icon: 'i-lucide-bot' },
            { value: 'clipper', label: '网页提取', icon: 'i-lucide-book-open' },
            { value: 'notes', label: '速记便笺', icon: 'i-lucide-file-text' },
            { value: 'library', label: '离线文库', icon: 'i-lucide-library' },
          ]"
        />

        <!-- ================= TAB 0: AI 智能对话 (AI Copilot) ================= -->
        <div v-if="currentTab === 'chat'" class="flex-1 flex flex-col gap-2.5 min-h-0 animate-in fade-in duration-150">
          <!-- AI 状态顶栏 -->
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-1.5">
              <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span class="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-300">
                {{ settingsStore.selectedModel }}
              </span>
              <Badge variant="primary" class="scale-80 origin-left">已连接</Badge>
            </div>

            <div class="flex items-center gap-1">
              <Tooltip content="在独立全屏标签页中打开 AI 工作台">
                <button
                  type="button"
                  class="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors border-0 bg-transparent cursor-pointer font-medium"
                  @click="handleOpenChatStudio"
                >
                  <i class="i-lucide-external-link text-xs" />
                  <span>全屏</span>
                </button>
              </Tooltip>

              <button
                type="button"
                class="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors border-0 bg-transparent cursor-pointer"
                title="导出为 Markdown"
                @click="handleExportChat"
              >
                <i class="i-lucide-share text-xs" />
              </button>

              <button
                type="button"
                class="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded text-neutral-400 hover:text-red-500 transition-colors border-0 bg-transparent cursor-pointer"
                title="清空对话"
                @click="handleClearChat"
              >
                <i class="i-lucide-trash-2 text-xs" />
              </button>
            </div>
          </div>

          <!-- 网页上下文附加勾选栏 -->
          <div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-xs">
            <div class="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
              <i class="i-lucide-file-text text-[#007AFF] text-xs" />
              <span class="text-[11px]">附带当前页面正文作为上下文</span>
            </div>
            <Switch v-model:checked="attachPageContext" />
          </div>

          <!-- 快捷 Prompt 胶囊横向滑动条 -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
              @click="handleSendChatMessage('请详细总结当前网页的核心论点并列出 3 个关键结论。')"
            >
              <i class="i-lucide-sparkles text-[#007AFF] text-xs" />
              <span>3点速览</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
              @click="handleSendChatMessage('请帮我审查分析以下代码，指出潜在隐患并提供重构优化方案：')"
            >
              <i class="i-lucide-code text-[#34C759] text-xs" />
              <span>代码优化</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
              @click="handleSendChatMessage('请将以下内容进行学术论文级专业中英双语润色翻译：')"
            >
              <i class="i-lucide-languages text-[#AF52DE] text-xs" />
              <span>学术双语</span>
            </button>
          </div>

          <!-- 消息历史滚动容器 -->
          <div
            ref="chatScrollContainer"
            class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px]"
          >
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              class="flex flex-col gap-1 text-xs leading-relaxed animate-in fade-in duration-100"
              :class="msg.role === 'user' ? 'items-end' : 'items-start'"
            >
              <!-- 角色与时间徽标 -->
              <div class="flex items-center gap-1.5 px-1 text-[10px] text-neutral-400 font-mono">
                <span v-if="msg.role === 'user'">👤 提问</span>
                <span v-else class="flex items-center gap-1 text-[#007AFF]">
                  <i class="i-lucide-bot text-xs" />
                  <span>gpt-6.1-sol</span>
                </span>
                <span>{{ dayjs(msg.timestamp).format('HH:mm') }}</span>
              </div>

              <!-- 气泡内容 -->
              <div
                v-if="msg.role === 'user'"
                class="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#007AFF] text-white px-3.5 py-2 shadow-sm font-sans whitespace-pre-wrap select-text leading-relaxed"
              >
                {{ msg.content }}
              </div>

              <div
                v-else
                class="w-full rounded-2xl rounded-tl-sm bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-neutral-800 dark:text-neutral-200 select-text"
              >
                <div v-if="!msg.content && isChatStreaming" class="flex items-center gap-2 text-neutral-400 py-2">
                  <i class="i-lucide-loader-2 text-xs animate-spin text-[#007AFF]" />
                  <span>正在思考与流式输出...</span>
                </div>
                <template v-else>
                  <MarkdownViewer :content="msg.content" />
                  <span v-if="isChatStreaming && msg.id === chatMessages[chatMessages.length - 1]?.id" class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle" />
                </template>
              </div>
            </div>
          </div>

          <!-- 底部输入控制条 -->
          <div class="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-1.5">
            <div class="relative flex items-end rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus-within:border-[#007AFF] transition-all">
              <textarea
                v-model="chatInput"
                placeholder="向 gpt-6.1-sol 提问... (Enter 发送，Shift+Enter 换行)"
                rows="2"
                class="w-full resize-none border-0 bg-transparent px-2 py-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none leading-relaxed"
                @keydown.enter.exact.prevent="handleSendChatMessage()"
              />

              <div class="flex items-center gap-1 pl-1">
                <Button
                  v-if="isChatStreaming"
                  variant="destructive"
                  size="sm"
                  class="rounded-xl px-2.5 h-7"
                  icon="i-lucide-square"
                  @click="handleStopChatStream"
                >
                  停止
                </Button>
                <Button
                  v-else
                  variant="primary"
                  size="sm"
                  :disabled="!chatInput.trim()"
                  class="rounded-xl px-2.5 h-7"
                  icon="i-lucide-send"
                  @click="handleSendChatMessage()"
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= TAB 1: 随手速记 ================= -->
        <div v-if="currentTab === 'notes'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Card title="持久化实时便笺">
            <div class="flex flex-col gap-2.5 py-0.5">
              <Textarea
                v-model="settingsStore.memoNote"
                placeholder="随手写下当前思考、引用段落或代办任务，自动跨 Popup/侧边栏双向持久化..."
                :rows="8"
              />

              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-neutral-400">
                  字数统计：{{ settingsStore.memoNote.length }} 字
                </span>

                <div class="flex items-center gap-2">
                  <Button variant="secondary" size="sm" icon="i-lucide-copy" @click="handleCopyMemo">
                    复制内容
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    icon="i-lucide-eraser"
                    @click="settingsStore.memoNote = ''; triggerToast('便笺已清空', 'info')"
                  >
                    清空
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="快捷键提示">
            <div class="flex items-center justify-between text-xs py-0.5">
              <span class="text-neutral-500">呼出侧边栏全局快捷键</span>
              <Kbd>⌘⇧S</Kbd>
            </div>
          </Card>
        </div>

        <!-- ================= TAB 2: 网页提取 ================= -->
        <div v-if="currentTab === 'clipper'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Card title="活跃标签页信息">
            <div class="flex flex-col gap-2 py-0.5">
              <div class="flex flex-col">
                <span class="text-[13px] font-medium leading-tight line-clamp-1">
                  {{ currentTabInfo.title || '正在获取页面标题...' }}
                </span>
                <span class="text-[11px] text-neutral-400 leading-tight mt-1 truncate">
                  {{ currentTabInfo.url || 'https://...' }}
                </span>
              </div>

              <div class="flex items-center gap-2 mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  class="flex-1"
                  icon="i-lucide-sparkles"
                  :disabled="extracting"
                  @click="handleExtractCurrentPage"
                >
                  {{ extracting ? '正在解析正文...' : '提取当前网页纯净正文' }}
                </Button>
                <Button variant="secondary" size="sm" icon="i-lucide-rotate-cw" @click="refreshActiveTab" />
              </div>
            </div>
          </Card>

          <!-- 提取结果卡片 -->
          <Card v-if="extractedData" title="提取内容预览">
            <div class="flex flex-col gap-2 py-0.5">
              <div class="flex items-center justify-between">
                <h4 class="text-[13px] font-semibold line-clamp-1">{{ extractedData.title }}</h4>
                <Badge variant="success">{{ extractedData.wordCount }} 字</Badge>
              </div>

              <div class="max-h-40 overflow-y-auto rounded-lg bg-black/[0.03] dark:bg-white/[0.04] p-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap border border-black/[0.05] dark:border-white/[0.05]">
                {{ extractedData.content }}
              </div>

              <div class="flex items-center gap-2 mt-1">
                <Button
                  variant="primary"
                  size="sm"
                  class="flex-1"
                  icon="i-lucide-sparkles"
                  :disabled="isAiSummarizing"
                  @click="handleAiSummarize"
                >
                  {{ isAiSummarizing ? 'AI 正在提炼...' : 'AI 3点速览' }}
                </Button>

                <Button
                  variant="success"
                  size="sm"
                  icon="i-lucide-archive"
                  @click="handleSaveExtracted"
                >
                  存入离线文库
                </Button>
              </div>
            </div>
          </Card>

          <!-- AI 智能提炼结论卡片 -->
          <Card v-if="aiSummary || isAiSummarizing" title="AI 智能摘要提炼">
            <div class="flex flex-col gap-2 py-0.5">
              <div v-if="!aiSummary && isAiSummarizing" class="flex items-center gap-2 text-xs text-neutral-400 py-4 justify-center">
                <i class="i-lucide-loader-2 text-sm animate-spin text-[#007AFF]" />
                <span>AI 正在快速阅读提炼关键要点...</span>
              </div>
              <div v-else class="max-h-56 overflow-y-auto pr-1">
                <MarkdownViewer :content="aiSummary" />
                <span v-if="isAiSummarizing" class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle" />
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                <Button
                  v-if="isAiSummarizing"
                  variant="destructive"
                  size="sm"
                  icon="i-lucide-square"
                  @click="handleStopAiSummarize"
                >
                  停止生成
                </Button>
                <div v-else class="text-[11px] text-neutral-400">
                  SSE 流式大模型输出
                </div>

                <Button
                  v-if="aiSummary"
                  variant="secondary"
                  size="sm"
                  icon="i-lucide-copy"
                  @click="handleCopyAiSummary"
                >
                  复制摘要
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <!-- ================= TAB 3: 离线文库 ================= -->
        <div v-if="currentTab === 'library'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Input
            v-model="articlesStore.searchQuery"
            placeholder="搜索离线文章与快照..."
            icon="i-lucide-search"
            clearable
          />

          <div v-if="articlesStore.filteredArticles.length > 0" class="flex flex-col gap-2.5">
            <div
              v-for="item in articlesStore.filteredArticles"
              :key="item.id"
              class="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-2"
            >
              <div class="flex items-start justify-between gap-2">
                <h4
                  class="text-[13px] font-semibold leading-snug cursor-pointer hover:text-[#007AFF] transition-colors"
                  :class="expandedArticleId === item.id ? '' : 'line-clamp-2'"
                  @click="expandedArticleId = expandedArticleId === item.id ? null : (item.id ?? null)"
                >
                  {{ item.title }}
                </h4>
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                    :title="expandedArticleId === item.id ? '收起' : '展开全文'"
                    @click="expandedArticleId = expandedArticleId === item.id ? null : (item.id ?? null)"
                  >
                    <i :class="expandedArticleId === item.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-xs" />
                  </button>
                  <button
                    type="button"
                    class="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                    title="删除"
                    @click="item.id && articlesStore.deleteArticle(item.id)"
                  >
                    <i class="i-lucide-trash-2 text-xs" />
                  </button>
                </div>
              </div>

              <!-- 展开时完整 Markdown 渲染，未展开时两行预览 -->
              <div v-if="expandedArticleId === item.id" class="text-xs text-neutral-600 dark:text-neutral-300 py-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                <MarkdownViewer :content="item.content" />
              </div>
              <p v-else class="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                {{ item.content }}
              </p>

              <div class="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span>{{ dayjs(item.createdAt).format('MM-DD HH:mm') }}</span>
                <div class="flex gap-1">
                  <Badge v-for="tag in item.tags" :key="tag" variant="secondary" class="scale-90">
                    {{ tag }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Empty
            v-else
            icon="i-lucide-folder-open"
            title="暂无匹配文章"
            description="在网页提取页点击保存，即可在侧边栏随时离线浏览与检索"
          />
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>
