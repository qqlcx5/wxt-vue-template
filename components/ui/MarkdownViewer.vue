<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { renderMarkdown } from '@/utils/markdown/pipeline';
import { cn } from '@/utils/cn';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  class?: string;
  streaming?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  class: '',
  streaming: false,
});

const emit = defineEmits<{
  (e: 'wikilink-click', target: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

// 安全流式渲染
const renderedHtml = computed(() => {
  return renderMarkdown(props.content);
});

// 全局委托监听代码块复制与双链点击
function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // 1. 复制代码块
  const copyBtn = target.closest<HTMLButtonElement>('.mac-copy-btn');
  if (copyBtn) {
    e.preventDefault();
    e.stopPropagation();
    const encoded = copyBtn.dataset.code || '';
    const text = decodeURIComponent(encoded);
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        const textSpan = copyBtn.querySelector('.mac-copy-text');
        if (textSpan) {
          const original = textSpan.textContent;
          textSpan.textContent = '已复制!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            textSpan.textContent = original;
            copyBtn.classList.remove('copied');
          }, 1800);
        }
      });
    }
    return;
  }

  // 2. 双向链接点击
  const wikilink = target.closest<HTMLAnchorElement>('.am-wikilink');
  if (wikilink) {
    e.preventDefault();
    e.stopPropagation();
    const targetDoc = wikilink.dataset.target || '';
    if (targetDoc) {
      emit('wikilink-click', targetDoc);
    }
  }
}
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('markdown-body relative font-sans text-xs leading-relaxed select-text', props.class)"
    @click="handleClick"
  >
    <div v-html="renderedHtml" />

    <!-- 打字机流式输出光标指示器 -->
    <span
      v-if="props.streaming"
      class="inline-block w-1.5 h-3.5 bg-[#007AFF] ml-0.5 animate-pulse align-middle rounded-full"
    />
  </div>
</template>

<style>
/* ================= 基础排版与正文规范 ================= */
.markdown-body {
  color: inherit;
  word-break: break-word;
}

.markdown-body p {
  margin: 0.6em 0;
  line-height: 1.7;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-weight: 700;
  line-height: 1.35;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  color: #111827;
  scroll-margin-top: 3.5rem;
}
:root.dark .markdown-body h1,
:root.dark .markdown-body h2,
:root.dark .markdown-body h3,
:root.dark .markdown-body h4 {
  color: #f3f4f6;
}

.markdown-body h1 { font-size: 1.35rem; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.15rem; border-bottom: 1px solid rgba(0,0,0,0.04); padding-bottom: 0.25em; }
.markdown-body h3 { font-size: 1.02rem; }
.markdown-body h4 { font-size: 0.92rem; }

.markdown-body strong {
  font-weight: 600;
  color: #111827;
}
:root.dark .markdown-body strong {
  color: #f9fafb;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.35em;
  margin: 0.5em 0;
}
.markdown-body ul { list-style-type: disc; }
.markdown-body ol { list-style-type: decimal; }
.markdown-body li { margin: 0.25em 0; line-height: 1.6; }

/* 行内代码 */
.markdown-body :not(pre) > code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.88em;
  padding: 0.15em 0.4em;
  margin: 0 0.2em;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.06);
  color: #007aff;
}
:root.dark .markdown-body :not(pre) > code {
  background-color: rgba(255, 255, 255, 0.1);
  color: #38bdf8;
}

/* 引用块 */
.markdown-body blockquote {
  margin: 0.8em 0;
  padding: 0.4em 0.8em;
  border-left: 3px solid #007aff;
  background: rgba(0, 122, 255, 0.04);
  border-radius: 0 8px 8px 0;
  color: #4b5563;
  font-style: normal;
}
:root.dark .markdown-body blockquote {
  background: rgba(0, 122, 255, 0.08);
  color: #9ca3af;
}

/* 表格规范 */
.markdown-body table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 0.9em 0;
  font-size: 0.82rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
:root.dark .markdown-body table {
  border-color: rgba(255, 255, 255, 0.1);
}
.markdown-body th,
.markdown-body td {
  padding: 0.45em 0.75em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}
:root.dark .markdown-body th,
:root.dark .markdown-body td {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  border-right-color: rgba(255, 255, 255, 0.06);
}
.markdown-body th {
  background: rgba(0, 0, 0, 0.03);
  font-weight: 600;
  text-align: left;
}
:root.dark .markdown-body th {
  background: rgba(255, 255, 255, 0.05);
}
.markdown-body tr:last-child td {
  border-bottom: none;
}
.markdown-body td:last-child,
.markdown-body th:last-child {
  border-right: none;
}

