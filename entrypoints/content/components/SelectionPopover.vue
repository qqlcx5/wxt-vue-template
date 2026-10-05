<script lang="ts" setup>
import { ref, watch } from 'vue';
import { explainContent, summarizeContent, translateContent, type StreamChatHandle } from '@/services/ai';
import { MarkdownViewer } from '@/components/ui';
import { useSettingsStore } from '@/stores';

interface Props {
  text: string;
  position: { x: number; y: number; placement: 'top' | 'bottom' };
  visible: boolean;
}

const props = defineProps<Props>();
const emits = defineEmits<{
  (e: 'close'): void;
}>();

const settingsStore = useSettingsStore();

const currentMode = ref<'toolbar' | 'ai-result'>('toolbar');
const aiActionType = ref<'explain' | 'translate' | 'summarize'>('explain');
const aiResponse = ref('');
const aiLoading = ref(false);
const miniToast = ref('');
let activeStreamHandle: StreamChatHandle | null = null;

function showToast(msg: string) {
  miniToast.value = msg;
  setTimeout(() => {
    miniToast.value = '';
  }, 2000);
}

// 每次选区变化，重置回工具栏模式
watch(
  () => props.text,
  () => {
    currentMode.value = 'toolbar';
    aiResponse.value = '';
    aiLoading.value = false;
    activeStreamHandle?.abort();
  },
);

// 触发 AI 流式分析
function handleAiAction(type: 'explain' | 'translate' | 'summarize') {
  currentMode.value = 'ai-result';
  aiActionType.value = type;
  aiResponse.value = '';
  aiLoading.value = true;

  activeStreamHandle?.abort();

  const options = {
    onChunk: (_delta: string, accumulated: string) => {
      aiResponse.value = accumulated;
    },
    onFinish: (fullText: string) => {
      aiResponse.value = fullText;
      aiLoading.value = false;
    },
    onError: (err: Error) => {
      aiResponse.value = `❌ ${err.message}`;
      aiLoading.value = false;
    },
  };

  if (type === 'explain') {
    activeStreamHandle = explainContent(props.text, options);
  } else if (type === 'translate') {
    activeStreamHandle = translateContent(props.text, '中文', options);
  } else {
    activeStreamHandle = summarizeContent(props.text, options);
  }
}

// 中止当前 AI 流式输出
function handleStopStreaming() {
  activeStreamHandle?.abort();
  aiLoading.value = false;
  showToast('已停止生成');
}

// 存入侧边栏便笺
function handleSaveToNotes(customText?: string) {
  const contentToSave = customText || props.text;
  const quote = `\n\n> 摘自网页: ${contentToSave}`;
  settingsStore.memoNote = (settingsStore.memoNote || '') + quote;
  showToast('已追加存入便笺');
}

// 存入 AI 回答到便笺
function handleSaveAiToNotes() {
  if (!aiResponse.value) return;
  const quote = `\n\n### AI 分析 (${aiActionType.value === 'explain' ? '解释' : aiActionType.value === 'translate' ? '翻译' : '摘要'}):\n${aiResponse.value}`;
  settingsStore.memoNote = (settingsStore.memoNote || '') + quote;
  showToast('AI 回答已存入便笺');
}

// 复制为 Markdown 引用
function handleCopyQuote() {
  navigator.clipboard.writeText(`> ${props.text}`);
  showToast('已复制为引用');
}

// 复制 AI 回答
function handleCopyAiResponse() {
  navigator.clipboard.writeText(aiResponse.value);
  showToast('AI 回答已复制');
}

