<script lang="ts" setup>
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
  Button,
  Switch,
  Slider,
  Progress,
  Tooltip,
  AccordionItem,
  DialogContent,
  AccordionRoot,
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  ToggleGroupRoot,
  ToggleGroupItem,
  Separator,
  TooltipProvider,
} from '@/components/ui';

// 暗黑模式接管
const isDark = useDark();
const toggleDark = useToggle(isDark);

const count = ref(0);
const sliderVal = ref([50]);
const subscribed = ref(true);
const toggleVal = ref('center');
const progress = ref(65);

let progressTimer: ReturnType<typeof setInterval>;
function animateProgress() {
  progress.value = 0;
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (progress.value >= 100) {
      clearInterval(progressTimer);
    } else {
      progress.value += 2;
    }
  }, 40);
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="w-[420px] max-h-[620px] overflow-y-auto flex flex-col items-center gap-6 p-6 transition-colors duration-200"
      :class="isDark ? 'bg-zinc-900 text-white/90' : 'bg-slate-50 text-slate-800'"
    >
      <!-- Header -->
      <div class="flex items-center gap-4">
        <img src="/wxt.svg" class="h-10 hover:scale-110 transition-transform cursor-pointer" alt="WXT" />
        <span class="text-xl font-bold opacity-40">+</span>
        <img src="@/assets/vue.svg" class="h-10 hover:scale-110 transition-transform cursor-pointer" alt="Vue" />
        <span class="text-xl font-bold opacity-40">+</span>
        <div class="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400 text-xs font-semibold border border-violet-500/30 flex items-center gap-1.5">
          <i class="i-lucide-palette text-xs" />
          UnoCSS
        </div>
      </div>

      <!-- Title -->
      <div class="text-center">
        <h1 class="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
          WXT + Reka UI + UnoCSS
        </h1>
        <p class="text-xs opacity-50 mt-1">现代化生产级 Chrome 扩展脚手架</p>
      </div>

      <!-- Counter Button -->
      <div class="flex items-center gap-3">
        <Button variant="default" size="default" @click="count++">
          <i class="i-lucide-sparkles text-sm" />
          <span>点击计数: {{ count }}</span>
        </Button>
        <span class="text-xs opacity-40">纯 CSS 图标 + 封装 UI</span>
      </div>

      <Separator class="w-full h-px opacity-10 bg-current" />

      <!-- ========== Components Showcase ========== -->
      <div class="w-full flex flex-col gap-5">
        <!-- Dark Mode & Subscribe Row -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Switch :checked="isDark" @update:checked="toggleDark()" />
            <span class="text-xs font-medium opacity-80 flex items-center gap-1.5">
              <i :class="isDark ? 'i-lucide-moon text-cyan-400' : 'i-lucide-sun text-amber-500'" class="text-sm" />
              {{ isDark ? '暗黑模式' : '明亮模式' }}
            </span>
          </div>

          <Tooltip content="开启后将接收扩展版本与功能通知">
            <div
              class="flex items-center gap-2 cursor-pointer text-xs opacity-80 hover:opacity-100 transition-opacity"
              @click="subscribed = !subscribed"
            >
              <div
                class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                :class="subscribed ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-current/30'"
              >
                <i v-if="subscribed" class="i-lucide-check text-[10px]" />
              </div>
              <span>订阅更新</span>
            </div>
          </Tooltip>
        </div>

        <!-- Slider -->
        <div class="flex flex-col gap-2">
          <div class="flex justify-between text-xs">
            <span class="opacity-60 flex items-center gap-1">
              <i class="i-lucide-volume-2 text-xs" /> 音量调节
            </span>
            <span class="text-cyan-400 font-mono font-bold">{{ sliderVal[0] }}%</span>
          </div>
          <Slider v-model="sliderVal" :max="100" :step="1" />
        </div>

        <!-- Progress -->
        <div class="flex flex-col gap-2">
          <div class="flex justify-between text-xs">
            <span class="opacity-60 flex items-center gap-1">
              <i class="i-lucide-activity text-xs" /> 任务进度
            </span>
            <span class="text-emerald-400 font-mono font-bold">{{ progress }}%</span>
          </div>
          <Progress :model-value="progress" />
          <Button variant="secondary" size="sm" class="self-start text-xs h-7 px-2.5" @click="animateProgress">
            <i class="i-lucide-rotate-ccw text-xs" />
            重放动画
          </Button>
        </div>

        <!-- Toggle Group -->
        <div class="flex flex-col gap-1.5">
          <span class="text-xs opacity-60">布局对齐</span>
          <ToggleGroupRoot
            v-model="toggleVal"
            type="single"
            class="inline-flex rounded-lg border border-current/10 bg-current/5 overflow-hidden p-0.5"
          >
            <ToggleGroupItem
              value="left"
              class="flex-1 py-1.5 text-xs opacity-60 hover:opacity-100 data-[state=on]:bg-violet-500/25 data-[state=on]:text-violet-400 data-[state=on]:opacity-100 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <i class="i-lucide-align-left text-xs" /> 左对齐
            </ToggleGroupItem>
            <ToggleGroupItem
              value="center"
              class="flex-1 py-1.5 text-xs opacity-60 hover:opacity-100 data-[state=on]:bg-violet-500/25 data-[state=on]:text-violet-400 data-[state=on]:opacity-100 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <i class="i-lucide-align-center text-xs" /> 居中
            </ToggleGroupItem>
            <ToggleGroupItem
              value="right"
              class="flex-1 py-1.5 text-xs opacity-60 hover:opacity-100 data-[state=on]:bg-violet-500/25 data-[state=on]:text-violet-400 data-[state=on]:opacity-100 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <i class="i-lucide-align-right text-xs" /> 右对齐
            </ToggleGroupItem>
          </ToggleGroupRoot>
        </div>

        <!-- Tabs -->
        <TabsRoot default-value="code" class="w-full">
          <TabsList class="flex gap-1 p-1 rounded-lg bg-current/5 border border-current/10">
            <TabsTrigger
              value="code"
              class="flex-1 px-3 py-1.5 text-xs rounded-md opacity-60 data-[state=active]:bg-current/10 data-[state=active]:opacity-100 font-medium transition-all cursor-pointer"
            >
              代码
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              class="flex-1 px-3 py-1.5 text-xs rounded-md opacity-60 data-[state=active]:bg-current/10 data-[state=active]:opacity-100 font-medium transition-all cursor-pointer"
            >
              预览
            </TabsTrigger>
            <TabsTrigger
              value="output"
              class="flex-1 px-3 py-1.5 text-xs rounded-md opacity-60 data-[state=active]:bg-current/10 data-[state=active]:opacity-100 font-medium transition-all cursor-pointer"
            >
              构建
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" class="mt-2.5">
            <pre class="p-3 rounded-lg bg-zinc-800/80 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto"><code>import { useDark } from '@vueuse/core';
