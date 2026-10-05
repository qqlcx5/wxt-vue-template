<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootProps,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ ProgressRootProps {
  class?: HTMLAttributes['class'];
  accent?: 'blue' | 'green' | 'orange';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  accent: 'blue',
});

const rootClasses = computed(() =>
  cn('relative h-2 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.12]', props.class),
);

const colors = {
  blue: 'bg-apple-blue',
  green: 'bg-apple-green',
  orange: 'bg-apple-orange',
};
</script>

<template>
  <ProgressRoot v-bind="props" :class="rootClasses">
    <ProgressIndicator
      class="h-full rounded-full transition-all duration-300 ease-out"
      :class="colors[accent]"
      :style="{ transform: `translateX(-${100 - (modelValue ?? 0)}%)` }"
    />
  </ProgressRoot>
</template>
