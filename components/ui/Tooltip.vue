<script lang="ts" setup>
import {
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props {
  content?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  side: 'top',
  sideOffset: 6,
});
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        :side="side"
        :side-offset="sideOffset"
        :class="cn('z-50 overflow-hidden rounded-lg bg-neutral-900/90 dark:bg-zinc-800/90 px-2.5 py-1 text-xs font-medium text-white shadow-md backdrop-blur-md border border-white/10 select-none animate-in fade-in zoom-in-95', $props.class)"
      >
        <slot name="content">{{ content }}</slot>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
