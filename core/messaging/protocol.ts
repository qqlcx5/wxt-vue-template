/**
 * 强类型跨上下文通信协议 (RPC Protocol Map)
 * 定义每种动作的输入参数与输出响应，TypeScript 编译器全程类型保障
 */

export interface ExtensionProtocol {
  // 基础系统与环境
  'get-current-tab': {
    request: void;
    response: { id?: number; url?: string; title?: string };
  };
  'ping': {
    request: { timestamp: number };
    response: { pong: boolean; time: number };
  };
  'set-badge': {
    request: { text: string; color?: string };
    response: { success: boolean };
  };

  // 窗口与页面路由
  'open-sidepanel': {
    request: void;
    response: { success: boolean; error?: string };
  };
  'open-options': {
    request: void;
    response: { success: boolean; error?: string };
  };
  'open-chat': {
    request: void;
    response: { success: boolean; error?: string };
  };
  'open-reader': {
    request: { articleId?: number; content?: string } | void;
    response: { success: boolean; error?: string };
  };

  // 截屏与页面提取
  'capture-screenshot': {
    request: { quality?: number } | void;
    response: { success: boolean; dataUrl?: string; error?: string };
  };
  'extract-page': {
    request: { url?: string } | void;
    response: { success: boolean; data?: any; error?: string };
  };
  'save-article': {
    request: {
      url: string;
      title: string;
      content: string;
      author?: string;
      tags?: string[];
    };
    response: { success: boolean; id?: number; error?: string };
  };

  // ----------------------------------------------------
  // 向下兼容现有的大写旧 Key (防止既有业务引用断裂)
  // ----------------------------------------------------
  'GET_CURRENT_TAB': ExtensionProtocol['get-current-tab'];
  'PING': ExtensionProtocol['ping'];
  'OPEN_SIDEPANEL': ExtensionProtocol['open-sidepanel'];
  'OPEN_OPTIONS': ExtensionProtocol['open-options'];
  'OPEN_CHAT': ExtensionProtocol['open-chat'];
  'OPEN_READER': ExtensionProtocol['open-reader'];
  'SET_BADGE': ExtensionProtocol['set-badge'];
  'CAPTURE_SCREENSHOT': ExtensionProtocol['capture-screenshot'];
  'EXTRACT_PAGE': ExtensionProtocol['extract-page'];
  'SAVE_ARTICLE': ExtensionProtocol['save-article'];
}

export type ActionName = keyof ExtensionProtocol;
