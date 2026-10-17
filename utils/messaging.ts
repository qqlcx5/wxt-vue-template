import {
  sendMessage,
  sendToTab,
  broadcastMessage,
  onMessage,
  type ExtensionProtocol,
  type ActionName,
} from '@/core/messaging';

export * from '@/core/messaging';

// 兼容既有命名别名
export type ExtensionMessages = ExtensionProtocol;
export type MessageKey = ActionName;
export const sendToBackground = sendMessage;
export const onExtensionMessage = onMessage;