const isDark = useDark();</code></pre>
          </TabsContent>

          <TabsContent value="preview" class="mt-2.5">
            <div class="p-3 rounded-lg bg-current/5 border border-current/10 text-xs opacity-80 leading-relaxed">
              <p class="text-emerald-400 font-medium">✨ UnoCSS + Reka UI 运行正常</p>
              <p class="mt-1 opacity-60">零 CSS 文件冲突，支持 Shadow DOM 隔离与热重载。</p>
            </div>
          </TabsContent>

          <TabsContent value="output" class="mt-2.5">
            <div class="p-3 rounded-lg bg-current/5 border border-current/10 text-xs font-mono opacity-80 flex flex-col gap-1">
              <p class="text-cyan-400">Vite: <span class="opacity-70">8.3.2</span></p>
              <p class="text-cyan-400">UnoCSS: <span class="opacity-70">v66 (presetWind3)</span></p>
              <p class="text-cyan-400">Manifest: <span class="opacity-70">Chrome MV3</span></p>
            </div>
          </TabsContent>
        </TabsRoot>

        <!-- Accordion -->
        <AccordionRoot type="single" collapsible class="w-full rounded-xl border border-current/10 overflow-hidden">
          <AccordionItem value="item-1" title="什么是 UnoCSS？">
            UnoCSS 是即时按需原子 CSS 引擎。支持 presetWind3、presetIcons、presetAttributify 与预设转换器。
          </AccordionItem>
          <AccordionItem value="item-2" title="为什么封装 Reka UI？">
            Reka UI（原 Radix Vue）提供完全无样式的底层原语与键盘无障碍导航，通过 components/ui 封装后开箱即用。
          </AccordionItem>
          <AccordionItem value="item-3" title="如何防止扩展样式污染宿主网页？">
            在 entrypoints/content.ts 中通过 WXT 的 createShadowRootUi 隔离挂载，彻底避免全局样式冲突。
          </AccordionItem>
        </AccordionRoot>

        <!-- Dialog Demo -->
        <DialogRoot>
          <DialogTrigger as-child>
            <Button variant="default" class="w-full py-2.5 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-violet-300 border-violet-500/30 hover:from-violet-500/30 hover:to-cyan-500/30">
              <i class="i-lucide-external-link text-sm" />
              打开演示对话框
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle class="text-base font-bold text-white flex items-center gap-2">
              <i class="i-lucide-shield-check text-emerald-400" />
              操作确认
            </DialogTitle>
            <DialogDescription class="mt-2 text-xs text-white/60 leading-relaxed">
              这是基于 Reka UI + UnoCSS 封装的弹窗组件，已自动处理全局蒙层、焦点捕获 (Focus Trap) 与 Esc 键盘事件。
            </DialogDescription>
            <div class="flex justify-end gap-2.5 mt-5">
              <DialogClose as-child>
                <Button variant="ghost" size="sm">取消</Button>
              </DialogClose>
              <DialogClose as-child>
                <Button variant="default" size="sm">确认提交</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </DialogRoot>
      </div>

      <!-- Footer -->
      <p class="text-[11px] opacity-30 text-center">
        WXT Vue Template • 支持 HMR 实时热更
      </p>
    </div>
  </TooltipProvider>
</template>
