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
    'inline-flex p-[2px] rounded-[8px] bg-[#767680]/12 dark:bg-[#767680]/24 border-0 select-none w-full h-[32px] items-center',
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
        class="flex-1 h-[28px] px-2 rounded-[6px] text-[12px] font-medium transition-all duration-150 border-0 outline-none select-none flex items-center justify-center gap-1.5 cursor-pointer data-[state=on]:bg-white dark:data-[state=on]:bg-[#636366] data-[state=on]:text-[#000000] dark:data-[state=on]:text-[#FFFFFF] data-[state=on]:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_0.5px_1px_rgba(0,0,0,0.06)] data-[state=on]:font-semibold data-[state=off]:text-[#000000]/65 dark:data-[state=off]:text-white/60 hover:data-[state=off]:text-[#000000] dark:hover:data-[state=off]:text-white"
      >
        <i v-if="opt.icon" :class="opt.icon" class="text-xs" />
        <span>{{ opt.label }}</span>
      </ToggleGroupItem>
    </slot>
  </ToggleGroupRoot>
</template>
