<template>
  <div
    ref="capsuleRef"
    class="floating-dock-capsule"
    :style="containerStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click.capture="onClickCapture"
  >
    <!-- Toast 提示气泡 -->
    <transition name="dock-toast-fade">
      <div
        v-if="toastVisible"
        class="floating-dock-toast"
        :style="toastStyle"
      >
        {{ toastText }}
      </div>
    </transition>

    <!-- 点阵拖拽抓手 -->
    <div class="floating-dock-grip" title="按住可拖动，贴边自动收折">
      <svg width="7" height="14" viewBox="0 0 7 14" fill="none">
        <circle cx="2" cy="2" r="1.3" fill="#8e8e93" />
        <circle cx="5" cy="2" r="1.3" fill="#8e8e93" />
        <circle cx="2" cy="7" r="1.3" fill="#8e8e93" />
        <circle cx="5" cy="7" r="1.3" fill="#8e8e93" />
        <circle cx="2" cy="12" r="1.3" fill="#8e8e93" />
        <circle cx="5" cy="12" r="1.3" fill="#8e8e93" />
      </svg>
    </div>

    <!-- 按钮插槽 -->
    <slot :show-toast="showToast" :set-busy="setBusy" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    storageKey?: string;
    edgeThreshold?: number;
    collapseDelay?: number;
    defaultDocked?: boolean;
    defaultDockSide?: 'left' | 'right';
    defaultTopPercent?: number;
  }>(),
  {
    storageKey: 'vue_floating_dock_config',
    edgeThreshold: 32,
    collapseDelay: 700,
    defaultDocked: true,
    defaultDockSide: 'right',
    defaultTopPercent: 0.82,
  }
);

const emit = defineEmits<{
  (e: 'dock-change', isDocked: boolean, dockSide: 'left' | 'right'): void;
}>();

const capsuleRef = ref<HTMLDivElement | null>(null);

// 状态
const isDocked = ref(props.defaultDocked);
const dockSide = ref<'left' | 'right'>(props.defaultDockSide);
const posX = ref(0);
const posY = ref(0);
const topPercent = ref(props.defaultTopPercent);
const isHovered = ref(false);
const isBusy = ref(false);
const isCollapsed = ref(false);

const toastVisible = ref(false);
const toastText = ref('');
let toastTimer: any = null;
let collapseTimer: any = null;

// 手势状态
let isPointerDown = false;
let isDragging = false;
let hasDragged = false;
let startX = 0;
let startY = 0;
let initialX = 0;
let initialY = 0;

const expand = () => {
  clearTimeout(collapseTimer);
  isCollapsed.value = false;
};

const collapse = () => {
  if (!isDocked.value || isHovered.value || isDragging || isBusy.value) return;
  isCollapsed.value = true;
};

const scheduleCollapse = (delay = props.collapseDelay) => {
  clearTimeout(collapseTimer);
  if (!isDocked.value || isHovered.value || isDragging || isBusy.value) return;
  collapseTimer = setTimeout(() => {
    collapse();
  }, delay);
};

const setBusy = (val: boolean) => {
  isBusy.value = val;
  if (isBusy.value) {
    expand();
  } else if (isDocked.value && !isHovered.value) {
    scheduleCollapse(800);
  }
};

const showToast = (msg: string, duration = 2500) => {
  clearTimeout(toastTimer);
  toastText.value = msg;
  toastVisible.value = true;
  expand();
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
    if (!isBusy.value && isDocked.value && !isHovered.value) {
      scheduleCollapse(600);
    }
  }, duration);
};

const onMouseEnter = () => {
  isHovered.value = true;
  if (isDocked.value) expand();
};

const onMouseLeave = () => {
  isHovered.value = false;
  if (isDocked.value) scheduleCollapse();
};

const onPointerDown = (e: PointerEvent) => {
  if (e.button !== 0 || !capsuleRef.value) return;
  isPointerDown = true;
  hasDragged = false;
  isDragging = false;
  startX = e.clientX;
  startY = e.clientY;
  const rect = capsuleRef.value.getBoundingClientRect();
  initialX = rect.left;
  initialY = rect.top;
};

const onPointerMove = (e: PointerEvent) => {
  if (!isPointerDown || !capsuleRef.value) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  if (!isDragging && Math.hypot(dx, dy) > 5) {
    isDragging = true;
    hasDragged = true;
    expand();
    try {
      capsuleRef.value.setPointerCapture(e.pointerId);
    } catch {}
  }

  if (isDragging) {
    const rect = capsuleRef.value.getBoundingClientRect();
    posX.value = Math.max(0, Math.min(window.innerWidth - rect.width, initialX + dx));
    posY.value = Math.max(10, Math.min(window.innerHeight - rect.height - 10, initialY + dy));
  }
};

