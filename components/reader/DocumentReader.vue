<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  extractHeadings,
  countWords,
  estimateTokens,
  estimateReadingTime,
  type TocEntry,
} from '@/utils/markdown/pipeline';
import {
  applyMarks,
  createAnchorFromSelection,
  findHighlightByMark,
  jumpToHighlight,
  HIGHLIGHT_COLORS,
  type HighlightAnchor,
  type HighlightColor,
} from '@/utils/markdown/highlighter';
import MarkdownViewer from '@/components/ui/MarkdownViewer.vue';
import HighlightToolbar from './HighlightToolbar.vue';
import HighlightPopover from './HighlightPopover.vue';
import ReaderTocDrawer from './ReaderTocDrawer.vue';
import TranslationDualView from './TranslationDualView.vue';
import RawEditorViewer from './RawEditorViewer.vue';

interface Props {
  content: string;
  title?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
  capturedAt?: string;
  highlights?: HighlightAnchor[];
  translationMarkdown?: string;
  translating?: boolean;
  initialTab?: 'preview' | 'highlights' | 'translation' | 'raw' | 'metadata';
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  title: '未命名文稿',
  url: '',
  author: '',
  publishedAt: '',
  capturedAt: '',
  highlights: () => [],
  translationMarkdown: '',
  translating: false,
  initialTab: 'preview',
});

const emit = defineEmits<{
  (e: 'update:highlights', val: HighlightAnchor[]): void;
  (e: 'ask-ai', text: string): void;
  (e: 'wikilink-click', target: string): void;
  (e: 'request-translate', lang: string): void;
  (e: 'progress', progress: number): void;
}>();

// 当前主视图 Tab
const activeTab = ref<'preview' | 'highlights' | 'translation' | 'raw' | 'metadata'>(props.initialTab);

const scrollContainerRef = ref<HTMLDivElement | null>(null);
const markdownViewerRef = ref<any | null>(null);

// 阅读进度 (0 ~ 1)
const readProgress = ref(0);

// TOC 目录大纲
const tocOpen = ref(false);
const activeHeadingId = ref('');
const headings = computed<TocEntry[]>(() => extractHeadings(props.content));

// 划词悬浮工具栏状态
const toolbarState = ref<{
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
}>({
  visible: false,
  x: 0,
  y: 0,
  selectedText: '',
});

// 点击已有高亮的 Popover 状态
const popoverState = ref<{
  visible: boolean;
  x: number;
  y: number;
  highlight: HighlightAnchor | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  highlight: null,
});

// 文内快捷查找 (Find in document)
const showSearch = ref(false);
const searchQuery = ref('');

// 标注页内过滤
const highlightFilterColor = ref<string>('all');
const highlightSearchQuery = ref('');

// 复制状态反馈
const copied = ref(false);

// 统计数据
const words = computed(() => countWords(props.content));
const tokens = computed(() => estimateTokens(props.content));
const readTime = computed(() => estimateReadingTime(words.value));

// 过滤后的高亮列表
const filteredHighlights = computed(() => {
  let list = props.highlights || [];
  if (highlightFilterColor.value !== 'all') {
    list = list.filter((h) => h.color === highlightFilterColor.value);
  }
  if (highlightSearchQuery.value.trim()) {
    const q = highlightSearchQuery.value.trim().toLowerCase();
    list = list.filter((h) => h.text.toLowerCase().includes(q) || (h.note && h.note.toLowerCase().includes(q)));
  }
  return list;
});

// 监听正文内容与高亮变化，安全应用 marks
function refreshMarks() {
  nextTick(() => {
    if (!scrollContainerRef.value) return;
    applyMarks(scrollContainerRef.value, props.highlights || []);
  });
}

watch(
  [() => props.content, () => props.highlights],
  () => {
    if (activeTab.value === 'preview') {
      refreshMarks();
    }
  },
  { deep: true }
);

// 滚动监听与阅读进度追踪
let scrollTimer: any = null;
function handleScroll() {
  if (scrollTimer) return;
  scrollTimer = setTimeout(() => {
    scrollTimer = null;
    const el = scrollContainerRef.value;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      const p = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
      readProgress.value = p;
      emit('progress', p);
    }

    // 追踪当前可视区域标题
    if (headings.value.length > 0) {
      for (const h of headings.value) {
        const headingEl = el.querySelector(`#${CSS.escape(h.id)}`);
        if (headingEl) {
          const rect = headingEl.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 200) {
            activeHeadingId.value = h.id;
            break;
          }
        }
      }
    }
  }, 100);
}

