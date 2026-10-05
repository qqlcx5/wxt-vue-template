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
    'peer inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 border-0 outline-none select-none disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-[#34C759] data-[state=unchecked]:bg-[#E9E9EA] dark:data-[state=unchecked]:bg-[#39393D]',
    props.class,
  ),
);
</script>

<template>
  <SwitchRoot v-bind="forwarded" :class="rootClasses">
    <SwitchThumb
      class="pointer-events-none block h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_1px_rgba(0,0,0,0.1)] ring-0 transition-transform duration-200 data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0"
    />
  </SwitchRoot>
</template>
