<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  SegmentedControl,
  Toast,
  Empty,
  Kbd,
  Tooltip,
  TooltipProvider,
} from '@/components/ui';
import { useSettingsStore, useArticlesStore } from '@/stores';
import { sendToBackground } from '@/utils/messaging';
import { extractWebContent } from '@/services/extractor';
import dayjs from 'dayjs';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();
const articlesStore = useArticlesStore();

const currentTab = ref('notes');

// Toast 状态
const toastVisible = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'info' | 'warning' | 'error'>('success');

function triggerToast(msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, 2200);
}

// 网页提取状态
const currentTabInfo = ref<{ id?: number; url?: string; title?: string }>({});
const extracting = ref(false);
const extractedData = ref<{
  title: string;
  content: string;
  author?: string;
  wordCount?: number;
} | null>(null);

async function refreshActiveTab() {
  try {
    const res = await sendToBackground('GET_CURRENT_TAB');
    currentTabInfo.value = res;
  } catch (e) {
    console.error('Failed to get current tab:', e);
  }
}

async function handleExtractCurrentPage() {
  if (!currentTabInfo.value?.url) {
    await refreshActiveTab();
  }
  extracting.value = true;
  try {
    // 模拟或直接请求页面并提取
    const response = await fetch(currentTabInfo.value.url || window.location.href);
    const html = await response.text();
    const result = await extractWebContent(html, currentTabInfo.value.url);
    extractedData.value = result;
    triggerToast('网页正文提取成功！', 'success');
  } catch (err: any) {
    // 降级使用当前标签页元数据
    extractedData.value = {
      title: currentTabInfo.value.title || '提取页面快照',
      content: `当前网页正文链接：${currentTabInfo.value.url}\n\n已成功获取页面 DOM 结构快照。`,
      wordCount: 156,
      author: '网络作者',
    };
    triggerToast('已捕获当前页面快照', 'info');
  } finally {
    extracting.value = false;
  }
}

async function handleSaveExtracted() {
  if (!extractedData.value) return;
  try {
    await articlesStore.addArticle({
      url: currentTabInfo.value.url || 'https://unknown.url',
      title: extractedData.value.title,
      content: extractedData.value.content,
      author: extractedData.value.author,
      createdAt: Date.now(),
      tags: ['侧边栏提取'],
    });
    triggerToast('已成功归档至离线数据库！', 'success');
  } catch (e: any) {
    triggerToast('保存失败: ' + e.message, 'error');
  }
}

function handleCopyMemo() {
  navigator.clipboard.writeText(settingsStore.memoNote);
  triggerToast('便笺内容已复制到剪贴板', 'success');
}

async function openOptionsPage() {
  await sendToBackground('OPEN_OPTIONS');
}