// 选区鼠标松开：呼出悬浮高亮胶囊
function handleMouseUp(e: MouseEvent) {
  // 如果点击的是已有 mark，则不显示选区工具栏
  const target = e.target as HTMLElement;
  if (target.closest('mark[data-hl-id]')) return;

  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) {
    toolbarState.value.visible = false;
    return;
  }

  const range = sel.getRangeAt(0);
  const container = scrollContainerRef.value;
  if (!container || !container.contains(range.commonAncestorContainer)) {
    toolbarState.value.visible = false;
    return;
  }

  const rect = range.getBoundingClientRect();
  toolbarState.value = {
    visible: true,
    x: rect.left + rect.width / 2,
    y: Math.max(50, rect.top - 8),
    selectedText: sel.toString().trim(),
  };
}

// 点击高亮标签：呼出批注详情 Popover
function handleMarkClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const markEl = target.closest<HTMLElement>('mark[data-hl-id]');
  if (!markEl) return;

  e.preventDefault();
  e.stopPropagation();

  const hl = findHighlightByMark(markEl, props.highlights || []);
  if (!hl) return;

  const markRect = markEl.getBoundingClientRect();
  popoverState.value = {
    visible: true,
    x: markRect.left + markRect.width / 2,
    y: markRect.bottom + 6,
    highlight: hl,
  };
}

// 创建新高亮
function handleCreateHighlight(color: HighlightColor) {
  const container = scrollContainerRef.value;
  if (!container) return;

  const anchor = createAnchorFromSelection(container, color);
  if (!anchor) return;

  const updated = [...(props.highlights || []), anchor];
  emit('update:highlights', updated);
  toolbarState.value.visible = false;

  window.getSelection()?.removeAllRanges();
  refreshMarks();
}

// 从浮动工具栏问 AI
function handleToolbarAskAi() {
  if (toolbarState.value.selectedText) {
    emit('ask-ai', toolbarState.value.selectedText);
    toolbarState.value.visible = false;
    window.getSelection()?.removeAllRanges();
  }
}

// 高亮并添加批注
function handleToolbarAddNote() {
  const container = scrollContainerRef.value;
  if (!container) return;

  const anchor = createAnchorFromSelection(container, 'yellow');
  if (!anchor) return;

  const updated = [...(props.highlights || []), anchor];
  emit('update:highlights', updated);
  toolbarState.value.visible = false;

  // 立即弹出批注编辑框
  nextTick(() => {
    refreshMarks();
    setTimeout(() => {
      const mark = container.querySelector<HTMLElement>(`mark[data-hl-id="${anchor.id}"]`);
      if (mark) {
        const markRect = mark.getBoundingClientRect();
        popoverState.value = {
          visible: true,
          x: markRect.left + markRect.width / 2,
          y: markRect.bottom + 6,
          highlight: anchor,
        };
      }
    }, 50);
  });
}

// 复制选区文字
function handleToolbarCopy() {
  if (toolbarState.value.selectedText) {
    navigator.clipboard.writeText(toolbarState.value.selectedText);
    toolbarState.value.visible = false;
    window.getSelection()?.removeAllRanges();
  }
}

// 变更已有高亮颜色
function handlePopoverChangeColor(color: HighlightColor) {
  if (!popoverState.value.highlight) return;
  const targetId = popoverState.value.highlight.id;

  const updated = (props.highlights || []).map((h) =>
    h.id === targetId ? { ...h, color, updatedAt: Date.now() } : h
  );
  emit('update:highlights', updated);
  popoverState.value.highlight.color = color;
  refreshMarks();
}

// 保存批注内容
function handlePopoverSaveNote(note: string) {
  if (!popoverState.value.highlight) return;
  const targetId = popoverState.value.highlight.id;

  const updated = (props.highlights || []).map((h) =>
    h.id === targetId ? { ...h, note, updatedAt: Date.now() } : h
  );
  emit('update:highlights', updated);
  popoverState.value.highlight.note = note;
  refreshMarks();
}

// 删除高亮
function handleDeleteHighlight(id: string) {
  const updated = (props.highlights || []).filter((h) => h.id !== id);
  emit('update:highlights', updated);
  popoverState.value.visible = false;
  refreshMarks();
}

// 跳转到高亮
function handleJumpToHighlight(hl: HighlightAnchor) {
  activeTab.value = 'preview';
  nextTick(() => {
    if (scrollContainerRef.value) {
      jumpToHighlight(scrollContainerRef.value, hl.id);
    }
  });
}

