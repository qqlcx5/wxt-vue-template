import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss'],
  unocss: {
    excludeEntrypoints: ['background'],
  },
  manifest: {
    permissions: [
      'storage',
      'sidePanel',
      'contextMenus',
      'activeTab',
      'tabs',
      'alarms',
    ],
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+Y',
          mac: 'Command+Shift+Y',
        },
        description: '打开扩展快捷弹窗',
      },
      'open-sidepanel': {
        suggested_key: {
          default: 'Ctrl+Shift+S',
          mac: 'Command+Shift+S',
        },
        description: '打开右侧工作台侧边栏',
      },
      'quick-extract': {
        suggested_key: {
          default: 'Ctrl+Shift+E',
          mac: 'Command+Shift+E',
        },
        description: '快捷提取当前网页正文',
      },
    },
  },
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    openDevtools: true,
  },
});
