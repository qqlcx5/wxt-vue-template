<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  type SelectRootEmits,
  type SelectRootProps,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SelectContent,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface Props extends /* @vue-ignore */ SelectRootProps {
  options?: SelectOption[];
  placeholder?: string;
  class?: HTMLAttributes['class'];
  triggerClass?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
const emits = defineEmits<SelectRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const triggerClasses = computed(() =>
  cn(
    'flex h-8.5 w-full items-center justify-between rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.04] dark:bg-white/[0.08] px-3 text-xs text-neutral-850 dark:text-neutral-100 hover:bg-black/[0.07] dark:hover:bg-white/[0.12] transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue/40 cursor-pointer select-none',
    props.triggerClass,
  ),
);
</script>

<template>
  <SelectRoot v-bind="forwarded">
    <SelectTrigger :class="triggerClasses">
      <SelectValue :placeholder="placeholder || '请选择...'" />
      <i class="i-lucide-chevrons-up-down text-[11px] text-neutral-400 shrink-0 ml-2" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-850/95 p-1 text-neutral-900 dark:text-neutral-100 shadow-[0_10px_25px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-in fade-in zoom-in-95"
      >
        <SelectViewport class="p-0.5">
          <slot>
            <SelectItem
              v-for="opt in options"
              :key="opt.value"
              :value="opt.value"
              :disabled="opt.disabled"
              class="relative flex select-none items-center justify-between rounded-[6px] px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none transition-colors data-[highlighted]:bg-apple-blue data-[highlighted]:text-white cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <i v-if="opt.icon" :class="opt.icon" class="text-xs" />
                <SelectItemText>{{ opt.label }}</SelectItemText>
              </div>

              <SelectItemIndicator class="flex items-center justify-center pl-2">
                <i class="i-lucide-check text-xs" />
              </SelectItemIndicator>
            </SelectItem>
          </slot>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
