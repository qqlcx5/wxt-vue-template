<script lang="ts" setup>
import { ref } from 'vue';
import { useTextSelection } from './composables/useSelection';
import SelectionPopover from './components/SelectionPopover.vue';
import { useElementClipper, type ClippedElementInfo } from './composables/useElementClipper';
import ElementClipper from './components/ElementClipper.vue';
import { captureVisibleScreenshot, downloadScreenshot, saveScreenshotToArticles } from '@/services/screenshot';
import { sendToBackground } from '@/utils/messaging';

const { selectedText, position, isVisible, clearSelection } = useTextSelection();
const { isClipperActive, hoveredInfo, selectedInfo, startClipper, stopClipper } = useElementClipper();

const expanded = ref(false);
const statusToast = ref('');
const isCapturing = ref(false);

function showToast(msg: string) {
  statusToast.value = msg;
  setTimeout(() => {
    statusToast.value = '';
  }, 2400);
}

async function handleOpenSidePanel() {
  await sendToBackground('OPEN_SIDEPANEL');
  expanded.value = false;
}

async function handleOpenOptions() {
  await sendToBackground('OPEN_OPTIONS');
  expanded.value = false;
}

async function handleOpenChatStudio() {
  await sendToBackground('OPEN_CHAT');
  expanded.value = false;
}

// 启动网页元素剪藏器
function handleStartClipper() {
  expanded.value = false;
  startClipper();
  showToast('元素拾取已开启：鼠标悬停选择，点击锁定，Esc 退出');
}

// 保存剪藏的 DOM 元素到离线数据库
async function handleSaveClippedElement(info: ClippedElementInfo) {
  try {
    showToast('正在归档剪藏元素...');
    const res = await sendToBackground('SAVE_ARTICLE', {
      url: window.location.href,
      title: `[网页剪藏] <${info.tagName}> ${document.title || ''}`,
      content: `来源网址: ${window.location.href}\n元素标签: <${info.tagName}>\n类名: ${info.className}\n\n### 提取文本内容\n${info.text}\n\n### HTML 源码\n\`\`\`html\n${info.html}\n\`\`\``,
      tags: ['网页剪藏', info.tagName],
    });
    if (res?.success) {
      showToast('已成功存入离线文库！');
    }
    stopClipper();
  } catch (err: any) {
    showToast('剪藏失败: ' + err.message);
  }
}

// 捕获可视区域高画质快照并保存
async function handleCaptureScreenshot() {
  if (isCapturing.value) return;
  isCapturing.value = true;
  expanded.value = false;
  showToast('正在捕获高画质快照...');

  try {
    const dataUrl = await captureVisibleScreenshot();
    if (!dataUrl) {
      showToast('截屏失败，未获取到图像数据');
      return;
    }
    // 自动保存 PNG 文件
    const filename = `snapshot-${Date.now()}.png`;
    downloadScreenshot(dataUrl, filename);
    // 同时持久化到 Dexie 知识库
    await saveScreenshotToArticles(dataUrl, document.title || '网页可视快照');
    showToast('快照捕获成功并已下载存档！');
  } catch (err: any) {
    showToast('截屏失败: ' + err.message);
  } finally {
    isCapturing.value = false;
  }
}

// 一键快速全文提取
async function handleQuickExtract() {
  showToast('正在提取当前页正文...');
  try {
    const res = await sendToBackground('SAVE_ARTICLE', {
      url: window.location.href,
      title: document.title || '网页快照',
      content: `URL: ${window.location.href}\nTitle: ${document.title}\n\n已成功从宿主页面捕获。`,
      tags: ['悬浮球提取'],
    });
    if (res?.success) {
      showToast('已成功归档至离线文库！');
    }
  } catch (err: any) {
    showToast('提取失败: ' + err.message);
  }
}
</script>

