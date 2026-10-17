import type { StorageLike } from 'pinia-plugin-persistedstate';
import { getBrowser } from '../env/browser';
import type { Store } from 'pinia';

// 内存镜像缓存，保证同步 getItem 不阻塞初始渲染
const memoryCache = new Map<string, string>();

/**
 * 专为 Chrome Extension MV3 定制的 Pinia 持久化存储驱动
 * 彻底解决 Service Worker 无 localStorage、Content Script 域隔离的问题
 */
export const chromeExtensionStorage: StorageLike = {
  getItem(key: string): string | null {
    // 1. 优先从内存缓存获取
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!;
    }
    // 2. 普通扩展页面尝试读取 localStorage 作为冷启动加速
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val) {
        memoryCache.set(key, val);
        return val;
      }
    }
    return null;
  },

  setItem(key: string, value: string): void {
    // 1. 更新内存缓存
    memoryCache.set(key, value);

    // 2. 若在带 window 的环境中写入 localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    }

    // 3. 异步持久化到真正的 Chrome 扩展本地存储中 (跨 Background/Content 全局共享)
    const browser = getBrowser();
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      browser.storage.local.set({ [key]: value }).catch((err: any) => {
        console.error(`[PiniaAdapter] Failed to persist key "${key}":`, err);
      });
    }
  },
};

/**
 * 绑定 Pinia Store 与 Chrome Storage 变更监听
 * 当在 Popup 或 Options 修改状态后，其他存活页面（如网页里的 Content Script、Sidepanel）将自动 $patch 响应式同步
 */
export function bindStoreToStorage(store: Store, storageKey: string): () => void {
  const browser = getBrowser();

  // 1. 启动时异步从 browser.storage.local 进行一次最新值校准
  if (typeof browser !== 'undefined' && browser.storage?.local) {
    browser.storage.local.get(storageKey).then((res: Record<string, any>) => {
      if (res && res[storageKey]) {
        try {
          const parsed = typeof res[storageKey] === 'string' ? JSON.parse(res[storageKey]) : res[storageKey];
          memoryCache.set(storageKey, typeof res[storageKey] === 'string' ? res[storageKey] : JSON.stringify(res[storageKey]));
          store.$patch(parsed);
        } catch {}
      }
    }).catch(() => {});
  }

  // 2. 监听全局 Storage 变动广播
  const listener = (changes: Record<string, any>, areaName: string) => {
    if (areaName === 'local' && changes[storageKey]) {
      const { newValue } = changes[storageKey];
      if (newValue !== undefined) {
        try {
          const parsed = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
          memoryCache.set(storageKey, typeof newValue === 'string' ? newValue : JSON.stringify(newValue));
          store.$patch(parsed);
        } catch (e) {
          console.warn(`[PiniaAdapter] Sync error for store "${store.$id}":`, e);
        }
      }
    }
  };

  if (typeof browser !== 'undefined' && browser.storage?.onChanged) {
    browser.storage.onChanged.addListener(listener);
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  }

  return () => {};
}
