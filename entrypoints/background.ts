import { browser } from 'wxt/browser';
import { onExtensionMessage } from '@/utils/messaging';

/**
 * 稳妥唤醒 Chrome 原生侧边栏 (Side Panel)
 */
async function openSidePanelSafe(windowId?: number, tabId?: number): Promise<boolean> {
  const sidePanelApi = (globalThis as any).chrome?.sidePanel;
  if (!sidePanelApi?.open) {
    console.error('[Background] 当前浏览器内核不支持 chrome.sidePanel API');
    return false;
  }

  if (windowId) {
    try {
      await sidePanelApi.open({ windowId });
      return true;
    } catch {}
  }

  if (tabId) {
    try {
      await sidePanelApi.open({ tabId });
      return true;
    } catch {}
  }

  try {
    const win = await (globalThis as any).chrome?.windows?.getLastFocused?.();
    if (win?.id) {
      await sidePanelApi.open({ windowId: win.id });
      return true;
    }
  } catch {}

  return false;
}

/**
 * 静默刷新 Qoder 基础用量并更新角标
 */
async function refreshQoderBadgeSafe() {
  try {
    const meRes = await fetch('https://qoder.com/api/v1/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!meRes.ok) {
      // 401 或异常，清空角标
      await browser.action.setBadgeText({ text: '' });
      return;
    }

    const user = await meRes.json();
    if (!user?.id) return;

    const now = Date.now();
    const startTime = now - 86400000;
    const trendRes = await fetch(
      `https://qoder.com/api/v1/me/cost-center/credits/daily-trend?userId=${encodeURIComponent(
        user.id,
      )}&startTime=${startTime}&endTime=${now}&groupBy=all`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      },
    );

    if (trendRes.ok) {
      const data = await trendRes.json();
      const today = new Date().toISOString().slice(0, 10);
      const todayItem = data.trend?.find((t: any) => t.date === today);
      const credits = todayItem ? Math.round(todayItem.credits * 10) / 10 : 0;

      if (credits > 0) {
        await browser.action.setBadgeText({ text: `${credits}` });
        await browser.action.setBadgeBackgroundColor({ color: '#2563eb' });
      } else {
        await browser.action.setBadgeText({ text: '' });
      }
    }
  } catch (e) {
    console.warn('[Background] Refresh Qoder badge error:', e);
  }
}

export default defineBackground(() => {
  console.log('[Background] Qoder Monitor background worker initialized.');

  // 1. 初始化安装事件：注册侧边栏路径、右键菜单与定时任务
  browser.runtime.onInstalled.addListener(async () => {
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

    // 移除旧菜单，防止冲突
    try {
      await browser.contextMenus.removeAll();
    } catch {}

    // 创建右键菜单
    browser.contextMenus.create({
      id: 'open-qoder-dashboard',
      title: '🚀 打开 Qoder 全屏大屏工作台',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'open-qoder-analytics-web',
      title: '前往 Qoder 官方个人度量网页',
      contexts: ['all'],
    });

    // 注册定时任务：每 15 分钟更新一次角标
    browser.alarms.create('refresh-qoder-badge', {
      periodInMinutes: 15,
    });

    // 初始执行一次角标更新
    refreshQoderBadgeSafe();
  });

  // 2. 右键菜单交互
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'open-qoder-dashboard') {
      await browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html' as any) });
    } else if (info.menuItemId === 'open-qoder-analytics-web') {
      await browser.tabs.create({ url: 'https://qoder.com/account/analytics' });
    }
  });

  // 3. 全局快捷键监听
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'open-dashboard') {
      await browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html' as any) });
    } else if (command === 'open-sidepanel') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await openSidePanelSafe(tab?.windowId, tab?.id);
    }
  });

  // 4. 定时任务唤醒
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refresh-qoder-badge') {
      refreshQoderBadgeSafe();
    }
  });

  // 5. 监听标签页更新：如果用户在浏览器中打开/登录了 qoder.com，自动触发一次角标刷新
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('qoder.com')) {
      refreshQoderBadgeSafe();
    }
  });

  // 6. 消息响应
  onExtensionMessage('OPEN_SIDEPANEL', async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const success = await openSidePanelSafe(tab?.windowId, tab?.id);
    return {
      success,
      error: success ? undefined : '未能呼出侧边栏，请使用快捷键 ⌘⇧S 打开',
    };
  });

  onExtensionMessage('PING', async () => {
    return {
      pong: true,
      time: Date.now(),
    };
  });
});
