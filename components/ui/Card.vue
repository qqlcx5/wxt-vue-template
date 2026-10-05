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
      <span class="text-[13px] font-medium text-[#6c6c70] dark:text-[#98989d] tracking-tight">
        {{ title }}
      </span>
      <span v-if="description" class="text-[11px] text-[#8e8e93]">
        {{ description }}
      </span>
    </div>

    <!-- 纯白/深灰苹果圆角卡片 -->
    <div
      :class="cn('rounded-[12px] bg-white dark:bg-[#1C1C1E] p-3.5 border border-black/[0.04] dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-[#1d1d1f] dark:text-[#f5f5f7] transition-all duration-200', $props.class)"
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
