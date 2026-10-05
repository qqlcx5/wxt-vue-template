import { createApp } from 'vue';
import { pinia } from '@/stores';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('[Content Script] Initializing WXT ShadowRoot UI with Selection Kit...');

    const ui = await createShadowRootUi(ctx, {
      name: 'wxt-shadow-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(ContentApp);
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
