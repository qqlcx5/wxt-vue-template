/**
 * Floating Edge Dock - 原生 TypeScript 开箱即用实现
 * 
 * 适用于：浏览器扩展 Content Script、网页悬浮挂件、油猴脚本等
 * 特性：
 * - 自由悬浮常驻，未贴边绝不强制物理吸附
 * - 拖到边缘（<= edgeThreshold）自动贴边并在闲置时最小化折叠
 * - 悬停边缘拉手丝滑滑出，移开鼠标延时缩回
 * - 正在操作或 Toast 期间自动开启 Busy Lock 防止误折叠
 * - 原生 Pointer Events 手势捕获，零第三方依赖
 */

export interface DockButtonConfig {
  id: string;
  title: string;
  svg: string;
  bg?: string;
  color?: string;
  onClick: (btn: HTMLButtonElement, dock: FloatingDockInstance) => void | Promise<void>;
}

export interface FloatingDockOptions {
  id?: string;
  storageKey?: string;
  defaultDocked?: boolean;
  defaultDockSide?: 'left' | 'right';
  defaultTopPercent?: number;
  edgeThreshold?: number;
  collapseDelay?: number;
  buttons: DockButtonConfig[];
}

export interface FloatingDockInstance {
  container: HTMLDivElement;
  showToast: (text: string, duration?: number) => void;
  setBusy: (isBusy: boolean) => void;
  expand: () => void;
  collapse: () => void;
  destroy: () => void;
}