/* ================= macOS 风格代码高亮视窗 ================= */
.mac-code-block {
  margin: 0.9em 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #1e1e1e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
:root.dark .mac-code-block {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.mac-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4em 0.75em;
  background-color: #252526;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  user-select: none;
}

.mac-traffic-lights {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mac-dot {
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  display: inline-block;
}
.mac-dot-red { background-color: #ff5f56; border: 1px solid #e0443e; }
.mac-dot-yellow { background-color: #ffbd2e; border: 1px solid #dea123; }
.mac-dot-green { background-color: #27c93f; border: 1px solid #1aab29; }

.mac-lang-badge {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b949e;
  margin-left: 0.3rem;
}

.mac-copy-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  font-size: 0.68rem;
  color: #8b949e;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 5px;
  transition: all 0.15s ease;
}
.mac-copy-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}
.mac-copy-btn.copied {
  color: #34c759;
}
.mac-copy-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.mac-code-body {
  padding: 0.75rem 0.9rem;
  margin: 0;
  overflow-x: auto;
  line-height: 1.5;
  font-size: 0.78rem;
  color: #e5e7eb;
}

/* ================= GitHub 风格 Callout / Alerts ================= */
.markdown-alert {
  margin: 0.9em 0;
  padding: 0.65em 0.9em;
  border-radius: 10px;
  border-left: 3.5px solid;
}
.markdown-alert-note {
  border-left-color: #007aff;
  background: rgba(0, 122, 255, 0.06);
}
.markdown-alert-tip {
  border-left-color: #34c759;
  background: rgba(52, 199, 89, 0.07);
}
.markdown-alert-important {
  border-left-color: #af52de;
  background: rgba(175, 82, 222, 0.07);
}
.markdown-alert-warning {
  border-left-color: #ff9500;
  background: rgba(255, 149, 0, 0.07);
}
.markdown-alert-caution {
  border-left-color: #ff3b30;
  background: rgba(255, 59, 48, 0.07);
}

.markdown-alert-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 0.3em;
}
.markdown-alert-note .markdown-alert-title { color: #007aff; }
.markdown-alert-tip .markdown-alert-title { color: #34c759; }
.markdown-alert-important .markdown-alert-title { color: #af52de; }
.markdown-alert-warning .markdown-alert-title { color: #ff9500; }
.markdown-alert-caution .markdown-alert-title { color: #ff3b30; }

.markdown-alert-content {
  font-size: 0.8rem;
  line-height: 1.6;
}

/* 双链 Wikilinks 标签 */
.am-wikilink {
  color: #007aff;
  background: rgba(0, 122, 255, 0.08);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.15s ease;
}
.am-wikilink:hover {
  background: rgba(0, 122, 255, 0.18);
  text-decoration: underline;
}

/* 高亮样式 */
.hl-mark {
  border-radius: 3px;
  padding: 0.05em 0.15em;
  cursor: pointer;
  transition: all 0.15s;
}
.hl-mark:hover {
  filter: brightness(0.92);
}
.hl-mark.hl-yellow { background: rgba(250, 204, 21, 0.35); border-bottom: 1.5px solid rgba(202, 138, 4, 0.6); }
.hl-mark.hl-green  { background: rgba(34, 197, 94, 0.25); border-bottom: 1.5px solid rgba(22, 101, 52, 0.6); }
.hl-mark.hl-blue   { background: rgba(59, 130, 246, 0.25); border-bottom: 1.5px solid rgba(30, 58, 138, 0.6); }
.hl-mark.hl-pink   { background: rgba(244, 114, 182, 0.3); border-bottom: 1.5px solid rgba(190, 24, 93, 0.6); }
.hl-mark.hl-purple { background: rgba(168, 85, 247, 0.25); border-bottom: 1.5px solid rgba(107, 33, 168, 0.6); }

/* 高亮跳转动画 */
.hl-flash {
  animation: hl-pulse-flash 1.6s ease-out;
}
@keyframes hl-pulse-flash {
  0%, 30% { box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.5); border-radius: 4px; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* highlight.js 语法主题高亮 */
.hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #ff7b72; }
.hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-type, .hljs-addition { color: #a5d6ff; }
.hljs-comment, .hljs-quote, .hljs-deletion { color: #8b949e; font-style: italic; }
.hljs-function, .hljs-class .hljs-title { color: #d2a8ff; }
.hljs-variable, .hljs-attr { color: #79c0ff; }
</style>
