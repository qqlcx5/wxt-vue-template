import { getBrowser } from '../env/browser';
import type { ExtensionProtocol, ActionName } from './protocol';

export type { ExtensionProtocol, ActionName };

/**
 * 消息载荷规范格式
 */
interface MessagePayload<K extends ActionName> {
  action: K;
  type?: K; // 兼容旧版 type 字段
  data: ExtensionProtocol[K]['request'];
  timestamp: number;
}

/**
 * 向 Background Service Worker 发送强类型消息
 * TypeScript 编译器根据 action 自动推导入参与返回值
 */
export async function sendMessage<K extends ActionName>(
  action: K,
  data?: ExtensionProtocol[K]['request'],
): Promise<ExtensionProtocol[K]['response']> {
  const browser = getBrowser();
  const payload: MessagePayload<K> = {
    action,
    type: action,
    data: data as any,
    timestamp: Date.now(),
  };

  try {
    const res = await browser.runtime.sendMessage(payload);
    return res;
  } catch (err: any) {
    console.warn(`[Messaging] sendMessage "${String(action)}" warning:`, err);
    throw err;
  }
}

/**
 * 向特定标签页 (Tab) 的 Content Script 发送强类型消息
 */
export async function sendToTab<K extends ActionName>(
  tabId: number,
  action: K,
  data?: ExtensionProtocol[K]['request'],
): Promise<ExtensionProtocol[K]['response']> {
  const browser = getBrowser();
  const payload: MessagePayload<K> = {
    action,
    type: action,
    data: data as any,
    timestamp: Date.now(),
  };

  return await browser.tabs.sendMessage(tabId, payload);
}

/**
 * 向所有当前打开的浏览器标签页 Content Script 广播消息
 */
export async function broadcastMessage<K extends ActionName>(
  action: K,
  data?: ExtensionProtocol[K]['request'],
): Promise<void> {
  const browser = getBrowser();
  const payload: MessagePayload<K> = {
    action,
    type: action,
    data: data as any,
    timestamp: Date.now(),
  };

  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
        browser.tabs.sendMessage(tab.id, payload).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[Messaging] Broadcast error:', err);
  }
}

/**
 * 监听强类型扩展内部消息
 * 自动拦截异常，安全返回异步 Promise，支持取消订阅
 */
export function onMessage<K extends ActionName>(
  action: K,
  handler: (
    data: ExtensionProtocol[K]['request'],
    sender: any,
  ) => Promise<ExtensionProtocol[K]['response']> | ExtensionProtocol[K]['response'],
): () => void {
  const browser = getBrowser();
  const normalize = (val: any) =>
    typeof val === 'string' ? val.toLowerCase().replace(/[-_]/g, '') : '';
  const targetNorm = normalize(action);

  const listener = (message: any, sender: any, sendResponse: (res: any) => void) => {
    // 兼容 action 或 type 命名，以及大小写/横杠下划线规范
    const msgAction = message?.action || message?.type;
    if (msgAction === action || (msgAction && normalize(msgAction) === targetNorm)) {
      Promise.resolve(handler(message.data, sender))
        .then((res) => {
          sendResponse(res);
        })
        .catch((err) => {
          console.error(`[Messaging] Handler error on action "${String(action)}":`, err);
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      return true; // 保持异步通信通道开启
    }
    return false;
  };

  browser.runtime.onMessage.addListener(listener);
  return () => {
    browser.runtime.onMessage.removeListener(listener);
  };
}

// 兼容现有命名别名
export const sendToBackground = sendMessage;
export const onExtensionMessage = onMessage;
