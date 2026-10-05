<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
  <div
    :class="cn('animate-pulse rounded-[8px] bg-black/[0.06] dark:bg-white/[0.08]', $props.class)"
  />
</template>