const onPointerUp = (e: PointerEvent) => {
  if (!isPointerDown || !capsuleRef.value) return;
  isPointerDown = false;

  if (isDragging) {
    isDragging = false;
    try {
      capsuleRef.value.releasePointerCapture(e.pointerId);
    } catch {}

    const rect = capsuleRef.value.getBoundingClientRect();
    const distLeft = rect.left;
    const distRight = window.innerWidth - rect.right;

    if (distLeft <= props.edgeThreshold) {
      isDocked.value = true;
      dockSide.value = 'left';
      posX.value = 0;
    } else if (distRight <= props.edgeThreshold) {
      isDocked.value = true;
      dockSide.value = 'right';
      posX.value = window.innerWidth - rect.width;
    } else {
      isDocked.value = false;
    }

    topPercent.value = Math.max(0.02, Math.min(0.96, posY.value / Math.max(1, window.innerHeight - rect.height)));

    saveConfig();
    emit('dock-change', isDocked.value, dockSide.value);

    if (isDocked.value) {
      scheduleCollapse(900);
    }

    setTimeout(() => {
      hasDragged = false;
    }, 120);
  }
};

const onClickCapture = (e: MouseEvent) => {
  if (hasDragged) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
};

const containerStyle = computed(() => {
  let transform = 'none';
  let opacity = '1';

  if (isDocked.value && isCollapsed.value) {
    transform = dockSide.value === 'right' ? 'translateX(calc(100% - 24px))' : 'translateX(calc(-100% + 24px))';
    opacity = '0.75';
  }

  return {
    left: `${posX.value}px`,
    top: `${posY.value}px`,
    transform,
    opacity,
  };
});

const toastStyle = computed(() => {
  return {
    left: dockSide.value === 'left' ? '0' : 'auto',
    right: dockSide.value === 'right' ? '0' : 'auto',
    bottom: posY.value < 60 ? 'auto' : 'calc(100% + 8px)',
    top: posY.value < 60 ? 'calc(100% + 8px)' : 'auto',
  };
});

const saveConfig = () => {
  const cfg = {
    isDocked: isDocked.value,
    dockSide: dockSide.value,
    x: posX.value,
    y: posY.value,
    topPercent: topPercent.value,
  };
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(cfg));
  } catch {}
};

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(props.storageKey);
    if (raw) {
      const cfg = JSON.parse(raw);
      isDocked.value = !!cfg.isDocked;
      dockSide.value = cfg.dockSide || 'right';
      topPercent.value = cfg.topPercent ?? 0.82;
      posX.value = cfg.x ?? 0;
      posY.value = cfg.y ?? (window.innerHeight * 0.8);
      return;
    }
  } catch {}

  // 默认位置
  posX.value = window.innerWidth - 120;
  posY.value = window.innerHeight * topPercent.value;
};

let resizeTimer: any = null;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (isDocked.value && capsuleRef.value) {
      const rect = capsuleRef.value.getBoundingClientRect();
      posX.value = dockSide.value === 'left' ? 0 : window.innerWidth - rect.width;
      posY.value = topPercent.value * (window.innerHeight - rect.height);
    }
  }, 120);
};

onMounted(() => {
  loadConfig();
  window.addEventListener('resize', onResize);
  if (isDocked.value) {
    scheduleCollapse(1200);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  clearTimeout(collapseTimer);
  clearTimeout(toastTimer);
});

defineExpose({
  showToast,
  setBusy,
  expand,
  collapse,
});
</script>

<style scoped>
.floating-dock-capsule {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 9999px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
  user-select: none;
  cursor: grab;
  touch-action: none;
  transition:
    left 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    top 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-dock-capsule:active {
  cursor: grabbing;
}

.floating-dock-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 24px;
  cursor: grab;
  padding: 0 2px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.floating-dock-grip:hover {
  opacity: 1;
}

.floating-dock-toast {
  position: absolute;
  z-index: 2147483647;
  padding: 6px 12px;
  background-color: rgba(29, 29, 31, 0.92);
  color: #ffffff;
  border-radius: 8px;
  font-size: 11px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-toast-fade-enter-active,
.dock-toast-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dock-toast-fade-enter-from,
.dock-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
