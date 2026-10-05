<script lang="ts" setup>
import { computed, ref } from 'vue';
import hljs from 'highlight.js';
import { cn } from '@/utils/cn';

interface Props {
  content: string;
  class?: string;
}

const props = defineProps<Props>();

interface Segment {
  type: 'text' | 'code';
  content: string;
  lang?: string;
  highlighted?: string;
}

const copiedIndex = ref<number | null>(null);

function copyCode(code: string, index: number) {
  navigator.clipboard.writeText(code);
  copiedIndex.value = index;
  setTimeout(() => {
    copiedIndex.value = null;
  }, 2000);
}

// 解析 Markdown 内容为文本段与代码块段
const segments = computed<Segment[]>(() => {
  if (!props.content) return [];

  const result: Segment[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(props.content)) !== null) {
    // 提取代码块之前的普通文本
    if (match.index > lastIndex) {
      result.push({
        type: 'text',
        content: props.content.slice(lastIndex, match.index),
      });
    }

    const lang = (match[1] || '').trim();
    const code = match[2] || '';

    let highlighted = '';
    try {
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
    } catch {
      highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    result.push({
      type: 'code',
      content: code,
      lang: lang || 'code',
      highlighted,
    });

    lastIndex = match.index + match[0].length;
  }

  // 剩余普通文本
  if (lastIndex < props.content.length) {
    result.push({
      type: 'text',
      content: props.content.slice(lastIndex),
    });
  }

  return result;
});

// 轻量行内格式化（粗体、行内代码、引用）
function formatInlineText(text: string): string {
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 粗体 **bold**
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-neutral-900 dark:text-white">$1</strong>',
  );

  // 行内代码 `code`
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 mx-0.5 rounded-[4px] bg-black/[0.06] dark:bg-white/[0.1] text-apple-blue font-mono text-[11px]">$1</code>',
  );

  // 标题 ### Title
  formatted = formatted.replace(
    /^###\s+(.*$)/gm,
    '<h4 class="text-xs font-bold text-neutral-900 dark:text-white mt-2 mb-1">$1</h4>',
  );
  formatted = formatted.replace(
    /^##\s+(.*$)/gm,
    '<h3 class="text-[13px] font-bold text-neutral-900 dark:text-white mt-2.5 mb-1">$1</h3>',
  );

  // 引用 > Quote
  formatted = formatted.replace(
    /^>\s+(.*$)/gm,
    '<blockquote class="border-l-2 border-apple-blue/50 pl-2.5 py-0.5 my-1 text-neutral-500 italic">$1</blockquote>',
  );

  // 列表 - List
  formatted = formatted.replace(
    /^\s*-\s+(.*$)/gm,
    '<li class="ml-3.5 list-disc leading-relaxed">$1</li>',
  );

  return formatted;
}
</script>

<template>
  <div :class="cn('flex flex-col gap-2 font-sans text-xs leading-relaxed select-text', $props.class)">
    <template v-for="(seg, idx) in segments" :key="idx">
      <!-- 1. 普通文本段落 -->
      <div
        v-if="seg.type === 'text'"
        class="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200"
        v-html="formatInlineText(seg.content)"
      />

      <!-- 2. 苹果 macOS 风格代码高亮窗口 -->
      <div
        v-else
        class="my-1.5 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-[#1e1e1e] text-neutral-100 shadow-[0_4px_16px_rgba(0,0,0,0.15)] font-mono text-[11px]"
      >
        <!-- 窗口顶栏：macOS 三色控制点 + 语言标签 + 复制按钮 -->
        <div class="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-white/[0.08] select-none">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block" />
            <span class="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block" />
            <span class="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block" />
            <span class="ml-1 text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              {{ seg.lang }}
            </span>
          </div>

          <button
            type="button"
            class="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
            @click="copyCode(seg.content, idx)"
          >
            <i v-if="copiedIndex === idx" class="i-lucide-check text-[#34C759] text-xs" />
            <i v-else class="i-lucide-copy text-xs" />
            <span>{{ copiedIndex === idx ? '已复制' : '复制' }}</span>
          </button>
        </div>

        <!-- 高亮代码展示区 -->
        <pre class="p-3 overflow-x-auto leading-normal font-mono scrollbar-thin"><code v-html="seg.highlighted" /></pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 经典深色高亮色彩微调 */
:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-subst) {
  color: #ff7b72;
}

:deep(.hljs-string),
:deep(.hljs-title),
:deep(.hljs-section),
:deep(.hljs-attribute),
:deep(.hljs-literal),
:deep(.hljs-template-tag),
:deep(.hljs-template-variable),
:deep(.hljs-type),
:deep(.hljs-addition) {
  color: #a5d6ff;
}

:deep(.hljs-comment),
:deep(.hljs-quote),
:deep(.hljs-deletion) {
  color: #8b949e;
  font-style: italic;
}

:deep(.hljs-function),
:deep(.hljs-class .hljs-title) {
  color: #d2a8ff;
}

:deep(.hljs-variable),
:deep(.hljs-attr) {
  color: #79c0ff;
}
</style>
