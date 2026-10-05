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
        :class="cn('z-50 w-72 rounded-xl bg-zinc-800 p-4 text-white border border-white/10 shadow-xl backdrop-blur-md focus:outline-none animate-in fade-in zoom-in-95', $props.class)"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
