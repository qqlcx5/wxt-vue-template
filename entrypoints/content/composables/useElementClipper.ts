import { ref, onUnmounted } from 'vue';

export interface ClippedElementInfo {
  tagName: string;
  className: string;
  html: string;
  text: string;
  rect: { top: number; left: number; width: number; height: number };
}

/**
 * 网页元素精准拾取与剪藏追踪 Composable
 */
export function useElementClipper() {
  const isClipperActive = ref(false);
  const hoveredInfo = ref<ClippedElementInfo | null>(null);
  const selectedInfo = ref<ClippedElementInfo | null>(null);

  let currentTargetEl: HTMLElement | null = null;

  function handleMouseMove(e: MouseEvent) {
    if (!isClipperActive.value) return;

    // 获取鼠标悬浮的 DOM 节点
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!el || el === currentTargetEl) return;

    // 排除扩展自身的 Shadow DOM 容器
    if (el.closest('#wxt-shadow-ui') || el.tagName === 'WXT-SHADOW-UI') {
      return;
    }

    currentTargetEl = el;
    const rect = el.getBoundingClientRect();

    hoveredInfo.value = {
      tagName: el.tagName.toLowerCase(),
      className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
      html: el.outerHTML,
      text: el.innerText || '',
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  function handleClick(e: MouseEvent) {
    if (!isClipperActive.value) return;

    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (el && (el.closest('#wxt-shadow-ui') || el.tagName === 'WXT-SHADOW-UI')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (hoveredInfo.value) {
      selectedInfo.value = { ...hoveredInfo.value };
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      stopClipper();
    }
  }

  function startClipper() {
    isClipperActive.value = true;
    selectedInfo.value = null;
    hoveredInfo.value = null;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('keydown', handleKeyDown);
  }

  function stopClipper() {
    isClipperActive.value = false;
    hoveredInfo.value = null;
    selectedInfo.value = null;
    currentTargetEl = null;

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('click', handleClick, { capture: true });
    window.removeEventListener('keydown', handleKeyDown);
  }

  onUnmounted(() => {
    stopClipper();
  });

  return {
    isClipperActive,
    hoveredInfo,
    selectedInfo,
    startClipper,
    stopClipper,
  };
}
