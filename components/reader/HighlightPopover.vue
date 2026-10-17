<script lang="ts" setup>
import { ref, watch } from 'vue';
import { HIGHLIGHT_COLORS, type HighlightColor, type HighlightAnchor } from '@/utils/markdown/highlighter';

interface Props {
  visible: boolean;
  x: number;
  y: number;
  highlight: HighlightAnchor | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'change-color', color: HighlightColor): void;
  (e: 'save-note', note: string): void;
  (e: 'send-to-chat', text: string): void;
  (e: 'delete', id: string): void;
  (e: 'close'): void;
}>();

const editingNote = ref(false);
const noteDraft = ref('');

watch(
  () => props.highlight,
  (hl) => {
    noteDraft.value = hl?.note || '';
    editingNote.value = false;
  },
  { immediate: true }
);

function handleSaveNote() {
  emit('save-note', noteDraft.value.trim());
  editingNote.value = false;
}
</script>

<template>
  <div
    v-if="props.visible && props.highlight"
    class="fixed z-50 w-64 rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.2)] p-2.5 flex flex-col gap-2 select-none animate-in fade-in zoom-in-95 duration-150"
    :style="{ left: `${props.x}px`, top: `${props.y}px`, transform: 'translate(-50%, 0)' }"
    @click.stop
    @mousedown.stop
  >
    <!-- 顶栏：调色盘与关闭 -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-1.5">
        <button
          v-for="c in HIGHLIGHT_COLORS"
          :key="c.color"
          type="button"
          class="w-4.5 h-4.5 rounded-full border transition-all hover:scale-115 cursor-pointer p-0"
          :class="props.highlight.color === c.color ? 'ring-2 ring-[#007AFF] border-white scale-110' : 'border-black/10 dark:border-white/20'"
          :style="{ background: c.bg }"
          :title="c.label"
          @click="emit('change-color', c.color)"
        />
      </div>

      <button
        type="button"
        class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border-0 bg-transparent cursor-pointer p-0.5"
        @click="emit('close')"
      >
        <i class="i-lucide-x text-xs" />
      </button>
    </div>

    <!-- 引用选段预览 -->
    <div class="text-[11px] text-neutral-500 dark:text-neutral-400 bg-black/[0.03] dark:bg-white/[0.04] p-1.5 rounded-lg line-clamp-2 italic leading-relaxed border border-black/[0.03] dark:border-white/[0.05]">
      "{{ props.highlight.text }}"
    </div>

    <!-- 批注编辑区 -->
    <div v-if="editingNote || !props.highlight.note" class="flex flex-col gap-1.5">
      <textarea
        v-model="noteDraft"
        placeholder="写下关于此段落的思考或批注..."
        rows="2"
        class="w-full text-xs p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 focus:border-[#007AFF] outline-none resize-none leading-relaxed text-neutral-800 dark:text-neutral-200"
        @keydown.enter.exact.prevent="handleSaveNote"
      />
      <div class="flex items-center justify-end gap-1.5">
        <button
          v-if="props.highlight.note"
          type="button"
          class="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border-0 bg-transparent cursor-pointer"
          @click="editingNote = false; noteDraft = props.highlight.note || ''"
        >
          取消
        </button>
        <button
          type="button"
          class="px-2.5 py-0.5 text-[11px] rounded-md font-medium text-white bg-[#007AFF] hover:bg-[#007AFF]/90 border-0 cursor-pointer shadow-sm"
          @click="handleSaveNote"
        >
          保存批注
        </button>
      </div>
    </div>

    <!-- 批注展示区 -->
    <div v-else class="flex flex-col gap-1 bg-amber-500/[0.08] p-2 rounded-lg border border-amber-500/20">
      <div class="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-medium">
        <span>批注内容</span>
        <button
          type="button"
          class="text-neutral-400 hover:text-[#007AFF] border-0 bg-transparent cursor-pointer text-[10px]"
          @click="editingNote = true"
        >
          编辑
        </button>
      </div>
      <p class="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed m-0 whitespace-pre-wrap select-text">
        {{ props.highlight.note }}
      </p>
    </div>

    <div class="h-px bg-black/[0.06] dark:bg-white/[0.08] my-0.5" />

    <!-- 快捷操作栏 -->
    <div class="flex items-center justify-between text-[11px]">
      <button
        type="button"
        class="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 hover:text-[#007AFF] transition-colors border-0 bg-transparent cursor-pointer p-0.5"
        @click="emit('send-to-chat', props.highlight.text)"
      >
        <i class="i-lucide-message-square text-xs text-[#007AFF]" />
        <span>发送至 AI</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors border-0 bg-transparent cursor-pointer p-0.5"
        @click="emit('delete', props.highlight.id)"
      >
        <i class="i-lucide-trash-2 text-xs" />
        <span>删除高亮</span>
      </button>
    </div>
  </div>
</template>
