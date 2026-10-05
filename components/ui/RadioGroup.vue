<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  RadioGroupIndicator,
  RadioGroupItem,
  RadioGroupRoot,
  type RadioGroupRootEmits,
  type RadioGroupRootProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface Props extends /* @vue-ignore */ RadioGroupRootProps {
  options?: RadioOption[];
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
const emits = defineEmits<RadioGroupRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const rootClasses = computed(() =>
  cn('grid gap-2 select-none', props.class),
);
</script>

<template>
  <RadioGroupRoot v-bind="forwarded" :class="rootClasses">
    <slot>
      <label
        v-for="opt in options"
        :key="opt.value"
        class="flex items-start gap-2.5 cursor-pointer text-xs font-normal"
        :class="{ 'opacity-50 pointer-events-none': opt.disabled }"
      >
        <RadioGroupItem
          :value="opt.value"
          :disabled="opt.disabled"
          class="peer h-4 w-4 shrink-0 rounded-full border border-black/25 dark:border-white/30 bg-white dark:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 data-[state=checked]:border-apple-blue data-[state=checked]:bg-apple-blue flex items-center justify-center cursor-pointer mt-0.5"
        >
          <RadioGroupIndicator class="flex items-center justify-center">
            <span class="h-1.5 w-1.5 rounded-full bg-white" />
          </RadioGroupIndicator>
        </RadioGroupItem>

        <div class="flex flex-col">
          <span class="text-[13px] font-normal text-neutral-850 dark:text-neutral-100 leading-tight">
            {{ opt.label }}
          </span>
          <span v-if="opt.description" class="text-[11px] text-neutral-500 leading-tight mt-0.5">
            {{ opt.description }}
          </span>
        </div>
      </label>
    </slot>
  </RadioGroupRoot>
</template>
