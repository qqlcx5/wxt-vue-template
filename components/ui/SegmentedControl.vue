<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  ToggleGroupItem,
  ToggleGroupRoot,
  type ToggleGroupRootEmits,
  type ToggleGroupRootProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: string;
}

interface Props extends /* @vue-ignore */ ToggleGroupRootProps {
  options?: SegmentOption[];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  type: 'single',
});

const emits = defineEmits<ToggleGroupRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const rootClasses = computed(() =>
  cn(
    'inline-flex p-[3px] rounded-[10px] bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.03] dark:border-white/[0.04] select-none w-full h-[34px] items-center',
    props.class,
  ),
);
</script>

<template>
  <ToggleGroupRoot v-bind="forwarded" :class="rootClasses">
    <slot>
      <ToggleGroupItem
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        class="flex-1 h-[28px] px-2 rounded-[7px] text-[12px] font-medium transition-all duration-200 border-0 outline-none select-none flex items-center justify-center gap-1.5 cursor-pointer data-[state=on]:bg-white dark:data-[state=on]:bg-zinc-700/90 data-[state=on]:text-neutral-900 dark:data-[state=on]:text-white data-[state=on]:shadow-[0_1px_4px_rgba(0,0,0,0.08),0_0.5px_1px_rgba(0,0,0,0.04)] dark:data-[state=on]:shadow-[0_1px_3px_rgba(0,0,0,0.3)] data-[state=on]:font-semibold data-[state=off]:text-neutral-500 dark:data-[state=off]:text-neutral-400 hover:data-[state=off]:text-neutral-800 dark:hover:data-[state=off]:text-neutral-200 active:scale-[0.98]"
      >
        <i v-if="opt.icon" :class="opt.icon" class="text-xs" />
        <span>{{ opt.label }}</span>
      </ToggleGroupItem>
    </slot>
  </ToggleGroupRoot>
</template>
