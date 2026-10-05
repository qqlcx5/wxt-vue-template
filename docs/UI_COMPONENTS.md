# UI 组件库完整参考手册 (components/ui)

本项目采用 **Reka UI (原 Radix Vue) + UnoCSS + CVA** 的现代化 Headless 封装规范，组件存放于 `components/ui/`，无需裸写复杂的底层原语。

---

## 快速导入
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
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogClose,
} from '@/components/ui';
```

---

## 组件清单与用法示例

### 1. Button (按钮)
基于 `class-variance-authority` (cva) 封装，支持多种色彩变体与尺寸。

#### Props
- `variant`: `'default'` | `'destructive'` | `'outline'` | `'secondary'` | `'ghost'` | `'link'`（默认 `'default'`）
- `size`: `'default'` | `'sm'` | `'lg'` | `'icon'`（默认 `'default'`）
- `as`: 默认 `'button'`
- `class`: 自定义 UnoCSS 类名

#### 示例
```vue
<Button variant="default" size="default" @click="handleClick">
  <i class="i-lucide-sparkles text-sm" />
  提交操作
</Button>

<Button variant="destructive" size="sm">删除</Button>
<Button variant="ghost" size="icon"><i class="i-lucide-x text-sm" /></Button>
<Button variant="outline" size="sm">次要按钮</Button>
```

---

### 2. Switch (开关)
封装 `SwitchRoot` + `SwitchThumb`，处理开启动画与可访问性。

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
  <div class="flex items-center gap-2">
    <Switch v-model:checked="enabled" />
    <span class="text-xs">启用状态: {{ enabled }}</span>
  </div>
</template>
```

---

### 3. Checkbox (复选框)
封装 `CheckboxRoot` + `CheckboxIndicator`，内置纯 CSS 勾选对号图标。

#### Props / Emits
- `checked` / `v-model:checked`: `boolean` | `'indeterminate'`
- `disabled`: `boolean`
- `class`: 样式定制

#### 示例
```vue
<div class="flex items-center gap-2">
  <Checkbox v-model:checked="subscribed" />
  <label class="text-xs text-white/80 cursor-pointer">自动保存页面数据</label>
</div>
```

---

### 4. Input (输入框)
基础文本输入框，内置暗色主题、边框与 Emerald 聚焦光晕。

#### Props
- `v-model`: `string | number`
- `placeholder`: `string`
- `type`: `string` (默认 `'text'`)
- `disabled`: `boolean`
- `class`: 样式定制

#### 示例
```vue
<Input v-model="searchQuery" placeholder="搜索已保存的内容..." class="w-full" />
```

---

### 5. Textarea (文本域)
自适应多行文本域，支持垂直拖拽。

#### Props
- `v-model`: `string | number`
- `placeholder`: `string`
- `rows`: `number` (默认 `3`)
- `class`: 样式定制

#### 示例
```vue
<Textarea v-model="notes" placeholder="输入页面备注..." :rows="4" />
```

---

### 6. Badge (徽章/标签)
小巧的状态展示组件，支持多种配色。

#### Props
- `variant`: `'default'` (绿) | `'secondary'` (灰) | `'destructive'` (红) | `'outline'` (线框) | `'cyan'` (青) | `'violet'` (紫)

#### 示例
```vue
<Badge variant="default">已同步</Badge>
<Badge variant="cyan"><i class="i-lucide-activity text-xs" /> 处理中</Badge>
<Badge variant="destructive">错误</Badge>
```

---

### 7. Card (卡片面板)
极简的容器卡片，支持直接传递 `title` 和 `description`，亦可使用具名插槽。

#### Props / Slots
- Props: `title`、`description`、`class`、`contentClass`
- Slots: `#header`、`#default`、`#footer`

