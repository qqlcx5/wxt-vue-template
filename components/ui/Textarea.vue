<script lang="ts" setup>
import { computed, type TextareaHTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@/utils/cn';

interface Props {
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: TextareaHTMLAttributes['class'];
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const textareaClasses = computed(() =>
  cn(
    'flex min-h-[68px] w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.025] dark:bg-white/[0.05] px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all focus-visible:bg-white dark:focus-visible:bg-zinc-900 focus-visible:border-apple-blue focus-visible:ring-2 focus-visible:ring-apple-blue/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none font-sans leading-relaxed',
    props.class,
  ),
);
</script>

<template>
  <textarea v-model="modelValue" :placeholder="placeholder" :disabled="disabled" :rows="rows" :class="textareaClasses" />
</template>
