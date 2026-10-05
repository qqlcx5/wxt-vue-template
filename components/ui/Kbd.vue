<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <kbd
    :class="cn('inline-flex h-5 items-center justify-center gap-0.5 rounded-[4px] border border-black/15 dark:border-white/20 bg-black/[0.05] dark:bg-white/[0.08] px-1.5 font-mono text-[11px] font-medium text-neutral-600 dark:text-neutral-300 shadow-[0_1px_0_rgba(0,0,0,0.1)] select-none leading-none', $props.class)"
  >
    <slot />
  </kbd>
</template>
