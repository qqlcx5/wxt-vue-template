<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  SliderRange,
  SliderRoot,
  type SliderRootEmits,
  type SliderRootProps,
  SliderTrack,
  SliderThumb,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ SliderRootProps {
  class?: HTMLAttributes['class'];
  accent?: 'blue' | 'green' | 'orange' | 'purple';
}

const props = withDefaults(defineProps<Props>(), {
  accent: 'blue',
});
const emits = defineEmits<SliderRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const rootClasses = computed(() =>
  cn('relative flex w-full touch-none select-none items-center h-6', props.class),
);

const rangeColors = {
  blue: 'bg-apple-blue',
  green: 'bg-apple-green',
  orange: 'bg-apple-orange',
  purple: 'bg-apple-purple',
};
</script>

<template>
  <SliderRoot v-bind="forwarded" :class="rootClasses">
    <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.15]">
      <SliderRange class="absolute h-full rounded-full transition-all" :class="rangeColors[accent]" />
    </SliderTrack>
    <SliderThumb
      class="block h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-black/[0.04] ring-0 transition-transform duration-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 cursor-grab active:cursor-grabbing active:scale-95"
    />
  </SliderRoot>
</template>
