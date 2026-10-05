<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Badge,
  Toast,
  Tooltip,
  TooltipProvider,
  MarkdownViewer,
} from '@/components/ui';
import { useSettingsStore } from '@/stores';
import { streamChat, type StreamChatHandle } from '@/services/ai';
import { sendToBackground } from '@/utils/messaging';
import dayjs from 'dayjs';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Session {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

const sessions = ref<Session[]>([
  {
    id: 'default',
    title: '日常答疑与代码优化',
    createdAt: Date.now(),
    messages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `### 欢迎使用 AI 智能对话工作台 (Studio)\n\n当前已接入 **${settingsStore.selectedModel || 'gpt-6.1-sol'}** 高性能推理通道。\n\n本工作台完全遵循 Apple Human Interface Guidelines 设计，具备：\n- **SSE 打字机流式响应**：毫秒级首字出词体验\n- **macOS 高保真代码视窗**：自动识别语法高亮与一键复制代码\n- **多轮会话管理**：支持多会话隔离、随时中断与导出 Markdown`,
        timestamp: Date.now(),
      },
    ],
  },
]);

const currentSessionId = ref('default');
const currentSession = computed<Session>(() => {
  return (
    sessions.value.find((s) => s.id === currentSessionId.value) ||
    sessions.value[0] || {
      id: 'default',
      title: '新会话',
      createdAt: Date.now(),
      messages: [],
    }
  );
});

const inputQuery = ref('');
const isStreaming = ref(false);
let activeStreamHandle: StreamChatHandle | null = null;
const messagesContainer = ref<HTMLDivElement | null>(null);

// Toast
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

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function createNewSession() {
  const newId = 'session-' + Date.now();
  const newSession: Session = {
    id: newId,
    title: '新对话 ' + (sessions.value.length + 1),
    createdAt: Date.now(),
    messages: [
      {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `已开启新会话。当前使用推理模型: **${settingsStore.selectedModel}**。\n\n请直接输入问题，或点击下方预设 Prompt 开始探索。`,
        timestamp: Date.now(),
      },
    ],
  };
  sessions.value.unshift(newSession);
  currentSessionId.value = newId;
  triggerToast('已创建新会话');
}

function deleteSession(id: string, e: Event) {
  e.stopPropagation();
  if (sessions.value.length <= 1) {
    triggerToast('至少保留一个会话', 'warning');
    return;
  }
  sessions.value = sessions.value.filter((s) => s.id !== id);
  if (currentSessionId.value === id && sessions.value[0]) {
    currentSessionId.value = sessions.value[0].id;
  }
  triggerToast('会话已删除');
}

