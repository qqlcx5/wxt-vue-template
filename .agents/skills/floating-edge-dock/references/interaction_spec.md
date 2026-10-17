# Floating Edge Dock - 交互参数与算法规范

本文件记录悬浮胶囊在手势、坐标系、边界检测与折叠展开时的精确数学计算与参数推荐值。

---

## 1. 核心数值与时间常量 (Constants)

| 参数名 | 推荐默认值 | 作用与说明 |
| :--- | :--- | :--- |
| `DOCK_THRESHOLD` | `32px` | 贴边吸附判定阈值。松手时距屏幕边框 ≤ 此值才判定贴边，否则为自由悬浮。 |
| `DRAG_START_THRESHOLD` | `5px` | 拖拽位移触发阈值。按下后移动勾股距离大于 5px 才转入拖拽态，避免误触。 |
| `EXPOSED_WIDTH` | `24px` | 贴边最小化时留在屏幕可视区域内的拉手宽度。 |
| `COLLAPSE_DELAY` | `700ms` | 鼠标移开（MouseLeave）后的折叠防抖延时，防止轻微划出边缘引起闪烁。 |
| `TOAST_DURATION` | `2500ms` | 状态反馈气泡默认展示时长。气泡展示期间自动激活 Busy Lock。 |
| `SPRING_EASE` | `cubic-bezier(0.16, 1, 0.3, 1)` | 现代丝滑抽屉动画曲线（Apple 风格的平滑减速曲线）。 |
| `CLICK_BLOCK_DELAY` | `120ms` | 拖拽释放后拦截原生 Click 事件的持续时间。 |

---

## 2. 坐标检测与限位算法 (Boundary & Dock Math)

### 2.1 拖拽实时限位
在 `pointermove` 过程中，动态限制容器不能被拖出屏幕之外：
```ts
const w = rect.width || 120;
const h = rect.height || 34;

// 限制 x, y 在屏幕可视区域之内，保留边缘安全间距
const clampedX = Math.max(0, Math.min(window.innerWidth - w, originX + dx));
const clampedY = Math.max(8, Math.min(window.innerHeight - h - 8, originY + dy));
```

### 2.2 松手贴边/自由态判定
在 `pointerup` 释放时：
```ts
const distLeft = currentX;
const distRight = window.innerWidth - (currentX + w);

let isDocked = false;
let dockSide: 'left' | 'right' = 'right';
let finalX = currentX;
let finalY = Math.max(12, Math.min(window.innerHeight - h - 12, currentY));

if (distLeft <= DOCK_THRESHOLD) {
  // 贴靠左边缘
  isDocked = true;
  dockSide = 'left';
  finalX = 0;
} else if (distRight <= DOCK_THRESHOLD) {
  // 贴靠右边缘
  isDocked = true;
  dockSide = 'right';
  finalX = window.innerWidth - w;
} else {
  // 自由常驻态：保留松手坐标，绝不强制吸边
  isDocked = false;
  finalX = currentX;
}

// 记录垂直比例（用于视口改变时的自适应还原）
const topPercent = finalY / Math.max(1, window.innerHeight - h);
```

---

## 3. 贴边收纳位移计算 (Transform Formulas)

当 `isDocked === true` 时，通过 CSS `transform` 进行无重排（GPU 加速）位移：

| 停靠侧边 | 收起态 (Collapsed) | 展开态 (Expanded) |
| :--- | :--- | :--- |
| **右侧停靠 (`dockSide: 'right'`)** | `transform: translateX(calc(100% - 24px)); opacity: 0.75;` | `transform: translateX(0); opacity: 1;` |
| **左侧停靠 (`dockSide: 'left'`)** | `transform: translateX(calc(-100% + 24px)); opacity: 0.75;` | `transform: translateX(0); opacity: 1;` |

*注：留在屏幕内的 `24px` 刚好覆盖最侧边的点阵手柄或侧端按钮，鼠标只要划到该半圆即可立即触发 `mouseenter` 唤醒。*

---

## 4. 防冲突事件流与锁机制 (Conflict & Lock Resolution)

```
[ PointerDown ]
  ├── 记录 pointerStartX, pointerStartY
  └── 记录 initialRectLeft, initialRectTop

[ PointerMove ]
  ├── 计算 dx, dy
  ├── 若 !isDragging && Math.hypot(dx, dy) > 5:
  │     ├── isDragging = true, hasDragged = true
  │     ├── 取消 left/top 过渡动画 (transition: 'none')
  │     ├── setPointerCapture(e.pointerId)
  │     └── 展开胶囊 (transform: 'none', opacity: 1)
  └── 实时更新 container.style.left, container.style.top

[ PointerUp ]
  ├── 若 isDragging:
  │     ├── releasePointerCapture(e.pointerId)
  │     ├── 执行贴边阈值判定 (dist <= 32px ?)
  │     ├── 开启平滑过渡 (transition: 'left 0.25s ..., top 0.25s ...')
  │     ├── 若贴边：触发 scheduleCollapse(900)
  │     └── 设定 hasDragged = true，并在 120ms 后重置

[ Container Click (Capture 阶段) ]
  └── 若 hasDragged 为 true:
        ├── e.preventDefault()
        └── e.stopImmediatePropagation() (彻底拦截子按钮的点击事件)
```
