# UnoCSS (v66+) 完整使用手册与速查指南

本项目已在 `uno.config.ts` 中配置了 UnoCSS 最新规范（基于 `presetWind3` 预设，兼容 Tailwind CSS v3/v4 语法），并集成了属性化模式、纯 CSS 图标、排版以及指令转换器。

无需每次去官网检索，日常开发可直接查阅本手册。

---

## 目录
1. [预设与特性一览](#1-预设与特性一览)
2. [纯 CSS 图标方案 (presetIcons)](#2-纯-css-图标方案-preseticons)
3. [属性化模式 (presetAttributify)](#3-属性化模式-presetattributify)
4. [组合变体 (transformerVariantGroup)](#4-组合变体-transformervariantgroup)
5. [CSS 指令 (@apply / theme)](#5-css-指令-apply--theme)
6. [常用实用类速查 (Tailwind/UnoCSS)](#6-常用实用类速查)
7. [本项目预置 Shortcuts](#7-本项目预置-shortcuts)
8. [浏览器扩展 (Content Script) 样式隔离规则](#8-浏览器扩展-content-script-样式隔离规则)

---

## 1. 预设与特性一览

| 预设 / 转换器 | 功能描述 | 典型场景 |
| :--- | :--- | :--- |
| `presetWind3()` | 基础实用类规范（对齐 Tailwind CSS） | `flex`, `bg-zinc-900`, `text-emerald-400` |
| `presetAttributify()` | 属性化写法 | `<div flex="~ col items-center" gap-4>` |
| `presetIcons()` | 纯 CSS 遮罩图标（0kb JS） | `<i class="i-lucide-sun text-lg" />` |
| `presetTypography()` | 针对富文本/Markdown 文章的优雅排版 | `<div class="prose prose-invert">` |
| `transformerDirectives()` | 支持原生 CSS 中的 `@apply` 与 `theme()` | `<style> .btn { @apply px-4 py-2; } </style>` |
| `transformerVariantGroup()` | 状态选择器与伪类前缀折叠 | `hover:(bg-emerald-500 scale-105 text-white)` |

---

## 2. 纯 CSS 图标方案 (presetIcons)

本项目已安装 `@iconify-json/lucide` 离线图标库。

### 语法
任何 HTML 标签上添加 `i-lucide-<icon-name>` 即可渲染为矢量图标：
```html
<!-- 基础使用 -->
<i class="i-lucide-sparkles" />
<span class="i-lucide-check" />

<!-- 尺寸与颜色（完全继承父级 font-size 与 color） -->
<i class="i-lucide-moon text-cyan-400 text-lg" />
<i class="i-lucide-activity text-emerald-400 w-5 h-5" />

<!-- 旋转/动效 -->
<i class="i-lucide-loader-2 animate-spin text-white/50" />
```

### 常用图标名称清单
- **界面控制**：`i-lucide-x`, `i-lucide-check`, `i-lucide-chevron-down`, `i-lucide-chevron-right`, `i-lucide-plus`, `i-lucide-minus`
- **主题与状态**：`i-lucide-sun`, `i-lucide-moon`, `i-lucide-sparkles`, `i-lucide-shield-check`, `i-lucide-activity`
- **内容与媒体**：`i-lucide-volume-2`, `i-lucide-layers`, `i-lucide-external-link`, `i-lucide-copy`, `i-lucide-rotate-ccw`, `i-lucide-palette`
- **对齐与排版**：`i-lucide-align-left`, `i-lucide-align-center`, `i-lucide-align-right`
- *更多图标可在 [Lucide 官方图标库](https://lucide.dev/icons) 查找对应名称。*

---

## 3. 属性化模式 (presetAttributify)

避免类名过长，可将布局属性按类别分组写入 HTML attribute：

```html
<!-- 传统类名写法 -->
<div class="flex flex-col items-center justify-between p-4 bg-zinc-800 text-white rounded-xl">
  ...
</div>

<!-- 属性化写法 -->
<div
  flex="~ col items-center justify-between"
  p-4
  bg="zinc-800"
  text="white"
  rounded="xl"
>
  ...
</div>
```

---

## 4. 组合变体 (transformerVariantGroup)

支持将多个带有相同伪类或媒体查询的类名折叠，大幅降低模板重复代码：

```html
<!-- 传统写法 -->
<button class="hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95 transition-all">
  按钮
</button>

<!-- 变体折叠写法 -->
<button class="hover:(bg-emerald-500 text-white scale-105) active:scale-95 transition-all">
  按钮
</button>

<!-- 暗黑模式折叠 -->
<div class="bg-white text-slate-800 dark:(bg-zinc-900 text-white/90)">
  卡片
</div>
```

---

## 5. CSS 指令 (@apply / theme)

在 Vue 的 `<style scoped>` 中支持原生 Tailwind 指令：

```vue
<style scoped>
.my-custom-box {
  @apply rounded-xl p-4 border border-white/10 transition-all;
  background-color: theme('colors.primary.DEFAULT');
}
</style>
```

---

## 6. 常用实用类速查

### 1. 布局与弹性盒
- **Flex**：`flex`, `inline-flex`, `flex-col`, `flex-row`, `items-center`, `justify-center`, `justify-between`, `gap-2` (8px), `gap-4` (16px)
- **Grid**：`grid`, `grid-cols-2`, `grid-cols-3`, `gap-3`
- **定位**：`relative`, `absolute`, `fixed`, `inset-0`, `top-1/2`, `left-1/2`, `-translate-x-1/2`, `-translate-y-1/2`, `z-50`

### 2. 间距与尺寸
- **内边距**：`p-2` (8px), `p-4` (16px), `px-3` (水平 12px), `py-1.5` (垂直 6px)
- **外边距**：`m-2`, `mt-4`, `mb-2`, `mx-auto`
- **尺寸**：`w-full`, `w-80` (320px), `w-[420px]`, `h-9` (36px), `h-full`, `max-h-[600px]`, `min-h-[60px]`

### 3. 色彩与透明度
- **背景**：`bg-zinc-900`, `bg-zinc-800`, `bg-white/10` (10% 透明度), `bg-emerald-500/20`
- **文字**：`text-white`, `text-white/80` (80% 不透明), `text-emerald-400`, `text-cyan-400`, `text-red-400`
- **渐变**：`bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent`

### 4. 边框与圆角
- **圆角**：`rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-full` (9999px)
- **边框**：`border`, `border-white/10`, `border-emerald-500/30`, `border-b`

### 5. 交互与动效
- **过渡**：`transition-all`, `transition-colors`, `transition-transform`, `duration-200`, `duration-300`
- **光标**：`cursor-pointer`, `cursor-not-allowed`, `select-none`
- **微动效**：`hover:scale-105`, `active:scale-95`, `hover:drop-shadow-lg`
- **毛玻璃**：`backdrop-blur-md`, `backdrop-blur-sm`

---

## 7. 本项目预置 Shortcuts

在 `uno.config.ts` 中已预设快捷类：
```typescript
['flex-center', 'flex items-center justify-center'],
['flex-between', 'flex items-center justify-between'],
['flex-col-center', 'flex flex-col items-center justify-center'],
['btn-base', 'inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none'],
['card-panel', 'rounded-xl bg-zinc-800/80 border border-white/10 backdrop-blur-md p-4 shadow-lg shadow-black/20']
```

---

## 8. 浏览器扩展 (Content Script) 样式隔离规则

在编写注入宿主页面的 Content Script 时，必须严格遵循以下原则：

1. **务必使用 Shadow DOM 挂载**：使用 WXT 的 `createShadowRootUi(ctx, ...)`。
2. **务必使用 `cssInjectionMode: 'ui'`**：在 `defineContentScript` 中声明：
   ```typescript
   export default defineContentScript({
     matches: ['<all_urls>'],
     cssInjectionMode: 'ui', // 保证 UnoCSS 自动注入到 Shadow Root 内部
     async main(ctx) { ... }
   });
   ```
3. **不要在宿主页面的 `document.head` 挂载全局样式**，避免破坏目标网站原有排版。
