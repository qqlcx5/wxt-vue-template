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
7. [Content Script 选区感知与 Shadow DOM 隔离](#7-content-script-选区感知与-shadow-dom-隔离)
8. [通用 AI 流式中枢引擎 (services/ai.ts)](#8-通用-ai-流式中枢引擎-servicesaits)
9. [本地数据库与全文检索 (Dexie + MiniSearch)](#9-本地数据库与全文检索-dexie--minisearch)

---

## 1. 扩展入口点结构 (Entrypoints)

WXT 使用基于约定的文件路由，全部位于 `entrypoints/` 目录下：

| 文件 / 目录路径 | 对应扩展能力 | 运行环境与特性 |
| :--- | :--- | :--- |
| `entrypoints/popup/` | 扩展弹出窗口 (Popup) | 临时 DOM 窗口，点击图标展开，移开即销毁。适合高频快速预览与控制 |
| `entrypoints/sidepanel/` | 浏览器原生右侧边栏 | 长期停靠侧边栏 (Chrome 114+)。内置 AI 对话、便笺与文章库 |
| `entrypoints/chat/` | 全屏独立 AI 工作台 (Studio) | 独占标签页大屏工作区 (`/chat.html`)。会话管理、流式对话、Markdown 导出 |
| `entrypoints/options/` | 扩展偏好设置管理后台 | 独立大屏控制台，macOS 系统设置风格。支持 API 连通性测速与模型配置 |
| `entrypoints/background.ts` | 后台服务工作者 (Service Worker) | 无 DOM、事件驱动、自动休眠/唤醒。负责右键菜单、快捷键与定时任务 |
| `entrypoints/content.ts` | 内容脚本 (Content Script) | 全网网页注入执行，以 Shadow DOM 挂载划词悬浮胶囊与右下角快捷面板 |

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

## 7. Content Script 选区感知与 Shadow DOM 隔离

向宿主页面注入 UI 时，务必采用 Shadow DOM 挂载以杜绝样式互染。

### 1. 选区感知 Composable (`composables/useSelection.ts`)
支持在任何网页圈选文字时，精确获取其绝对视口坐标与防壁碰撞：
```typescript
import { useTextSelection } from './composables/useSelection';

const { selectedText, position, isVisible, clearSelection } = useTextSelection();
```

### 2. 标准注入脚本 (`entrypoints/content.ts`)
```typescript
import { createApp } from 'vue';
import { pinia } from '@/stores';
import ContentApp from './content/ContentApp.vue';
import 'virtual:uno.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'wxt-shadow-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(ContentApp);
        app.use(pinia);
        app.mount(container);
        return app;
      },
      onRemove: (app) => app?.unmount(),
    });

    ui.mount();
  },
});
```

---

## 8. 通用 AI 流式中枢引擎 (`services/ai.ts`)

封装了基于 `eventsource-parser` 的通用 SSE 流式大模型调用器，不绑定任何单一模型或业务场景，跨模型适配 **OpenAI、DeepSeek、Claude、Gemini 以及本地 Ollama (localhost:11434)**，自带打字机输出、主动中断 (`AbortController`)、指数退避重试 (429/503) 与 Token 消耗预估。

### 1. 通用流式调用 `streamChat`
```typescript
import { streamChat } from '@/services/ai';

const handle = streamChat({
  model: 'gpt-6.1-sol', // 或 'deepseek', 'claude35', 'gemini15', 'ollama'
  messages: [
    { role: 'system', content: '你是一位资深技术专家。' },
    { role: 'user', content: '请解释什么是 Manifest V3。' },
  ],
  onChunk: (delta, accumulated) => {
    console.log('当前流式切片:', delta);
    console.log('累积文本:', accumulated);
  },
  onFinish: (fullText, stats) => {
    console.log('生成完成:', fullText);
    console.log('Token 统计:', stats.estimatedTokens);
  },
  onError: (err) => {
    console.error('调用出错:', err.message);
  },
});

// 支持随时主动中断
// handle.abort();
```

### 2. 多服务商体系与动态模型探测 (`types/ai.ts` & `services/ai.ts`)
脚手架开箱支持 **自定义网关、OpenAI、DeepSeek、Claude、Gemini、Ollama、OpenRouter、硅基流动、Kimi** 等服务商独立并行管理：
```typescript
import { testProviderConnection, fetchRemoteModels } from '@/services/ai';

// 1. 服务商连通性与 Ping 延时测试
const pingRes = await testProviderConnection('custom', 'gpt-6.1-sol');
if (pingRes.success) {
  console.log(`Ping 成功，延迟: ${pingRes.latencyMs}ms`);
}

// 2. 远程可用模型动态探测 (GET /v1/models)
const modelsRes = await fetchRemoteModels('custom');
if (modelsRes.success) {
  console.log('远程支持的模型列表:', modelsRes.models);
}
```

### 3. 精细超参数与场景分流路由 (Parameters & Routing)
- **推理超参数**：`temperature` (0.0-2.0)、`topP` (0.0-1.0)、`maxTokens`、`presencePenalty`、`frequencyPenalty`、`contextRounds` (多轮历史智能截断)；
- **场景路由分派**：为全屏工作台 (`chatStudioModel`)、侧边栏 (`sidepanelModel`)、划词悬浮菜单 (`selectionModel`)、网页提取 (`summaryModel`) 分别绑定最适模型；
- **系统角色词库**：预置 6 款专家人设（全栈架构师、双语审校、极简摘要、学术润色、深度推理），支持自定义添加。

### 4. 四大 AI 交互场景完整覆盖
脚手架为 AI 功能实现了全套专属 Apple 设计风格的 UI 界面：
1. **全屏独立工作台 (`/chat.html` / `entrypoints/chat/`)**：
   - 类似 ChatGPT/Claude 独立全屏大页，具备左侧多会话列表、历史检索、重命名与删除。
   - 顶栏配备 Apple 胶囊风格的**实时模型切换**与**专家人设切换**下拉组件。
   - 主屏支持流式打字机输出、实时停止生成、一键复制与 Markdown 文件导出。
   - 底部内置快捷 Prompt Chips（3点速览、代码重构、双语翻译）。
2. **原生侧边栏常驻 Copilot (`entrypoints/sidepanel/App.vue`)**：
   - 首个默认标签页即为 AI 对话。
   - 支持**「附带当前网页上下文」**开关，对话时自动读取当前活动标签页的 URL、Title 与正文片段。
3. **弹出层极速随手问 (`entrypoints/popup/App.vue`)**：
   - Popup 首页默认进入「AI 随身问」模式。
   - 快速解答日常疑问，支持结果一键转存至侧边栏便笺或直接复制。
   - 右上角一键无缝跳转全屏 AI Studio。
4. **Options 设置中心健康诊断 (`entrypoints/options/App.vue`)**：
   - 实时调节模型、Temperature 创造力滑块与系统角色设定 (System Prompt)。
   - 提供「测试 API 连通性 (Ping)」实时网络健康检测按钮。

### 4. 常用业务 Prompt 流水线
- `summarizePageWithDefuddle(html, url, options)`: 结合 Defuddle 算法提取正文并输出 3 点核心提炼。
- `explainAndOptimizeCode(code, language, options)`: 详细逐行解释代码逻辑并输出重构方案。
- `academicPolish(text, options)`: 顶级学术论文/技术文档级中英文专业润色。
- `bilingualTranslate(text, targetLang, options)`: 忠实保留术语与语境的双语翻译。
- `explainContent(text, options)`: 划词悬浮胶囊一键通俗解释。
- `summarizeContent(text, options)`: 快速 3 点要点摘要。

---

## 9. 网页交互杀手锏：元素剪藏与快照截图

### 1. 网页元素拾取剪藏器 (`useElementClipper.ts` & `ElementClipper.vue`)
类似印象笔记与 Notion 剪藏体验：
- 鼠标滑过任何网页 DOM 节点时，自动显示苹果蓝半透明高亮选框与 `<tag>` 尺寸徽章。
- 单击即时锁定目标区块，精准提取该节点的 Clean Text 与完整 HTML 代码。
- 自动避开 `#wxt-shadow-ui` 扩展容器，绝不污染宿主网页。
- 支持快捷键 `Esc` 退出拾取模式。

```typescript
import { useElementClipper } from '@/entrypoints/content/composables/useElementClipper';

const { isClipperActive, hoveredInfo, selectedInfo, startClipper, stopClipper } = useElementClipper();

// 启动元素拾取
startClipper();
```

### 2. 网页可视区域快照截图 (`services/screenshot.ts`)
封装 Chrome MV3 `browser.tabs.captureVisibleTab`：
```typescript
import { captureVisibleScreenshot, downloadScreenshot, saveScreenshotToArticles } from '@/services/screenshot';

// 1. 捕获高画质 Base64 PNG 快照
const dataUrl = await captureVisibleScreenshot();

// 2. 自动下载为本地 PNG 图片
downloadScreenshot(dataUrl, 'snapshot.png');

// 3. 同时存入本地 Dexie 知识库
await saveScreenshotToArticles(dataUrl, '网页快照');
```

---

## 10. 高保真 Markdown 代码高亮组件 (`MarkdownViewer.vue`)

专为 AI 流式输出与代码块展示量身定制：
- 引入轻量级 `highlight.js`，支持 JavaScript, TypeScript, Python, HTML, CSS, JSON, Bash 等常见语言自动高亮。
- 采用 macOS 原生交通灯 (红黄绿) 三色控制点设计视窗卡片，配备语言标签与一键复制代码按钮。
- 同步支持行内粗体、行内代码、引用块与多级标题渲染。

```vue
<script setup>
import { MarkdownViewer } from '@/components/ui';
</script>

<template>
  <MarkdownViewer :content="aiResponse" />
</template>
```

---

## 11. 本地数据库与全文检索 (Dexie + MiniSearch)

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
