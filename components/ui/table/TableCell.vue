<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

export interface TableCellProps {
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right' | boolean;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<TableCellProps>(), {
  align: 'left',
  sticky: false,
});

const alignClass = computed(() => {
  if (props.align === 'center') return 'text-center';
  if (props.align === 'right') return 'text-right';
  return 'text-left';
});

const stickyClass = computed(() => {
  if (props.sticky === 'right' || props.sticky === true) {
    return 'sticky right-0 z-10 bg-white dark:bg-[#1c1c1e] group-hover:bg-[#f9fafb] dark:group-hover:bg-[#252528] border-l border-black/[0.05] dark:border-white/[0.06] shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors';
  }
  if (props.sticky === 'left') {
    return 'sticky left-0 z-10 bg-white dark:bg-[#1c1c1e] group-hover:bg-[#f9fafb] dark:group-hover:bg-[#252528] border-r border-black/[0.05] dark:border-white/[0.06] shadow-[6px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors';
  }
  return '';
});
</script>

<template>
  <td :class="cn('py-2 px-3 align-middle', alignClass, stickyClass, $props.class)">
    <slot />
  </td>
</template>
