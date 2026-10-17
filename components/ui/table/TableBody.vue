<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <tbody :class="cn('divide-y divide-black/[0.04] dark:divide-white/[0.04]', $props.class)">
    <slot />
  </tbody>
</template>
