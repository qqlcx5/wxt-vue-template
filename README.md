# 🚀 Chrome Vue Starter · 生产级 WXT + Vue 3 扩展脚手架

<div align="center">

<p align="center">
  <strong>现代化、高性能的 Chrome / Web 扩展 (Manifest V3) 开箱即用模版</strong><br />
  基于 WXT + Vue 3 + UnoCSS + Reka UI 构建，深度整合 Apple HIG 设计美学与通用 AI 大模型流式中枢。
</p>

<p align="center">
  <a href="https://wxt.dev"><img src="https://img.shields.io/badge/WXT-0.21.3-blue?style=flat-square&logo=googlechrome&logoColor=white" alt="WXT" /></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue.js-3.5-42b883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://unocss.dev"><img src="https://img.shields.io/badge/UnoCSS-v66-333333?style=flat-square&logo=unocss&logoColor=white" alt="UnoCSS" /></a>
  <a href="https://reka-ui.com"><img src="https://img.shields.io/badge/Reka_UI-2.10-007AFF?style=flat-square" alt="Reka UI" /></a>
  <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Chrome-Manifest_V3-success?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-amber?style=flat-square" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="#-特性亮点">特性亮点</a> •
  <a href="#-全景入口覆盖">全景入口</a> •
  <a href="#-通用-ai-大模型接入">通用 AI 对接</a> •
  <a href="#-目录架构">目录架构</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-工程化基建">工程化基建</a> •
  <a href="#-github-检索与曝光推荐">SEO 推荐</a>
</p>

</div>

---

## 🌟 为什么选择这个脚手架？

开发 Chrome 扩展（Manifest V3）常常面临诸多痛点：
- ❌ **MV3 生命周期限制**：Background Service Worker 频繁休眠导致状态丢失、跨上下文通信代码混乱；
- ❌ **样式污染严重**：注入到宿主网页的内容脚本（Content Script）容易与目标网站的 CSS 产生冲突；
- ❌ **AI 接入包袱重**：接入大模型动辄引入数十个各大厂商专属 SDK，打包体积膨胀、升级易破坏；
- ❌ **缺少质感 UI**：从零搭建毛玻璃、暗黑模式切换和原生组件耗费大量时间。

**Chrome Vue Starter** 专为解决这些问题而生：
- 💎 **通用 OpenAI 兼容协议中枢**：零厂商 SDK 依赖，支持全球任意兼容接口（DeepSeek、OpenAI、通义千问、Kimi、Ollama 本地大模型等），内置 SSE 流式打字机与思维链（Reasoning）捕获。
- 🍎 **Apple Human Interface Guidelines 级美学**：基于 UnoCSS + Reka UI (原 Radix Vue)，精致的磨砂毛玻璃、微动效与暗黑主题。
- 🛡️ **生产级工程化**：Shadow DOM 隔离、强类型端到端 RPC 消息总线、MV3 安全 Pinia 持久化、DOM 事件屏障与全套自动化测试。

---

## ✨ 特性亮点

### 🤖 1. 通用 AI 大模型中枢 (Universal OpenAI-Compatible)
- **零 SDK 依赖**：基于原生 `fetch` 与 `eventsource-parser`，打包体积几乎为 0kb。
- **协议大一统**：完全遵循行业标准的 `POST /v1/chat/completions` 与 SSE 流式响应。
- **前沿模型思维链（Reasoning）捕获**：原生解析 `delta.reasoning_content` 与 `delta.thought`，完美支持 DeepSeek-R1、Qwen-Thinking、o1 等思考型模型。
- **智能 Base URL 标准化**：自动修复多余斜杠、误填路径（如 `/chat/completions`）与协议头补齐。
- **本地大模型支持**：针对 Ollama、vLLM、LocalAI 等本地 `localhost:11434` 端点自动放行免密调用。
- **动态模型探测**：支持一键向 `/v1/models` 请求可用模型列表，并支持实时连通性与 Ping 延时测试。