async function handleSendMessage(customPrompt?: string) {
  const text = (customPrompt || inputQuery.value).trim();
  if (!text || isStreaming.value) return;

  inputQuery.value = '';
  const session = currentSession.value;

  // 更新会话标题（若是第一条用户消息）
  if (session.messages.filter((m) => m.role === 'user').length === 0) {
    session.title = text.slice(0, 16) + (text.length > 16 ? '...' : '');
  }

  // 添加用户消息
  session.messages.push({
    id: 'user-' + Date.now(),
    role: 'user',
    content: text,
    timestamp: Date.now(),
  });

  // 创建助手占位消息
  const assistantMsg: Message = {
    id: 'assistant-' + Date.now(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  };
  session.messages.push(assistantMsg);
  isStreaming.value = true;
  scrollToBottom();

  const apiMessages = [
    { role: 'system' as const, content: settingsStore.systemPrompt || '你是一位严谨专业、富有洞察力的智能助手。' },
    ...session.messages.slice(-8, -1).map((m) => ({ role: m.role, content: m.content })),
  ];

  activeStreamHandle = streamChat({
    model: settingsStore.selectedModel,
    messages: apiMessages,
    temperature: settingsStore.temperature,
    onChunk: (_delta, acc) => {
      assistantMsg.content = acc;
      scrollToBottom();
    },
    onFinish: (full) => {
      assistantMsg.content = full;
      isStreaming.value = false;
      scrollToBottom();
    },
    onError: (err) => {
      assistantMsg.content = `❌ 出错: ${err.message}`;
      isStreaming.value = false;
      scrollToBottom();
    },
  });
}

function handleStopStream() {
  activeStreamHandle?.abort();
  isStreaming.value = false;
  triggerToast('已停止生成', 'info');
}

function handleClearCurrentSession() {
  const session = currentSession.value;
  session.messages = [];
  triggerToast('会话记录已清空');
}

function handleExportMarkdown() {
  const session = currentSession.value;
  const md = `# ${session.title}\n\n` + session.messages
    .map((m) => `### ${m.role === 'user' ? '👤 提问' : '🤖 AI 回复'} (${dayjs(m.timestamp).format('YYYY-MM-DD HH:mm:ss')})\n\n${m.content}`)
    .join('\n\n---\n\n');
  navigator.clipboard.writeText(md);
  triggerToast('当前会话已全部复制为 Markdown', 'success');
}

async function openOptionsPage() {
  await sendToBackground('OPEN_OPTIONS');
}

const promptShortcuts = [
  { label: '💡 3点核心要点提炼', prompt: '请提炼总结核心内容，并分列出 3 个最重要的洞察点：' },
  { label: '💻 代码审查与优化', prompt: '请审查分析以下代码，指出潜在隐患并提供重构优化后的版本：\n\n```ts\n\n```' },
  { label: '✍️ 学术论文双语润色', prompt: '请以 Nature / IEEE 顶级期刊的严谨标准，将以下文本进行学术润色与专业中英双语对齐：' },
  { label: '📊 架构方案设计', prompt: '请帮我设计一个高可用、轻量级的前端架构设计方案：' },
];
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="h-screen w-full flex font-sans transition-colors duration-200 select-none antialiased overflow-hidden"
      :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
    >
      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- 左侧边栏 (macOS 风格列表) -->
      <aside
        class="w-72 border-r border-black/[0.06] dark:border-white/[0.08] p-3.5 flex flex-col justify-between shrink-0"
        :class="isDark ? 'bg-[#1c1c1e]/70' : 'bg-white/70'"
      >
        <div class="flex flex-col gap-3 min-h-0">
          <!-- 顶栏：macOS 交通灯 + 标题 -->
          <div class="flex items-center justify-between px-1 py-1">
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
                <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
                <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
              </div>
              <span class="text-xs font-semibold ml-1 tracking-tight">AI Studio</span>
            </div>

            <Badge variant="primary" class="scale-85 origin-right font-mono">{{ settingsStore.selectedModel }}</Badge>
          </div>

          <!-- 新建对话按钮 -->
          <button
            type="button"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-medium bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-[0_2px_8px_rgba(0,122,255,0.25)] transition-all cursor-pointer border-0 active:scale-98"
            @click="createNewSession"
          >
            <i class="i-lucide-plus text-sm" />
            <span>新建对话</span>
          </button>

          <!-- 会话历史列表 -->
          <div class="flex flex-col gap-1 mt-1 overflow-y-auto flex-1 pr-1">
            <span class="text-[11px] font-medium text-neutral-400 px-2 py-0.5">历史会话</span>
            <div
              v-for="s in sessions"
              :key="s.id"
              class="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
              :class="
                currentSessionId === s.id
                  ? 'bg-black/[0.08] dark:bg-white/[0.12] font-semibold text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              "
              @click="currentSessionId = s.id"
            >
              <div class="flex items-center gap-2 min-w-0">
                <i class="i-lucide-message-square text-xs shrink-0 text-[#007AFF]" />
                <span class="truncate">{{ s.title }}</span>
              </div>

              <button
                type="button"
                class="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity p-0.5 border-0 bg-transparent cursor-pointer"
                title="删除会话"
                @click="deleteSession(s.id, $event)"
              >
                <i class="i-lucide-trash-2 text-xs" />
              </button>
            </div>
          </div>
        </div>

        <!-- 底部偏好设置与深色模式切换 -->
        <div class="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between px-1">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors border-0 bg-transparent cursor-pointer"
            @click="openOptionsPage"
          >
            <i class="i-lucide-settings text-xs" />
            <span>偏好设置</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0"
            @click="toggleDark()"
          >
            <i v-if="isDark" class="i-lucide-moon text-[#007AFF] text-xs" />
            <i v-else class="i-lucide-sun text-[#FF9500] text-xs" />
          </button>
        </div>
      </aside>

      <!-- 右侧对话主界面 -->
      <main class="flex-1 flex flex-col h-screen min-w-0">
        <!-- 顶栏操作区 -->
        <header
          class="flex items-center justify-between px-6 py-3 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl"
          :class="isDark ? 'bg-[#1c1c1e]/70' : 'bg-white/70'"
        >
          <div class="flex items-center gap-2.5">
            <h1 class="text-sm font-semibold tracking-tight">{{ currentSession.title }}</h1>
            <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Badge variant="secondary" class="font-mono text-[10px]">{{ settingsStore.selectedModel }}</Badge>
          </div>

          <div class="flex items-center gap-2">
            <Button variant="secondary" size="sm" @click="handleExportMarkdown">
              <i class="i-lucide-copy text-xs mr-1" />
              <span>导出为 Markdown</span>
            </Button>
            <Button variant="neutral" size="sm" @click="handleClearCurrentSession">
              <i class="i-lucide-eraser text-xs mr-1" />
              <span>清空</span>
            </Button>
          </div>
        </header>

        <!-- 消息滚动流 -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 flex flex-col gap-5 max-w-4xl w-full mx-auto"
        >
          <div
            v-for="msg in currentSession.messages"
            :key="msg.id"
            class="flex flex-col gap-1.5 animate-in fade-in duration-150"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <!-- 角色与时间元数据 -->
            <div class="flex items-center gap-2 px-1 text-[11px] text-neutral-400 font-mono">
              <span v-if="msg.role === 'user'">👤 提问者</span>
              <span v-else class="flex items-center gap-1 text-[#007AFF] font-semibold">
                <i class="i-lucide-bot text-xs" />
                <span>{{ settingsStore.selectedModel }}</span>
              </span>
              <span>{{ dayjs(msg.timestamp).format('HH:mm:ss') }}</span>
            </div>

            <!-- 用户气泡 -->
            <div
              v-if="msg.role === 'user'"
              class="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#007AFF] text-white px-4 py-2.5 text-xs shadow-sm font-sans whitespace-pre-wrap select-text leading-relaxed"
            >
              {{ msg.content }}
            </div>

            <!-- AI 助手卡片 -->
            <div
              v-else
              class="w-full rounded-2xl rounded-tl-sm bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-xs text-neutral-800 dark:text-neutral-200 select-text"
            >
              <div v-if="!msg.content && isStreaming" class="flex items-center gap-2 text-neutral-400 py-2">
                <i class="i-lucide-loader-2 text-sm animate-spin text-[#007AFF]" />
                <span>正在思考中...</span>
              </div>
              <template v-else>
                <MarkdownViewer :content="msg.content" />
                <span v-if="isStreaming && msg.id === currentSession.messages[currentSession.messages.length - 1]?.id" class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle" />
              </template>
            </div>
          </div>
        </div>

        <!-- 底部输入与 Prompt 快捷栏 -->
        <footer class="p-4 border-t border-black/[0.06] dark:border-white/[0.08] max-w-4xl w-full mx-auto flex flex-col gap-2.5">
          <!-- 快捷 Prompt 胶囊 -->
          <div class="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
            <button
              v-for="p in promptShortcuts"
              :key="p.label"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95 text-xs font-medium"
              @click="handleSendMessage(p.prompt)"
            >
              <span>{{ p.label }}</span>
            </button>
          </div>

          <!-- 输入框卡片 -->
          <div class="relative flex items-end rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 p-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-within:border-[#007AFF] transition-all">
            <textarea
              v-model="inputQuery"
              placeholder="向 gpt-6.1-sol 提问任何内容... (Enter 发送，Shift+Enter 换行)"
              rows="3"
              class="w-full resize-none border-0 bg-transparent px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none leading-relaxed"
              @keydown.enter.exact.prevent="handleSendMessage()"
            />

            <div class="flex items-center gap-2 pl-2">
              <Button
                v-if="isStreaming"
                variant="destructive"
                size="sm"
                class="rounded-xl px-3 h-8"
                @click="handleStopStream"
              >
                <i class="i-lucide-square text-xs mr-1" />
                停止生成
              </Button>
              <Button
                v-else
                variant="primary"
                size="sm"
                :disabled="!inputQuery.trim()"
                class="rounded-xl px-3.5 h-8 font-medium"
                @click="handleSendMessage()"
              >
                <i class="i-lucide-send text-xs mr-1" />
                发送
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  </TooltipProvider>
</template>
