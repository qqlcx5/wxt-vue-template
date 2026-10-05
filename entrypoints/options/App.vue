<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Card,
  Input,
  Textarea,
  Slider,
  Switch,
  Select,
  Badge,
  Kbd,
  Toast,
  SegmentedControl,
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TooltipProvider,
} from '@/components/ui';
import { useSettingsStore, useArticlesStore } from '@/stores';
import { testAiConnection, testProviderConnection, fetchRemoteModels } from '@/services/ai';

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
  { value: 'gpt-6.1-sol', label: 'gpt-6.1-sol (当前专属推理通道)', icon: 'i-lucide-sparkles' },
  { value: 'gpt4o', label: 'gpt-6.1-sol (Omni)', icon: 'i-lucide-zap' },
  { value: 'claude35', label: 'Claude 3.5 Sonnet', icon: 'i-lucide-bot' },
  { value: 'deepseek', label: 'DeepSeek-V3', icon: 'i-lucide-cpu' },
  { value: 'gemini15', label: 'Gemini 1.5 Pro', icon: 'i-lucide-layers' },
  { value: 'ollama', label: 'Ollama 本地离线模型', icon: 'i-lucide-hard-drive' },
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

const testingConnection = ref(false);
const testResult = ref<{ success: boolean; latencyMs: number; reply?: string; error?: string } | null>(null);

const aiSubTab = ref<'providers' | 'parameters' | 'routing' | 'prompts'>('providers');
const aiSubTabs = [
  { value: 'providers', label: '模型服务商 (Providers)' },
  { value: 'parameters', label: '推理超参数 (Parameters)' },
  { value: 'routing', label: '场景分流绑定 (Routing)' },
  { value: 'prompts', label: '系统角色词库 (Prompts)' },
];

const providerPingStatus = ref<Record<string, { testing: boolean; result?: { success: boolean; latencyMs: number; reply?: string; error?: string } }>>({});
const providerFetchingModels = ref<Record<string, boolean>>({});
const newModelInputs = ref<Record<string, string>>({});
const keyVisibility = ref<Record<string, boolean>>({});

async function handleTestProvider(providerId: string) {
  providerPingStatus.value[providerId] = { testing: true };
  try {
    const res = await testProviderConnection(providerId);
    providerPingStatus.value[providerId] = { testing: false, result: res };
    if (res.success) {
      triggerToast(`连通测试通过！延迟 ${res.latencyMs}ms`, 'success');
    } else {
      triggerToast(`连接测试未通过: ${res.error}`, 'error');
    }
  } catch (err: any) {
    providerPingStatus.value[providerId] = { testing: false, result: { success: false, latencyMs: 0, error: err.message } };
    triggerToast(`请求异常: ${err.message}`, 'error');
  }
}

async function handleFetchRemoteModels(providerId: string) {
  providerFetchingModels.value[providerId] = true;
  try {
    const res = await fetchRemoteModels(providerId);
    if (res.success && res.models.length > 0) {
      settingsStore.mergeDiscoveredModels(providerId, res.models);
      triggerToast(`成功获取并同步了 ${res.models.length} 个模型！`, 'success');
    } else {
      triggerToast(res.error || '未拉取到可用模型', 'warning');
    }
  } catch (err: any) {
    triggerToast(`拉取失败: ${err.message}`, 'error');
  } finally {
    providerFetchingModels.value[providerId] = false;
  }
}

function handleAddCustomModel(providerId: string) {
  const name = newModelInputs.value[providerId]?.trim();
  if (!name) return;
  settingsStore.addCustomModel(providerId, name, name);
  newModelInputs.value[providerId] = '';
  triggerToast(`已添加模型: ${name}`, 'success');
}

// 快速设置 Max Tokens 选项
const maxTokenPresets = [
  { label: '1024', value: 1024 },
  { label: '2048', value: 2048 },
  { label: '4096 (推荐)', value: 4096 },
  { label: '8192', value: 8192 },
  { label: '16384', value: 16384 },
  { label: '不限 (0)', value: 0 },
];

// 自定义角色预设表单
const showNewPromptModal = ref(false);
const newPromptTitle = ref('');
const newPromptDesc = ref('');
const newPromptText = ref('');

