<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20',
        primary: 'bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20',
        success: 'bg-apple-green/10 text-emerald-600 dark:text-apple-green dark:bg-apple-green/20',
        destructive: 'bg-apple-red/10 text-red-600 dark:text-apple-red dark:bg-apple-red/20',
        warning: 'bg-apple-orange/10 text-amber-600 dark:text-apple-orange dark:bg-apple-orange/20',
        purple: 'bg-apple-purple/10 text-purple-600 dark:text-purple-400 dark:bg-apple-purple/20',
        secondary: 'bg-black/[0.05] text-neutral-600 dark:bg-white/[0.1] dark:text-neutral-300',
        outline: 'border border-black/10 dark:border-white/15 text-neutral-700 dark:text-neutral-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

interface Props {
  variant?: BadgeVariants['variant'];
  class?: HTMLAttributes['class'];
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class));
</script>

<template>
  <div :class="classes">
    <i v-if="icon" :class="icon" class="text-[11px]" />
    <slot />
  </div>
</template>
