<script lang="ts" setup>
import {
  AccordionContent,
  AccordionItem,
  type AccordionItemProps,
  AccordionTrigger,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ AccordionItemProps {
  title?: string;
  icon?: string;
  class?: string;
}

defineProps<Props>();
</script>

<template>
  <AccordionItem :value="value" :class="cn('border-b border-black/[0.06] dark:border-white/[0.08] last:border-b-0', $props.class)">
    <AccordionTrigger
      class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-neutral-850 dark:text-neutral-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
    >
      <div class="flex items-center gap-2.5">
        <i v-if="icon" :class="icon" class="text-sm text-apple-blue" />
        <slot name="title">{{ title }}</slot>
      </div>
      <i class="i-lucide-chevron-right w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-90 text-neutral-400" />
    </AccordionTrigger>
    <AccordionContent class="overflow-hidden px-4 pb-3 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed transition-all">
      <slot />
    </AccordionContent>
  </AccordionItem>
</template>
