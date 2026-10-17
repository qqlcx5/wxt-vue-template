import { ref, watch, onUnmounted, type Ref } from 'vue';
import { getBrowser } from '../env/browser';

export interface UseExtensionStorageOptions {
  area?: 'local' | 'sync';
  deep?: boolean;
}

/**
 * 跨上下文响应式存储组合式函数 (Vue 3 Composable)
 * 核心特性：
 * 1. 响应式读写底层 `browser.storage.local` 或 `browser.storage.sync`；
 * 2. 自动监听 `browser.storage.onChanged` 全局广播，当其他页面（Popup/Sidepanel/Content）修改时，本地自动响应式更新；
 * 3. 规避 MV3 下 ServiceWorker 无 localStorage、Content Script 域隔离等所有典型陷阱。
 */
export function useExtensionStorage<T>(
  key: string,
  defaultValue: T,
  options: UseExtensionStorageOptions = {},
): Ref<T> {
  const browser = getBrowser();
  const area = options.area || 'local';
  const data = ref<T>(defaultValue) as Ref<T>;
  let isInternalUpdate = false;

  // 1. 初始异步拉取
  if (browser?.storage?.[area]) {
    browser.storage[area]
      .get(key)
      .then((res: Record<string, any>) => {
        if (res && res[key] !== undefined) {
          isInternalUpdate = true;
          data.value = res[key];
          isInternalUpdate = false;
        } else {
          // 如果未存过，写回默认值
          browser.storage[area].set({ [key]: defaultValue }).catch(() => {});
        }
      })
      .catch((err: any) => {
        console.warn(`[useExtensionStorage] Read "${key}" error:`, err);
      });
  }

  // 2. 本地响应式变更 -> 写入底层 Chrome Storage
  watch(
    data,
    (newVal) => {
      if (isInternalUpdate) return;
      if (browser?.storage?.[area]) {
        browser.storage[area].set({ [key]: newVal }).catch((err: any) => {
          console.error(`[useExtensionStorage] Write "${key}" error:`, err);
        });
      }
    },
    { deep: options.deep ?? true },
  );

  // 3. 监听全局 storage.onChanged 事件 (跨 Tab / 跨窗口 / 跨 Content Script 实时多向同步)
  const changeListener = (changes: Record<string, any>, areaName: string) => {
    if (areaName === area && changes[key]) {
      const change = changes[key];
      // 避免自身写入又重复触发 watch 引起死循环
      if (JSON.stringify(change.newValue) !== JSON.stringify(data.value)) {
        isInternalUpdate = true;
        data.value = change.newValue;
        isInternalUpdate = false;
      }
    }
  };

  if (browser?.storage?.onChanged) {
    browser.storage.onChanged.addListener(changeListener);
  }

  // 4. 组件卸载时释放监听
  try {
    onUnmounted(() => {
      if (browser?.storage?.onChanged) {
        browser.storage.onChanged.removeListener(changeListener);
      }
    });
  } catch {}

  return data;
}
