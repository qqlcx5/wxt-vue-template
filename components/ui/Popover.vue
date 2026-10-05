<script lang="ts" setup>
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  type PopoverContentProps,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ PopoverContentProps {
  sideOffset?: number;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  sideOffset: 6,
  side: 'bottom',
  align: 'center',
});
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side"
        :side-offset="sideOffset"
        :align="align"
        :class="cn('z-50 w-72 rounded-2xl bg-white/95 dark:bg-zinc-850/95 p-4 text-neutral-900 dark:text-neutral-100 border border-black/10 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl focus:outline-none animate-in fade-in zoom-in-95', $props.class)"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
