import { isExtensionContext } from './detect';

/**
 * 轻量级 Web 调试 Mock 层
 * 当在普通浏览器（如 http://localhost:3000/popup.html）打开页面且无 Chrome 插件宿主时生效
 * 极大提升前端开发者调试 Popup/Sidepanel/Options 时的 DX（支持标准 Vue DevTools）
 */

interface StorageChangeRecord {
  [key: string]: {
    oldValue?: any;
    newValue?: any;
  };
}

class MockStorageArea {
  private prefix = '__wxt_mock_storage__';
  private memStorage = new Map<string, string>();
  private listeners: Set<(changes: StorageChangeRecord, areaName: string) => void> = new Set();

  constructor(private areaName: string) {}

  addListener(fn: (changes: StorageChangeRecord, areaName: string) => void) {
    this.listeners.add(fn);
  }

  removeListener(fn: (changes: StorageChangeRecord, areaName: string) => void) {
    this.listeners.delete(fn);
  }

  private getKey(k: string) {
    return `${this.prefix}:${this.areaName}:${k}`;
  }

  private getStorageItem(k: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(k);
    }
    return this.memStorage.get(k) ?? null;
  }

  private setStorageItem(k: string, v: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(k, v);
      } catch {}
    }
    this.memStorage.set(k, v);
  }

  private removeStorageItem(k: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(k);
      } catch {}
    }
    this.memStorage.delete(k);
  }

  async get(keys?: string | string[] | Record<string, any> | null): Promise<Record<string, any>> {
    const res: Record<string, any> = {};
    if (!keys) {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(`${this.prefix}:${this.areaName}:`)) {
            const rawKey = k.replace(`${this.prefix}:${this.areaName}:`, '');
            try {
              res[rawKey] = JSON.parse(localStorage.getItem(k) || 'null');
            } catch {
              res[rawKey] = localStorage.getItem(k);
            }
          }
        }
      }
      for (const [k, v] of this.memStorage.entries()) {
        if (k.startsWith(`${this.prefix}:${this.areaName}:`)) {
          const rawKey = k.replace(`${this.prefix}:${this.areaName}:`, '');
          try {
            res[rawKey] = JSON.parse(v);
          } catch {
            res[rawKey] = v;
          }
        }
      }
      return res;
    }

    if (typeof keys === 'string') {
      keys = [keys];
    }

    if (Array.isArray(keys)) {
      for (const k of keys) {
        const raw = this.getStorageItem(this.getKey(k));
        if (raw !== null) {
          try {
            res[k] = JSON.parse(raw);
          } catch {
            res[k] = raw;
          }
        }
      }
      return res;
    }

    // 对象默认值形式
    for (const [k, defVal] of Object.entries(keys)) {
      const raw = this.getStorageItem(this.getKey(k));
      if (raw !== null) {
        try {
          res[k] = JSON.parse(raw);
        } catch {
          res[k] = raw;
        }
      } else {
        res[k] = defVal;
      }
    }
    return res;
  }

  async set(items: Record<string, any>): Promise<void> {
    const changes: StorageChangeRecord = {};
    for (const [k, v] of Object.entries(items)) {
      const oldRaw = this.getStorageItem(this.getKey(k));
      let oldValue = undefined;
      if (oldRaw !== null) {
        try {
          oldValue = JSON.parse(oldRaw);
        } catch {
          oldValue = oldRaw;
        }
      }
      this.setStorageItem(this.getKey(k), JSON.stringify(v));
      changes[k] = { oldValue, newValue: v };
    }

    // 触发本域 listener
    this.listeners.forEach((fn) => {
      try {
        fn(changes, this.areaName);
      } catch (e) {
        console.error('[MockStorage] Listener error:', e);
      }
    });
  }

  async remove(keys: string | string[]): Promise<void> {
    const arr = Array.isArray(keys) ? keys : [keys];
    const changes: StorageChangeRecord = {};
    for (const k of arr) {
      const oldRaw = this.getStorageItem(this.getKey(k));
      let oldValue = undefined;
      if (oldRaw !== null) {
        try {
          oldValue = JSON.parse(oldRaw);
        } catch {
          oldValue = oldRaw;
        }
      }
      this.removeStorageItem(this.getKey(k));
      changes[k] = { oldValue, newValue: undefined };
    }
    this.listeners.forEach((fn) => fn(changes, this.areaName));
  }

  async clear(): Promise<void> {
    const all = await this.get();
    await this.remove(Object.keys(all));
  }
}