export function createFloatingDock(options: FloatingDockOptions): FloatingDockInstance {
  const containerId = options.id || 'floating-edge-dock-container';
  const existing = document.getElementById(containerId);
  if (existing) {
    existing.remove();
  }

  const storageKey = options.storageKey || 'floating_dock_config';
  const edgeThreshold = options.edgeThreshold ?? 32;
  const collapseDelay = options.collapseDelay ?? 700;

  // 状态管理
  let isDocked = options.defaultDocked ?? true;
  let dockSide: 'left' | 'right' = options.defaultDockSide ?? 'right';
  let isHovered = false;
  let isBusy = false;
  let isToastShowing = false;
  let collapseTimer: any = null;

  // 1. Toast 气泡
  const toastBubble = document.createElement('div');
  toastBubble.className = 'floating-dock-toast';
  Object.assign(toastBubble.style, {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    right: '0',
    zIndex: '2147483647',
    padding: '6px 12px',
    backgroundColor: 'rgba(29, 29, 31, 0.92)',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    pointerEvents: 'none',
    opacity: '0',
    transform: 'translateY(4px)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    whiteSpace: 'nowrap',
    maxWidth: '260px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  // 展开与收起
  const expand = () => {
    clearTimeout(collapseTimer);
    container.style.transition = 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, box-shadow 0.2s ease';
    container.style.transform = 'translateX(0)';
    container.style.opacity = '1';
  };

  const collapse = () => {
    if (!isDocked || isHovered || isDragging || isBusy) return;
    container.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, box-shadow 0.2s ease';
    if (dockSide === 'right') {
      container.style.transform = 'translateX(calc(100% - 24px))';
    } else {
      container.style.transform = 'translateX(calc(-100% + 24px))';
    }
    container.style.opacity = '0.75';
  };

  const scheduleCollapse = (delay = collapseDelay) => {
    clearTimeout(collapseTimer);
    if (!isDocked || isHovered || isDragging || isBusy) return;
    collapseTimer = setTimeout(() => {
      collapse();
    }, delay);
  };

  const setBusy = (val: boolean) => {
    isBusy = val;
    if (isBusy) {
      expand();
    } else if (isDocked && !isHovered) {
      scheduleCollapse(800);
    }
  };

  let toastTimer: any = null;
  const showToast = (text: string, duration = 2500) => {
    clearTimeout(toastTimer);
    isToastShowing = true;
    expand();
    toastBubble.textContent = text;
    toastBubble.style.opacity = '1';
    toastBubble.style.transform = 'translateY(0)';
    toastTimer = setTimeout(() => {
      toastBubble.style.opacity = '0';
      toastBubble.style.transform = 'translateY(4px)';
      isToastShowing = false;
      if (!isBusy && isDocked && !isHovered) {
        scheduleCollapse(600);
      }
    }, duration);
  };

  // 2. 胶囊主容器
  const container = document.createElement('div');
  container.id = containerId;
  Object.assign(container.style, {
    position: 'fixed',
    right: '0',
    bottom: '72px',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '9999px',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: 'none',
    pointerEvents: 'auto',
    cursor: 'grab',
    touchAction: 'none',
    transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, box-shadow 0.2s ease',
  });

  container.addEventListener('mouseenter', () => {
    isHovered = true;
    if (isDocked) expand();
    else container.style.opacity = '1';
  });

  container.addEventListener('mouseleave', () => {
    isHovered = false;
    if (isDocked) scheduleCollapse();
  });

  // 3. 点阵抓手
  const grip = document.createElement('div');
  grip.className = 'floating-dock-grip';
  grip.title = '按住可自由拖拽；靠屏幕边缘松手自动折叠，放于中间保持常驻';
  grip.innerHTML = `<svg width="7" height="14" viewBox="0 0 7 14" fill="none">
    <circle cx="2" cy="2" r="1.3" fill="#8e8e93"/>
    <circle cx="5" cy="2" r="1.3" fill="#8e8e93"/>
    <circle cx="2" cy="7" r="1.3" fill="#8e8e93"/>
    <circle cx="5" cy="7" r="1.3" fill="#8e8e93"/>
    <circle cx="2" cy="12" r="1.3" fill="#8e8e93"/>
    <circle cx="5" cy="12" r="1.3" fill="#8e8e93"/>
  </svg>`;
  Object.assign(grip.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '10px',
    height: '24px',
    cursor: 'grab',
    padding: '0 2px',
    userSelect: 'none',
    flexShrink: '0',
    opacity: '0.6',
    transition: 'opacity 0.2s ease',
  });
  grip.addEventListener('mouseenter', () => { grip.style.opacity = '1'; });
  grip.addEventListener('mouseleave', () => { grip.style.opacity = '0.6'; });

  // 4. 拖拽逻辑
  let isPointerDown = false;
  let isDragging = false;
  let hasDragged = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let initialRectLeft = 0;
  let initialRectTop = 0;

  const applyPosition = (cfg: {
    isDocked: boolean;
    dockSide: 'left' | 'right';
    x?: number;
    y?: number;
    topPercent?: number;
  }) => {
    isDocked = cfg.isDocked;
    dockSide = cfg.dockSide;

    const rect = container.getBoundingClientRect();
    const w = rect.width || 120;
    const h = rect.height || 34;

    let targetX = typeof cfg.x === 'number' ? cfg.x : (window.innerWidth - w);
    let targetY = typeof cfg.y === 'number' ? cfg.y : (window.innerHeight * 0.8);

    if (isDocked) {
      if (typeof cfg.topPercent === 'number') {
        const clampedPercent = Math.max(0.02, Math.min(0.96, cfg.topPercent));
        targetY = Math.max(12, Math.min(window.innerHeight - h - 12, clampedPercent * (window.innerHeight - h)));
      }
      targetX = dockSide === 'left' ? 0 : (window.innerWidth - w);
    } else {
      targetX = Math.max(12, Math.min(window.innerWidth - w - 12, targetX));
      targetY = Math.max(12, Math.min(window.innerHeight - h - 12, targetY));
    }

    container.style.transition = 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease';
    container.style.left = `${targetX}px`;
    container.style.top = `${targetY}px`;
    container.style.right = 'auto';
    container.style.bottom = 'auto';

    // Toast 对齐
    if (isDocked) {
      toastBubble.style.left = dockSide === 'left' ? '0' : 'auto';
      toastBubble.style.right = dockSide === 'right' ? '0' : 'auto';
    } else {
      toastBubble.style.left = targetX < window.innerWidth / 2 ? '0' : 'auto';
      toastBubble.style.right = targetX >= window.innerWidth / 2 ? '0' : 'auto';
    }

    if (targetY < 60) {
      toastBubble.style.bottom = 'auto';
      toastBubble.style.top = 'calc(100% + 8px)';
    } else {
      toastBubble.style.top = 'auto';
      toastBubble.style.bottom = 'calc(100% + 8px)';
    }

    if (isDocked && !isHovered && !isBusy) {
      collapse();
    } else {
      expand();
    }
  };

  const saveConfig = (cfg: { isDocked: boolean; dockSide: 'left' | 'right'; x: number; y: number; topPercent: number }) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [storageKey]: cfg });
      } else {
        localStorage.setItem(storageKey, JSON.stringify(cfg));
      }
    } catch {}
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDown = true;
    hasDragged = false;
    isDragging = false;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    const rect = container.getBoundingClientRect();
    initialRectLeft = rect.left;
    initialRectTop = rect.top;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isPointerDown) return;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    if (!isDragging && Math.hypot(dx, dy) > 5) {
      isDragging = true;
      hasDragged = true;
      clearTimeout(collapseTimer);
      container.style.transition = 'none';
      container.style.transform = 'none';
      container.style.opacity = '1';
      container.style.cursor = 'grabbing';
      grip.style.cursor = 'grabbing';
      try { container.setPointerCapture(e.pointerId); } catch {}
    }

    if (isDragging) {
      const rect = container.getBoundingClientRect();
      const w = rect.width || 120;
      const h = rect.height || 34;
      const newX = Math.max(0, Math.min(window.innerWidth - w, initialRectLeft + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - h - 10, initialRectTop + dy));
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isPointerDown) return;
    isPointerDown = false;

    if (isDragging) {
      isDragging = false;
      try { container.releasePointerCapture(e.pointerId); } catch {}
      container.style.cursor = 'grab';
      grip.style.cursor = 'grab';

      const rect = container.getBoundingClientRect();
      const distLeft = rect.left;
      const distRight = window.innerWidth - rect.right;

      let nextDocked = false;
      let nextSide = dockSide;
      let finalLeft = rect.left;
      let finalTop = Math.max(12, Math.min(window.innerHeight - rect.height - 12, rect.top));

      if (distLeft <= edgeThreshold) {
        nextDocked = true;
        nextSide = 'left';
        finalLeft = 0;
      } else if (distRight <= edgeThreshold) {
        nextDocked = true;
        nextSide = 'right';
        finalLeft = window.innerWidth - rect.width;
      } else {
        nextDocked = false;
      }

      const topPercent = Math.max(0.02, Math.min(0.96, finalTop / Math.max(1, window.innerHeight - rect.height)));

      applyPosition({
        isDocked: nextDocked,
        dockSide: nextSide,
        x: finalLeft,
        y: finalTop,
        topPercent,
      });

      saveConfig({
        isDocked: nextDocked,
        dockSide: nextSide,
        x: finalLeft,
        y: finalTop,
        topPercent,
      });

      if (nextDocked) {
        scheduleCollapse(900);
      }

      setTimeout(() => {
        hasDragged = false;
      }, 120);
    }
  };

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);
  container.addEventListener('dragstart', (e) => e.preventDefault());

  // 点击捕获拦截
  container.addEventListener(
    'click',
    (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  container.appendChild(toastBubble);
  container.appendChild(grip);

  // 5. 挂载业务功能按钮
  const instance: FloatingDockInstance = {
    container,
    showToast,
    setBusy,
    expand,
    collapse,
    destroy: () => {
      window.removeEventListener('resize', onResize);
      container.remove();
    },
  };

  for (const btnConfig of options.buttons) {
    const btn = document.createElement('button');
    btn.innerHTML = btnConfig.svg;
    btn.title = btnConfig.title;
    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      border: 'none',
      outline: 'none',
      backgroundColor: btnConfig.bg || 'rgba(0,0,0,0.06)',
      color: btnConfig.color || '#1d1d1f',
      borderRadius: '50%',
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'all 0.18s ease',
      padding: '0',
      flexShrink: '0',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '0.85';
      btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.opacity = '1';
      btn.style.transform = 'none';
    });
    btn.addEventListener(
      'click',
      (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        btnConfig.onClick(btn, instance);
      },
      { capture: true }
    );

    container.appendChild(btn);
  }

  document.body.appendChild(container);

  // 6. 初始化恢复与窗口自适应
  const initLoad = () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([storageKey], (res) => {
          if (res?.[storageKey]) {
            applyPosition(res[storageKey]);
          } else {
            applyPosition({
              isDocked: options.defaultDocked ?? true,
              dockSide: options.defaultDockSide ?? 'right',
              topPercent: options.defaultTopPercent ?? 0.82,
            });
          }
        });
      } else {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          applyPosition(JSON.parse(raw));
        } else {
          applyPosition({
            isDocked: options.defaultDocked ?? true,
            dockSide: options.defaultDockSide ?? 'right',
            topPercent: options.defaultTopPercent ?? 0.82,
          });
        }
      }
    } catch {
      applyPosition({
        isDocked: options.defaultDocked ?? true,
        dockSide: options.defaultDockSide ?? 'right',
        topPercent: options.defaultTopPercent ?? 0.82,
      });
    }
  };

  initLoad();

  let resizeTimer: any = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initLoad();
    }, 120);
  };
  window.addEventListener('resize', onResize);

  return instance;
}
