---
name: floating-edge-dock
description: Design and build ultra-compact draggable floating capsules, edge-docking mini drawers, and unobtrusive floating widgets for web apps, browser extensions (MV3 content scripts), and userscripts. Supports free-floating placement, threshold-based edge collapse, hover-reveal, busy-lock protection, toast alignment, and state persistence.
---

# Floating Edge Dock (悬浮条与边缘折叠挂件规范)

适用于在 Web 应用、浏览器扩展（Content Scripts / Page Injections）、油猴脚本中构建**极简、轻量、高灵活性**的页面悬浮工具条。

核心设计哲学：**不喧宾夺主，把控制权交给用户**。
- **自由常驻**：放置在屏幕任意主体区域时，绝不强行物理吸边，常驻显示完整图标。
- **推边收纳**：只有当用户主动推到屏幕边缘（距离 ≤ 阈值）松手时，才吸齐边框并自动折叠为仅露出拉手的微型边缘标签。
- **悬停唤醒**：鼠标悬停在边缘拉手即丝滑滑出，移开鼠标防抖延时缩回。
- **任务防收回锁**：异步操作进行中、转圈中或提示气泡展示时强制锁定展开，防止误触。

---

## 适用场景 (When to Use)

当用户或业务需要以下能力时使用本 Skill：
1. **浏览器扩展内容脚本注入**：在第三方网页（如抖音、B站、Twitter、GitHub 等）注入辅助工具条，不能遮挡原生播放器、评论区或控制按钮。
2. **轻量收集与抓取挂件**：类似 Inbox 收集箱、页面解析、一键转存、自动向下滚屏等快捷动作的载体。
3. **网页浮动控制台 / 悬浮球**：Web 管理后台、移动端/桌面端 H5 悬浮助手，需要既能随意拖动，又能靠边收折叠。

---

## 核心状态机 (State Machine)

```
       [ 自由常驻态 (Free-Floating) ]
         │ (拖拽位移 > 5px)
         ▼
       [ 拖拽中 (Dragging) ]
         │ (松手检测：离边缘 <= 32px ?)
         ├────────── 否 ──────────► [ 自由常驻态 ] (原地停留，保持常驻)
         │ 是
         ▼
       [ 贴边折叠态 (Docked & Collapsed) ]
         │ (鼠标悬停 MouseEnter)
         ▼
       [ 贴边展开态 (Docked & Expanded) ]
         │ (鼠标离开 MouseLeave + 延时 700ms)
         ├───── 无任务活跃 ─────► [ 贴边折叠态 ]
         │
         ▼
       [ 任务锁定态 (Busy-Locked) ] ── (任务结束 / Toast 消失) ──► 恢复延时收回
```

---

## 关键设计规则 (Key Rules & Implementation Guidelines)

### 1. 原生 Pointer Events 拖拽与点击防冲突
- 使用 `pointerdown`, `pointermove`, `pointerup`，配合 `setPointerCapture(pointerId)`，确保鼠标拖出浏览器视口或跨越 iframe 时事件不丢失。
- **点击防误触**：记录按下起始点，位移勾股距离 `Math.hypot(dx, dy) > 5` 才进入拖拽态。
- **释放拦截**：松手如果判定发生过拖拽，在容器根节点以 `capture: true` 阶段拦截紧随其后的原生 `click` 事件并调用 `e.stopImmediatePropagation()`，阻止子按钮误触发。

### 2. 边缘阈值判定（不搞强制吸边）
- 设定边缘检测阈值（推荐 `DOCK_THRESHOLD = 32px`）。
- 松手时检测与屏幕边缘距离：
  - `distLeft = x`
  - `distRight = window.innerWidth - (x + width)`
  - 若 `distLeft <= 32px`：判定为靠左贴边，设置 `left = 0`，进入折叠态。
  - 若 `distRight <= 32px`：判定为靠右贴边，设置 `left = window.innerWidth - width`，进入折叠态。
  - **若两者均 > 32px**：不吸边，停留在 `(x, y)`，标记 `isDocked = false`，完全保持展开常驻。

### 3. 贴边收纳与位移变换 (Transform Formulas)
- **右侧贴边收纳**：`translateX(calc(100% - 24px))`，向右缩进 70%~80%，屏幕边缘露出左侧 24px 微型拉手。
- **左侧贴边收纳**：`translateX(calc(-100% + 24px))`，向左缩进，屏幕边缘露出右侧 24px 微型拉手。
- **悬停唤醒**：`translateX(0)`，配合 `transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease`。

### 4. 任务防收回保护 (Busy-Lock Guard)
- 当以下任一情况为真时，将 `isBusy = true` 并强制展开：
  1. 内部按钮正在执行异步请求（转圈加载状态）；
  2. 正在执行持续性任务（如自动向下滚屏、轮询监听）；
  3. 挂载在胶囊上的 Toast 提示处于展示阶段。
- 任务结束并且 Toast 淡出后，调用 `scheduleCollapse(700)` 重新进入延时折叠流程。

### 5. 提示气泡 (Toast) 挂载与视口自适应
- Toast 元素直接作为胶囊容器的子元素（`position: absolute`），拖拽胶囊时 Toast 自动位移，无需独立坐标同步。
- **对齐自适应**：
  - 靠右贴边或偏屏幕右半区：Toast 靠右对齐（`right: 0; left: auto;`）。
  - 靠左贴边或偏屏幕左半区：Toast 靠左对齐（`left: 0; right: auto;`）。
  - 胶囊靠屏幕极顶部（`y < 60px`）：Toast 切换至胶囊下方展示（`top: calc(100% + 8px); bottom: auto;`），防止溢出视口。

### 6. 配置持久化与窗口缩放保护
- 在本地存储（`chrome.storage.local` 或 `localStorage`）中保存：
  `{ isDocked, dockSide, x, y, topPercent }`
- 监听 `window.resize`（防抖 120ms）：若处于贴边态，根据 `topPercent` 重新计算并吸附在视口边缘；若处于自由态，限制 `x, y` 在新视口边界内，避免胶囊因窗口缩放掉出视口外。

---

## 配套参考与模板 (References & Templates)

- [交互参数与状态机详解](./references/interaction_spec.md)
- [DOM 结构与视觉样式规范](./references/dom_and_css_patterns.md)
- [Vanilla TS 开箱即用模块模板](./templates/vanilla_capsule.ts)
- [Vue 3 单文件组件模板](./templates/vue_capsule.vue)
