<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <tfoot
    :class="
      cn(
        'border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] font-medium text-neutral-600 dark:text-neutral-300',
        $props.class
      )
    "
  >
    <slot />
  </tfoot>
</template>
