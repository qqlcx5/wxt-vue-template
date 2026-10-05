import { createApp } from 'vue';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('[Content Script] Initializing WXT ShadowRoot UI...');

    const ui = await createShadowRootUi(ctx, {
      name: 'wxt-shadow-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        // cssInjectionMode: 'ui' 会由 WXT 自动将 virtual:uno.css 打包并注入 Shadow Root 内
        const app = createApp(ContentApp);
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
