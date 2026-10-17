import type { Directive } from 'vue';

/**
 * 事件屏蔽配置选项
 */
export interface EventShieldOptions {
  /** 是否拦截键盘事件 (keydown, keyup, keypress) 默认 true */
  keyboard?: boolean;
  /** 是否拦截鼠标点击 (mousedown, mouseup, click, dblclick) 默认 true */
  mouse?: boolean;
  /** 是否拦截滚轮 (wheel) 默认 false (允许正常页面滚动) */
  wheel?: boolean;
  /** 是否仅在目标为表单输入控件时拦截键盘 默认 false */
  onlyInputs?: boolean;
}

const DEFAULT_OPTIONS: EventShieldOptions = {
  keyboard: true,
  mouse: true,
  wheel: false,
  onlyInputs: false,
};

/**
 * 为指定 DOM 容器附加事件屏障 (Event Shield)
 * 彻底防止扩展 Content Script 内的按键与点击冒泡污染宿主网页（如 B 站按空格暂停、GitHub 按快捷键跳转等冲突）
 */
export function attachEventShield(
  el: HTMLElement,
  options: EventShieldOptions = DEFAULT_OPTIONS,
): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const disposers: Array<() => void> = [];

  const addIsolatedListener = (eventName: string, handler: (e: Event) => void) => {
    el.addEventListener(eventName, handler, { capture: true });
    disposers.push(() => el.removeEventListener(eventName, handler, { capture: true }));
  };

  // 1. 键盘事件隔离
  if (opts.keyboard) {
    const keyHandler = (e: Event) => {
      if (opts.onlyInputs) {
        const target = e.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox');
        if (!isInput) return;
      }
      e.stopPropagation();
    };

    ['keydown', 'keyup', 'keypress'].forEach((evt) => addIsolatedListener(evt, keyHandler));
  }

  // 2. 鼠标点击隔离 (防止触发宿主网页底层链接跳转或事件监听)
  if (opts.mouse) {
    const mouseHandler = (e: Event) => {
      e.stopPropagation();
    };

    ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach((evt) =>
      addIsolatedListener(evt, mouseHandler),
    );
  }

  // 3. 滚轮隔离
  if (opts.wheel) {
    const wheelHandler = (e: Event) => {
      e.stopPropagation();
    };
    addIsolatedListener('wheel', wheelHandler);
  }

  return () => {
    disposers.forEach((dispose) => dispose());
  };
}

/**
 * Vue 3 专属防穿透指令: v-event-shield
 * 使用方法:
 * <div v-event-shield>...</div>
 * <input v-event-shield="{ keyboard: true, mouse: false }" />
 */
export const vEventShield: Directive<HTMLElement, EventShieldOptions | undefined> = {
  mounted(el, binding) {
    const cleanup = attachEventShield(el, binding.value || DEFAULT_OPTIONS);
    (el as any).__event_shield_cleanup__ = cleanup;
  },
  unmounted(el) {
    if ((el as any).__event_shield_cleanup__) {
      (el as any).__event_shield_cleanup__();
      delete (el as any).__event_shield_cleanup__;
    }
  },
};
