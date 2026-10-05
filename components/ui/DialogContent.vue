<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ DialogContentProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
const emits = defineEmits<DialogContentEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const contentClasses = computed(() =>
  cn(
    'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/95 dark:bg-zinc-850/95 p-6 border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl text-neutral-900 dark:text-neutral-100 duration-200 focus:outline-none animate-in fade-in zoom-in-95',
    props.class,
  ),
);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
    />
    <DialogContent v-bind="forwarded" :class="contentClasses">
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
