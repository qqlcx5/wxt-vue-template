<script lang="ts" setup>
import { computed, type HTMLAttributes } from 'vue';
import {
  SwitchRoot,
  SwitchThumb,
  type SwitchRootEmits,
  type SwitchRootProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/cn';

interface Props extends /* @vue-ignore */ SwitchRootProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
const emits = defineEmits<SwitchRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const rootClasses = computed(() =>
  cn(
    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/15',
    props.class,
  ),
);
</script>

<template>
  <SwitchRoot v-bind="forwarded" :class="rootClasses">
    <SwitchThumb
      class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
    />
  </SwitchRoot>
</template>