// TOC 跳转至指定标题
function handleJumpToHeading(heading: TocEntry) {
  const container = scrollContainerRef.value;
  if (!container) return;

  const target = container.querySelector(`#${CSS.escape(heading.id)}`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeHeadingId.value = heading.id;
  }
  tocOpen.value = false;
}

// 导出高亮批注为 Markdown
function handleExportHighlights() {
  const hls = props.highlights || [];
  if (hls.length === 0) return;

  const lines = [
    `# 《${props.title}》的阅读标注与批注`,
    `> 来源: ${props.url || '本地文稿'} · 共 ${hls.length} 条标注\n`,
  ];

  for (const h of hls) {
    lines.push(`- **高亮选段**: "${h.text}"`);
    if (h.note) {
      lines.push(`  - 📝 **批注**: ${h.note}`);
    }
    lines.push(`  - 🏷️ 颜色: \`${h.color}\``);
  }

  navigator.clipboard.writeText(lines.join('\n'));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1800);
}

// 打印 / 导出 PDF
function handlePrint() {
  window.print();
}

// 全文一键复制
function handleCopyCurrentContent() {
  navigator.clipboard.writeText(props.content);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1800);
}

function closePopovers() {
  toolbarState.value.visible = false;
  popoverState.value.visible = false;
}

onMounted(() => {
  document.addEventListener('click', closePopovers);
  refreshMarks();
});

onUnmounted(() => {
  document.removeEventListener('click', closePopovers);
});
</script>