function handleCreateCustomPrompt() {
  if (!newPromptTitle.value.trim() || !newPromptText.value.trim()) {
    triggerToast('请填写人设名称和 System Prompt 内容', 'warning');
    return;
  }
  settingsStore.addCustomPromptPreset({
    title: newPromptTitle.value.trim(),
    icon: 'i-lucide-user-check',
    description: newPromptDesc.value.trim() || '自定义角色设定',
    prompt: newPromptText.value.trim(),
  });
  newPromptTitle.value = '';
  newPromptDesc.value = '';
  newPromptText.value = '';
  showNewPromptModal.value = false;
  triggerToast('自定义角色人设创建成功！', 'success');
}

async function handleTestAiConnection() {
  testingConnection.value = true;
  testResult.value = null;
  try {
    const res = await testAiConnection(
      settingsStore.selectedModel,
      settingsStore.openaiKey,
      settingsStore.customEndpoint,
    );
    testResult.value = res;
    if (res.success) {
      triggerToast(`连通测试通过！延迟 ${res.latencyMs}ms`, 'success');
    } else {
      triggerToast(`连接测试未通过: ${res.error}`, 'error');
    }
  } catch (err: any) {
    testResult.value = { success: false, latencyMs: 0, error: err.message };
    triggerToast(`请求异常: ${err.message}`, 'error');
  } finally {
    testingConnection.value = false;
  }
}

