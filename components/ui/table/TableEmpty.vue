<script lang="ts" setup>
import { type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  colspan?: number;
  class?: HTMLAttributes['class'];
}

withDefaults(defineProps<Props>(), {
  colspan: 1,
});
</script>

<template>
  <tr>
    <td
      :colspan="colspan"
      :class="cn('py-12 px-4 text-center align-middle text-neutral-400 dark:text-neutral-500 text-xs', $props.class)"
    >
      <slot>暂无数据</slot>
    </td>
  </tr>
</template>
