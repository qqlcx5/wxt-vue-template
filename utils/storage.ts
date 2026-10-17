import { storage } from 'wxt/utils/storage';
import { chromeExtensionStorage } from '@/core/storage';

export * from '@/core/storage';

/**
 * WXT 强类型存储项定义
 */
export const darkModeStorage = storage.defineItem<boolean>('local:darkMode', {
  defaultValue: true,
});

export const userTokenStorage = storage.defineItem<string | null>('local:userToken', {
  defaultValue: null,
});

/**
 * 适用于 pinia-plugin-persistedstate 的 Chrome 扩展全局持久化存储适配器
 */
export const extensionPiniaStorage = chromeExtensionStorage;
