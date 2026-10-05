import { storage } from 'wxt/utils/storage';
import { browser } from 'wxt/browser';
import type { StorageLike } from 'pinia-plugin-persistedstate';

/**
 * WXT 强类型响应式存储项定义示例
 * 支持跨 Popup、Background (Service Worker)、Content Script 自动双向响应式同步
 */
export const darkModeStorage = storage.defineItem<boolean>('local:darkMode', {
  defaultValue: true,
});

export const userTokenStorage = storage.defineItem<string | null>('local:userToken', {
  defaultValue: null,
});

/**
 * 适用于 pinia-plugin-persistedstate 的 Chrome Extension (MV3) 安全存储适配器
 * 规避 Background Service Worker 中不存在 localStorage 导致的崩溃问题
 */
export const extensionPiniaStorage: StorageLike = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    // 同步写入 Chrome / Browser Extension 本地存储，确保 Background 与 Content Script 均可读取
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      browser.storage.local.set({ [key]: value }).catch(() => {});
    }
  },
};