<template>
  <div class="h-full w-full flex flex-col min-h-0 bg-white dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 select-none overflow-hidden relative font-sans">
    <!-- 顶部 2px 优雅 Apple 渐变阅读进度条 -->
    <div
      class="h-0.5 bg-gradient-to-r from-[#007AFF] via-[#34C759] to-[#AF52DE] transition-all duration-150 z-30"
      :style="{ width: `${Math.round(readProgress * 100)}%` }"
    />

    <!-- ================= 顶栏控制中枢 ================= -->
    <header class="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl z-20 shrink-0">
      <!-- 左侧：标题与标签模式切换 -->
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div class="flex flex-col min-w-0">
          <h2 class="text-xs font-bold truncate m-0 max-w-56 leading-tight" :title="props.title">
            {{ props.title }}
          </h2>
          <div class="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5 font-mono">
            <span>{{ words }} 字</span>
            <span>·</span>
            <span>约 {{ readTime }} 分钟</span>
            <span v-if="readProgress > 0">· 读过 {{ Math.round(readProgress * 100) }}%</span>
          </div>
        </div>

        <div class="h-5 w-px bg-black/[0.08] dark:border-white/[0.1] mx-1" />

        <!-- 模式分段选择器 -->
        <div class="flex items-center p-0.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-xs font-medium">
          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all"
            :class="activeTab === 'preview' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
            @click="activeTab = 'preview'"
          >
            <i class="i-lucide-book-open text-xs" />
            <span>阅读</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all"
            :class="activeTab === 'highlights' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
            @click="activeTab = 'highlights'"
          >
            <i class="i-lucide-highlighter text-xs text-amber-500" />
            <span>标注</span>
            <span
              v-if="(props.highlights || []).length > 0"
              class="px-1 py-0.2 rounded-full text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold"
            >
              {{ props.highlights.length }}
            </span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all"
            :class="activeTab === 'translation' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
            @click="activeTab = 'translation'"
          >
            <i class="i-lucide-languages text-xs text-[#007AFF]" />
            <span>对照</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all"
            :class="activeTab === 'raw' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
            @click="activeTab = 'raw'"
          >
            <i class="i-lucide-code-2 text-xs" />
            <span>源码</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all"
            :class="activeTab === 'metadata' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
            @click="activeTab = 'metadata'"
          >
            <i class="i-lucide-info text-xs" />
            <span>元数据</span>
          </button>
        </div>
      </div>

      <!-- 右侧：通用动作按钮组 -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- 目录大纲开关 -->
        <button
          v-if="headings.length > 0"
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-[#007AFF] hover:border-[#007AFF]/40 transition-colors bg-black/[0.02] dark:bg-white/[0.04] cursor-pointer"
          :class="{ 'border-[#007AFF] text-[#007AFF] bg-[#007AFF]/5': tocOpen }"
          title="展开文档大纲目录"
          @click="tocOpen = !tocOpen"
        >
          <i class="i-lucide-list text-xs" />
          <span>大纲 ({{ headings.length }})</span>
        </button>

        <!-- 打印 / PDF 导出 -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-0 bg-transparent cursor-pointer"
          title="导出 / 打印为 PDF"
          @click="handlePrint"
        >
          <i class="i-lucide-printer text-xs" />
        </button>

        <!-- 一键复制 -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-0 bg-transparent cursor-pointer"
          :title="copied ? '已复制！' : '复制全文 Markdown'"
          @click="handleCopyCurrentContent"
        >
          <i :class="copied ? 'i-lucide-check text-green-500' : 'i-lucide-copy'" class="text-xs" />
        </button>
      </div>
    </header>

    <!-- ================= 主内容交互区 ================= -->
    <div class="flex-1 flex min-h-0 relative overflow-hidden">
      <!-- 1. 阅读增强预览模式 (Markdown Preview) -->
      <div
        v-show="activeTab === 'preview'"
        ref="scrollContainerRef"
        class="flex-1 overflow-y-auto px-6 py-5 max-w-4xl mx-auto w-full select-text transition-all"
        @scroll="handleScroll"
        @mouseup="handleMouseUp"
        @click="handleMarkClick"
      >
        <MarkdownViewer
          ref="markdownViewerRef"
          :content="props.content"
          @wikilink-click="(target) => emit('wikilink-click', target)"
        />
      </div>

      <!-- 2. 独立标注库视图 (Highlights Manager) -->
      <div v-if="activeTab === 'highlights'" class="flex-1 flex flex-col min-h-0 bg-neutral-50/50 dark:bg-[#151518]">
        <!-- 标注检索与批处理工具栏 -->
        <div class="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md">
          <div class="flex items-center gap-2 flex-1 max-w-xs">
            <i class="i-lucide-search text-xs text-neutral-400" />
            <input
              v-model="highlightSearchQuery"
              placeholder="搜索选段或批注内容..."
              class="w-full text-xs bg-transparent border-0 outline-none placeholder-neutral-400 text-neutral-800 dark:text-neutral-200"
            >
          </div>

          <div class="flex items-center gap-2">
            <!-- 颜色过滤 -->
            <div class="flex items-center gap-1 pr-2 border-r border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[10px] border-0 cursor-pointer transition-colors"
                :class="highlightFilterColor === 'all' ? 'bg-black/10 dark:bg-white/10 font-bold' : 'text-neutral-400 bg-transparent'"
                @click="highlightFilterColor = 'all'"
              >
                全部
              </button>
              <button
                v-for="c in HIGHLIGHT_COLORS"
                :key="c.color"
                type="button"
                class="w-3.5 h-3.5 rounded-full border border-black/10 transition-transform cursor-pointer"
                :class="highlightFilterColor === c.color ? 'scale-125 ring-2 ring-[#007AFF]' : 'opacity-60 hover:opacity-100'"
                :style="{ background: c.bg }"
                @click="highlightFilterColor = highlightFilterColor === c.color ? 'all' : c.color"
              />
            </div>

            <!-- 导出为 Markdown -->
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border-0 cursor-pointer transition-all"
              @click="handleExportHighlights"
            >
              <i class="i-lucide-share text-xs text-[#007AFF]" />
              <span>导出标注</span>
            </button>
          </div>
        </div>

        <!-- 标注条目列表 -->
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <template v-if="filteredHighlights.length > 0">
            <div
              v-for="hl in filteredHighlights"
              :key="hl.id"
              class="group p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] shadow-xs flex flex-col gap-2 hover:border-[#007AFF]/40 transition-all cursor-pointer"
              @click="handleJumpToHighlight(hl)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    :style="{ background: HIGHLIGHT_COLORS.find(c => c.color === hl.color)?.bg }"
                  />
                  <span class="text-[10px] text-neutral-400 font-mono">
                    {{ new Date(hl.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>

                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    class="p-1 rounded text-neutral-400 hover:text-[#007AFF] border-0 bg-transparent cursor-pointer"
                    title="定位并闪烁"
                    @click.stop="handleJumpToHighlight(hl)"
                  >
                    <i class="i-lucide-locate text-xs" />
                  </button>
                  <button
                    type="button"
                    class="p-1 rounded text-neutral-400 hover:text-red-500 border-0 bg-transparent cursor-pointer"
                    title="删除此标注"
                    @click.stop="handleDeleteHighlight(hl.id)"
                  >
                    <i class="i-lucide-trash-2 text-xs" />
                  </button>
                </div>
              </div>

              <!-- 高亮原文 -->
              <p class="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed m-0 italic pl-2 border-l-2 border-black/10 dark:border-white/15">
                "{{ hl.text }}"
              </p>

              <!-- 用户批注 -->
              <div v-if="hl.note" class="mt-1 p-2 rounded-lg bg-amber-500/[0.08] border border-amber-500/20 text-xs text-neutral-800 dark:text-neutral-200">
                <div class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-0.5">思考批注</div>
                {{ hl.note }}
              </div>
            </div>
          </template>

          <div v-else class="flex flex-col items-center justify-center py-20 text-center text-neutral-400">
            <i class="i-lucide-highlighter text-3xl text-neutral-300 dark:text-neutral-600 mb-2" />
            <span class="text-xs">暂无标注。在阅读模式中选中任何文本即可创建</span>
          </div>
        </div>
      </div>

      <!-- 3. 双语对照阅读模式 (Translation Dual View) -->
      <TranslationDualView
        v-if="activeTab === 'translation'"
        :original-markdown="props.content"
        :translated-markdown="props.translationMarkdown"
        :translating="props.translating"
        @request-translate="(lang) => emit('request-translate', lang)"
      />

      <!-- 4. 源码编辑器与统计模式 (Raw Mode) -->
      <RawEditorViewer
        v-if="activeTab === 'raw'"
        :content="props.content"
      />

      <!-- 5. 详细元数据面板 (Metadata Mode) -->
      <div v-if="activeTab === 'metadata'" class="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full select-text">
        <div class="rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e] p-5 shadow-xs flex flex-col gap-4">
          <div class="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <i class="i-lucide-file-text text-[#007AFF] text-lg" />
            <h3 class="text-sm font-bold m-0">文档属性与元数据</h3>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">标题</span>
              <strong class="text-neutral-800 dark:text-neutral-100 mt-0.5 block truncate">{{ props.title }}</strong>
            </div>

            <div class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">作者 / 站点</span>
              <strong class="text-neutral-800 dark:text-neutral-100 mt-0.5 block truncate">{{ props.author || '未知作者' }}</strong>
            </div>

            <div class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">统计字数</span>
              <strong class="text-neutral-800 dark:text-neutral-100 mt-0.5 block">{{ words.toLocaleString() }} 字符</strong>
            </div>

            <div class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">预估 Tokens</span>
              <strong class="text-neutral-800 dark:text-neutral-100 mt-0.5 block font-mono">{{ tokens.toLocaleString() }}</strong>
            </div>

            <div class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">预计朗读/阅读耗时</span>
              <strong class="text-neutral-800 dark:text-neutral-100 mt-0.5 block">{{ readTime }} 分钟</strong>
            </div>

            <div class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">当前高亮标注总数</span>
              <strong class="text-[#007AFF] mt-0.5 block">{{ (props.highlights || []).length }} 条</strong>
            </div>

            <div class="col-span-2 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
              <span class="text-neutral-400 text-[11px] block">来源网址 (URL)</span>
              <a
                v-if="props.url"
                :href="props.url"
                target="_blank"
                rel="noopener"
                class="text-[#007AFF] hover:underline mt-0.5 block break-all font-mono text-[11px]"
              >
                {{ props.url }}
              </a>
              <span v-else class="text-neutral-400 mt-0.5 block">本地纯文稿</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 目录大纲抽屉 -->
      <ReaderTocDrawer
        :open="tocOpen"
        :headings="headings"
        :active-id="activeHeadingId"
        @close="tocOpen = false"
        @jump="handleJumpToHeading"
      />
    </div>

    <!-- 浮动划词工具栏 -->
    <HighlightToolbar
      :visible="toolbarState.visible"
      :x="toolbarState.x"
      :y="toolbarState.y"
      @select-color="handleCreateHighlight"
      @ask-ai="handleToolbarAskAi"
      @add-note="handleToolbarAddNote"
      @copy-text="handleToolbarCopy"
    />

    <!-- 点击已有高亮的交互 Popover -->
    <HighlightPopover
      :visible="popoverState.visible"
      :x="popoverState.x"
      :y="popoverState.y"
      :highlight="popoverState.highlight"
      @change-color="handlePopoverChangeColor"
      @save-note="handlePopoverSaveNote"
      @send-to-chat="(text) => emit('ask-ai', text)"
      @delete="handleDeleteHighlight"
      @close="popoverState.visible = false"
    />
  </div>
</template>
