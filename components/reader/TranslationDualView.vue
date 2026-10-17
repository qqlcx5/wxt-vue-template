<script lang="ts" setup>
import { computed, ref } from 'vue';
import { splitAstBlocks, renderMarkdown } from '@/utils/markdown/pipeline';
import MarkdownViewer from '@/components/ui/MarkdownViewer.vue';

interface Props {
  originalMarkdown: string;
  translatedMarkdown?: string;
  targetLang?: string;
  translating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  originalMarkdown: '',
  translatedMarkdown: '',
  targetLang: '中文',
  translating: false,
});

const emit = defineEmits<{
  (e: 'request-translate', lang: string): void;
}>();

const layoutMode = ref<'stacked' | 'split'>('stacked');
const selectedLang = ref(props.targetLang || '中文');

const languages = ['中文', 'English', '日本語', '한국어', 'Français', 'Deutsch', 'Español'];

// AST 块级切分（代码块与表格保持原子完整）
const originalBlocks = computed(() => splitAstBlocks(props.originalMarkdown));
const translatedBlocks = computed(() => splitAstBlocks(props.translatedMarkdown));

// 智能段落对齐
const blockPairs = computed(() => {
  const orig = originalBlocks.value;
  const trans = translatedBlocks.value;

  if (trans.length === 0) {
    return orig.map((b) => ({
      original: b.raw,
      translated: '',
      isCode: b.type === 'code',
    }));
  }

  // 完美对齐
  if (orig.length === trans.length) {
    return orig.map((b, idx) => ({
      original: b.raw,
      translated: b.type === 'code' ? b.raw : (trans[idx]?.raw || ''),
      isCode: b.type === 'code',
    }));
  }

  // 若长短不一（例如模型对列表进行了合并总结），尽量保留对应
  const maxLen = Math.max(orig.length, trans.length);
  const pairs: Array<{ original: string; translated: string; isCode: boolean }> = [];
  for (let i = 0; i < maxLen; i++) {
    const o = orig[i]?.raw || '';
    const isCode = orig[i]?.type === 'code';
    const t = isCode ? o : (trans[i]?.raw || '');
    pairs.push({ original: o, translated: t, isCode });
  }
  return pairs;
});

function handleStartTranslate() {
  emit('request-translate', selectedLang.value);
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 bg-neutral-50/60 dark:bg-[#121214]">
    <!-- 控制顶栏 -->
    <div class="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between flex-wrap gap-2 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md">
      <div class="flex items-center gap-2">
        <i class="i-lucide-languages text-[#007AFF] text-sm" />
        <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">段落级双语对照</span>

        <select
          v-model="selectedLang"
          class="text-xs bg-black/[0.04] dark:bg-white/[0.08] border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 outline-none text-neutral-700 dark:text-neutral-200 cursor-pointer"
        >
          <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
        </select>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white bg-[#007AFF] hover:bg-[#007AFF]/90 border-0 cursor-pointer transition-all shadow-xs disabled:opacity-50"
          :disabled="props.translating || !props.originalMarkdown"
          @click="handleStartTranslate"
        >
          <i v-if="props.translating" class="i-lucide-loader-2 text-xs animate-spin" />
          <i v-else class="i-lucide-sparkles text-xs" />
          <span>{{ props.translating ? '正在翻译...' : (props.translatedMarkdown ? '重新翻译' : '翻译全文') }}</span>
        </button>
      </div>

      <!-- 视图布局切换 -->
      <div class="flex items-center p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-xs">
        <button
          type="button"
          class="px-2 py-0.5 rounded-md border-0 cursor-pointer transition-colors"
          :class="layoutMode === 'stacked' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-medium' : 'text-neutral-500 bg-transparent'"
          @click="layoutMode = 'stacked'"
        >
          上下交替
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded-md border-0 cursor-pointer transition-colors"
          :class="layoutMode === 'split' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-medium' : 'text-neutral-500 bg-transparent'"
          @click="layoutMode = 'split'"
        >
          左右并排
        </button>
      </div>
    </div>

    <!-- 主对照滚动列表 -->
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <template v-if="blockPairs.length > 0">
        <div
          v-for="(pair, idx) in blockPairs"
          :key="idx"
          class="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-3 shadow-xs transition-colors"
          :class="layoutMode === 'split' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-2.5'"
        >
          <!-- 原文块 -->
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-center justify-between text-[10px] text-neutral-400 font-mono select-none">
              <span>ORIGINAL #{{ idx + 1 }}</span>
              <button
                type="button"
                class="hover:text-neutral-700 dark:hover:text-neutral-200 border-0 bg-transparent cursor-pointer p-0.5"
                title="复制此段原文"
                @click="copyText(pair.original)"
              >
                <i class="i-lucide-copy text-[10px]" />
              </button>
            </div>
            <MarkdownViewer :content="pair.original" class="text-neutral-900 dark:text-neutral-100" />
          </div>

          <!-- 译文块 -->
          <div
            class="flex flex-col gap-1 min-w-0"
            :class="layoutMode === 'stacked' ? 'pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] pl-2 border-l-2 border-[#007AFF]/40' : ''"
          >
            <div class="flex items-center justify-between text-[10px] text-[#007AFF] font-mono select-none">
              <span>TRANSLATION ({{ selectedLang }})</span>
              <button
                v-if="pair.translated"
                type="button"
                class="hover:text-neutral-700 dark:hover:text-neutral-200 border-0 bg-transparent cursor-pointer p-0.5 text-neutral-400"
                title="复制此段译文"
                @click="copyText(pair.translated)"
              >
                <i class="i-lucide-copy text-[10px]" />
              </button>
            </div>

            <template v-if="pair.translated">
              <MarkdownViewer :content="pair.translated" class="text-neutral-700 dark:text-neutral-300" />
            </template>
            <div v-else-if="props.translating" class="flex items-center gap-1.5 text-xs text-neutral-400 py-2">
              <i class="i-lucide-loader-2 text-xs animate-spin text-[#007AFF]" />
              <span>正在生成对照译文...</span>
            </div>
            <div v-else class="text-xs text-neutral-400 italic py-1">
              暂无译文，点击上方「翻译全文」一键生成
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex flex-col items-center justify-center py-20 text-center text-neutral-400">
        <i class="i-lucide-languages text-3xl text-neutral-300 dark:text-neutral-600 mb-2" />
        <span class="text-xs">暂无文稿内容可供对照翻译</span>
      </div>
    </div>
  </div>
</template>
