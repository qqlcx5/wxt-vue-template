import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { bindStoreToStorage } from '@/core/storage';

export const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 自动对具备 persist 配置的 store 注册跨端 storage.onChanged 实时响应式多向广播同步
pinia.use(({ store, options }) => {
  if (options.persist) {
    const persistOpts = options.persist === true ? {} : (options.persist as any);
    const key = persistOpts.key || store.$id;
    bindStoreToStorage(store, key);
  }
});

export * from './settings';
export * from './articles';
