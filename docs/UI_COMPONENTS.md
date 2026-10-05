# UI 组件库完整参考手册 (components/ui)

本项目采用 **Apple Human Interface Guidelines (HIG) + Reka UI + UnoCSS + CVA** 的现代化 Headless 封装规范，组件存放于 `components/ui/`，无需裸写复杂的底层原语，开箱即用。

---

## 快速导入

```ts
import {
  Button,
  Switch,
  Checkbox,
  Input,
  Textarea,
  Badge,
  Card,
  Slider,
  Progress,
  Tooltip,
  Popover,
  AccordionItem,
  SegmentedControl,
  Select,
  DropdownMenu,
  RadioGroup,
  Toast,
  Kbd,
  Skeleton,
  Avatar,
  Empty,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogClose,
  AccordionRoot,
  TooltipProvider,
} from '@/components/ui';
```

---

## 组件清单与用法示例

### 1. Button (苹果胶囊按钮)
基于 `class-variance-authority` (cva) 封装，采用纯正 Apple HIG 胶囊圆角 (`rounded-full`)、无粗边框设计、触控微缩放 (`active:scale-[0.97]`)。

#### Props
- `variant`: `'primary'` (苹果蓝) | `'secondary'` (轻灰微透) | `'success'` (苹果绿) | `'destructive'` (苹果红) | `'outline'` | `'ghost'` | `'neutral'`（默认 `'primary'`）
- `size`: `'default'` | `'sm'` | `'lg'` | `'icon'`（默认 `'default'`）
- `icon`: 纯 CSS 图标类名（如 `'i-lucide-sparkles'`）
- `as`: 默认 `'button'`
- `class`: 自定义 UnoCSS 类名

#### 示例
```vue
<Button variant="primary" icon="i-lucide-sparkles" @click="handleClick">
  主要操作
</Button>

<Button variant="secondary" icon="i-lucide-folder">次要操作</Button>
<Button variant="success" icon="i-lucide-check">确认完成</Button>
<Button variant="destructive" icon="i-lucide-trash-2">删除</Button>
<Button variant="ghost" size="icon" icon="i-lucide-more-horizontal" />
```

---

### 2. Switch (iOS 切换开关)
对标 iOS 原生 `44x26px` 黄金微比例，开启后呈现经典苹果系统绿 (`#34C759`)，滑块带有柔和微投影。

#### Props / Emits
- `checked` / `v-model:checked`: `boolean`
- `disabled`: `boolean`
- `class`: 样式定制

#### 示例
```vue
<script setup lang="ts">
import { ref } from 'vue';
const enabled = ref(true);
</script>

<template>
  <div class="flex items-center justify-between">
    <span class="text-xs">云端自动备份</span>
    <Switch v-model:checked="enabled" />
  </div>
</template>
```

---

### 3. Checkbox (复选框)
封装 `CheckboxRoot` + `CheckboxIndicator`，内置纯 CSS 勾选对号图标，选中后呈现苹果蓝底色。

#### Props / Emits
- `checked` / `v-model:checked`: `boolean` | `'indeterminate'`
- `disabled`: `boolean`
- `class`: 样式定制

#### 示例
```vue
<div class="flex items-center gap-2.5">
  <Checkbox v-model:checked="isSubscribed" id="c1" />
  <label for="c1" class="text-xs text-neutral-800 dark:text-neutral-200 cursor-pointer">
    自动提取网页 OpenGraph 与封面图
  </label>
</div>
```

---

### 4. Input (文本输入框)
macOS 风格圆角输入框，支持左侧图标与右侧一键清空按钮，柔和浅灰底色。

#### Props / Emits
- `modelValue` / `v-model`: `string` | `number`
- `placeholder`: `string`
- `icon`: 左侧图标类名（如 `'i-lucide-search'`）
- `clearable`: `boolean`，是否显示一键清除按钮
- `type`: `string`，默认 `'text'`

#### 示例
```vue
<Input
  v-model="searchText"
  placeholder="搜索已保存的书签或网页记录..."
  icon="i-lucide-search"
  clearable
/>
```

