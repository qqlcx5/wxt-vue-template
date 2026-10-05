<script lang="ts" setup>
import { type HTMLAttributes, computed } from 'vue';
import { Primitive, type PrimitiveProps } from 'reka-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-[13px] font-medium transition-all duration-150 border-0 outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        // Apple 经典实色主要按钮 (Blue Filled) - 纯净无描边
        default: 'bg-[#007AFF] text-white hover:bg-[#0071E3] active:bg-[#0062CC] rounded-full',
        primary: 'bg-[#007AFF] text-white hover:bg-[#0071E3] active:bg-[#0062CC] rounded-full',
        // Apple 灰底彩色文字次要按钮 (Tinted Secondary)
        secondary: 'bg-[#000000]/[0.06] dark:bg-[#FFFFFF]/[0.1] text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#000000]/[0.09] dark:hover:bg-[#FFFFFF]/[0.15] rounded-full',
        // Apple 灰底深色文字轻量按钮
        neutral: 'bg-[#000000]/[0.06] dark:bg-[#FFFFFF]/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#000000]/[0.09] dark:hover:bg-[#FFFFFF]/[0.15] rounded-full',
        // Apple 绿色成功按钮
        success: 'bg-[#34C759] text-white hover:bg-[#28A745] active:bg-[#218838] rounded-full',
        // Apple 红色警示按钮 (浅底红字)
        destructive: 'bg-[#FF3B30]/12 text-[#FF3B30] hover:bg-[#FF3B30]/20 dark:bg-[#FF453A]/20 dark:text-[#FF453A] rounded-full',
        // Apple 极细半透边框线框按钮
        outline: 'border border-[#007AFF]/30 text-[#007AFF] hover:bg-[#007AFF]/6 bg-transparent rounded-full',
        // Apple 幽灵纯文本按钮
        ghost: 'text-[#007AFF] hover:bg-[#007AFF]/8 active:bg-[#007AFF]/12 rounded-full',
        link: 'text-[#007AFF] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-[32px] px-3.5',
        sm: 'h-[26px] px-2.5 text-[12px]',
        lg: 'h-[40px] px-5 text-[15px]',
        icon: 'h-[30px] w-[30px] p-0 rounded-full',
        'icon-sm': 'h-[24px] w-[24px] p-0 rounded-full text-[11px]',
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
  icon?: string;
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
    <i v-if="icon" :class="icon" class="text-sm shrink-0" />
    <slot />
  </Primitive>
</template>