function handleClose() {
  activeStreamHandle?.abort();
  emits('close');
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed z-[9999999] font-sans select-none transition-all duration-150 ease-out"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: `translate(-50%, ${position.placement === 'top' ? '-100%' : '0'})`,
    }"
  >
    <!-- 内部轻量 Toast 提示 -->
    <div
      v-if="miniToast"
      class="absolute -top-9 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-full bg-black/85 text-white text-[11px] font-medium shadow-lg whitespace-nowrap animate-in fade-in"
    >
      {{ miniToast }}
    </div>

    <!-- 1. 划词悬浮胶囊工具栏 (Selection Toolbar Mode) -->
    <div
      v-if="currentMode === 'toolbar'"
      class="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-black/10 dark:border-white/10 text-neutral-850 dark:text-neutral-100 animate-in zoom-in-95 duration-100"
    >
      <!-- [ 🤖 AI 解释 / 翻译 ] -->
      <button
        type="button"
        class="flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium hover:bg-[#007AFF]/10 text-[#007AFF] transition-all cursor-pointer border-0 bg-transparent active:scale-95"
        title="呼出 AI 解释、翻译与摘要"
        @click="handleAiAction('explain')"
      >
        <i class="i-lucide-sparkles text-xs" />
        <span>AI 解释 / 翻译</span>
      </button>

      <span class="w-px h-3.5 bg-black/10 dark:bg-white/10" />

      <!-- [ 📝 存入便笺 ] -->
      <button
        type="button"
        class="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer border-0 bg-transparent text-neutral-700 dark:text-neutral-300 active:scale-95"
        title="存入侧边栏随手便笺"
        @click="handleSaveToNotes()"
      >
        <i class="i-lucide-file-text text-xs text-[#FF9500]" />
        <span>存入便笺</span>
      </button>

      <!-- [ 📋 复制引用 ] -->
      <button
        type="button"
        class="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer border-0 bg-transparent text-neutral-700 dark:text-neutral-300 active:scale-95"
        title="复制为 Markdown 引用"
        @click="handleCopyQuote"
      >
        <i class="i-lucide-quote text-xs text-[#34C759]" />
        <span>复制引用</span>
      </button>

      <span class="w-px h-3.5 bg-black/10 dark:bg-white/10" />

      <!-- 关闭按钮 -->
      <button
        type="button"
        class="flex items-center justify-center h-6 w-6 rounded-full hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all cursor-pointer border-0 bg-transparent active:scale-90"
        title="关闭"
        @click="handleClose"
      >
        <i class="i-lucide-x text-xs" />
      </button>
    </div>

    <!-- 2. AI 展开回答卡片 (AI Result Mode) -->
    <div
      v-else
      class="w-[380px] max-h-[460px] flex flex-col rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-black/10 dark:border-white/10 p-3.5 text-neutral-850 dark:text-neutral-100 animate-in zoom-in-95 duration-150"
    >
      <!-- 顶栏：标题与功能切换 Segmented Control -->
      <div class="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div class="flex items-center gap-1.5">
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#007AFF] text-white">
            <i class="i-lucide-sparkles text-[11px]" />
          </span>
          <span class="text-xs font-semibold tracking-tight">AI 智能分析</span>
          <span class="text-[9px] font-mono text-[#007AFF] bg-[#007AFF]/10 px-1.5 py-0.5 rounded-full">{{ settingsStore.featureRouting.selectionModel }}</span>
        </div>

        <!-- 切换 Tab: 解释 / 翻译 / 摘要 -->
        <div class="flex items-center bg-black/[0.05] dark:bg-white/[0.08] p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            class="px-2 py-0.5 rounded-md font-medium transition-all border-0 cursor-pointer"
            :class="aiActionType === 'explain' ? 'bg-white dark:bg-neutral-800 text-[#007AFF] shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-transparent'"
            @click="handleAiAction('explain')"
          >
            解释
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded-md font-medium transition-all border-0 cursor-pointer"
            :class="aiActionType === 'translate' ? 'bg-white dark:bg-neutral-800 text-[#007AFF] shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-transparent'"
            @click="handleAiAction('translate')"
          >
            翻译
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded-md font-medium transition-all border-0 cursor-pointer"
            :class="aiActionType === 'summarize' ? 'bg-white dark:bg-neutral-800 text-[#007AFF] shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-transparent'"
            @click="handleAiAction('summarize')"
          >
            摘要
          </button>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="text-[11px] px-1.5 py-0.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border-0 bg-transparent cursor-pointer"
            title="返回悬浮胶囊"
            @click="currentMode = 'toolbar'"
          >
            返回
          </button>
          <button
            type="button"
            class="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all border-0 bg-transparent cursor-pointer"
            @click="handleClose"
          >
            <i class="i-lucide-x text-[11px]" />
          </button>
        </div>
      </div>

      <!-- 内容正文流式输出 (采用专业 MarkdownViewer 渲染与语法高亮) -->
      <div class="my-2.5 flex-1 overflow-y-auto max-h-[280px] text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans select-text pr-1">
        <div v-if="!aiResponse && aiLoading" class="flex flex-col items-center justify-center gap-2 py-8 text-neutral-400">
          <i class="i-lucide-loader-2 text-base animate-spin text-[#007AFF]" />
          <span class="text-xs">正在连线 AI 大模型并组织回答...</span>
        </div>
        <template v-else>
          <MarkdownViewer :content="aiResponse" />
          <span v-if="aiLoading" class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle" />
        </template>
      </div>

      <!-- 底栏操作 -->
      <div class="pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <!-- 停止流式输出 -->
          <button
            v-if="aiLoading"
            type="button"
            class="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-0 bg-transparent cursor-pointer font-medium"
            @click="handleStopStreaming"
          >
            <i class="i-lucide-square text-[10px]" />
            <span>停止生成</span>
          </button>

          <!-- 存入便笺 -->
          <button
            v-else-if="aiResponse"
            type="button"
            class="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors border-0 bg-transparent cursor-pointer font-medium"
            @click="handleSaveAiToNotes"
          >
            <i class="i-lucide-file-text text-[10px] text-[#FF9500]" />
            <span>存入便笺</span>
          </button>
        </div>

        <!-- 复制回答 -->
        <button
          type="button"
          :disabled="!aiResponse"
          class="flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-[#007AFF] text-white hover:bg-[#007AFF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-0 cursor-pointer font-medium shadow-sm active:scale-95"
          @click="handleCopyAiResponse"
        >
          <i class="i-lucide-copy text-[10px]" />
          <span>复制回答</span>
        </button>
      </div>
    </div>
  </div>
</template>
