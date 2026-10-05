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
  class?: string;
}

defineProps<Props>();
</script>

<template>
  <AccordionItem :value="value" :class="cn('border-b border-white/10 last:border-b-0', $props.class)">
    <AccordionTrigger
      class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors cursor-pointer group"
    >
      <slot name="title">{{ title }}</slot>
      <i class="i-lucide-chevron-down w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 text-white/40" />
    </AccordionTrigger>
    <AccordionContent class="overflow-hidden px-4 pb-3 text-sm text-white/50 leading-relaxed transition-all">
      <slot />
    </AccordionContent>
  </AccordionItem>
</template>
