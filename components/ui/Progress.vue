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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
});

const rootClasses = computed(() =>
  cn('relative h-3 w-full overflow-hidden rounded-full bg-white/10', props.class),
);
</script>

<template>
  <ProgressRoot v-bind="props" :class="rootClasses">
    <ProgressIndicator
      class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
      :style="{ transform: `translateX(-${100 - (modelValue ?? 0)}%)` }"
    />
  </ProgressRoot>
</template>