### 🎨 2. 现代原子化 CSS 与 Apple 级设计系统
- **UnoCSS v66+**：预置 `presetWind3`、`presetAttributify`、`presetTypography`，秒级极速热重载。
- **纯 CSS 遮罩图标**：集成 `@unocss/preset-icons` + `@iconify-json/lucide`，无需引入庞大 SVG 组件，仅需 `i-lucide-sparkles` 即可渲染。
- **高阶 UI 组件库**：在 `components/ui/` 中封装了 Button、Select、Slider、Switch、Badge、Tooltip、Dialog、Tabs 等高复用无障碍组件。
- **全局自适应暗黑模式**：基于 `@vueuse/core` 的 `useDark()` 统一接管浅色/深色主题持久化。

### 📑 3. 内容提取与专业 Markdown 渲染管线
- **Defuddle 正文提取器**：一键去除广告与导航噪点，智能提炼文章核心内容与标题。
- **专业 Markdown 管道**：
  - **KaTeX 公式渲染**：原生支持行内 `$E=mc^2$` 与独立块级公式。
  - **macOS 交通灯代码视窗**：带红黄绿控制点、语法高亮与一键复制。
  - **GFM 表格与 Callout 提示框**：优雅渲染 Note / Tip / Warning / Caution 警示卡片。
  - **AST 语义分块**：支持段落级双语对照翻译与结构化要点萃取。

---

## 🧩 全景入口覆盖

项目预置了完整的 Chrome Extension 核心场景入口，各自职责明确且相互打通：

| 场景入口 | 对应路径 | 核心能力与场景定位 |
| :--- | :--- | :--- |
| **快捷弹窗 (Popup)** | `entrypoints/popup/` | 工具栏点击即开，集成即时速览、随手速记便笺与快捷模型对话 |
| **原生侧边栏 (SidePanel)** | `entrypoints/sidepanel/` | Chrome 原生侧边栏 Copilot，支持伴随当前网页多任务查阅、一键提取正文与交互提问 |
| **偏好设置 (Options)** | `entrypoints/options/` | 全功能配置中心，涵盖通用 API 网关配置、超参数微调、场景分流路由与角色词库管理 |
| **全屏对话工作台 (Chat Studio)** | `entrypoints/chat/` | 独立 Tab 全屏 AI 聊天环境，支持多轮会话隔离、打字机流式输出与导出 Markdown |
| **沉浸式阅读器 (Reader)** | `entrypoints/reader/` | 深度阅读视图，支持正文重排、双语对照、公式渲染与目录层级大纲 |
| **内容脚本 (Content Script)** | `entrypoints/content.ts` | 采用 WXT 的 `createShadowRootUi` 挂载 Vue 悬浮胶囊，100% 隔离样式并自带事件屏障 |
| **后台中枢 (Background)** | `entrypoints/background.ts` | MV3 常驻服务，接管强类型 RPC 消息路由、右键菜单 (ContextMenus) 与快捷键绑定 |

---

## 🚀 快速开始

### 1. 环境准备
确保已安装 Node.js 18+ 与 pnpm：
```bash
node -v
pnpm -v
```

### 2. 获取代码与安装依赖
```bash
# 克隆仓库
git clone https://github.com/your-username/chrome-vue-template.git
cd chrome-vue-template

# 安装依赖
pnpm install
```

### 3. 本地启动开发
```bash
# 启动 Chrome 扩展热重载开发服务器（将自动唤起带有插件的专用测试浏览器）
pnpm dev

# 若需开发 Firefox 扩展
pnpm dev:firefox
```

### 4. 构建与打包
```bash
# 严格 TypeScript 类型校验 (vue-tsc)
pnpm compile

# 自动化测试验证 (RPC 通信 / Storage / Event Shield / Markdown / 通用 AI 引擎)
pnpm test

# 生产环境打包 (输出到 .output/chrome-mv3)
pnpm build

# 打包为 Chrome Web Store 发布用 Zip 归档
pnpm zip
```

---

## 🤖 通用 AI 大模型接入指南

