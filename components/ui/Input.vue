<script lang="ts" setup>
import { computed, type InputHTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@/utils/cn';

interface Props {
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: InputHTMLAttributes['class'];
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const inputClasses = computed(() =>
  cn(
    'flex h-9 w-full rounded-lg border border-white/15 bg-zinc-800/60 px-3 py-1 text-sm text-white shadow-xs transition-colors placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
);
</script>

<template>
  <input v-model="modelValue" :type="type" :placeholder="placeholder" :disabled="disabled" :class="inputClasses" />
</template>
