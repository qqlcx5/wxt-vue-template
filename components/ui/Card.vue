<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  title?: string;
  description?: string;
  icon?: string;
  iconBg?: string;
  class?: HTMLAttributes['class'];
  contentClass?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col w-full">
    <!-- 苹果风格：卡片外部小标题 -->
    <div v-if="title || description" class="px-2 pb-1.5 flex items-baseline justify-between">
      <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-tight flex items-center gap-1.5">
        <i v-if="icon" :class="icon" class="text-xs text-apple-blue" />
        {{ title }}
      </span>
      <span v-if="description" class="text-[11px] text-neutral-400">
        {{ description }}
      </span>
    </div>

    <!-- 纯白/深灰苹果圆角卡片 -->
    <div
      :class="cn('rounded-2xl bg-white dark:bg-[#1C1C1E] p-3.5 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] text-neutral-900 dark:text-neutral-100 transition-all duration-200', $props.class)"
    >
      <div v-if="$slots.header" class="mb-3">
        <slot name="header" />
      </div>

      <!-- Content Body -->
      <div :class="contentClass">
        <slot />
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#8e8e93]">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
