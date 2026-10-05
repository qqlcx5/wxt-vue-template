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
    'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-800 p-6 border border-white/10 shadow-2xl duration-200 focus:outline-none',
    props.class,
  ),
);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
    />
    <DialogContent v-bind="forwarded" :class="contentClasses">
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
