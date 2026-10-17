# Floating Edge Dock - DOM 结构与视觉样式规范

本文件整理胶囊浮窗的 HTML/DOM 结构标准以及推荐的 CSS 样式 Token。

---

## 1. 推荐 DOM 结构层级

```html
<!-- 胶囊容器根节点 -->
<div id="app-floating-capsule" class="floating-dock-container">
  <!-- 1. 伴随 Toast 气泡（绝对定位在胶囊上方/下方，跟随移动） -->
  <div class="floating-dock-toast" aria-live="polite">已保存</div>

  <!-- 2. 微型点阵拖拽抓手 -->
  <div class="floating-dock-grip" title="拖拽移动，靠边自动折叠">
    <svg width="7" height="14" viewBox="0 0 7 14">...</svg>
  </div>

  <!-- 3. 业务纯图标功能按钮组 -->
  <button class="floating-dock-btn primary" title="存入收集箱">...</button>
  <button class="floating-dock-btn" title="快速扫描">...</button>
  <button class="floating-dock-btn" title="自动向下滚屏">...</button>
</div>
```

---

## 2. 核心容器样式 Tokens (Frosted Glass & Pill)

```css
.floating-dock-container {
  /* 定位与层级 */
  position: fixed;
  z-index: 2147483647; /* 保证高于绝大多数页面模态层 */
  
  /* 布局与排布 */
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  
  /* 毛玻璃与背景 */
  background-color: rgba(255, 255, 255, 0.90);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-radius: 9999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
  
  /* 手势与抗干扰 */
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  cursor: grab;
  
  /* 动效过渡 */
  transition:
    left 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    top 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-dock-container:active {
  cursor: grabbing;
}
```

---

## 3. 点阵拉手 (Drag Grip) SVG 与样式

点阵手柄能给用户非常明确的“可被拖拽”心理暗示：

```html
<svg width="7" height="14" viewBox="0 0 7 14" fill="none">
  <circle cx="2" cy="2" r="1.3" fill="#8e8e93"/>
  <circle cx="5" cy="2" r="1.3" fill="#8e8e93"/>
  <circle cx="2" cy="7" r="1.3" fill="#8e8e93"/>
  <circle cx="5" cy="7" r="1.3" fill="#8e8e93"/>
  <circle cx="2" cy="12" r="1.3" fill="#8e8e93"/>
  <circle cx="5" cy="12" r="1.3" fill="#8e8e93"/>
</svg>
```

```css
.floating-dock-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 24px;
  cursor: grab;
  padding: 0 2px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.floating-dock-grip:hover {
  opacity: 1;
}
```

---

## 4. 图标按钮 (Icon Buttons) 规范

- **外形尺寸**：`28px × 28px` 圆形，内部 SVG 尺寸约 `14px ~ 15px`。
- **色彩与层级**：
  - 主动作（Primary Action）：使用高对比功能色（如 Apple Green `#34C759`，白色图标）。
  - 次要动作（Secondary Actions）：使用极弱半透明背景（`rgba(0, 0, 0, 0.06)`，深色图标 `#1d1d1f`）。
  - 危险/终止动作（Destructive/Stop）：高亮警示红（`#FF3B30`）。
- **微交互**：`mouseenter` 时 `transform: scale(1.1); opacity: 0.85;`。

---

## 5. Toast 提示气泡跟随规范

```css
.floating-dock-toast {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0; /* 根据贴靠侧动态切换为 left: 0 或 right: 0 */
  z-index: 2147483647;
  padding: 6px 12px;
  background-color: rgba(29, 29, 31, 0.92);
  color: #ffffff;
  border-radius: 8px;
  font-size: 11px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}
```