async function openChatStudio() {
  await sendToBackground('OPEN_CHAT');
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
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold tracking-tight">AI 模型引擎与工作台</h2>
              <p class="text-xs text-neutral-500 mt-1">管理多服务商凭证、精细调节推理超参数、场景分流与系统角色库</p>
            </div>

            <Button variant="primary" size="sm" icon="i-lucide-external-link" @click="openChatStudio">
              进入独立全屏 AI 工作台
            </Button>
          </div>

          <!-- Apple 胶囊分段选项卡 -->
          <SegmentedControl v-model="aiSubTab" :options="aiSubTabs" />

          <!-- ================= SUB-TAB 1: 模型服务商 (Providers) ================= -->
          <div v-if="aiSubTab === 'providers'" class="flex flex-col gap-4">
            <div
              v-for="provider in settingsStore.providers"
              :key="provider.id"
              class="rounded-2xl border transition-all"
              :class="provider.enabled
                ? 'bg-white/80 dark:bg-[#1c1c1e]/80 border-black/10 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-70'"
            >
              <!-- 服务商头部 -->
              <div class="flex items-center justify-between p-4 pb-3 border-b border-black/[0.04] dark:border-white/[0.05]">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    :class="provider.enabled ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-black/5 dark:bg-white/5 text-neutral-400'"
                  >
                    <i :class="provider.icon" class="text-lg" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{{ provider.name }}</span>
                      <Badge :variant="provider.enabled ? 'success' : 'secondary'" class="text-[10px] px-2 py-0.5">
                        {{ provider.enabled ? '已启用' : '已停用' }}
                      </Badge>
                      <Badge
                        v-if="providerPingStatus[provider.id]?.result"
                        :variant="providerPingStatus[provider.id]?.result?.success ? 'success' : 'destructive'"
                        class="text-[10px] px-2 py-0.5"
                      >
                        {{ providerPingStatus[provider.id]?.result?.success ? `${providerPingStatus[provider.id]?.result?.latencyMs}ms` : '连通失败' }}
                      </Badge>
                    </div>
                    <span class="text-[11px] text-neutral-400 font-mono mt-0.5 block truncate max-w-[280px]">
                      {{ provider.baseUrl }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <Button
                    v-if="provider.enabled"
                    variant="secondary"
                    size="sm"
                    :disabled="providerPingStatus[provider.id]?.testing"
                    class="h-7 px-2.5 text-xs rounded-full"
                    @click="handleTestProvider(provider.id)"
                  >
                    <i class="i-lucide-activity mr-1 text-[11px]" :class="{ 'animate-pulse': providerPingStatus[provider.id]?.testing }" />
                    {{ providerPingStatus[provider.id]?.testing ? '测试中...' : 'Ping' }}
                  </Button>
                  <Switch
                    :model-value="provider.enabled"
                    @update:model-value="(val) => settingsStore.toggleProvider(provider.id, val)"
                  />
                </div>
              </div>

              <!-- 服务商配置详情（启用时展示） -->
              <div v-if="provider.enabled" class="p-4 flex flex-col gap-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Base URL -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-neutral-700 dark:text-neutral-300">Base URL 端点</label>
                    <Input
                      v-model="provider.baseUrl"
                      placeholder="https://api.example.com/v1"
                      icon="i-lucide-globe"
                      clearable
                    />
                  </div>

                  <!-- API Key -->
                  <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-medium text-neutral-700 dark:text-neutral-300">API 访问密钥 (Key)</label>
                      <button
                        type="button"
                        class="text-[11px] text-[#007AFF] hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1"
                        @click="keyVisibility[provider.id] = !keyVisibility[provider.id]"
                      >
                        <i :class="keyVisibility[provider.id] ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
                        {{ keyVisibility[provider.id] ? '隐藏' : '显示' }}
                      </button>
                    </div>
                    <Input
                      v-model="provider.apiKey"
                      :type="keyVisibility[provider.id] ? 'text' : 'password'"
                      placeholder="sk-..."
                      icon="i-lucide-key"
                      clearable
                    />
                  </div>
                </div>

                <!-- 模型列表管理区 -->
                <div class="flex flex-col gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div class="flex items-center justify-between">
                    <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <span>可用模型列表</span>
                      <span class="text-[10px] text-neutral-400 font-normal">({{ provider.models.length }} 个)</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      :disabled="providerFetchingModels[provider.id]"
                      class="h-6 text-[11px] px-2 text-[#007AFF]"
                      @click="handleFetchRemoteModels(provider.id)"
                    >
                      <i class="i-lucide-refresh-cw mr-1 text-[10px]" :class="{ 'animate-spin': providerFetchingModels[provider.id] }" />
                      {{ providerFetchingModels[provider.id] ? '拉取中...' : '拉取远程可用模型 (/models)' }}
                    </Button>
                  </div>

                  <!-- 模型 Chips 列表 -->
                  <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.04] dark:border-white/[0.04]">
                    <div
                      v-for="m in provider.models"
                      :key="m.id"
                      class="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all"
                      :class="settingsStore.selectedModel === m.id
                        ? 'bg-[#007AFF] text-white shadow-sm'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'"
                    >
                      <span>{{ m.name || m.id }}</span>
                      <button
                        v-if="m.isCustom || provider.models.length > 1"
                        type="button"
                        class="border-0 bg-transparent cursor-pointer p-0 text-current opacity-40 hover:opacity-100 flex items-center justify-center transition-opacity"
                        title="删除该模型"
                        @click.stop="settingsStore.removeCustomModel(provider.id, m.id)"
                      >
                        <i class="i-lucide-x text-[10px]" />
                      </button>
                    </div>
                  </div>

                  <!-- 添加自定义模型输入行 -->
                  <div class="flex items-center gap-2 mt-1">
                    <Input
                      v-model="newModelInputs[provider.id]"
                      placeholder="输入自定义模型 ID (如 gpt-6.1-sol, deepseek-v3...)"
                      size="sm"
                      class="text-xs"
                      @keydown.enter.prevent="handleAddCustomModel(provider.id)"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      class="shrink-0 rounded-full h-8 px-3"
                      @click="handleAddCustomModel(provider.id)"
                    >
                      ＋ 添加模型
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= SUB-TAB 2: 推理超参数 (Parameters) ================= -->
          <div v-if="aiSubTab === 'parameters'" class="flex flex-col gap-4 animate-in fade-in duration-150">
            <Card title="采样温度与核采样 (Sampling & Creativity)">
              <div class="flex flex-col gap-4 py-1">
                <!-- Temperature -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-neutral-800 dark:text-neutral-200 font-medium">采样温度 (Temperature): {{ settingsStore.inferenceParams.temperature.toFixed(2) }}</span>
                    <span class="text-[11px] text-neutral-400">
                      {{ settingsStore.inferenceParams.temperature < 0.3 ? '严谨确定 (代码/分析)' : (settingsStore.inferenceParams.temperature > 1.2 ? '天马行空 (头脑风暴)' : '平衡推荐') }}
                    </span>
                  </div>
                  <Slider
                    :model-value="[Math.round(settingsStore.inferenceParams.temperature * 100)]"
                    :max="200"
                    accent="blue"
                    @update:model-value="(val) => { if (val?.[0] !== undefined) settingsStore.inferenceParams.temperature = val[0] / 100; }"
                  />
                  <span class="text-[11px] text-neutral-400">0.0 (最严谨保守，输出完全确定) ~ 2.0 (极度发散创造力)，默认推荐 0.70</span>
                </div>

                <div class="border-b border-black/[0.04] dark:border-white/[0.05]" />

                <!-- Top P -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-neutral-800 dark:text-neutral-200 font-medium">核采样概率 (Top P): {{ settingsStore.inferenceParams.topP.toFixed(2) }}</span>
                    <span class="text-[11px] text-neutral-400">只从前 P% 概率的候选词池中采样</span>
                  </div>
                  <Slider
                    :model-value="[Math.round(settingsStore.inferenceParams.topP * 100)]"
                    :max="100"
                    accent="blue"
                    @update:model-value="(val) => { if (val?.[0] !== undefined) settingsStore.inferenceParams.topP = val[0] / 100; }"
                  />
                </div>
              </div>
            </Card>

            <Card title="生成长度与重复惩罚 (Length & Penalties)">
              <div class="flex flex-col gap-4 py-1">
                <!-- Max Tokens -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-neutral-800 dark:text-neutral-200 font-medium">单次最大生成长度 (Max Completion Tokens)</span>
                    <span class="text-[11px] text-neutral-400 font-mono">{{ settingsStore.inferenceParams.maxTokens === 0 ? '不限制 (自适应)' : `${settingsStore.inferenceParams.maxTokens} Tokens` }}</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      v-for="preset in maxTokenPresets"
                      :key="preset.value"
                      type="button"
                      class="px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer transition-all active:scale-95"
                      :class="settingsStore.inferenceParams.maxTokens === preset.value
                        ? 'bg-[#007AFF] text-white shadow-sm'
                        : 'bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]'"
                      @click="settingsStore.inferenceParams.maxTokens = preset.value"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                </div>

                <div class="border-b border-black/[0.04] dark:border-white/[0.05]" />

                <!-- Presence Penalty & Frequency Penalty -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1.5">
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-neutral-800 dark:text-neutral-200 font-medium">存在惩罚 (Presence): {{ settingsStore.inferenceParams.presencePenalty.toFixed(1) }}</span>
                    </div>
                    <Slider
                      :model-value="[Math.round((settingsStore.inferenceParams.presencePenalty + 2) * 25)]"
                      :max="100"
                      accent="blue"
                      @update:model-value="(val) => { if (val?.[0] !== undefined) settingsStore.inferenceParams.presencePenalty = Number(((val[0] / 25) - 2).toFixed(1)); }"
                    />
                    <span class="text-[11px] text-neutral-400">大于 0 鼓励模型谈论新主题</span>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-neutral-800 dark:text-neutral-200 font-medium">频率惩罚 (Frequency): {{ settingsStore.inferenceParams.frequencyPenalty.toFixed(1) }}</span>
                    </div>
                    <Slider
                      :model-value="[Math.round((settingsStore.inferenceParams.frequencyPenalty + 2) * 25)]"
                      :max="100"
                      accent="blue"
                      @update:model-value="(val) => { if (val?.[0] !== undefined) settingsStore.inferenceParams.frequencyPenalty = Number(((val[0] / 25) - 2).toFixed(1)); }"
                    />
                    <span class="text-[11px] text-neutral-400">大于 0 降低字词的逐字重复率</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="上下文窗口截断与流式传输 (Context & Stream)">
              <div class="flex flex-col gap-3 py-1">
                <!-- Context Rounds -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-neutral-800 dark:text-neutral-200 font-medium">历史对话轮数 (Context Rounds): {{ settingsStore.inferenceParams.contextRounds }} 轮</span>
                    <span class="text-[11px] text-neutral-400">超出将自动截断早期上下文</span>
                  </div>
                  <Slider
                    :model-value="[settingsStore.inferenceParams.contextRounds]"
                    :min="1"
                    :max="20"
                    accent="blue"
                    @update:model-value="(val) => { if (val?.[0] !== undefined) settingsStore.inferenceParams.contextRounds = val[0]; }"
                  />
                  <span class="text-[11px] text-neutral-400">发送给模型时保留 System Prompt 并取最近 N 轮对话，有效杜绝长对话爆 Token 与超时。</span>
                </div>

                <div class="border-b border-black/[0.04] dark:border-white/[0.05]" />

                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-[13px] font-medium">启用 SSE 流式输出 (Stream)</div>
                    <div class="text-[11px] text-neutral-400 mt-0.5">逐字打字机实时返回，极大缩减首字感知等待时间</div>
                  </div>
                  <Switch v-model="settingsStore.inferenceParams.stream" />
                </div>
              </div>
            </Card>
          </div>

          <!-- ================= SUB-TAB 3: 场景模型路由 (Routing) ================= -->
          <div v-if="aiSubTab === 'routing'" class="flex flex-col gap-4 animate-in fade-in duration-150">
            <Card title="业务场景与最佳适配模型分流">
              <div class="flex flex-col gap-4 py-1">
                <!-- 场景 1: 全屏独立工作台 -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <i class="i-lucide-laptop text-sm text-[#007AFF]" />
                      全屏独立工作台 (Chat Studio)
                    </span>
                    <Badge variant="primary" class="text-[10px]">高智力深度推理</Badge>
                  </div>
                  <Select v-model="settingsStore.featureRouting.chatStudioModel" :options="settingsStore.availableModels" />
                  <span class="text-[11px] text-neutral-400">推荐使用 gpt-6.1-sol、Claude 3.5 Sonnet 或 DeepSeek-R1，适合深度长篇架构思考与长代码撰写。</span>
                </div>

                <div class="border-b border-black/[0.04] dark:border-white/[0.05]" />

                <!-- 场景 2: 侧边栏常驻助手 -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <i class="i-lucide-panel-right text-sm text-green-500" />
                      原生侧边栏常驻助手 (Sidepanel Copilot)
                    </span>
                    <Badge variant="success" class="text-[10px]">网页多任务伴随</Badge>
                  </div>
                  <Select v-model="settingsStore.featureRouting.sidepanelModel" :options="settingsStore.availableModels" />
                  <span class="text-[11px] text-neutral-400">伴随当前网页边查资料边提问，支持自动注入网页正文上下文。</span>
                </div>

                <div class="border-b border-black/[0.04] dark:border-white/[0.05]" />

                <!-- 场景 3: 划词悬浮菜单 -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <i class="i-lucide-sparkles text-sm text-amber-500" />
                      划词悬浮胶囊 (Selection Toolbar)
                    </span>
                    <Badge variant="warning" class="text-[10px]">极速高性价比</Badge>
                  </div>
                  <Select v-model="settingsStore.featureRouting.selectionModel" :options="settingsStore.availableModels" />
                  <span class="text-[11px] text-neutral-400">网页圈选文字后的即时翻译与通俗解释，推荐极速响应模型 (如 gpt-4o-mini 或 DeepSeek-V3)。</span>
                </div>

                <div class="border-b border-black/[0.04] dark:border-white/[0.05]" />

                <!-- 场景 4: 网页正文提取速览 -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <i class="i-lucide-file-text text-sm text-purple-500" />
                      网页正文提取与 3 点要点摘要 (Summary)
                    </span>
                    <Badge variant="secondary" class="text-[10px]">超大上下文窗口</Badge>
                  </div>
                  <Select v-model="settingsStore.featureRouting.summaryModel" :options="settingsStore.availableModels" />
                  <span class="text-[11px] text-neutral-400">清洗提取万字长文后归纳提炼，推荐长窗口模型 (如 Gemini 1.5 Pro 或 GPT-4o)。</span>
                </div>
              </div>
            </Card>
          </div>

          <!-- ================= SUB-TAB 4: 系统角色词库 (Prompts) ================= -->
          <div v-if="aiSubTab === 'prompts'" class="flex flex-col gap-4 animate-in fade-in duration-150">
            <!-- 当前激活人设卡片 -->
            <Card title="当前生效的系统角色设定 (System Prompt)">
              <div class="flex flex-col gap-3 py-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {{ settingsStore.systemPromptPresets.find(p => p.id === settingsStore.activePromptPresetId)?.title || '自定义人设' }}
                    </span>
                    <Badge variant="primary" class="text-[10px]">当前生效中</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 text-[11px] text-[#007AFF]"
                    @click="settingsStore.systemPrompt = settingsStore.systemPromptPresets.find(p => p.id === settingsStore.activePromptPresetId)?.prompt || settingsStore.systemPrompt; triggerToast('已还原为此预设原版', 'info')"
                  >
                    重置为本预设默认值
                  </Button>
                </div>

                <Textarea
                  v-model="settingsStore.systemPrompt"
                  placeholder="输入自定义 System Prompt 人设设定..."
                  :rows="4"
                  class="font-mono text-xs leading-relaxed"
                />
              </div>
            </Card>

            <!-- 精选人设库 -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold">精选专家角色人设库</h3>
                <p class="text-[11px] text-neutral-400 mt-0.5">点击即可一键切换为人设，自动赋予模型相应的思维深度与输出风格</p>
              </div>

              <DialogRoot v-model:open="showNewPromptModal">
                <DialogTrigger as-child>
                  <Button variant="secondary" size="sm" icon="i-lucide-plus" class="rounded-full h-7 px-3 text-xs">
                    新建自定义人设
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle class="text-[15px] font-semibold">创建自定义系统角色人设</DialogTitle>
                  <DialogDescription class="text-xs text-neutral-500 mt-1">
                    定制专属于你业务场景的 System Prompt 角色。
                  </DialogDescription>
                  <div class="flex flex-col gap-3 mt-3">
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium">角色名称</label>
                      <Input v-model="newPromptTitle" placeholder="如：电商文案爆款专家" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium">角色简述</label>
                      <Input v-model="newPromptDesc" placeholder="一句话描述该角色的长处" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium">System Prompt 内容</label>
                      <Textarea v-model="newPromptText" placeholder="详细的人设指令..." :rows="5" />
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 mt-4">
                    <DialogClose as-child>
                      <Button variant="neutral" size="sm">取消</Button>
                    </DialogClose>
                    <Button variant="primary" size="sm" @click="handleCreateCustomPrompt">
                      确认创建
                    </Button>
                  </div>
                </DialogContent>
              </DialogRoot>
            </div>

            <!-- 人设网格 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="preset in settingsStore.systemPromptPresets"
                :key="preset.id"
                class="p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3"
                :class="settingsStore.activePromptPresetId === preset.id
                  ? 'bg-white/90 dark:bg-[#1c1c1e] border-[#007AFF] shadow-[0_4px_16px_rgba(0,122,255,0.08)] ring-1 ring-[#007AFF]/30'
                  : 'bg-white/50 dark:bg-white/[0.03] border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15'"
              >
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[13px] font-semibold flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100">
                      <i :class="preset.icon" class="text-[#007AFF]" />
                      {{ preset.title }}
                    </span>
                    <Badge v-if="settingsStore.activePromptPresetId === preset.id" variant="primary" class="text-[10px]">
                      当前应用
                    </Badge>
                    <Badge v-else variant="secondary" class="text-[10px]">
                      {{ preset.isBuiltIn ? '官方内置' : '用户自定义' }}
                    </Badge>
                  </div>
                  <p class="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                    {{ preset.description }}
                  </p>
                  <p class="text-[10px] text-neutral-400 font-mono line-clamp-3 bg-black/[0.02] dark:bg-white/[0.02] p-2 rounded-lg mt-1">
                    {{ preset.prompt }}
                  </p>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <Button
                    v-if="!preset.isBuiltIn"
                    variant="destructive"
                    size="sm"
                    class="h-7 text-xs px-2.5"
                    @click="settingsStore.deletePromptPreset(preset.id); triggerToast('已删除此人设', 'info')"
                  >
                    删除
                  </Button>
                  <Button
                    v-if="settingsStore.activePromptPresetId !== preset.id"
                    variant="secondary"
                    size="sm"
                    class="h-7 text-xs px-3"
                    @click="settingsStore.setActivePromptPreset(preset.id); triggerToast(`已切换为人设：${preset.title}`, 'success')"
                  >
                    设为当前人设
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部保存条 -->
          <div class="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              icon="i-lucide-save"
              @click="triggerToast('AI 引擎全部配置已实时保存并生效！', 'success')"
            >
              保存配置
            </Button>

            <Button
              variant="neutral"
              icon="i-lucide-rotate-ccw"
              @click="settingsStore.resetSettings(); triggerToast('已重置为默认推荐配置 (gpt-6.1-sol)', 'info')"
            >
              恢复默认推荐配置
            </Button>
          </div>
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
