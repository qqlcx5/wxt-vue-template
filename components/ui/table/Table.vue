<script lang="ts" setup>
import { ref, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  class?: HTMLAttributes['class'];
  wrapperClass?: HTMLAttributes['class'];
  draggable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  draggable: false,
});

const containerRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
let startX = 0;
let startScrollLeft = 0;

function handleMouseDown(e: MouseEvent) {
  if (!props.draggable) return;
  const target = e.target as HTMLElement;
  if (target.closest('button, a, input, select, textarea, [role="button"], [role="menuitem"], label')) {
    return;
  }
  isDragging.value = true;
  startX = e.pageX - (containerRef.value?.offsetLeft || 0);
  startScrollLeft = containerRef.value?.scrollLeft || 0;
}

function handleMouseMove(e: MouseEvent) {
  if (!props.draggable || !isDragging.value || !containerRef.value) return;
  e.preventDefault();
  const x = e.pageX - (containerRef.value.offsetLeft || 0);
  const walk = (x - startX) * 1.2;
  containerRef.value.scrollLeft = startScrollLeft - walk;
}

function handleMouseUp() {
  if (!props.draggable) return;
  isDragging.value = false;
}

defineExpose({
  containerRef,
});
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative w-full overflow-auto',
        draggable && (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none'),
        wrapperClass
      )
    "
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <table :class="cn('w-full text-left text-xs border-collapse', $props.class)">
      <slot />
    </table>
  </div>
</template>
