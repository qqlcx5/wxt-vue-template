<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Card,
  Input,
  Switch,
  Select,
  Badge,
  Kbd,
  Toast,
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TooltipProvider,
} from '@/components/ui';
import { useSettingsStore, useArticlesStore } from '@/stores';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

const settingsStore = useSettingsStore();
const articlesStore = useArticlesStore();

const activeSection = ref<'general' | 'shortcuts' | 'storage' | 'ai' | 'about'>('general');

// Toast
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

const navItems = [
  { id: 'general', label: '通用偏好', icon: 'i-lucide-sliders-horizontal' },
  { id: 'shortcuts', label: '系统快捷键', icon: 'i-lucide-command' },
  { id: 'storage', label: '数据与存储', icon: 'i-lucide-hard-drive' },
  { id: 'ai', label: 'AI 模型引擎', icon: 'i-lucide-bot' },
  { id: 'about', label: '关于扩展', icon: 'i-lucide-info' },
] as const;

// AI 模型选项
const aiModelOptions = [
  { value: 'gpt4o', label: 'GPT-4o (Omni)', icon: 'i-lucide-sparkles' },
  { value: 'claude35', label: 'Claude 3.5 Sonnet', icon: 'i-lucide-zap' },
  { value: 'gemini15', label: 'Gemini 1.5 Pro', icon: 'i-lucide-bot' },
  { value: 'deepseek', label: 'DeepSeek-V3', icon: 'i-lucide-cpu' },
];

// 快捷键列表
const shortcutList = [
  { name: '打开快捷弹窗', command: '_execute_action', keys: '⌘⇧Y', desc: '激活当前页面的 Apple UI Popup 菜单' },
  { name: '打开右侧工作台', command: 'open-sidepanel', keys: '⌘⇧S', desc: '在浏览器右侧停靠并展开全功能工作台' },
  { name: '静默提取当前页', command: 'quick-extract', keys: '⌘⇧E', desc: '全后台抓取当前活跃标签页正文并存入数据库' },
];

import { sendToBackground } from '@/utils/messaging';

async function openSidePanelTest() {
  const sidePanelApi = (globalThis as any).chrome?.sidePanel;
  if (sidePanelApi?.open) {
    try {
      const win = await (globalThis as any).chrome?.windows?.getCurrent?.();
      if (win?.id) {
        await sidePanelApi.open({ windowId: win.id });
        triggerToast('侧边栏已成功唤起！', 'success');
        return;
      }
    } catch (e: any) {
      console.warn('Options open sidepanel error:', e);
    }
  }
  const res = await sendToBackground('OPEN_SIDEPANEL');
  if (res?.success) {
    triggerToast('侧边栏已唤起！', 'success');
  } else {
    triggerToast(res?.error || '唤起失败，请在浏览器右上角展开侧边栏', 'warning');
  }
}

function openBrowserShortcuts() {
  window.open('chrome://extensions/shortcuts', '_blank');
}

// 导出 JSON
async function handleExport() {
  try {
    const json = await articlesStore.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extension-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('数据已成功导出为 JSON 文件', 'success');
  } catch (e: any) {
    triggerToast('导出失败: ' + e.message, 'error');
  }
}

// 导入 JSON
const fileInput = ref<HTMLInputElement | null>(null);
function triggerImport() {
  fileInput.value?.click();
}

async function handleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const count = await articlesStore.importJSON(content);
      triggerToast(`成功导入恢复 ${count} 条记录！`, 'success');
    } catch (err: any) {
      triggerToast('导入解析失败：' + err.message, 'error');
    } finally {
      if (fileInput.value) fileInput.value.value = '';
    }
  };
  reader.readAsText(file);
}

// 清空数据
async function handleClearData() {
  await articlesStore.clearAll();
  triggerToast('本地数据库已全部重置清空', 'warning');
}

