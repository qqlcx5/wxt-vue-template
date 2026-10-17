<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <thead
    :class="
      cn(
        'border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-500 dark:text-neutral-400 font-semibold',
        $props.class
      )
    "
  >
    <slot />
  </thead>
</template>
