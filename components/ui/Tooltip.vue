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
        :class="cn('z-50 overflow-hidden rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white border border-white/10 shadow-lg backdrop-blur-sm', $props.class)"
      >
        <slot name="content">{{ content }}</slot>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