#### 示例
```vue
<Card title="扩展设置" description="配置您的 API 密钥与同步偏好">
  <div class="flex flex-col gap-3">
    <Input placeholder="输入密钥..." />
  </div>
  <template #footer>
    <span class="text-xs text-white/40">版本: v1.0.0</span>
    <Button size="sm">保存</Button>
  </template>
</Card>
```

---

### 8. Dialog (对话框 / 模态框)
基于 Reka UI 原语与 `DialogContent`，内置毛玻璃全屏遮罩、居中定位与焦点捕获。

#### 示例
```vue
<DialogRoot>
  <DialogTrigger as-child>
    <Button>打开弹窗</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle class="text-base font-bold text-white">确认操作</DialogTitle>
    <DialogDescription class="mt-2 text-xs text-white/60">
      此操作将清空本地所有缓存，是否继续？
    </DialogDescription>
    <div class="flex justify-end gap-2 mt-5">
      <DialogClose as-child>
        <Button variant="ghost" size="sm">取消</Button>
      </DialogClose>
      <DialogClose as-child>
        <Button variant="destructive" size="sm">确认清空</Button>
      </DialogClose>
    </div>
  </DialogContent>
</DialogRoot>
```

---

### 9. Slider (滑动条)
渐变色滑动控制器。

#### Props
- `v-model`: `number[]`
- `min`: `number` (默认 0)
- `max`: `number` (默认 100)
- `step`: `number` (默认 1)

#### 示例
```vue
<Slider v-model="volume" :max="100" :step="5" />
```

---

### 10. Progress (进度条)
渐变动画进度条。

#### Props
- `model-value`: `number` (0 ~ 100)

#### 示例
```vue
<Progress :model-value="downloadProgress" />
```

---

### 11. Tooltip (文字提示)
悬浮气泡提示组件。

#### Props
- `content`: 提示文字
- `side`: `'top'` | `'right'` | `'bottom'` | `'left'` (默认 `'top'`)
- `sideOffset`: 偏移像素 (默认 `6`)

#### 示例
```vue
<Tooltip content="复制当前网页链接" side="bottom">
  <Button variant="ghost" size="icon">
    <i class="i-lucide-copy text-sm" />
  </Button>
</Tooltip>
```

---

### 12. Popover (弹出菜单/气泡卡片)
弹出卡片层，适合展示复杂筛选器或操作菜单。

#### 示例
```vue
<Popover>
  <template #trigger>
    <Button variant="outline" size="sm">筛选选项</Button>
  </template>
  <div class="flex flex-col gap-3">
    <h4 class="text-xs font-semibold">选择类型</h4>
    <Switch v-model:checked="filterActive" />
  </div>
</Popover>
```

---

### 13. Accordion (折叠手风琴)
折叠面板，自带平滑旋转箭头。

#### 示例
```vue
<AccordionRoot type="single" collapsible class="w-full rounded-xl border border-white/10 overflow-hidden">
  <AccordionItem value="item-1" title="如何开始使用？">
    点击右上角图标即可打开弹出页。
  </AccordionItem>
  <AccordionItem value="item-2" title="快捷键支持">
    支持通过 chrome://extensions/shortcuts 配置自定义呼出快捷键。
  </AccordionItem>
</AccordionRoot>
```

---

### 14. SegmentedControl (苹果分段选择器)
经典的 iOS / macOS 分段标签滑块控制器，支持带图标的标签项切换与键盘快捷操作。

#### Props
- `v-model`: `string`
- `options`: `Array<{ value: string; label: string; icon?: string }>`
- `class`: 样式定制

#### 示例
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SegmentedControl } from '@/components/ui';

const currentTab = ref('featured');
</script>

<template>
  <SegmentedControl
    v-model="currentTab"
    :options="[
      { value: 'featured', label: '精选控件', icon: 'i-lucide-layout-grid' },
      { value: 'forms', label: '表单输入', icon: 'i-lucide-edit-3' },
      { value: 'cards', label: '卡片展区', icon: 'i-lucide-layers' },
    ]"
  />
</template>
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
