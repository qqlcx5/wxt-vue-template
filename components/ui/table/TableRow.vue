<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  selected?: boolean;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});
</script>

<template>
  <tr
    :data-selected="props.selected ? 'true' : undefined"
    :class="
      cn(
        'group transition-colors',
        'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
        props.selected && 'bg-[#007AFF]/[0.04] dark:bg-[#007AFF]/[0.08]',
        $props.class
      )
    "
  >
    <slot />
  </tr>
</template>
