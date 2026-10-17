<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { DocumentReader } from '@/components/reader';
import { Toast, Badge, Button } from '@/components/ui';
import type { HighlightAnchor } from '@/utils/markdown/highlighter';

const isDark = useDark({ initialValue: 'light' });
const toggleDark = useToggle(isDark);

// 当前选择的示范文档
const currentPreset = ref<'quantum' | 'vue3' | 'custom'>('quantum');

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

// ================= 预设 1: 量子计算与现代物理前沿 =================
const quantumContent = `# 量子纠缠与分布式量子信息计算前沿

> [!NOTE]
> 本文用于全面展示 **MarkdownViewer** 与 **DocumentReader** 的全套核心能力：
> 包括 **LaTeX 数学公式**、**GitHub Callouts 提示块**、**macOS 风格代码视窗**、**W3C 规范级 5 色划词批注** 与 **TOC 目录大纲平滑跟踪**。

## 1. 量子态叠加与数学表述

在封闭量子体系中，单量子比特（Qubit）的状态可以表示为二维复希尔伯特空间中的单位向量：

$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle, \\quad \\alpha, \\beta \\in \\mathbb{C}$$

其中满足归一化条件 $|\\alpha|^2 + |\\beta|^2 = 1$。当引入贝尔态（Bell States）时，两个纠缠光子的联合态可写作：

$$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}} (|00\\rangle + |11\\rangle)$$

> [!TIP]
> **行内公式示例**：量子哈密顿量为 $\\mathcal{H} = \\hbar \\omega (a^\\dagger a + \\frac{1}{2})$，其中 $a^\\dagger$ 与 $a$ 分别为产生与湮灭算符。

## 2. 量子纠缠模拟算法实现

下面通过 Python 与 Qiskit 构建一个 EPR 纠缠态发生器电路：

\`\`\`python
from qiskit import QuantumCircuit, Aer, execute

def create_bell_pair():
    # 创建含 2 个量子比特与 2 个经典比特的电路
    qc = QuantumCircuit(2, 2)
    qc.h(0)         # 在比特 0 施加 Hadamard 门
    qc.cx(0, 1)     # 施加 CNOT 受控非门
    qc.measure([0, 1], [0, 1])
    return qc

# 启动模拟器执行测量
backend = Aer.get_backend('qasm_simulator')
job = execute(create_bell_pair(), backend, shots=1024)
result = job.result().get_counts()
print("Bell State Measurement:", result)
\`\`\`

> [!IMPORTANT]
> 真正的物理量子纠缠绝不违反狭义相对论中的无信号传递定理（No-signaling theorem）。纠缠测量无法以超光速传递经典信息[^1]。

## 3. 经典计算与量子优势对比矩阵

| 架构维度 | 传统超算集群 (CPU/GPU) | 超导量子计算机 (QPU) | 性能复杂度差异 |
| :--- | :--- | :--- | :--- |
| **基础单元** | 二进制比特 (0 或 1) | 量子叠加态 (|0⟩ 和 |1⟩) | 指数级状态容量 $2^N$ |
| **大数质因数分解** | 数域筛法：$O(e^{\\sqrt[3]{n}})$ | Shor 算法：$O((\\log n)^3)$ | 指数级量子加速 |
| **非结构化数据搜索** | 经典穷举：$O(N)$ | Grover 算法：$O(\\sqrt{N})$ | 二次多项式加速 |
| **容错机制** | ECC 内存奇偶校验 | 表面码 (Surface Code) | 需大量辅助测量比特 |

> [!WARNING]
> 量子退相干（Decoherence）与门保真度仍然是当前含噪声中等规模量子（NISQ）时代的主要瓶颈。

[^1]: 详见 Einstein, Podolsky, Rosen (1935), "Can Quantum-Mechanical Description of Physical Reality be Considered Complete?".
`;

const quantumTranslation = `# Quantum Entanglement and Frontiers of Distributed Quantum Information Computing

> [!NOTE]
> This article is used to comprehensively showcase the full capabilities of **MarkdownViewer** and **DocumentReader**:
> Including **LaTeX Math Formulas**, **GitHub Callouts**, **macOS-style Code Windows**, **W3C-compliant 5-Color Text Highlighting**, and **TOC Outline Tracking**.

## 1. Quantum State Superposition and Mathematical Representation

In a closed quantum system, the state of a single qubit can be represented as a unit vector in a 2D complex Hilbert space:

$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle, \\quad \\alpha, \\beta \\in \\mathbb{C}$$

subject to the normalization constraint $|\\alpha|^2 + |\\beta|^2 = 1$. When introducing Bell States, the joint state can be written as:

$$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}} (|00\\rangle + |11\\rangle)$$

> [!TIP]
> **Inline math example**: The quantum Hamiltonian is $\\mathcal{H} = \\hbar \\omega (a^\\dagger a + \\frac{1}{2})$.

## 2. Quantum Entanglement Simulation Algorithm

\`\`\`python
from qiskit import QuantumCircuit, Aer, execute

def create_bell_pair():
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.measure([0, 1], [0, 1])
    return qc
\`\`\`

## 3. Classical vs Quantum Advantage Matrix

| Architecture Metric | Classical Supercomputing | Quantum Processor (QPU) |
| :--- | :--- | :--- |
| Basic Unit | Binary Bits | Quantum Superposition |
| Factoring | Exponential Time | Polynomial Time (Shor) |
`;

