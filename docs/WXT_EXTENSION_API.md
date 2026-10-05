# WXT 浏览器扩展核心架构与 API 指南

本项目基于 [WXT (Web Extension Toolbox)](https://wxt.dev) 构建，严格遵循 Chrome Manifest V3 (MV3) 规范。

日常开发扩展无需反复翻查 Chrome 官方英文文档，核心机制与代码模板已汇总于本指南。

---

## 目录
1. [扩展入口点结构 (Entrypoints)](#1-扩展入口点结构-entrypoints)
2. [跨上下文响应式存储 (Storage API)](#2-跨上下文响应式存储-storage-api)
3. [端到端强类型通信 (Messaging API)](#3-端到端强类型通信-messaging-api)
4. [Content Script 与 Shadow DOM 样式隔离](#4-content-script-与-shadow-dom-样式隔离)
5. [Pinia 持久化与 MV3 安全规范](#5-pinia-持久化与-mv3-安全规范)
6. [数据与服务层使用 (Dexie + Defuddle)](#6-数据与服务层使用-dexie--defuddle)
7. [新增 Options 页面与 Sidepanel 侧边栏](#7-新增-options-页面与-sidepanel-侧边栏)

---

## 1. 扩展入口点结构 (Entrypoints)

WXT 使用基于约定的文件路由，放置在 `entrypoints/` 目录下即可自动识别：

| 文件 / 目录路径 | 对应扩展能力 | 运行环境 |
| :--- | :--- | :--- |
| `entrypoints/popup/` | 扩展弹出窗口 (Popup) | 临时 DOM 窗口，点击图标展开，移开即销毁 |
| `entrypoints/background.ts` | 后台服务工作者 (Service Worker) | 无 DOM、事件驱动、自动休眠/唤醒 |
| `entrypoints/content.ts` | 内容脚本 (Content Script) | 注入目标网页的上下文中执行 |
| `entrypoints/options/` *(可选)* | 扩展完整配置页 | 独立全屏或嵌入设置标签页 |
| `entrypoints/sidepanel/` *(可选)* | 浏览器原生右侧边栏 | 长期停靠侧边栏 (Chrome 114+) |

---

## 2. 跨上下文响应式存储 (Storage API)

### 为什么不用 `localStorage`？
- Chrome MV3 的 Service Worker (Background) 中**完全没有 `localStorage` API**。
- Popup 的 `localStorage` 无法与 Content Script 共享。

### WXT 响应式持久化最佳实践
在 `utils/storage.ts` 中使用 `storage.defineItem`：
```typescript
import { storage } from 'wxt/utils/storage';

// 1. 定义强类型存储项（默认存储于 chrome.storage.local）
export const userConfigStorage = storage.defineItem<{ apiKey: string; autoSync: boolean }>('local:userConfig', {
  defaultValue: { apiKey: '', autoSync: false },
});

// 2. 在任何环境读取
const config = await userConfigStorage.getValue();

// 3. 写入值（会自动通知所有正在监听的页面）
await userConfigStorage.setValue({ apiKey: 'sk-123456', autoSync: true });

// 4. 监听变化（Popup, Background, Content 均可响应式收到更新）
const unwatch = userConfigStorage.watch((newVal, oldVal) => {
  console.log('配置已更新:', newVal);
});
```

---

## 3. 端到端强类型通信 (Messaging API)

本项目在 `utils/messaging.ts` 中封装了端到端类型安全的消息通信。

### 1. 注册消息类型
编辑 `utils/messaging.ts`：
```typescript
export interface ExtensionMessages {
  GET_PAGE_DATA: {
    request: { tabId: number };
    response: { title: string; wordCount: number };
  };
}
```

### 2. 在 Background 中监听
```typescript
// entrypoints/background.ts
import { onExtensionMessage } from '@/utils/messaging';

export default defineBackground(() => {
  onExtensionMessage('GET_PAGE_DATA', async (data) => {
    // 异步处理并返回数据
    return { title: '目标标题', wordCount: 1200 };
  });
});
```

### 3. 在 Popup 或任何地方发起调用
```typescript
// entrypoints/popup/App.vue
import { sendToBackground } from '@/utils/messaging';

const res = await sendToBackground('GET_PAGE_DATA', { tabId: 101 });
console.log(res.title, res.wordCount);
```

---

## 4. Content Script 与 Shadow DOM 样式隔离

向宿主页面注入 UI 时，务必采用 Shadow DOM 挂载以杜绝样式互染。

### 标准模板 (`entrypoints/content.ts`)
```typescript
import { createApp } from 'vue';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  cssInjectionMode: 'ui', // 由 WXT 自动打包 UnoCSS 样式并注入 Shadow Root
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-shadow-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(ContentApp);
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
```

---

## 5. Pinia 持久化与 MV3 安全规范

若您在项目中习惯使用 Pinia 全局状态管理，请配置我们提供的 `extensionPiniaStorage` 适配器：

```typescript
import { defineStore } from 'pinia';
import { extensionPiniaStorage } from '@/utils/storage';

export const useAppStore = defineStore('app', {
  state: () => ({
    token: '',
    bookmarks: [],
  }),
  persist: {
    storage: extensionPiniaStorage, // 安全桥接到 browser.storage.local
  },
});
```

---

## 6. 数据与服务层使用 (Dexie + Defuddle)

### 1. IndexedDB 存储 (`services/db.ts`)
适合存储大量离线数据、历史文章或用户标记：
```typescript
import { db } from '@/services/db';

// 插入数据
await db.articles.add({
  url: 'https://example.com/post',
  title: '文章标题',
  content: '## 正文内容...',
  createdAt: Date.now(),
  tags: ['前端', 'Vue'],
});

// 查询数据
const allArticles = await db.articles.orderBy('createdAt').reverse().toArray();
```

### 2. 网页正文提取与检索 (`services/extractor.ts`)
```typescript
import { extractWebContent, createSearchIndex } from '@/services/extractor';

// 1. 抓取正文（自动剔除广告、导航条并清洗 HTML）
const article = await extractWebContent(document);
console.log(article.title, article.wordCount);

// 2. 建立本地全文索引
const searchIndex = createSearchIndex();
searchIndex.add({ id: 1, title: article.title, content: article.content });

// 3. 搜索匹配
const results = searchIndex.search('Vue 3');
```

---

## 7. 新增 Options 页面与 Sidepanel 侧边栏

若后续功能扩展需要更多入口，只需在 `entrypoints/` 下新建对应文件夹：

### 新增 Options 设置页
1. 创建目录 `entrypoints/options/`
2. 新建 `index.html`:
   ```html
   <!DOCTYPE html>
   <html>
     <body>
       <div id="app"></div>
       <script type="module" src="./main.ts"></script>
     </body>
   </html>
   ```
3. 新建 `main.ts` 与 `App.vue`，即可拥有独立的扩展设置面板。

### 新增 Sidepanel 侧边栏 (Chrome 114+)
1. 创建目录 `entrypoints/sidepanel/`
2. 新建 `index.html`、`main.ts` 与 `App.vue`
3. 在 `wxt.config.ts` 中声明权限：
   ```typescript
   manifest: {
     permissions: ['storage', 'sidePanel'],
   }
   ```
WXT 会自动在编译时输出合规的 Chrome MV3 侧边栏配置。