<template>
  <div class="font-sans antialiased select-none text-neutral-900 dark:text-white">
    <!-- 1. 全局划词选区悬浮胶囊工具栏 -->
    <SelectionPopover
      :text="selectedText"
      :position="position"
      :visible="isVisible"
      @close="clearSelection"
    />

    <!-- 2. 网页元素高亮拾取器 (Element Clipper) -->
    <ElementClipper
      :active="isClipperActive"
      :hovered="hoveredInfo"
      :selected="selectedInfo"
      @save="handleSaveClippedElement"
      @cancel="stopClipper"
    />

    <!-- 3. 右下角常驻悬浮快捷球与卡片 -->
    <div class="fixed bottom-6 right-6 z-[999999]">
      <!-- 快捷反馈 Toast -->
      <div
        v-if="statusToast"
        class="absolute -top-10 right-0 z-10 px-3 py-1 rounded-full bg-black/85 text-white text-xs font-medium shadow-lg whitespace-nowrap animate-in fade-in"
      >
        {{ statusToast }}
      </div>

      <!-- 展开的 Apple 风格快捷卡片 -->
      <div
        v-if="expanded"
        class="mb-3 w-76 rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 p-3.5 text-neutral-850 dark:text-neutral-100 shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-black/10 dark:border-white/10 backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        <!-- 顶栏 -->
        <div class="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div class="flex items-center gap-2">
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#007AFF] text-white">
              <i class="i-lucide-apple text-xs" />
            </span>
            <span class="font-semibold text-xs tracking-tight">扩展助手 (Shadow DOM)</span>
          </div>
          <button
            type="button"
            class="rounded-full p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors border-0 bg-transparent cursor-pointer"
            @click="expanded = false"
          >
            <i class="i-lucide-x text-xs" />
          </button>
        </div>

        <!-- 功能说明 -->
        <div class="py-2.5 text-xs text-neutral-500 leading-relaxed">
          <p>选中文字呼出<strong>划词 AI 解释 / 翻译 / 引用</strong>，或使用下列工具剪藏网页：</p>
        </div>

        <!-- 常用快捷操作按钮组 -->
        <div class="flex flex-col gap-1.5 pt-1">
          <!-- 元素拾取剪藏 -->
          <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all border-0 cursor-pointer text-left"
            @click="handleStartClipper"
          >
            <span class="flex items-center gap-2">
              <i class="i-lucide-crop text-[#007AFF] text-xs" />
              <span>网页元素剪藏 (Element Clipper)</span>
            </span>
            <span class="text-[10px] text-neutral-400 font-mono">拾取</span>
          </button>

          <!-- 网页快照截屏 -->
          <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all border-0 cursor-pointer text-left"
            @click="handleCaptureScreenshot"
          >
            <span class="flex items-center gap-2">
              <i class="i-lucide-camera text-[#FF9500] text-xs" />
              <span>可视区域快照截图</span>
            </span>
            <span class="text-[10px] text-neutral-400 font-mono">PNG</span>
          </button>

          <!-- 一键存入离线文库 -->
          <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all border-0 cursor-pointer text-left"
            @click="handleQuickExtract"
          >
            <span class="flex items-center gap-2">
              <i class="i-lucide-book-open text-[#34C759] text-xs" />
              <span>一键存入离线文库</span>
            </span>
            <span class="text-[10px] text-neutral-400 font-mono">全文</span>
          </button>

          <!-- 全屏 AI 工作台 -->
          <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all border-0 cursor-pointer text-left"
            @click="handleOpenChatStudio"
          >
            <span class="flex items-center gap-2">
              <i class="i-lucide-bot text-[#007AFF] text-xs" />
              <span>全屏 AI 智能助手 (Studio)</span>
            </span>
            <span class="text-[10px] text-neutral-400 font-mono">新标签</span>
          </button>

          <!-- 打开侧边栏 -->
          <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all border-0 cursor-pointer text-left"
            @click="handleOpenSidePanel"
          >
            <span class="flex items-center gap-2">
              <i class="i-lucide-panel-right text-[#AF52DE] text-xs" />
              <span>打开侧边栏 (Side Panel)</span>
            </span>
            <span class="text-[10px] text-neutral-400 font-mono">⌘⇧S</span>
          </button>

          <!-- 偏好设置 -->
          <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all border-0 cursor-pointer text-left"
            @click="handleOpenOptions"
          >
            <span class="flex items-center gap-2">
              <i class="i-lucide-settings text-neutral-500 text-xs" />
              <span>偏好设置 (Options)</span>
            </span>
          </button>
        </div>
      </div>

      <!-- 悬浮胶囊触发器 -->
      <button
        type="button"
        class="flex h-10 px-3.5 items-center gap-2 rounded-full bg-white/95 dark:bg-[#1c1c1e]/95 text-neutral-800 dark:text-neutral-100 shadow-[0_8px_25px_rgba(0,0,0,0.18)] border border-black/10 dark:border-white/10 backdrop-blur-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer font-medium text-xs"
        @click="expanded = !expanded"
      >
        <i class="i-lucide-sparkles text-[#007AFF] text-sm" />
        <span class="text-xs">扩展助手</span>
      </button>
    </div>
  </div>
</template>