无论是公有云 API（如 DeepSeek、OpenAI、阿里云通义千问、Kimi、SiliconFlow），还是自建中转网关、本地 Ollama，只要支持 OpenAI 兼容的 `/v1/chat/completions` 格式，均可 1 分钟接入。

### 1. 扩展设置中心配置
在扩展 **偏好设置 (Options)** 页面中：
1. 填入 **Base URL**（例如 `https://api.deepseek.com/v1` 或 `http://localhost:11434/v1`）；
2. 填入 **API Key**（本地 Ollama 可免填）；
3. 点击 **Ping 测试** 验证网络延迟，或点击 **一键探测可用模型** 自动拉取模型列表。

#### 常用服务商参考端点：
| 厂商/平台 | 基础端点 (Base URL) | 典型推荐模型 |
| :--- | :--- | :--- |
| **DeepSeek (深度求索)** | `https://api.deepseek.com/v1` | `deepseek-chat`, `deepseek-reasoner` |
| **OpenAI 官方** | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini`, `o3-mini` |
| **阿里云百炼 (通义千问)** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-turbo`, `qwen-max` |
| **SiliconFlow (硅基流动)** | `https://api.siliconflow.cn/v1` | `deepseek-ai/DeepSeek-V3`, `deepseek-ai/DeepSeek-R1` |
| **Ollama (本地离线)** | `http://localhost:11434/v1` | `llama3.2`, `deepseek-r1:8b`, `qwen2.5:7b` |
| **OpenRouter (一站聚合)** | `https://openrouter.ai/api/v1` | `anthropic/claude-3.5-sonnet`, `google/gemini-2.0-flash` |

### 2. 代码中调用通用流式对话
```typescript
import { streamChat } from '@/services/ai';

// 发起流式打字机对话
const handle = streamChat({
  messages: [
    { role: 'system', content: '你是一位精通前端架构的专家。' },
    { role: 'user', content: '请解析 Vue 3 组合式 API 的优势。' },
  ],
  // 实时捕获普通文字增量
  onChunk: (delta, accumulated) => {
    console.log('增量词块:', delta);
  },
  // 实时捕获思维链 (DeepSeek-R1 / 思考过程)
  onReasoningChunk: (deltaReasoning, accumulatedReasoning) => {
    console.log('思考中:', deltaReasoning);
  },
  // 生成完成与 Token 统计
  onFinish: (fullText, stats) => {
    console.log('最终产物:', fullText);
    console.log('消耗统计:', stats);
  },
  onError: (error) => {
    console.error('通信失败:', error.message);
  },
});

// 可随时主动中断流式输出
// handle.abort();
```

---

## 📁 目录架构

```text
├── .agents/skills/            # 智能体设计规范 (如 floating-edge-dock 悬浮胶囊设计体系)
├── components/                # Vue 业务组件与原子 UI 库
│   └── ui/                    # 基于 Reka UI + UnoCSS 的高阶原子组件 (Button, Dialog, Select, etc.)
├── core/                      # 核心系统级工程化基建
│   ├── dom/                   # Content Script DOM 事件屏障 (Event Shield 防网页冒泡)
│   ├── env/                   # 运行环境探测与 Web Preview Mock API 自动化层
│   ├── logger/                # 统一前缀结构化控制台日志器
│   ├── messaging/             # 端到端强类型 RPC 通信总线
│   └── storage/               # 针对 Background Service Worker 强化的持久化驱动
├── docs/                      # 📚 深度开发指南与 API 文档
│   ├── UI_COMPONENTS.md       # UI 原子组件属性与调用清单
│   ├── UNOCSS_GUIDE.md        # UnoCSS 预设、图标与类名速查
│   └── WXT_EXTENSION_API.md   # WXT MV3 通信、生命周期与存储指南
├── entrypoints/               # 🧩 Chrome 扩展各场景入口
│   ├── background.ts          # Background Service Worker 核心事件路由
│   ├── chat/                  # 全屏独立 AI 对话工作台 (Chat Studio)
│   ├── content.ts             # 页面注入脚本 (Shadow DOM 隔离)
│   ├── options/               # 偏好设置管理中心 (Options Page)
│   ├── popup/                 # 快捷工具栏弹出窗 (Popup)
│   ├── reader/                # 沉浸式深度阅读视图 (Reader)
│   └── sidepanel/             # Chrome 原生侧边栏 (Sidepanel Copilot)
├── services/                  # 服务逻辑层
│   ├── ai.ts                  # 通用 OpenAI 兼容 AI 中枢引擎 (SSE / 思维链 / 容错标准化)
│   ├── db.ts                  # Dexie.js 响应式 IndexedDB 数据库
│   ├── extractor.ts           # Defuddle 正文提取与 MiniSearch 检索引擎
│   └── screenshot.ts          # 页面可视区域静默截屏服务
├── stores/                    # Pinia 状态管理层 (具备 Chrome LocalStorage 双向持久化)
│   ├── articles.ts            # 阅读列表与书签状态
│   └── settings.ts            # 全局配置、主题、通用模型与场景路由
├── utils/                     # 共享工具类库
│   ├── cn.ts                  # Tailwind / UnoCSS 类名合并工具
│   └── markdown/              # KaTeX / macOS 代码块 / Callout / AST 分块解析管线
├── test-core.mjs              # 核心基建端到端自动化测试
├── test-pipeline.mjs          # Markdown 渲染与 AST 语义分块测试
├── uno.config.ts              # UnoCSS 配置文件
└── wxt.config.ts              # WXT 扩展配置文件
```

