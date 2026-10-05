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
  icon?: string;
  clearable?: boolean;
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

function handleClear() {
  modelValue.value = '';
}
</script>

<template>
  <div
    class="relative flex items-center w-full rounded-xl transition-all duration-200 border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.07] focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-apple-blue focus-within:ring-3 focus-within:ring-apple-blue/20"
    :class="[disabled ? 'opacity-50 pointer-events-none' : '', $props.class]"
  >
    <!-- 前置图标 -->
    <div v-if="icon || $slots.icon" class="pl-3 flex items-center justify-center text-neutral-400 dark:text-neutral-500 pointer-events-none">
      <slot name="icon">
        <i :class="icon" class="text-sm" />
      </slot>
    </div>

    <!-- 真实输入框 -->
    <input
      v-model="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full h-9 bg-transparent px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none"
    />

    <!-- 清空按钮 -->
    <button
      v-if="clearable && modelValue"
      type="button"
      class="pr-2.5 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
      @click="handleClear"
    >
      <i class="i-lucide-x-circle text-sm" />
    </button>
  </div>
</template>
