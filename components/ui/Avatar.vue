<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props {
  src?: string;
  alt?: string;
  fallback?: string;
  icon?: string;
  size?: 'sm' | 'default' | 'lg';
  shape?: 'circle' | 'squircle';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  shape: 'circle',
});

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  default: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

const shapeClasses = {
  circle: 'rounded-full',
  squircle: 'rounded-[10px]',
};

const rootClasses = computed(() =>
  cn(
    'relative flex shrink-0 overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.04] dark:bg-white/[0.08] select-none',
    sizeClasses[props.size],
    shapeClasses[props.shape],
    props.class,
  ),
);
</script>

<template>
  <AvatarRoot :class="rootClasses">
    <AvatarImage
      v-if="src"
      :src="src"
      :alt="alt || 'Avatar'"
      class="h-full w-full object-cover"
    />
    <AvatarFallback
      class="flex h-full w-full items-center justify-center font-medium text-neutral-600 dark:text-neutral-300"
    >
      <i v-if="icon" :class="icon" class="text-sm" />
      <span v-else>{{ fallback || alt?.charAt(0) || '?' }}</span>
    </AvatarFallback>
  </AvatarRoot>
</template>
