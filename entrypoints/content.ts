import { createApp } from 'vue';
import { pinia } from '@/stores';
import { vEventShield, attachEventShield } from '@/core';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('[Content Script] Initializing WXT ShadowRoot UI with Event Shield...');

    const ui = await createShadowRootUi(ctx, {
      name: 'wxt-shadow-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        // 关键防护：为 ShadowRoot 容器挂载事件屏障，阻止输入事件穿透触发宿主网页全局快捷键
        attachEventShield(container, { keyboard: true, mouse: false });

        const app = createApp(ContentApp);
        app.directive('event-shield', vEventShield);
        app.use(pinia);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });

    ui.mount();
  },
});
