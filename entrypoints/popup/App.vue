<script lang="ts" setup>
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
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
  DialogContent,
  SegmentedControl,
  AccordionRoot,
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TooltipProvider,
} from '@/components/ui';

// 浅色为主，支持丝滑切换深色
const isDark = useDark({
  initialValue: 'light',
});
const toggleDark = useToggle(isDark);

// 当前导航分段
const currentTab = ref('featured');

// 控件状态
const autoSync = ref(true);
const extractorEnabled = ref(true);
const notificationEnabled = ref(false);

const searchInput = ref('');
const noteText = ref('这是一个纯净精致、对齐苹果 Human Interface Guidelines 规范的 Chrome 扩展脚手架。');
const volume = ref([65]);
const progress = ref(78);

const checkMeta = ref(true);
const checkIndex = ref(true);
const checkHighlight = ref(false);

let progressTimer: ReturnType<typeof setInterval>;
function replayProgress() {
  progress.value = 0;
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (progress.value >= 100) {
      clearInterval(progressTimer);
    } else {
      progress.value += 2;
    }
  }, 30);
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="w-[410px] max-h-[640px] overflow-y-auto flex flex-col font-sans transition-colors duration-200 select-none antialiased"
      :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
    >
      <!-- macOS 风格应用视窗顶栏 -->
      <div
        class="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl transition-colors"
        :class="isDark ? 'bg-[#1c1c1e]/85' : 'bg-white/85'"
      >
        <!-- 视窗红黄绿交通灯控制点 + 标题 -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
            <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
          </div>
          <span class="text-[13px] font-semibold ml-1 text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            Apple UI Starter
          </span>
        </div>

        <!-- 右侧操作栏：明暗模式切换无边框胶囊 -->
        <button
          type="button"
          class="flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
          @click="toggleDark()"
        >
          <i :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'" class="text-xs" />
          <span>{{ isDark ? '暗黑' : '浅色' }}</span>
        </button>
      </div>

      <!-- 主体内容区域 -->
      <div class="p-3.5 flex flex-col gap-4">
        <!-- 苹果标志性分段控制器 (Segmented Control) - 纯净无边框 -->
        <SegmentedControl
          v-model="currentTab"
          :options="[
            { value: 'featured', label: '常用控件', icon: 'i-lucide-layout-grid' },
            { value: 'forms', label: '表单与输入', icon: 'i-lucide-edit-3' },
            { value: 'cards', label: '卡片与弹窗', icon: 'i-lucide-layers' },
          ]"
        />

        <!-- ==================== TAB 1: 常用控件 (FEATURED) ==================== -->
        <div v-if="currentTab === 'featured'" class="flex flex-col gap-4 animate-in fade-in duration-150">
          <!-- iOS 设置分组卡片 (Grouped Inset List) -->
          <Card title="系统偏好设置">
            <div class="flex flex-col">
              <!-- Row 1: 云端同步 -->
              <div class="flex items-center justify-between py-1.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#007AFF] text-white">
                    <i class="i-lucide-cloud text-xs" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[13px] font-normal leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">云端自动备份</span>
                    <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">跨端多设备实时数据同步</span>
                  </div>
                </div>
                <Switch v-model:checked="autoSync" />
              </div>

              <!-- Inset Divider -->
              <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />

              <!-- Row 2: 网页正文提取 -->
              <div class="flex items-center justify-between py-1.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#34C759] text-white">
                    <i class="i-lucide-book-open text-xs" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[13px] font-normal leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Defuddle 网页提取</span>
                    <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">自动过滤网页广告与杂讯</span>
                  </div>
                </div>
                <Switch v-model:checked="extractorEnabled" />
              </div>

              <!-- Inset Divider -->
              <div class="ml-[40px] my-1 border-b border-black/[0.05] dark:border-white/[0.06]" />

              <!-- Row 3: 桌面通知 -->
              <div class="flex items-center justify-between py-1.5">
                <div class="flex items-center gap-3">
                  <div class="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#FF3B30] text-white">
                    <i class="i-lucide-bell text-xs" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[13px] font-normal leading-tight text-[#1d1d1f] dark:text-[#f5f5f7]">重要变动通知</span>
                    <span class="text-[11px] text-[#8e8e93] leading-tight mt-0.5">任务执行完毕后发出系统提醒</span>
                  </div>
                </div>
                <Switch v-model:checked="notificationEnabled" />
              </div>
            </div>
          </Card>

          <!-- 苹果系统按钮展厅 (零外部边框、标准胶囊圆角) -->
          <Card title="系统操作按钮">
            <div class="flex flex-wrap gap-2 py-0.5">
              <Button variant="primary" icon="i-lucide-sparkles">主要操作</Button>
              <Button variant="secondary" icon="i-lucide-folder">次要操作</Button>
              <Button variant="success" icon="i-lucide-check">确认完成</Button>
              <Button variant="destructive" icon="i-lucide-trash-2">删除</Button>
              <Button variant="outline" icon="i-lucide-share">分享</Button>
              <Button variant="ghost" size="icon" icon="i-lucide-more-horizontal" />
            </div>
          </Card>

          <!-- 滑块与任务进度 -->
          <Card title="滑杆与进度条">
            <div class="flex flex-col gap-3.5 py-0.5">
              <!-- Slider -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-[12px]">
                  <span class="text-[#6c6c70] dark:text-[#8e8e93] flex items-center gap-1.5">
                    <i class="i-lucide-volume-2 text-xs text-[#007AFF]" />
                    音量控制
                  </span>
                  <span class="font-mono text-[#007AFF] font-semibold">{{ volume[0] }}%</span>
                </div>
                <Slider v-model="volume" :max="100" accent="blue" />
              </div>

              <!-- Progress -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-[12px]">
                  <span class="text-[#6c6c70] dark:text-[#8e8e93] flex items-center gap-1.5">
                    <i class="i-lucide-activity text-xs text-[#34C759]" />
                    后台同步进度
                  </span>
                  <span class="font-mono text-[#34C759] font-semibold">{{ progress }}%</span>
                </div>
                <Progress :model-value="progress" accent="green" />
                <Button
                  variant="secondary"
                  size="sm"
                  class="self-start mt-0.5"
                  icon="i-lucide-rotate-ccw"
                  @click="replayProgress"
                >
                  重新演示
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <!-- ==================== TAB 2: 表单与输入 (FORMS) ==================== -->
        <div v-if="currentTab === 'forms'" class="flex flex-col gap-4 animate-in fade-in duration-150">
          <Card title="文本搜索与输入">
            <div class="flex flex-col gap-2.5 py-0.5">
              <Input
                v-model="searchInput"
                placeholder="搜索已保存的书签、页面或记录..."
                icon="i-lucide-search"
                clearable
              />
              <Textarea
                v-model="noteText"
                placeholder="在此记录速记或随想..."
                :rows="3"
              />
            </div>
          </Card>

          <Card title="选项勾选列表">
            <div class="flex flex-col gap-2.5 py-0.5">
              <div class="flex items-center gap-2.5">
                <Checkbox v-model:checked="checkMeta" id="check-1" />
                <label for="check-1" class="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  自动提取网页 OpenGraph 与 Twitter 封面图
                </label>
              </div>
              <div class="flex items-center gap-2.5">
                <Checkbox v-model:checked="checkIndex" id="check-2" />
                <label for="check-2" class="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  使用 MiniSearch 在本地构建毫秒级全文索引
                </label>
              </div>
              <div class="flex items-center gap-2.5">
                <Checkbox v-model:checked="checkHighlight" id="check-3" />
                <label for="check-3" class="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  提取代码块时启用高保真高亮解析
                </label>
              </div>
            </div>
          </Card>

          <Card title="色彩徽章胶囊">
            <div class="flex flex-wrap gap-2 py-0.5">
              <Badge variant="primary" icon="i-lucide-sparkles">精选推荐</Badge>
              <Badge variant="success" icon="i-lucide-check-circle-2">已就绪</Badge>
              <Badge variant="warning" icon="i-lucide-alert-circle">待确认</Badge>
              <Badge variant="destructive" icon="i-lucide-x-circle">异常</Badge>
              <Badge variant="purple" icon="i-lucide-zap">AI 赋能</Badge>
              <Badge variant="secondary">标准标签</Badge>
            </div>
          </Card>
        </div>

        <!-- ==================== TAB 3: 卡片与弹窗 (CARDS & MODALS) ==================== -->
        <div v-if="currentTab === 'cards'" class="flex flex-col gap-4 animate-in fade-in duration-150">
          <!-- 弹窗与弹出菜单操作 -->
          <Card title="macOS 视窗浮层">
            <div class="grid grid-cols-2 gap-2.5 py-0.5">
              <!-- Dialog Modal -->
              <DialogRoot>
                <DialogTrigger as-child>
                  <Button variant="primary" icon="i-lucide-app-window">
                    打开工作表弹窗
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div class="flex items-center gap-3 mb-2">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF]">
                      <i class="i-lucide-shield-alert text-lg" />
                    </div>
                    <DialogTitle class="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
                      系统操作确认
                    </DialogTitle>
                  </div>
                  <DialogDescription class="text-[12px] text-[#6c6c70] dark:text-[#98989d] leading-relaxed">
                    这是一个遵循 macOS Human Interface Guidelines 的工作表弹窗，具备柔和模糊背景与 Esc 快捷退出。
                  </DialogDescription>
                  <div class="flex justify-end gap-2 mt-4 pt-1">
                    <DialogClose as-child>
                      <Button variant="neutral" size="sm">取消</Button>
                    </DialogClose>
                    <DialogClose as-child>
                      <Button variant="primary" size="sm">确认执行</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </DialogRoot>

              <!-- Popover 气泡菜单 -->
              <Popover>
                <template #trigger>
                  <Button variant="secondary" icon="i-lucide-sliders">
                    气泡配置菜单
                  </Button>
                </template>
                <div class="flex flex-col gap-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[13px] font-semibold">快速筛选选项</span>
                    <Badge variant="primary">3 项已选</Badge>
                  </div>
                  <p class="text-[11px] text-[#8e8e93]">在不打断主流程的情况下微调弹窗内表单参数。</p>
                  <Button variant="primary" size="sm" class="w-full mt-1">应用筛选</Button>
                </div>
              </Popover>
            </div>
          </Card>

          <!-- iOS 折叠手风琴 -->
          <Card title="分组说明折叠面板">
            <AccordionRoot type="single" collapsible class="w-full rounded-[10px] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
              <AccordionItem value="item-1" title="什么是 Apple 风格规范？" icon="i-lucide-apple">
                以纯净浅色画布（#F2F2F7）、系统强调蓝（#007AFF）、通透毛玻璃、无冗余黑边与高灵敏微动效为核心的现代设计系统。
              </AccordionItem>
              <AccordionItem value="item-2" title="如何使用纯 CSS 矢量图标？" icon="i-lucide-feather">
                只需添加类名（如 i-lucide-sparkles），由 UnoCSS 自动编译为纯 CSS 遮罩，0kb JS 运行时开销。
              </AccordionItem>
              <AccordionItem value="item-3" title="组件如何快速引入新页面？" icon="i-lucide-box">
                所有组件均统一从 @/components/ui 导出，支持像标准 Vue 组件一样直接传参与使用 v-model。
              </AccordionItem>
            </AccordionRoot>
          </Card>
        </div>
      </div>

      <!-- 底部苹果极简标注 -->
      <div class="mt-auto px-4 py-3 text-center border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015]">
        <p class="text-[11px] text-[#8e8e93]">
          Apple Human Interface Guidelines • WXT + UnoCSS
        </p>
      </div>
    </div>
  </TooltipProvider>
</template>
