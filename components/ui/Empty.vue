<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  title?: string;
  description?: string;
  icon?: string;
  class?: HTMLAttributes['class'];
}

withDefaults(defineProps<Props>(), {
  icon: 'i-lucide-inbox',
});
</script>

<template>
  <div :class="cn('flex flex-col items-center justify-center p-6 text-center select-none', $props.class)">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-500 mb-2.5">
      <i :class="icon" class="text-2xl" />
    </div>
    <h4 v-if="title" class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
      {{ title }}
    </h4>
    <p v-if="description" class="mt-1 text-xs text-neutral-400 dark:text-neutral-500 max-w-[240px] leading-relaxed">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-3.5">
      <slot />
    </div>
  </div>
</template>