---

## 🛡️ 工程化基建

### 1. 跨上下文强类型 RPC 消息通信 (`core/messaging`)
无需再手写脆弱的 `chrome.runtime.sendMessage` 和难以追踪的字符串 Action：
```typescript
import { sendMessage, onMessage } from '@/core/messaging';

// 监听指定 RPC 协议
const unregister = onMessage('PING', async (payload) => {
  return { pong: true, time: Date.now() };
});

// 类型安全调用
const result = await sendMessage('PING', { timestamp: Date.now() });
```

### 2. Content Script 事件隔离屏障 (`core/dom/eventShield.ts`)
在目标网页注入浮动窗口或快捷键面板时，宿主网页的键盘事件（如 `Escape`、空格、快捷键）常被误触发。脚手架内置针对键盘与鼠标冒泡的专用屏障：
```typescript
import { attachEventShield } from '@/core/dom/eventShield';

// 挂载到浮窗容器，自动阻断向外部宿主网页的无序冒泡
const unshield = attachEventShield(containerElement, { keyboard: true, mouse: true });
```

### 3. Web Preview Mock API 层 (`core/env/mockApi.ts`)
无需每次改动都重新打包加载到 Chrome 插件中。项目内置 Mock 探测层，可在普通浏览器或 Node.js 环境中模拟执行 `chrome.storage`、`chrome.tabs`、`chrome.runtime`，提供近乎原生的极速调试体验。

---

## 🏷️ GitHub 检索与曝光推荐 (SEO & Metadata)

为了让 GitHub 搜索算法与更多开发者能够轻松检索到您的仓库，建议在 GitHub 仓库主页右侧 **About** 栏进行如下配置：

### 1. Description (仓库简介)
```text
🚀 Production-ready Chrome Extension (Manifest V3) starter template built with WXT, Vue 3, UnoCSS, Reka UI & Apple HIG aesthetics. Features a universal OpenAI-compatible LLM engine (DeepSeek/OpenAI/Ollama) with SSE streaming & reasoning support.
```

### 2. Topics (仓库标签推荐)
在 GitHub 仓库的 **Manage topics** 填入以下高热度标签：
```text
chrome-extension, chrome-extension-template, browser-extension, wxt, vue3, unocss, reka-ui, manifest-v3, openai-compatible, deepseek, ollama, ai-extension, sidepanel, starter-template, apple-design, typescript, vite
```

---

## 🤝 贡献与反馈

欢迎提交 Issue、功能建议与 Pull Request！
如果这个脚手架对您的扩展开发有所启发或帮助，欢迎在 GitHub 上点亮一颗 ⭐️ **Star**！

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 协议开源。
