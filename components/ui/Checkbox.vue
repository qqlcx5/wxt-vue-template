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
    'peer h-4 w-4 shrink-0 rounded border border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white flex items-center justify-center cursor-pointer',
    props.class,
  ),
);
</script>

<template>
  <CheckboxRoot v-bind="forwarded" :class="rootClasses">
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <i class="i-lucide-check text-xs font-bold" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
