import { ref, onMounted, onUnmounted } from 'vue';

export interface SelectionState {
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}

/**
 * 通用网页文本选区感知与屏幕坐标追踪 Composable
 */
export function useTextSelection(options: { minLength?: number } = {}) {
  const minLength = options.minLength ?? 1;

  const selectedText = ref('');
  const position = ref<{ x: number; y: number; placement: 'top' | 'bottom' }>({
    x: 0,
    y: 0,
    placement: 'top',
  });
  const isVisible = ref(false);

  function clearSelection() {
    isVisible.value = false;
    selectedText.value = '';
  }

  function updateSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      return;
    }

    const text = sel.toString().trim();
    if (text.length < minLength) {
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        return;
      }

      selectedText.value = text;

      // 计算水平居中坐标，并防止贴壁截断
      let x = rect.left + rect.width / 2;
      const minX = 140;
      const maxX = window.innerWidth - 140;
      x = Math.max(minX, Math.min(maxX, x));

      // 垂直定位：优先放在选区正上方，上方空间不足则放选区正下方
      let y = rect.top - 12;
      let placement: 'top' | 'bottom' = 'top';

      if (y < 60) {
        y = rect.bottom + 12;
        placement = 'bottom';
      }

      position.value = { x, y, placement };
      isVisible.value = true;
    } catch {}
  }

  function handleMouseUp(e: MouseEvent) {
    // 延迟一帧让 selectionchange 先就绪
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        // 如果点击的是空白区域且没有选中文字，隐藏浮层
        isVisible.value = false;
      } else {
        updateSelection();
      }
    }, 10);
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      clearSelection();
    } else {
      setTimeout(updateSelection, 10);
    }
  }

  onMounted(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
  });

  onUnmounted(() => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keyup', handleKeyUp);
  });

  return {
    selectedText,
    position,
    isVisible,
    clearSelection,
  };
}
