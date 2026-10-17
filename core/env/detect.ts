/**
 * 运行时环境探测工具
 * 用于判断当前代码运行在何种上下文（Extension 真实环境、普通浏览器网页 Mock、Content Script 或 Service Worker）
 */

export function isExtensionContext(): boolean {
  const g = globalThis as any;
  return typeof g.chrome !== 'undefined' && Boolean(g.chrome.runtime?.id);
}

export function isServiceWorker(): boolean {
  const g = globalThis as any;
  return typeof window === 'undefined' && typeof g.importScripts === 'function';
}

export function isContentScript(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.document) &&
    isExtensionContext() &&
    !location.href.startsWith('chrome-extension://') &&
    !location.href.startsWith('moz-extension://')
  );
}

export function isExtensionPage(): boolean {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  return href.startsWith('chrome-extension://') || href.startsWith('moz-extension://');
}

export function isFirefox(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes('Firefox');
}

export function isDev(): boolean {
  return import.meta.env?.DEV ?? false;
}
