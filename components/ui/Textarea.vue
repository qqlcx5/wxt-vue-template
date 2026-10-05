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
    'flex min-h-[60px] w-full rounded-lg border border-white/15 bg-zinc-800/60 px-3 py-2 text-sm text-white shadow-xs transition-colors placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
    props.class,
  ),
);
</script>

<template>
  <textarea v-model="modelValue" :placeholder="placeholder" :disabled="disabled" :rows="rows" :class="textareaClasses" />
</template>