---

### 5. Textarea (多行文本域)
适配浅色与暗色模式的多行文本域，聚焦带有柔和半透明焦点光圈。

#### Props
- `v-model`: `string`
- `placeholder`: `string`
- `rows`: 默认 `3`

#### 示例
```vue
<Textarea
  v-model="notes"
  placeholder="在此随手记录速记或摘录..."
  :rows="3"
/>
```

---

### 6. Badge (苹果药丸徽章)
采用柔和色彩底衬与高饱和文字对比度，极具苹果灵动微观感。

#### Props
- `variant`: `'primary'` | `'secondary'` | `'success'` | `'warning'` | `'destructive'` | `'purple'`
- `icon`: 图标类名

#### 示例
```vue
<Badge variant="primary" icon="i-lucide-sparkles">精选推荐</Badge>
<Badge variant="success">已就绪</Badge>
<Badge variant="warning">待确认</Badge>
<Badge variant="destructive">异常</Badge>
```

---

### 7. Card (iOS Inset Grouped 分组卡片)
对齐 iOS 系统设置的 Inset 纯白卡片，标题置于卡片外部顶端 (`title` prop)，内部列表项搭配 `ml-[40px]` 缩进微细分割线。

#### Props / Slots
- `title`: 卡片外置分组标题文本
- 默认插槽：卡片内容

#### 示例
```vue
<Card title="系统偏好设置">
  <div class="flex flex-col">
    <div class="flex items-center justify-between py-1.5">
      <span>深色模式</span>
      <Switch v-model:checked="isDark" />
    </div>
    <!-- 苹果 Inset 微细缩进分割线 -->
    <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />
    <div class="flex items-center justify-between py-1.5">
      <span>离线存储</span>
      <Switch v-model:checked="offlineStorage" />
    </div>
  </div>
</Card>
```

---

### 8. SegmentedControl (苹果分段滑块控制器)
经典的 iOS / macOS 分段标签滑块控制器，纯净浮动白底高亮块与微阴影，支持带图标的标签项切换与键盘快捷操作。

#### Props
- `v-model`: `string`
- `options`: `Array<{ value: string; label: string; icon?: string }>`
- `class`: 样式定制

#### 示例
```vue
<SegmentedControl
  v-model="currentTab"
  :options="[
    { value: 'featured', label: '常用控件', icon: 'i-lucide-layout-grid' },
    { value: 'forms', label: '表单输入', icon: 'i-lucide-edit-3' },
    { value: 'cards', label: '视窗浮层', icon: 'i-lucide-layers' },
  ]"
/>
```

---

### 9. Slider (触控滑杆)
苹果风格微细轨滑块，支持拖拽、键盘步进与平滑轨道填充。

#### Props
- `v-model`: `number[]`（例如 `ref([60])`）
- `min`: 默认 `0`
- `max`: 默认 `100`
- `step`: 默认 `1`
- `accent`: `'blue'` | `'green'` | `'orange'` | `'purple'`（默认 `'blue'`）

#### 示例
```vue
<Slider v-model="volume" :max="100" accent="blue" />
```

---

### 10. Progress (圆角进度条)
细腻平滑的进度指示器，支持纯 CSS 动画缓动更新。

#### Props
- `modelValue`: `number` (0 - 100)
- `accent`: `'blue'` | `'green'` | `'orange'` | `'purple'`（默认 `'blue'`）

#### 示例
```vue
<Progress :model-value="progress" accent="green" />
```

---

### 11. Tooltip (轻量气泡提示)
文字悬停微提示，自适应定位与平滑显现。

#### 示例
```vue
<Tooltip content="唤醒全局搜索 (⌘K)">
  <Button variant="ghost" size="icon" icon="i-lucide-help-circle" />
</Tooltip>
```

---

### 12. Dialog / Sheet (模态工作表)
macOS 经典居中模态视窗，带通透高斯模糊背景层与 Esc 快捷关闭。

