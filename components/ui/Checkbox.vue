<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  CheckboxIndicator,
  CheckboxRoot,
  type CheckboxRootEmits,
  type CheckboxRootProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ CheckboxRootProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
const emits = defineEmits<CheckboxRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const rootClasses = computed(() =>
  cn(
    'peer h-4.5 w-4.5 shrink-0 rounded-md border border-black/20 dark:border-white/30 bg-white dark:bg-zinc-800 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-apple-blue data-[state=checked]:border-apple-blue data-[state=checked]:text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-95',
    props.class,
  ),
);
</script>

<template>
  <CheckboxRoot v-bind="forwarded" :class="rootClasses">
    <CheckboxIndicator class="flex items-center justify-center text-white">
      <i class="i-lucide-check text-[11px] font-extrabold" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
