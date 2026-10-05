<script lang="ts" setup>
import { cn } from '@/utils/cn';

interface Props {
  show?: boolean;
  message?: string;
  icon?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  icon: 'i-lucide-check-circle-2',
  type: 'success',
});

const iconColors = {
  success: 'text-apple-green',
  info: 'text-apple-blue',
  warning: 'text-apple-orange',
  error: 'text-apple-red',
};
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 -translate-y-2 scale-95"
  >
    <div
      v-if="show"
      :class="cn('fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 shadow-[0_8px_20px_rgba(0,0,0,0.2)] backdrop-blur-xl text-xs font-medium select-none pointer-events-none whitespace-nowrap', $props.class)"
    >
      <i :class="[icon, iconColors[type]]" class="text-sm shrink-0" />
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>
