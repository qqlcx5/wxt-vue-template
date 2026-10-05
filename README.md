# WXT + Vue 3 + UnoCSS + Reka UI 生产级 Chrome 扩展脚手架

现代化、高性能的 Chrome Extension (Manifest V3) 开发模版，深度整合了 UnoCSS、Reka UI、VueUse 与扩展安全通信能力。

## ✨ 特性亮点

- **⚡️ 核心框架**：基于 [WXT](https://wxt.dev) + [Vue 3](https://vuejs.org) + [Vite](https://vitejs.dev) + [TypeScript](https://www.typescriptlang.org)。
- **🎨 原子化 CSS**：配置最新的 [UnoCSS](https://unocss.dev) (v66+)，预置 `presetWind3`、`presetAttributify`、`presetTypography`、`transformerDirectives` 与 `transformerVariantGroup`。
- **💎 纯 CSS 遮罩图标**：集成 `@unocss/preset-icons` + `@iconify-json/lucide`，0kb JS 运行时，通过类名（如 `i-lucide-sun`、`i-lucide-check`）直接渲染 SVG。
- **🧩 现代化 UI 架构**：基于 [Reka UI](https://reka-ui.com) (原 Radix Vue) 和 `clsx` + `tailwind-merge` (`cn()`)，在 `components/ui/` 中封装了高复用度组件（Button, Switch, Dialog, Tabs, Slider, Progress, Tooltip, AccordionItem）。
- **🌓 主题与暗黑模式**：内置 `@vueuse/core`，通过 `useDark()` 统一接管亮暗主题切换与持久化。
- **🛡️ 样式隔离（Shadow DOM）**：在 `entrypoints/content.ts` 中示范使用 WXT 的 `createShadowRootUi` 挂载 Vue 悬浮卡片，彻底避免插件与宿主网页的全局样式互相污染。
- **💾 MV3 安全存储**：封装 `utils/storage.ts`，提供 WXT 原生跨上下文响应式存储，并附带针对 `pinia-plugin-persistedstate` 的 MV3 Background Service Worker 安全适配器。
- **📦 数据与提取管线**：预置 `dexie`（类型安全 IndexedDB 数据库类）与 `defuddle` + `minisearch`（网页正文抓取与轻量全文索引）。

---

## 📁 目录架构

```text
├── components/          # Vue 组件层
│   └── ui/              # 封装好的 Reka UI + UnoCSS 原子组件库 (Button, Dialog, etc.)
├── entrypoints/         # WXT 扩展入口
│   ├── background.ts    # Background Service Worker
│   ├── content.ts       # Content Script (Shadow DOM 隔离挂载)
│   ├── content/         # Content Script 内部组件
│   └── popup/           # 弹出窗口 (App.vue, main.ts)
├── lib/                 # 标准库与路径别名支持 (lib/utils -> utils/cn)
├── services/            # 业务服务层
│   ├── db.ts            # Dexie IndexedDB 数据库
│   └── extractor.ts     # Defuddle 正文提取与 MiniSearch 检索引擎
├── utils/               # 工具函数
│   ├── cn.ts            # UnoCSS / Tailwind 类名合并函数
│   └── storage.ts       # WXT 响应式持久化与 Pinia 适配器
├── uno.config.ts        # UnoCSS 配置文件
└── wxt.config.ts        # WXT 扩展配置文件
```

---

## 🚀 常用命令

```bash
# 安装依赖
pnpm install

# 启动 Chrome 扩展开发热重载（自动打开带有扩展的独立测试窗口）
pnpm dev

# 启动 Firefox 扩展开发
pnpm dev:firefox

# TypeScript 类型检查
pnpm compile

# 生产环境打包构建（产出位于 .output/chrome-mv3）
pnpm build

# 打包为发布用 zip 压缩包
pnpm zip
```

---

## 💡 开发指南

### 1. 使用 UI 组件与类名合并
在业务页面中可直接引入封装好的组件与 `cn()` 工具函数：
```vue
<script setup lang="ts">
import { Button, Switch, Tooltip } from '@/components/ui';
</script>

<template>
  <Tooltip content="点击触发操作">
    <Button variant="default" size="sm">
      <i class="i-lucide-sparkles text-sm" />
      提交
    </Button>
  </Tooltip>
</template>
```

### 2. 使用纯 CSS 图标
无需手动引入 SVG 图标组件，直接在 HTML 标签中添加 UnoCSS 图标类名：
```html
<i class="i-lucide-moon text-cyan-400" />
<i class="i-lucide-check text-emerald-400" />
```
所有可用图标名称可参考 [Lucide Icons](https://lucide.dev/icons/)。

### 3. Content Script 中的 Shadow DOM 隔离
当需要在目标网页上注入浮动组件时，已在 `entrypoints/content.ts` 提供开箱即用的模式：
```typescript
const ui = await createShadowRootUi(ctx, {
  name: 'my-shadow-ui',
  position: 'inline',
  anchor: 'body',
  append: 'last',
  onMount: (container) => {
    const app = createApp(MyContentApp);
    app.mount(container);
    return app;
  },
});
ui.mount();
```
WXT 会自动将当前 Content Script 依赖的 UnoCSS 样式打包并注入到 Shadow Root 内部，保障与宿主页面 100% 隔离。
