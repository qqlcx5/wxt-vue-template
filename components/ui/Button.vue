<script lang="ts" setup>
import { type HTMLAttributes, computed } from 'vue';
import { Primitive, type PrimitiveProps } from 'reka-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30',
        destructive: 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30',
        outline: 'border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white',
        secondary: 'bg-white/10 text-white/90 hover:bg-white/15 border border-white/10',
        ghost: 'text-white/70 hover:bg-white/10 hover:text-white',
        link: 'text-emerald-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface Props extends /* @vue-ignore */ PrimitiveProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: HTMLAttributes['class'];
  as?: string;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  variant: 'default',
  size: 'default',
});

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
);
</script>

<template>
  <Primitive :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
