<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

export interface TableHeadProps {
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | false;
  sticky?: 'left' | 'right' | boolean;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<TableHeadProps>(), {
  align: 'left',
  sortable: false,
  sortDirection: false,
  sticky: false,
});

const alignClass = computed(() => {
  if (props.align === 'center') return 'text-center';
  if (props.align === 'right') return 'text-right';
  return 'text-left';
});

const stickyClass = computed(() => {
  if (props.sticky === 'right' || props.sticky === true) {
    return 'sticky right-0 z-20 bg-[#fbfbfb] dark:bg-[#202023] border-l border-black/[0.06] dark:border-white/[0.08] shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]';
  }
  if (props.sticky === 'left') {
    return 'sticky left-0 z-20 bg-[#fbfbfb] dark:bg-[#202023] border-r border-black/[0.06] dark:border-white/[0.08] shadow-[6px_0_12px_-4px_rgba(0,0,0,0.06)]';
  }
  return '';
});

const flexJustifyClass = computed(() => {
  if (props.align === 'center') return 'justify-center';
  if (props.align === 'right') return 'justify-end';
  return 'justify-start';
});
</script>

<template>
  <th
    :class="
      cn(
        'py-2.5 px-3 font-semibold text-neutral-500 dark:text-neutral-400 group/th',
        alignClass,
        sortable && 'cursor-pointer select-none hover:text-[#007AFF] transition-colors',
        stickyClass,
        $props.class
      )
    "
  >
    <div
      v-if="sortable"
      :class="cn('inline-flex items-center gap-1', flexJustifyClass)"
    >
      <slot />
      <i
        v-if="sortDirection === 'desc'"
        class="i-lucide-arrow-down text-xs text-[#007AFF] shrink-0"
      />
      <i
        v-else-if="sortDirection === 'asc'"
        class="i-lucide-arrow-up text-xs text-[#007AFF] shrink-0"
      />
      <i
        v-else
        class="i-lucide-arrow-up-down text-[10px] opacity-30 group-hover/th:opacity-75 transition-opacity shrink-0"
      />
    </div>
    <slot v-else />
  </th>
</template>
