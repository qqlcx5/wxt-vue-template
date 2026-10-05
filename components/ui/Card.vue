<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  title?: string;
  description?: string;
  class?: HTMLAttributes['class'];
  contentClass?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <div :class="cn('rounded-xl border border-white/10 bg-zinc-800/80 p-5 text-white shadow-lg backdrop-blur-md transition-colors', $props.class)">
    <!-- Header -->
    <div v-if="$slots.header || title || description" class="mb-4 flex flex-col gap-1.5">
      <slot name="header">
        <h3 v-if="title" class="text-base font-semibold leading-none tracking-tight text-white/95">
          {{ title }}
        </h3>
        <p v-if="description" class="text-xs text-white/50 leading-relaxed">
          {{ description }}
        </p>
      </slot>
    </div>

    <!-- Content Body -->
    <div :class="contentClass">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
      <slot name="footer" />
    </div>
  </div>
</template>
