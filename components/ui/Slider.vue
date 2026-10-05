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
}

const props = defineProps<Props>();
const emits = defineEmits<SliderRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const rootClasses = computed(() =>
  cn('relative flex w-full touch-none select-none items-center h-5', props.class),
);
</script>

<template>
  <SliderRoot v-bind="forwarded" :class="rootClasses">
    <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderRange class="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
    </SliderTrack>
    <SliderThumb
      class="block h-4 w-4 rounded-full bg-white shadow-md transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-grab active:cursor-grabbing"
    />
  </SliderRoot>
</template>