export function setupMockExtensionApi(): void {
  if (isExtensionContext()) {
    return;
  }

  const globalObj = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  if (globalObj.__wxt_mock_installed__) return;
  globalObj.__wxt_mock_installed__ = true;

  console.info(
    '%c[Web Mock Mode]%c 当前运行在普通浏览器/测试环境，已自动装配 Chrome Extension API Mock 层。',
    'background: #007AFF; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
    'color: #007AFF; font-weight: normal; margin-left: 6px;',
  );

  const localArea = new MockStorageArea('local');
  const syncArea = new MockStorageArea('sync');

  const mockStorage = {
    local: localArea,
    sync: syncArea,
    onChanged: {
      addListener(fn: any) {
        localArea.addListener(fn);
        syncArea.addListener(fn);
      },
      removeListener(fn: any) {
        localArea.removeListener(fn);
        syncArea.removeListener(fn);
      },
    },
  };

  const messageListeners = new Set<Function>();

  const mockRuntime = {
    id: 'mock-extension-id',
    getURL(path: string) {
      return path.startsWith('/') ? path : `/${path}`;
    },
    openOptionsPage() {
      if (typeof window !== 'undefined') {
        window.open('/options.html', '_blank');
      }
      return Promise.resolve();
    },
    async sendMessage(msg: any) {
      // 1. 如果有注册的 onMessage 监听器，派发给 listener
      for (const fn of messageListeners) {
        let responded = false;
        let responseData: any = undefined;
        const sendResponse = (res: any) => {
          responded = true;
          responseData = res;
        };
        const isAsync = fn(msg, { id: 'mock-sender' }, sendResponse);
        if (responded) {
          return responseData;
        }
        if (isAsync) {
          // 等待微任务队列完成
          await new Promise((r) => setTimeout(r, 10));
          return responseData;
        }
      }

      // 2. 默认针对常见事件做基本回显
      if (msg?.type === 'GET_CURRENT_TAB' || msg?.action === 'get-current-tab') {
        return {
          id: 1,
          url: typeof window !== 'undefined' ? window.location.href : 'https://example.com/test',
          title: typeof document !== 'undefined' ? document.title : 'Mock Web Page',
        };
      }
      if (msg?.type === 'PING' || msg?.action === 'ping') {
        return { pong: true, time: Date.now() };
      }
      return { success: true, mock: true };
    },
    onMessage: {
      addListener(listener: any) {
        messageListeners.add(listener);
      },
      removeListener(listener: any) {
        messageListeners.delete(listener);
      },
    },
  };

  const mockTabs = {
    async query(queryInfo: any) {
      return [
        {
          id: 1,
          windowId: 1,
          active: true,
          url: 'https://github.com/another/chrome-vue-template',
          title: 'Mock Active Web Tab - GitHub',
          favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
        },
      ];
    },
    async create(createProperties: any) {
      if (typeof window !== 'undefined' && createProperties?.url) {
        window.open(createProperties.url, '_blank');
      }
      return { id: 2, url: createProperties?.url };
    },
    async sendMessage(tabId: number, message: any) {
      return { success: true, mock: true };
    },
    async captureVisibleTab() {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    },
  };

  const mockAction = {
    async setBadgeText(details: { text: string }) {},
    async setBadgeBackgroundColor(details: { color: string }) {},
  };

  const mockSidePanel = {
    async open(options: any) {
      if (typeof window !== 'undefined') {
        window.open('/sidepanel.html', '_blank', 'width=420,height=780');
      }
      return true;
    },
    async setOptions(options: any) {
      return true;
    },
  };

  const mockCommands = {
    onCommand: {
      addListener(fn: any) {},
      removeListener(fn: any) {},
    },
  };

  const mockAlarms = {
    create() {},
    onAlarm: {
      addListener(fn: any) {},
      removeListener(fn: any) {},
    },
  };

  const mockContextMenus = {
    create() {},
    removeAll() {
      return Promise.resolve();
    },
    onClicked: {
      addListener(fn: any) {},
      removeListener(fn: any) {},
    },
  };

  const chromeMock = {
    runtime: mockRuntime,
    storage: mockStorage,
    tabs: mockTabs,
    action: mockAction,
    sidePanel: mockSidePanel,
    commands: mockCommands,
    alarms: mockAlarms,
    contextMenus: mockContextMenus,
  };

  globalObj.chrome = chromeMock;
  globalObj.browser = chromeMock;
}

// 自动探测并自激活 Mock
if (typeof window !== 'undefined' && !isExtensionContext()) {
  setupMockExtensionApi();
}