#### 示例
```vue
<DialogRoot>
  <DialogTrigger as-child>
    <Button variant="primary">打开视窗</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle class="text-sm font-semibold">系统操作确认</DialogTitle>
    <DialogDescription class="text-xs text-neutral-500 mt-1">
      确定要清除当前全部缓存快照吗？
    </DialogDescription>
    <div class="flex justify-end gap-2 mt-4">
      <DialogClose as-child>
        <Button variant="neutral" size="sm">取消</Button>
      </DialogClose>
      <DialogClose as-child>
        <Button variant="primary" size="sm">确认执行</Button>
      </DialogClose>
    </div>
  </DialogContent>
</DialogRoot>
```

---

### 13. Popover (微型气泡弹窗)
用于承载丰富表单或复杂筛选逻辑的气泡浮层。

#### 示例
```vue
<Popover>
  <template #trigger>
    <Button variant="secondary" size="sm">筛选选项</Button>
  </template>
  <div class="flex flex-col gap-2.5">
    <h4 class="text-xs font-semibold">快速筛选选项</h4>
    <p class="text-[11px] text-neutral-500">在不打断主流程的情况下微调参数。</p>
    <Button variant="primary" size="sm" class="w-full">应用配置</Button>
  </div>
</Popover>
```

---

### 14. Accordion (分组折叠手风琴)
折叠面板，自带平滑旋转微箭头与通畅展开动效。

#### 示例
```vue
<AccordionRoot type="single" collapsible class="w-full rounded-xl border border-black/5 dark:border-white/10 overflow-hidden">
  <AccordionItem value="item-1" title="如何开始使用？" icon="i-lucide-apple">
    点击右上角图标即可打开弹出页。
  </AccordionItem>
</AccordionRoot>
```

---

### 15. Select (下拉列表选择器)
macOS 弹出式单选选单，带有上下微箭头指示与右侧经典选中对号 (`✓`)，支持纯 CSS 图标。

#### Props
- `v-model`: `string`
- `options`: `Array<{ value: string; label: string; icon?: string; disabled?: boolean }>`
- `placeholder`: `string`

#### 示例
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@/components/ui';

const selectedModel = ref('gpt4o');
const modelOptions = [
  { value: 'gpt4o', label: 'GPT-4o (Omni)', icon: 'i-lucide-sparkles' },
  { value: 'claude35', label: 'Claude 3.5 Sonnet', icon: 'i-lucide-zap' },
  { value: 'gemini15', label: 'Gemini 1.5 Pro', icon: 'i-lucide-bot' },
];
</script>

<template>
  <Select v-model="selectedModel" :options="modelOptions" />
</template>
```

---

### 16. DropdownMenu (苹果操作下拉菜单)
支持分组、纯 CSS 图标、快捷键提示 (`kbd`)、危险红字项 (`destructive`)、高斯模糊半透明背景与苹果高亮选中态。

#### Props
- `groups`: `Array<{ actions: Array<{ label: string; icon?: string; kbd?: string; destructive?: boolean; disabled?: boolean; onSelect?: () => void }> }>`
- `side`: `'top'` | `'right'` | `'bottom'` | `'left'`（默认 `'bottom'`）
- `align`: `'start'` | `'center'` | `'end'`（默认 `'end'`）

#### 示例
```vue
<script setup lang="ts">
import { DropdownMenu, Button } from '@/components/ui';

const menuGroups = [
  {
    actions: [
      { label: '复制快照链接', icon: 'i-lucide-copy', kbd: '⌘C', onSelect: () => console.log('copy') },
      { label: '导出为 Markdown', icon: 'i-lucide-file-text', kbd: '⌘E', onSelect: () => console.log('export') },
    ],
  },
  {
    actions: [
      { label: '清除数据', icon: 'i-lucide-trash-2', destructive: true, onSelect: () => console.log('delete') },
    ],
  },
];
</script>

<template>
  <DropdownMenu :groups="menuGroups">
    <template #trigger>
      <Button variant="secondary" size="sm" icon="i-lucide-more-vertical">操作</Button>
    </template>
  </DropdownMenu>