const quantumHighlights = ref<HighlightAnchor[]>([
  {
    id: 'hl-sample-1',
    text: '二进制复希尔伯特空间中的单位向量',
    prefix: '状态可以表示为',
    suffix: '：\n\n$$|\\psi\\rangle',
    color: 'yellow',
    note: '希尔伯特空间是现代量子态的核心数学抽象',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'hl-sample-2',
    text: 'EPR 纠缠态发生器电路',
    prefix: '通过 Python 与 Qiskit 构建一个 ',
    suffix: '：\n\n```python',
    color: 'green',
    note: '使用 Hadamard + CNOT 生成最大纠缠态 Bell Pair',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: 'hl-sample-3',
    text: '无信号传递定理（No-signaling theorem）',
    prefix: '真正物理量子纠缠绝不违反狭义相对论中的',
    suffix: '。纠缠测量无法以超光速传递经典信息',
    color: 'purple',
    note: '核心物理定律：量子关联不能用于超光速通信',
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 600000,
  },
]);

// ================= 预设 2: Vue 3 核心机制与架构 =================
const vue3Content = `# 深入理解 Vue 3 核心响应式系统与编译器优化

Vue 3 引入了基于 ES2015 \`Proxy\` 的现代响应式架构，相较于 Vue 2 的 \`Object.defineProperty\` 实现了全方位的性能与语法飞跃。

## 1. 响应式系统核心原语

在 \`@vue/reactivity\` 内部，通过 WeakMap 存储目标对象与属性依赖树：

\`\`\`ts
// 核心 targetMap 依赖关系图
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>();

export function track(target: object, key: unknown) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key as any);
  if (!dep) {
    depsMap.set(key as any, (dep = new Set()));
  }
  dep.add(activeEffect);
}
\`\`\`

> [!CAUTION]
> 直接解构 Reactive 对象会导致响应式引用丢失！请务必配合 \`toRefs()\` 使用：
> \`\`\`ts
> const state = reactive({ count: 0 });
> const { count } = toRefs(state); // 保持响应式
> \`\`\`

## 2. 编译器静态提升与 Block Tree

在模板编译阶段，Vue 3 的模板编译器会自动识别并执行：
- **静态提升 (Hoisting)**：将完全无动态绑定的 VNode 提升至渲染函数之外。
- **Patch Flags (补丁标记)**：通过位掩码（Bitwise Flags）精确标识节点仅有文本动态还是属性动态。
`;

