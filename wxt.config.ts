import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss'],
  unocss: {
    excludeEntrypoints: ['background'],
  },
  manifest: {
    name: 'Qoder Analytics & Rate Monitor',
    description: 'Qoder 官方用量监控、原生 IDE 执行耗时与速率分析扩展',
    permissions: [
      'storage',
      'sidePanel',
      'contextMenus',
      'activeTab',
      'tabs',
      'alarms',
      'cookies',
    ],
    host_permissions: [
      '*://*.qoder.com/*',
      '*://*.qoder.cn/*',
      'http://127.0.0.1:*/*',
      'http://localhost:*/*',
    ],
    action: {
      default_title: 'Qoder Analytics & Rate Monitor',
      default_popup: 'popup.html',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+Y',
          mac: 'Command+Shift+Y',
        },
        description: '打开 Qoder 监控弹窗',
      },
      'open-dashboard': {
        suggested_key: {
          default: 'Ctrl+Shift+D',
          mac: 'Command+Shift+D',
        },
        description: '打开 Qoder 全屏大屏工作台',
      },
      'open-sidepanel': {
        suggested_key: {
          default: 'Ctrl+Shift+S',
          mac: 'Command+Shift+S',
        },
        description: '打开 Qoder 全景侧边栏看板',
      },
    },
  },
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    openDevtools: true,
  },
});