</template>
```

---

### 17. RadioGroup (单选框组)
iOS / macOS 风格纯正单选组，选中时呈现苹果蓝底与白芯，支持标题与副标题描述说明。

#### Props
- `v-model`: `string`
- `options`: `Array<{ value: string; label: string; description?: string; disabled?: boolean }>`

#### 示例
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RadioGroup } from '@/components/ui';

const storageMode = ref('local');
const options = [
  { value: 'local', label: '本地离线 IndexedDB', description: '数据严格保存在当前浏览器沙箱中' },
  { value: 'cloud', label: '端到端加密云备份', description: '跨设备自动同步收藏夹' },
];
</script>

<template>
  <RadioGroup v-model="storageMode" :options="options" />
</template>
```

---

### 18. Toast (灵动岛悬浮提示)
浮动于顶部的胶囊药丸提示，具备进入与退出弹性微动效、毛玻璃半透明底衬与状态图标。

#### Props
- `show`: `boolean`
- `message`: `string`
- `type`: `'success'` | `'info'` | `'warning'` | `'error'`（默认 `'success'`）
- `icon`: 图标类名（默认根据 type 自适应）

#### 示例
```vue
<Toast :show="toastVisible" message="设置已保存到云端" type="success" />
```

---

### 19. Kbd (苹果拟物按键徽章)
拟物化等宽微凸按键卡片，用于展示 `⌘K`、`⌥D`、`Esc` 等系统快捷键。

#### 示例
```vue
<Kbd>⌘K</Kbd>
<Kbd>⇧⌘P</Kbd>
```

---

### 20. Skeleton (骨架屏加载占位)
脉冲微光呼吸动画，在异步数据加载未完成时提供高品质占位反馈。

#### 示例
```vue
<div class="flex items-center gap-3">
  <Skeleton class="h-9 w-9 rounded-full" />
  <div class="flex flex-col gap-1.5 flex-1">
    <Skeleton class="h-3.5 w-3/4" />
    <Skeleton class="h-2.5 w-1/2" />
  </div>
</div>
```

---

### 21. Avatar (苹果头像与图标组件)
支持圆角圆形 (`circle`) 与平滑圆角超椭圆 (`squircle`)，支持图片链接与纯文本/纯 CSS 图标降级回退 (`fallback` / `icon`)。

#### Props
- `src`: 头像图片 URL
- `alt`: 替代文本
- `fallback`: 文字回退（如 `'AP'`）
- `icon`: 降级图标类名
- `size`: `'sm'` | `'default'` | `'lg'`
- `shape`: `'circle'` | `'squircle'`

#### 示例
```vue
<Avatar fallback="AP" shape="squircle" size="default" />
<Avatar src="https://github.com/apple.png" size="sm" />
```

---

### 22. Empty (苹果空状态占位)
极简大气的空状态插画与文字容器，支持自定义操作按钮插槽。

#### Props
- `icon`:  центральный 图标（默认 `'i-lucide-inbox'`）
- `title`: 标题文本
- `description`: 描述说明文本

#### 示例
```vue
<Empty
  icon="i-lucide-folder-search"
  title="暂无保存的网页快照"
  description="点击快捷键 ⌥D 立即捕获当前页面的纯净 Markdown 正文"
>
  <Button variant="primary" size="sm" icon="i-lucide-plus">立即提取</Button>
</Empty>
```

---

## 🛠️ 如何使用 `cn()` 封装新组件？

若您需要新增自己的 UI 组件，只需在组件中使用 `cn()` 合并类名即可：

```vue
<script lang="ts" setup>
import { computed } from 'vue';
import { cn } from '@/utils/cn';

const props = defineProps<{ class?: string }>();
const classes = computed(() => cn('base-classes here', props.class));
</script>
```
`cn()` 内部基于 `clsx` 与 `tailwind-merge`，能够自动识别并消除 Tailwind/UnoCSS 间的类名冲突（例如外部传入 `p-6` 时会自动覆盖默认的 `p-4`）。
