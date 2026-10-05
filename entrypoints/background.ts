import { browser } from 'wxt/browser';
import { onExtensionMessage } from '@/utils/messaging';
import { db } from '@/services/db';

/**
 * 稳妥唤醒 Chrome 原生侧边栏 (Side Panel)
 * 优先采用 Chrome 官方提供的 chrome.sidePanel API，兼顾 windowId 与 tabId
 */
async function openSidePanelSafe(windowId?: number, tabId?: number): Promise<boolean> {
  const sidePanelApi = (globalThis as any).chrome?.sidePanel;
  if (!sidePanelApi?.open) {
    console.error('[Background] 当前浏览器内核不支持 chrome.sidePanel API (需 Chrome 114+)');
    return false;
  }

  // 1. 尝试以指定 windowId 唤起全局侧边栏
  if (windowId) {
    try {
      await sidePanelApi.open({ windowId });
      return true;
    } catch (e) {
      console.warn('[Background] 通过 windowId 开启侧边栏失败，尝试以 tabId 打开:', e);
    }
  }

  // 2. 尝试以指定 tabId 唤起针对当前标签页的侧边栏
  if (tabId) {
    try {
      await sidePanelApi.open({ tabId });
      return true;
    } catch (e) {
      console.warn('[Background] 通过 tabId 开启侧边栏失败:', e);
    }
  }

  // 3. 兜底获取最近聚焦的窗口唤起
  try {
    const win = await (globalThis as any).chrome?.windows?.getLastFocused?.();
    if (win?.id) {
      await sidePanelApi.open({ windowId: win.id });
      return true;
    }
  } catch (e) {
    console.error('[Background] 兜底获取最后聚焦窗口打开侧边栏失败:', e);
  }

  return false;
}

export default defineBackground(() => {
  console.log('[Background] Service Worker starting with id:', browser.runtime.id);

  // 1. 初始化安装事件：注册右键菜单、配置侧边栏默认路径与后台定时任务
  browser.runtime.onInstalled.addListener(async () => {
    console.log('[Background] Extension installed/updated, configuring context menus & alarms...');

    // 显式确保侧边栏已针对所有标签页全局就绪
    const sidePanelApi = (globalThis as any).chrome?.sidePanel;
    if (sidePanelApi?.setOptions) {
      try {
        await sidePanelApi.setOptions({
          path: 'sidepanel.html',
          enabled: true,
        });
      } catch (err) {
        console.warn('[Background] sidePanel.setOptions error:', err);
      }
    }

    // 移除旧菜单，防止重复注册报错
    try {
      await browser.contextMenus.removeAll();
    } catch {}

    // 创建右键菜单项
    browser.contextMenus.create({
      id: 'open-sidepanel',
      title: '在侧边栏中打开工作台',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'extract-page',
      title: '提取当前网页纯净正文',
      contexts: ['page', 'selection'],
    });

    browser.contextMenus.create({
      id: 'open-options',
      title: '打开系统偏好设置',
      contexts: ['action'],
    });

    // 注册定时任务（每 60 分钟一次安全心跳）
    browser.alarms.create('maintenance-alarm', {
      periodInMinutes: 60,
    });
  });

  // 2. 右键菜单交互调度
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'open-sidepanel') {
      await openSidePanelSafe(tab?.windowId, tab?.id);
    } else if (info.menuItemId === 'open-options') {
      await browser.runtime.openOptionsPage();
    } else if (info.menuItemId === 'extract-page') {
      if (tab?.id && tab.url) {
        try {
          await db.articles.add({
            url: tab.url,
            title: tab.title || '提取网页快照',
            content: `来自右键抓取的快速快照：${tab.url}`,
            createdAt: Date.now(),
            tags: ['右键抓取'],
          });
          await browser.action.setBadgeText({ text: '✓' });
          await browser.action.setBadgeBackgroundColor({ color: '#34C759' });
          setTimeout(() => {
            browser.action.setBadgeText({ text: '' });
          }, 2000);
        } catch (e) {
          console.error('[Background] Failed to save article from context menu:', e);
        }
      }
    }
  });

  // 3. 浏览器全局快捷键监听 (Commands API)
  browser.commands.onCommand.addListener(async (command) => {
    console.log('[Background] Received command shortcut:', command);
    if (command === 'open-sidepanel') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await openSidePanelSafe(tab?.windowId, tab?.id);
    } else if (command === 'quick-extract') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) {
        await db.articles.add({
          url: tab.url,
          title: tab.title || '快捷键提取记录',
          content: `通过快捷键快速存入: ${tab.url}`,
          createdAt: Date.now(),
          tags: ['快捷键'],
        });
        await browser.action.setBadgeText({ text: 'OK' });
        await browser.action.setBadgeBackgroundColor({ color: '#007AFF' });
        setTimeout(() => {
          browser.action.setBadgeText({ text: '' });
        }, 2000);
      }
    }
  });

  // 4. 定时任务唤醒监听 (Alarms API)
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'maintenance-alarm') {
      console.log('[Background] Periodic alarm triggered:', new Date().toISOString());
    }
  });

  // 5. 强类型消息中心调度 (Messaging API)
  onExtensionMessage('GET_CURRENT_TAB', async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return {
      id: tab?.id,
      url: tab?.url,
      title: tab?.title,
    };
  });

  onExtensionMessage('PING', async () => {
    return {
      pong: true,
      time: Date.now(),
    };
  });

  onExtensionMessage('OPEN_SIDEPANEL', async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const success = await openSidePanelSafe(tab?.windowId, tab?.id);
    return {
      success,
      error: success ? undefined : '未能呼出侧边栏，请使用全局快捷键 ⌘⇧S 或在网页上右键打开',
    };
  });

  onExtensionMessage('OPEN_OPTIONS', async () => {
    try {
      await browser.runtime.openOptionsPage();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  onExtensionMessage('SET_BADGE', async (data) => {
    try {
      await browser.action.setBadgeText({ text: data.text });
      if (data.color) {
        await browser.action.setBadgeBackgroundColor({ color: data.color });
      }
      return { success: true };
    } catch {
      return { success: false };
    }
  });

  onExtensionMessage('SAVE_ARTICLE', async (data) => {
    try {
      const id = await db.articles.add({
        url: data.url,
        title: data.title,
        content: data.content,
        author: data.author,
        createdAt: Date.now(),
        tags: data.tags || ['通用'],
      });
      return { success: true, id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
});