onMounted(() => {
  articlesStore.loadArticles();
});
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="min-h-screen w-full flex font-sans transition-colors duration-200 select-none antialiased"
      :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
    >
      <!-- 隐藏的文件选择器 -->
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        class="hidden"
        @change="handleFileSelected"
      />

      <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

      <!-- 左侧 macOS 系统偏好设置导航栏 -->
      <aside
        class="w-64 border-r border-black/[0.06] dark:border-white/[0.08] p-4 flex flex-col justify-between shrink-0"
        :class="isDark ? 'bg-[#1c1c1e]/70' : 'bg-white/70'"
      >
        <div class="flex flex-col gap-4">
          <!-- 视窗红黄绿交通灯 + 标题 -->
          <div class="flex items-center gap-2 px-2 py-1">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
              <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
              <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
            </div>
            <span class="text-[14px] font-semibold ml-1.5 tracking-tight">偏好设置</span>
          </div>

          <!-- 导航菜单项 -->
          <nav class="flex flex-col gap-1">
            <button
              v-for="item in navItems"
              :key="item.id"
              type="button"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border-0 outline-none text-left"
              :class="
                activeSection === item.id
                  ? 'bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)]'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              "
              @click="activeSection = item.id"
            >
              <i :class="item.icon" class="text-sm shrink-0" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </div>

        <!-- 底部明暗切换与版本号 -->
        <div class="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between px-2">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors border-0 bg-transparent cursor-pointer"
            @click="toggleDark()"
          >
            <i :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'" />
            <span>{{ isDark ? '深色模式' : '浅色模式' }}</span>
          </button>
          <span class="text-[11px] text-neutral-400">v1.0.0</span>
        </div>
      </aside>

      <!-- 右侧配置展区 -->
      <main class="flex-1 p-8 max-w-2xl overflow-y-auto">
        <!-- ================= SECTION 1: 通用偏好 ================= -->
        <div v-if="activeSection === 'general'" class="flex flex-col gap-5 animate-in fade-in duration-150">
          <div>
            <h2 class="text-xl font-bold tracking-tight">通用偏好</h2>
            <p class="text-xs text-neutral-500 mt-1">管理应用默认外观、提醒和后台同步行为</p>
          </div>

          <Card title="界面与显示">
            <div class="flex flex-col">
              <div class="flex items-center justify-between py-1.5">
                <div>
                  <div class="text-[13px] font-normal">深色主题模式</div>
                  <div class="text-[11px] text-neutral-400 mt-0.5">跟随系统或手动切换全黑 Apple Dark Mode</div>
                </div>
                <Switch :checked="isDark" @update:checked="toggleDark()" />
              </div>

              <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />

              <div class="flex items-center justify-between py-1.5">
                <div>
                  <div class="text-[13px] font-normal">在图标上显示角标</div>
                  <div class="text-[11px] text-neutral-400 mt-0.5">保存新页面或执行任务时在浏览器右上角提示状态</div>
                </div>
                <Switch v-model:checked="settingsStore.showBadge" />
              </div>
            </div>
          </Card>

          <Card title="同步与提取">
            <div class="flex flex-col">
              <div class="flex items-center justify-between py-1.5">
                <div>
                  <div class="text-[13px] font-normal">网页正文自动清洗</div>
                  <div class="text-[11px] text-neutral-400 mt-0.5">提取时使用 DOMPurify 净化危险标签并格式化 Markdown</div>
                </div>
                <Switch v-model:checked="settingsStore.extractorEnabled" />
              </div>

              <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />

              <div class="flex items-center justify-between py-1.5">
                <div>
                  <div class="text-[13px] font-normal">云端自动备份</div>
                  <div class="text-[11px] text-neutral-400 mt-0.5">多设备之间实时同步已保存的文章与笔记记录</div>
                </div>
                <Switch v-model:checked="settingsStore.autoSync" />
              </div>
            </div>
          </Card>
        </div>

        <!-- ================= SECTION 2: 系统快捷键 ================= -->
        <div v-if="activeSection === 'shortcuts'" class="flex flex-col gap-5 animate-in fade-in duration-150">
          <div>
            <h2 class="text-xl font-bold tracking-tight">系统快捷键</h2>
            <p class="text-xs text-neutral-500 mt-1">全局快速呼出与沉浸式操作，支持在 Chrome 快捷键面板自定义修改</p>
          </div>

          <Card title="已注册的核心指令">
            <div class="flex flex-col gap-3 py-1">
              <div
                v-for="(item, idx) in shortcutList"
                :key="item.command"
                class="flex items-center justify-between py-1"
                :class="{ 'border-b border-black/[0.05] dark:border-white/[0.06] pb-2': idx < shortcutList.length - 1 }"
              >
                <div class="flex flex-col">
                  <span class="text-[13px] font-medium">{{ item.name }}</span>
                  <span class="text-[11px] text-neutral-400 mt-0.5">{{ item.desc }}</span>
                </div>
                <Kbd class="text-xs px-2.5 py-1">{{ item.keys }}</Kbd>
              </div>
            </div>
          </Card>

          <div class="flex items-center gap-3">
            <Button variant="primary" @click="openSidePanelTest">
              <i class="i-lucide-panel-right text-xs" />
              测试呼出侧边栏
            </Button>
            <Button variant="secondary" @click="openBrowserShortcuts">
              <i class="i-lucide-external-link text-xs" />
              打开 Chrome 自定义快捷键面板
            </Button>
          </div>
        </div>

        <!-- ================= SECTION 3: 数据与存储 ================= -->
        <div v-if="activeSection === 'storage'" class="flex flex-col gap-5 animate-in fade-in duration-150">
          <div>
            <h2 class="text-xl font-bold tracking-tight">数据与存储管理</h2>
            <p class="text-xs text-neutral-500 mt-1">本地 Dexie IndexedDB 数据库维护、完整冷备份与数据恢复</p>
          </div>

          <Card title="本地知识库存储统计">
            <div class="flex items-center justify-between py-2">
              <div class="flex flex-col">
                <span class="text-[13px] font-medium">离线已存文章数</span>
                <span class="text-[11px] text-neutral-400 mt-0.5">保存在当前浏览器沙箱中，具备毫秒级全文检索能力</span>
              </div>
              <Badge variant="primary" class="text-sm px-3 py-1">{{ articlesStore.totalCount }} 篇</Badge>
            </div>
          </Card>

          <Card title="冷备份与迁移恢复">
            <div class="flex flex-col gap-3 py-1">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-[13px] font-medium">导出所有离线文章 (JSON)</div>
                  <div class="text-[11px] text-neutral-400 mt-0.5">将全部抓取快照与便笺打包下载为标准 JSON</div>
                </div>
                <Button variant="secondary" size="sm" icon="i-lucide-download" @click="handleExport">
                  导出备份
                </Button>
              </div>

              <div class="border-b border-black/[0.05] dark:border-white/[0.06]" />

              <div class="flex items-center justify-between">
                <div>
                  <div class="text-[13px] font-medium">从 JSON 文件恢复数据</div>
                  <div class="text-[11px] text-neutral-400 mt-0.5">选择历史备份文件批量增量合并写入本地库</div>
                </div>
                <Button variant="outline" size="sm" icon="i-lucide-upload" @click="triggerImport">
                  导入恢复
                </Button>
              </div>
            </div>
          </Card>

          <Card title="危险区域">
            <div class="flex items-center justify-between py-1">
              <div>
                <div class="text-[13px] font-medium text-red-600 dark:text-red-400">清空本地全部数据库</div>
                <div class="text-[11px] text-neutral-400 mt-0.5">此操作不可撤销，将彻底抹除当前浏览器内所有离线快照</div>
              </div>

              <DialogRoot>
                <DialogTrigger as-child>
                  <Button variant="destructive" size="sm" icon="i-lucide-trash-2">
                    清空数据
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle class="text-[15px] font-semibold text-red-600">确定要清空全部数据吗？</DialogTitle>
                  <DialogDescription class="text-xs text-neutral-500 mt-2 leading-relaxed">
                    清空后本地 Dexie 数据库中的所有文章与便笺将彻底消失。若有重要内容，请务必先点击上方“导出备份”。
                  </DialogDescription>
                  <div class="flex justify-end gap-2 mt-4 pt-1">
                    <DialogClose as-child>
                      <Button variant="neutral" size="sm">取消</Button>
                    </DialogClose>
                    <DialogClose as-child>
                      <Button variant="destructive" size="sm" @click="handleClearData">
                        确认抹除
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </DialogRoot>
            </div>
          </Card>
        </div>

        <!-- ================= SECTION 4: AI 模型与密钥 ================= -->
        <div v-if="activeSection === 'ai'" class="flex flex-col gap-5 animate-in fade-in duration-150">
          <div>
            <h2 class="text-xl font-bold tracking-tight">AI 模型引擎</h2>
            <p class="text-xs text-neutral-500 mt-1">配置智能总结与网页语义理解大语言模型</p>
          </div>

          <Card title="默认分析模型">
            <div class="flex flex-col gap-2 py-1">
              <label class="text-[12px] text-neutral-500">选择当前优先启用的推理引擎</label>
              <Select v-model="settingsStore.selectedModel" :options="aiModelOptions" />
            </div>
          </Card>

          <Card title="API 访问密钥 (严格加密保存在本地 Storage)">
            <div class="flex flex-col gap-3 py-1">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium">OpenAI API Key</label>
                <Input
                  v-model="settingsStore.openaiKey"
                  type="password"
                  placeholder="sk-..."
                  icon="i-lucide-key"
                  clearable
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium">DeepSeek API Key</label>
                <Input
                  v-model="settingsStore.deepseekKey"
                  type="password"
                  placeholder="sk-..."
                  icon="i-lucide-key"
                  clearable
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium">自定义中转 Endpoint (可选)</label>
                <Input
                  v-model="settingsStore.customEndpoint"
                  placeholder="https://api.openai.com/v1"
                  icon="i-lucide-globe"
                  clearable
                />
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            icon="i-lucide-save"
            class="self-start"
            @click="triggerToast('AI 引擎配置已成功保存！', 'success')"
          >
            保存配置
          </Button>
        </div>

        <!-- ================= SECTION 5: 关于 ================= -->
        <div v-if="activeSection === 'about'" class="flex flex-col gap-5 animate-in fade-in duration-150">
          <div>
            <h2 class="text-xl font-bold tracking-tight">关于扩展脚手架</h2>
            <p class="text-xs text-neutral-500 mt-1">基于 WXT + Vue 3 + UnoCSS + Reka UI 打造的 Apple HIG 级扩展模板</p>
          </div>

          <Card title="脚手架技术架构">
            <div class="flex flex-col gap-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <div class="flex items-center justify-between">
                <span>框架内核</span>
                <Badge variant="primary">WXT 0.21.4 (Chrome MV3)</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span>视图引擎</span>
                <Badge variant="success">Vue 3.5 + Pinia 3.0</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span>原子化 CSS</span>
                <Badge variant="purple">UnoCSS v66 + Pure CSS Icons</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span>UI 组件库</span>
                <Badge variant="secondary">Apple HIG Custom UI (22 Components)</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span>本地数据库</span>
                <Badge variant="warning">Dexie IndexedDB v4.4</Badge>
              </div>
            </div>
          </Card>

          <Card title="设计与开发遵循">
            <p class="text-xs text-neutral-500 leading-relaxed py-1">
              严格遵循 Apple Human Interface Guidelines 规范，去除了粗糙的黑灰边框，呈现通透灵动的毛玻璃质感、胶囊圆角、黄金微比例开关与全套响应式数据流。
            </p>
          </Card>
        </div>
      </main>
    </div>
  </TooltipProvider>
</template>
