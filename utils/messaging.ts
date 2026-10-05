import { browser } from 'wxt/browser';

/**
 * 扩展内部通信协议定义（支持按需扩展 Message 类型）
 */
export interface ExtensionMessages {
  GET_CURRENT_TAB: {
    request: void;
    response: { id?: number; url?: string; title?: string };
  };
  PING: {
    request: { timestamp: number };
    response: { pong: boolean; time: number };
  };
  EXTRACT_PAGE: {
    request: { url?: string };
    response: { success: boolean; data?: any; error?: string };
  };
  OPEN_SIDEPANEL: {
    request: void;
    response: { success: boolean; error?: string };
  };
  OPEN_OPTIONS: {
    request: void;
    response: { success: boolean; error?: string };
  };
  SET_BADGE: {
    request: { text: string; color?: string };
    response: { success: boolean };
  };
  SAVE_ARTICLE: {
    request: {
      url: string;
      title: string;
      content: string;
      author?: string;
      tags?: string[];
    };
    response: { success: boolean; id?: number; error?: string };
  };
  CAPTURE_SCREENSHOT: {
    request: void;
    response: { success: boolean; dataUrl?: string; error?: string };
  };
  OPEN_CHAT: {
    request: void;
    response: { success: boolean; error?: string };
  };
}

export type MessageKey = keyof ExtensionMessages;

/**
 * 发送强类型消息至 Background Service Worker
 */
export async function sendToBackground<K extends MessageKey>(
  type: K,
  data?: ExtensionMessages[K]['request'],
): Promise<ExtensionMessages[K]['response']> {
  return await browser.runtime.sendMessage({ type, data });
}

/**
 * 发送强类型消息至指定 Tab 的 Content Script
 */
export async function sendToTab<K extends MessageKey>(
  tabId: number,
  type: K,
  data?: ExtensionMessages[K]['request'],
): Promise<ExtensionMessages[K]['response']> {
  return await browser.tabs.sendMessage(tabId, { type, data });
}

/**
 * 监听扩展内部消息
 */
export function onExtensionMessage<K extends MessageKey>(
  type: K,
  handler: (
    data: ExtensionMessages[K]['request'],
    sender: any,
  ) => Promise<ExtensionMessages[K]['response']> | ExtensionMessages[K]['response'],
) {
  const listener = (message: any, sender: any, sendResponse: (res: any) => void) => {
    if (message?.type === type) {
      Promise.resolve(handler(message.data, sender))
        .then(sendResponse)
        .catch((err) => sendResponse({ error: err.message }));
      return true; // 保持异步消息通道
    }
  };

  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}
