# WXT 浏览器扩展核心架构与 API 指南

本项目基于 [WXT (Web Extension Toolbox)](https://wxt.dev) 构建，严格遵循 Chrome Manifest V3 (MV3) 规范，并具备全套 **Popup + Side Panel + Options + Content Script + Background** 五重扩展形态。

日常开发扩展无需反复翻查 Chrome 官方英文文档，核心机制与代码模板已汇总于本指南。

---

## 目录
1. [扩展入口点结构 (Entrypoints)](#1-扩展入口点结构-entrypoints)
2. [全功能响应式状态层 (Pinia Stores)](#2-全功能响应式状态层-pinia-stores)
3. [跨上下文响应式存储 (Storage API)](#3-跨上下文响应式存储-storage-api)
4. [端到端强类型通信 (Messaging API)](#4-端到端强类型通信-messaging-api)
5. [后台服务中枢 (Context Menus, Commands, Alarms)](#5-后台服务中枢-context-menus-commands-alarms)
6. [Side Panel 侧边栏与 Options 独立设置页](#6-side-panel-侧边栏与-options-独立设置页)
7. [Content Script 与 Shadow DOM 样式隔离](#7-content-script-与-shadow-dom-样式隔离)
8. [本地数据库与全文检索 (Dexie + MiniSearch)](#8-本地数据库与全文检索-dexie--minisearch)

---

## 1. 扩展入口点结构 (Entrypoints)

WXT 使用基于约定的文件路由，全部位于 `entrypoints/` 目录下：

| 文件 / 目录路径 | 对应扩展能力 | 运行环境与特性 |
| :--- | :--- | :--- |
| `entrypoints/popup/` | 扩展弹出窗口 (Popup) | 临时 DOM 窗口，点击图标展开，移开即销毁。适合高频快速预览与控制 |
| `entrypoints/sidepanel/` | 浏览器原生右侧边栏 | 长期停靠侧边栏 (Chrome 114+)。适合查资料、写便笺、多任务常驻 |
| `entrypoints/options/` | 扩展偏好设置管理后台 | 独立大屏控制台，macOS 系统设置风格。适合数据导入导出、API Key 维护 |
| `entrypoints/background.ts` | 后台服务工作者 (Service Worker) | 无 DOM、事件驱动、自动休眠/唤醒。负责右键菜单、快捷键与定时任务 |
| `entrypoints/content.ts` | 内容脚本 (Content Script) | 注入目标网页上下文中执行，以 Shadow DOM 挂载浮动工具球与悬浮面板 |

---

## 2. 全功能响应式状态层 (Pinia Stores)

脚手架在 `stores/` 目录下提供了完整的状态管理架构，跨 Popup、SidePanel、Options 响应式即时同步：

### `useSettingsStore` (`stores/settings.ts`)
持久化保存扩展的全局配置：
- `theme`: 明暗模式切换 (`'light' | 'dark' | 'auto'`)
- `autoSync`: 云端自动备份开关
- `extractorEnabled`: 网页正文清洗开关
- `notificationEnabled`: 系统桌面通知开关
- `showBadge`: 图标状态角标开关
- `selectedModel`: 默认推理模型（如 `'gpt4o'`, `'claude35'`, `'deepseek'`）
- `memoNote`: 随手速记便笺内容（跨端双向自动同步）
- `openaiKey`, `deepseekKey`, `customEndpoint`: AI 访问凭证

### `useArticlesStore` (`stores/articles.ts`)
与本地 IndexedDB (Dexie) 绑定的响应式文章库：
```typescript
import { useArticlesStore } from '@/stores';

const articlesStore = useArticlesStore();

// 1. 加载全部文章
await articlesStore.loadArticles();

// 2. 添加抓取快照
await articlesStore.addArticle({
  url: 'https://example.com',
  title: '文章标题',
  content: '## 正文内容...',
  tags: ['网页提取'],
  createdAt: Date.now(),
});

// 3. 搜索与过滤
articlesStore.searchQuery = 'Vue 3';
console.log(articlesStore.filteredArticles);

// 4. 导出 JSON 备份
const json = await articlesStore.exportJSON();
```

---

## 3. 跨上下文响应式存储 (Storage API)

### 为什么不用 `localStorage`？
- Chrome MV3 的 Service Worker (Background) 中**完全没有 `localStorage` API**。
- Popup 的 `localStorage` 无法与 Content Script 共享。

### WXT 响应式持久化最佳实践
在 `utils/storage.ts` 中使用 `storage.defineItem`：
```typescript
import { storage } from 'wxt/utils/storage';

export const userConfigStorage = storage.defineItem<{ apiKey: string; autoSync: boolean }>('local:userConfig', {
  defaultValue: { apiKey: '', autoSync: false },
});

// 读取
const config = await userConfigStorage.getValue();
// 写入
await userConfigStorage.setValue({ apiKey: 'sk-123456', autoSync: true });
// 监听变化
userConfigStorage.watch((newVal) => console.log('更新:', newVal));
```

---

## 4. 端到端强类型通信 (Messaging API)

在 `utils/messaging.ts` 中封装了端到端类型安全的消息通信。

### 消息协议定义
- `GET_CURRENT_TAB`: 获取当前活跃标签页的 ID、URL、Title
- `PING`: 心跳检测
- `OPEN_SIDEPANEL`: 编程呼出右侧边栏
- `OPEN_OPTIONS`: 编程打开全屏偏好设置页
- `SET_BADGE`: 动态更新浏览器图标角标文字与底色
- `SAVE_ARTICLE`: 向后台提交离线文章存储请求

### 发起调用
```typescript
import { sendToBackground } from '@/utils/messaging';

// 呼出侧边栏
await sendToBackground('OPEN_SIDEPANEL');

// 打开偏好设置
await sendToBackground('OPEN_OPTIONS');

// 设置角标
await sendToBackground('SET_BADGE', { text: '12', color: '#007AFF' });
```

---

## 5. 后台服务中枢 (Context Menus, Commands, Alarms)

全部集中于 `entrypoints/background.ts` 调度：

### 1. 右键菜单 (Context Menus)
- *在侧边栏中打开工作台*：自动获取当前 Window 并呼出 Sidepanel。
- *提取当前网页纯净正文*：自动捕获并存入 Dexie 离线库，绿标闪烁。
- *打开系统偏好设置*：唤起 Options 面板。

### 2. 快捷键系统 (Commands)
在 `wxt.config.ts` 中预设，可在 `chrome://extensions/shortcuts` 中由用户自由修改：
- `⌘⇧Y` / `Ctrl+Shift+Y`: 快速激活 Popup 弹窗。
- `⌘⇧S` / `Ctrl+Shift+S`: 全局呼出右侧边栏。
- `⌘⇧E` / `Ctrl+Shift+E`: 静默提取当前标签页正文。

### 3. 安全定时任务 (Alarms)
Service Worker 在 30 秒无操作后会自动休眠，脚手架通过 `browser.alarms` 实现可靠后台心跳，杜绝 `setInterval` 丢失。

---

## 6. Side Panel 侧边栏与 Options 独立设置页

### 侧边栏 (`entrypoints/sidepanel/`)
- 包含 3 大核心功能卡片：
  1. **速记便笺**：实时双向持久化，字数统计与一键复制。
  2. **网页提取**：一键捕获当前标签页 URL 与正文纯净快照。
  3. **离线文库**：即时搜索、删除与标签展示。

### 独立设置页 (`entrypoints/options/`)
- macOS 系统偏好设置分栏布局：
  - **通用偏好**：深色模式、角标开关、自动清洗。
  - **系统快捷键**：指令清单与一键跳转 Chrome 快捷键设置面板。
  - **数据与存储**：冷备份导出 JSON、从 JSON 文件批量恢复、清空本地库（带二次确认）。
  - **AI 模型引擎**：选择首选大模型、配置 OpenAI / DeepSeek API Key 与中转 URL。
  - **关于扩展**：脚手架版本与技术架构说明。

---

## 7. Content Script 与 Shadow DOM 样式隔离

向宿主页面注入 UI 时，务必采用 Shadow DOM 挂载以杜绝样式互染。

### 标准模板 (`entrypoints/content.ts`)
```typescript
import { createApp } from 'vue';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'wxt-shadow-ui',
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

## 8. 本地数据库与全文检索 (Dexie + MiniSearch)

### 1. IndexedDB 存储 (`services/db.ts`)
```typescript
import { db } from '@/services/db';

await db.articles.add({
  url: 'https://example.com/post',
  title: '文章标题',
  content: '## 正文内容...',
  createdAt: Date.now(),
  tags: ['前端', 'Vue'],
});
```

### 2. 网页正文提取与检索 (`services/extractor.ts`)
```typescript
import { extractWebContent, createSearchIndex } from '@/services/extractor';

const article = await extractWebContent(document);
const searchIndex = createSearchIndex();
searchIndex.add({ id: 1, title: article.title, content: article.content });
const results = searchIndex.search('Vue 3');
```
