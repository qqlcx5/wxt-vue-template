<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        secondary: 'border border-transparent bg-white/10 text-white/80',
        destructive: 'border border-transparent bg-red-500/20 text-red-400 border-red-500/30',
        outline: 'border border-white/20 text-white/80',
        cyan: 'border border-transparent bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        violet: 'border border-transparent bg-violet-500/20 text-violet-400 border-violet-500/30',
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
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