const vue3Highlights = ref<HighlightAnchor[]>([
  {
    id: 'hl-vue-1',
    text: '基于 ES2015 `Proxy` 的现代响应式架构',
    prefix: 'Vue 3 引入了',
    suffix: '，相较于 Vue 2',
    color: 'blue',
    note: '不再需要递归劫持所有属性，按需惰性代理',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
]);

// ================= 预设 3: 自定义模式 =================
const customContent = ref(`# 自定义 Markdown 测试画板

> [!TIP]
> 你可以在这里粘贴任意复杂的 Markdown 源码，测试 LaTeX 公式、代码视窗、5 色划词标注与大纲抽取。

\`\`\`javascript
function helloWorld() {
  console.log("Hello from Chrome Vue Template!");
}
\`\`\`

- [x] 支持 GFM 任务列表
- [x] 支持表格与 LaTeX 渲染
- [x] 支持 5 色悬浮划词高亮
`);

const customHighlights = ref<HighlightAnchor[]>([]);

// 动态计算当前展示内容
const currentDoc = computed(() => {
  if (currentPreset.value === 'quantum') {
    return {
      title: '量子纠缠与分布式量子信息计算前沿',
      content: quantumContent,
      author: '量子前沿实验室',
      url: 'https://arxiv.org/abs/quant-ph/0304018',
      highlights: quantumHighlights.value,
      translation: quantumTranslation,
    };
  }
  if (currentPreset.value === 'vue3') {
    return {
      title: '深入理解 Vue 3 核心响应式系统与编译器优化',
      content: vue3Content,
      author: 'Evan You / Vue Core Team',
      url: 'https://vuejs.org',
      highlights: vue3Highlights.value,
      translation: '',
    };
  }
  return {
    title: '自定义 Markdown 实时工作台',
    content: customContent.value,
    author: '当前用户',
    url: 'local://playground',
    highlights: customHighlights.value,
    translation: '',
  };
});

function handleUpdateHighlights(newHls: HighlightAnchor[]) {
  if (currentPreset.value === 'quantum') quantumHighlights.value = newHls;
  else if (currentPreset.value === 'vue3') vue3Highlights.value = newHls;
  else customHighlights.value = newHls;
  triggerToast(`已更新标注集合 (当前共 ${newHls.length} 条)`, 'success');
}

function handleAskAi(text: string) {
  triggerToast(`已触发 AI 问答: "${text.slice(0, 20)}..."`, 'info');
}

function handleTranslate(lang: string) {
  triggerToast(`请求翻译为: ${lang}`, 'info');
}
</script>

<template>
  <div
    class="h-screen w-full flex flex-col font-sans transition-colors duration-200 select-none overflow-hidden"
    :class="isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#F2F2F7] text-[#1d1d1f]'"
  >
    <Toast :show="toastVisible" :message="toastMessage" :type="toastType" />

    <!-- macOS 顶栏 -->
    <header
      class="px-5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl flex items-center justify-between shrink-0 transition-colors"
      :class="isDark ? 'bg-[#1c1c1e]/90' : 'bg-white/90'"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20"
        >
          <i class="i-lucide-book-open text-xs" />
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5 leading-none">
            <span class="text-[13px] font-semibold tracking-tight text-neutral-900 dark:text-white">
              Reader Studio
            </span>
            <span
              class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              Markdown • KaTeX
            </span>
          </div>
          <span class="text-[10px] text-neutral-400 font-mono mt-0.5">
            文稿阅读器与渲染实验室
          </span>
        </div>
      </div>

      <!-- 示范预设切换器 -->
      <div class="flex items-center p-0.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-xs font-medium">
        <button
          type="button"
          class="flex items-center gap-1 px-3 py-1 rounded-lg border-0 cursor-pointer transition-all"
          :class="currentPreset === 'quantum' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
          @click="currentPreset = 'quantum'"
        >
          <span>⚛️ 量子物理与公式</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1 px-3 py-1 rounded-lg border-0 cursor-pointer transition-all"
          :class="currentPreset === 'vue3' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
          @click="currentPreset = 'vue3'"
        >
          <span>💚 Vue 3 核心机制</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1 px-3 py-1 rounded-lg border-0 cursor-pointer transition-all"
          :class="currentPreset === 'custom' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs font-semibold' : 'text-neutral-500 bg-transparent hover:text-neutral-800 dark:hover:text-neutral-200'"
          @click="currentPreset = 'custom'"
        >
          <span>📝 自定义编辑模式</span>
        </button>
      </div>

      <!-- 右侧控制 -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] transition-all cursor-pointer border-0 outline-none"
          @click="toggleDark()"
        >
          <i :class="isDark ? 'i-lucide-moon text-[#007AFF]' : 'i-lucide-sun text-[#FF9500]'" class="text-xs" />
          <span>{{ isDark ? '暗色' : '浅色' }}</span>
        </button>
      </div>
    </header>

    <!-- 主展示区 -->
    <main class="flex-1 flex min-h-0 overflow-hidden">
      <!-- 若为自定义模式，提供左侧 Markdown 编辑窗 -->
      <div
        v-if="currentPreset === 'custom'"
        class="w-80 border-r border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] flex flex-col shrink-0"
      >
        <div class="px-3.5 py-2 border-b border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold flex items-center justify-between">
          <span>输入 Markdown 源码</span>
          <span class="text-[10px] text-neutral-400 font-mono">{{ customContent.length }} 字符</span>
        </div>
        <textarea
          v-model="customContent"
          placeholder="在此处输入或粘贴你的 Markdown 内容..."
          class="flex-1 p-3.5 text-xs font-mono bg-transparent border-0 outline-none resize-none leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
        />
      </div>

      <!-- 复合文稿阅读器展示 -->
      <DocumentReader
        class="flex-1"
        :content="currentDoc.content"
        :title="currentDoc.title"
        :url="currentDoc.url"
        :author="currentDoc.author"
        :highlights="currentDoc.highlights"
        :translation-markdown="currentDoc.translation"
        @update:highlights="handleUpdateHighlights"
        @ask-ai="handleAskAi"
        @request-translate="handleTranslate"
      />
    </main>
  </div>
</template>
