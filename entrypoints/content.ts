import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['*://*.qoder.com/*', '*://*.qoder.cn/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'qoder-monitor-shadow',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(ContentApp);
        app.use(createPinia());
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