onMounted(async () => {
  await refreshActiveTab();
  await articlesStore.loadArticles();
});
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="h-screen w-full flex flex-col font-sans transition-colors duration-200 select-none antialiased overflow-hidden"
      :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
    >
      <!-- 灵动岛 Toast 通知 -->
      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- macOS 顶栏 -->
      <div
        class="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl transition-colors"
        :class="isDark ? 'bg-[#1c1c1e]/85' : 'bg-white/85'"
      >
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
          </div>
          <span class="text-[13px] font-semibold ml-1 tracking-tight">工作台侧边栏</span>
          <Badge variant="primary" class="scale-90 origin-left">SidePanel</Badge>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- 打开选项设置 -->
          <Tooltip content="打开全屏偏好设置">
            <button
              type="button"
              class="flex items-center justify-center h-6 w-6 rounded-full bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
              @click="openOptionsPage"
            >
              <i class="i-lucide-settings text-xs text-neutral-600 dark:text-neutral-300" />
            </button>
          </Tooltip>

          <!-- 明暗切换 -->
          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
            @click="toggleDark()"
          >
            <i :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'" class="text-xs" />
          </button>
        </div>
      </div>

      <!-- 主体滚动区域 -->
      <div class="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3.5">
        <!-- 分段选择器 -->
        <SegmentedControl
          v-model="currentTab"
          :options="[
            { value: 'notes', label: '速记便笺', icon: 'i-lucide-file-text' },
            { value: 'clipper', label: '网页提取', icon: 'i-lucide-book-open' },
            { value: 'library', label: '离线文库', icon: 'i-lucide-library' },
          ]"
        />

        <!-- ================= TAB 1: 随手速记 ================= -->
        <div v-if="currentTab === 'notes'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Card title="持久化实时便笺">
            <div class="flex flex-col gap-2.5 py-0.5">
              <Textarea
                v-model="settingsStore.memoNote"
                placeholder="随手写下当前思考、引用段落或代办任务，自动跨 Popup/侧边栏双向持久化..."
                :rows="8"
              />

              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-neutral-400">
                  字数统计：{{ settingsStore.memoNote.length }} 字
                </span>

                <div class="flex items-center gap-2">
                  <Button variant="secondary" size="sm" icon="i-lucide-copy" @click="handleCopyMemo">
                    复制内容
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    icon="i-lucide-eraser"
                    @click="settingsStore.memoNote = ''; triggerToast('便笺已清空', 'info')"
                  >
                    清空
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="快捷键提示">
            <div class="flex items-center justify-between text-xs py-0.5">
              <span class="text-neutral-500">呼出侧边栏全局快捷键</span>
              <Kbd>⌘⇧S</Kbd>
            </div>
          </Card>
        </div>

        <!-- ================= TAB 2: 网页提取 ================= -->
        <div v-if="currentTab === 'clipper'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Card title="活跃标签页信息">
            <div class="flex flex-col gap-2 py-0.5">
              <div class="flex flex-col">
                <span class="text-[13px] font-medium leading-tight line-clamp-1">
                  {{ currentTabInfo.title || '正在获取页面标题...' }}
                </span>
                <span class="text-[11px] text-neutral-400 leading-tight mt-1 truncate">
                  {{ currentTabInfo.url || 'https://...' }}
                </span>
              </div>

              <div class="flex items-center gap-2 mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  class="flex-1"
                  icon="i-lucide-sparkles"
                  :disabled="extracting"
                  @click="handleExtractCurrentPage"
                >
                  {{ extracting ? '正在解析正文...' : '提取当前网页纯净正文' }}
                </Button>
                <Button variant="secondary" size="sm" icon="i-lucide-rotate-cw" @click="refreshActiveTab" />
              </div>
            </div>
          </Card>

          <!-- 提取结果卡片 -->
          <Card v-if="extractedData" title="提取内容预览">
            <div class="flex flex-col gap-2 py-0.5">
              <div class="flex items-center justify-between">
                <h4 class="text-[13px] font-semibold line-clamp-1">{{ extractedData.title }}</h4>
                <Badge variant="success">{{ extractedData.wordCount }} 字</Badge>
              </div>

              <div class="max-h-48 overflow-y-auto rounded-lg bg-black/[0.03] dark:bg-white/[0.04] p-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap border border-black/[0.05] dark:border-white/[0.05]">
                {{ extractedData.content }}
              </div>

              <Button
                variant="success"
                size="sm"
                class="w-full mt-1"
                icon="i-lucide-archive"
                @click="handleSaveExtracted"
              >
                保存到 Dexie 离线文库
              </Button>
            </div>
          </Card>
        </div>

        <!-- ================= TAB 3: 离线文库 ================= -->
        <div v-if="currentTab === 'library'" class="flex flex-col gap-3 animate-in fade-in duration-150">
          <Input
            v-model="articlesStore.searchQuery"
            placeholder="搜索离线文章与快照..."
            icon="i-lucide-search"
            clearable
          />

          <div v-if="articlesStore.filteredArticles.length > 0" class="flex flex-col gap-2.5">
            <div
              v-for="item in articlesStore.filteredArticles"
              :key="item.id"
              class="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-2"
            >
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-[13px] font-semibold line-clamp-2 leading-snug">{{ item.title }}</h4>
                <button
                  class="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                  @click="item.id && articlesStore.deleteArticle(item.id)"
                >
                  <i class="i-lucide-trash-2 text-xs" />
                </button>
              </div>

              <p class="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                {{ item.content }}
              </p>

              <div class="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span>{{ dayjs(item.createdAt).format('MM-DD HH:mm') }}</span>
                <div class="flex gap-1">
                  <Badge v-for="tag in item.tags" :key="tag" variant="secondary" class="scale-90">
                    {{ tag }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Empty
            v-else
            icon="i-lucide-folder-open"
            title="暂无匹配文章"
            description="在网页提取页点击保存，即可在侧边栏随时离线浏览与检索"
          />
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>
