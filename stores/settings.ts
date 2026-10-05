import { defineStore } from 'pinia';
import { extensionPiniaStorage } from '@/utils/storage';
import type {
  AiProviderConfig,
  AiInferenceParameters,
  FeatureModelRouting,
  SystemPromptPreset,
} from '@/types/ai';

export const defaultProviders: AiProviderConfig[] = [
  {
    id: 'custom',
    name: '自定义 API 网关 (推荐)',
    icon: 'i-lucide-server',
    enabled: true,
    baseUrl: 'http://66.154.117.189:3000/v1',
    apiKey: 'sk-gI9BZBbEjHozLBOzBtYKLPJBv7X4oaYJQYXg90rERAgvTM12',
    models: [
      { id: 'gpt-6.1-sol', name: 'gpt-6.1-sol (当前专属推理通道)', providerId: 'custom', isCustom: true },
      { id: 'gpt-4o', name: 'GPT-4o (通用旗舰)', providerId: 'custom' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (极速轻量)', providerId: 'custom' },
    ],
    customHeaders: {},
    protocol: 'openai',
  },
  {
    id: 'openai',
    name: 'OpenAI 官方直连',
    icon: 'i-lucide-sparkles',
    enabled: false,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni 旗舰)', providerId: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (高性价比)', providerId: 'openai' },
      { id: 'o1', name: 'o1 (深度推理)', providerId: 'openai' },
      { id: 'o3-mini', name: 'o3-mini (轻量推理)', providerId: 'openai' },
    ],
    protocol: 'openai',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    icon: 'i-lucide-cpu',
    enabled: false,
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (通用大模型)', providerId: 'deepseek' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (深度思维链推理)', providerId: 'deepseek' },
    ],
    protocol: 'openai',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'i-lucide-bot',
    enabled: false,
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (编程与逻辑最强)', providerId: 'claude' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (极致极速)', providerId: 'claude' },
    ],
    protocol: 'openai',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'i-lucide-layers',
    enabled: false,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: '',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (超长两百万上下文)', providerId: 'gemini' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (新一代多模态极速)', providerId: 'gemini' },
    ],
    protocol: 'openai',
  },
  {
    id: 'ollama',
    name: 'Ollama 本地离线引擎',
    icon: 'i-lucide-hard-drive',
    enabled: false,
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2 (本地通用)', providerId: 'ollama' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek-R1:8B (本地推理)', providerId: 'ollama' },
      { id: 'qwen2.5:7b', name: 'Qwen 2.5:7B (中文最强)', providerId: 'ollama' },
    ],
    protocol: 'openai',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (一站聚合)',
    icon: 'i-lucide-network',
    enabled: false,
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', providerId: 'openrouter' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free Tier)', providerId: 'openrouter' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (via OpenRouter)', providerId: 'openrouter' },
    ],
    protocol: 'openai',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow (硅基流动)',
    icon: 'i-lucide-zap',
    enabled: false,
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3 (硅基高吞吐)', providerId: 'siliconflow' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 (硅基推理版)', providerId: 'siliconflow' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B (千问旗舰)', providerId: 'siliconflow' },
    ],
    protocol: 'openai',
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    icon: 'i-lucide-moon',
    enabled: false,
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: '',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', providerId: 'moonshot' },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', providerId: 'moonshot' },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K (长文本)', providerId: 'moonshot' },
    ],
    protocol: 'openai',
  },
];

export const defaultSystemPromptPresets: SystemPromptPreset[] = [
  {
    id: 'general',
    title: '💡 通用全能助手',
    icon: 'i-lucide-bot',
    description: '严谨、清晰、有洞察力的全能顾问，善于结构化组织回答',
    prompt: '你是一位严谨专业、富有洞察力的智能助手。请使用专业、简洁、清晰的 Markdown 格式回答用户的问题。在分析问题时条理分明，优先给出最核心的结论与行动建议。',
    isBuiltIn: true,
  },
  {
    id: 'fullstack',
    title: '👨‍💻 全栈架构师与代码专家',
    icon: 'i-lucide-code-2',
    description: '深入排查代码 Bug、遵循 clean code 原则与系统级高并发架构',
    prompt: '你是一位具有 15 年经验的资深全栈架构师与代码重构专家。请针对用户的技术疑问与代码片段，提供严格类型安全、高内聚低耦合的代码实现。指出潜在的性能隐患与边界情况，并给出遵循行业最佳实践的重构建议。代码块需指明语言且附带清晰注释。',
    isBuiltIn: true,
  },
  {
    id: 'translator',
    title: '🌐 技术双语审校与本地化',
    icon: 'i-lucide-languages',
    description: '信达雅翻译，精准保留专有名词与地道工程语境',
    prompt: '你是一位顶级技术文档与本地化翻译专家。请将用户输入的文本在中文与英文之间进行精准互译。翻译原则必须做到“信、达、雅”，绝不逐字机翻，地道符合原语境；保留专有名词（如函数名、术语缩写、品牌名），必要时在括号内附带英文原文。',
    isBuiltIn: true,
  },
  {
    id: 'summary',
    title: '📝 结构化 3 点要点提炼员',
    icon: 'i-lucide-file-text',
    description: '从冗长网页与文档中，瞬时提炼核心结论与洞察',
    prompt: '你是一位高效的知识萃取与速读分析专家。请阅读用户提供的文章或内容，严格按照以下三部分进行结构化提炼：\n1. 【一句话定性】：用 20 字以内概括全文核心论点；\n2. 【三大核心事实/论据】：以编号清单列出最有价值的信息增量；\n3. 【关键启发与落地建议】：提炼行动指引。',
    isBuiltIn: true,
  },
  {
    id: 'academic',
    title: '🎓 学术论文与文档润色',
    icon: 'i-lucide-graduation-cap',
    description: 'IEEE/ACM 顶级学术期刊风格，提升句式多变度与学术权威感',
    prompt: '你是一位顶级学术期刊（如 Nature, IEEE, ACM）的资深审稿人与母语润色专家。请对用户提供的学术草稿或技术描述进行深度修饰：消除冗余表达、提升专业术语契合度、优化被动与主动语态平衡，使语气严谨、权威且流畅。',
    isBuiltIn: true,
  },
  {
    id: 'reasoner',
    title: '🔍 深度逻辑推理与批判思考',
    icon: 'i-lucide-brain',
    description: '第一性原理拆解，多维度逻辑验证与反事实推演',
    prompt: '你是一位遵循第一性原理的深度逻辑推理者与辩证思考专家。在回答问题前，先明确基本公理与假设，分步骤展开多角度推理。主动寻找论据中的逻辑谬误、反例与边界条件，以严密的因果链条得出结论。',
    isBuiltIn: true,
  },
];

export interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  autoSync: boolean;
  extractorEnabled: boolean;
  notificationEnabled: boolean;
  showBadge: boolean;
  selectedModel: string;
  memoNote: string;
  openaiKey: string;
  deepseekKey: string;
  customEndpoint: string;
  temperature: number;
  systemPrompt: string;
  // 新增全功能扩展配置
  providers: AiProviderConfig[];
  inferenceParams: AiInferenceParameters;
  featureRouting: FeatureModelRouting;
  systemPromptPresets: SystemPromptPreset[];
  activePromptPresetId: string;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: 'light',
    autoSync: true,
    extractorEnabled: true,
    notificationEnabled: false,
    showBadge: true,
    selectedModel: 'gpt-6.1-sol',
    memoNote: '这是一个支持跨 Popup、SidePanel、Options 即时双向持久化同步的随手速记便笺。',
    openaiKey: 'sk-gI9BZBbEjHozLBOzBtYKLPJBv7X4oaYJQYXg90rERAgvTM12',
    deepseekKey: '',
    customEndpoint: 'http://66.154.117.189:3000/v1',
    temperature: 0.7,
    systemPrompt: '你是一位严谨专业、富有洞察力的智能助手。请使用专业、简洁、清晰的 Markdown 格式回答用户的问题。在分析问题时条理分明，优先给出最核心的结论与行动建议。',
    providers: defaultProviders,
    inferenceParams: {
      temperature: 1,
      topP: 1.0,
      maxTokens: 128000,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      contextRounds: 6,
      stream: true,
      timeoutMs: 60000,
    },
    featureRouting: {
      chatStudioModel: 'gpt-6.1-sol',
      sidepanelModel: 'gpt-6.1-sol',
      selectionModel: 'gpt-6.1-sol',
      summaryModel: 'gpt-6.1-sol',
    },
    systemPromptPresets: defaultSystemPromptPresets,
    activePromptPresetId: 'general',
  }),
  getters: {
    // 获取当前所有已启用服务商下的可用模型平面列表（供所有 Select 下拉组件使用）
    availableModels(state) {
      const list: { label: string; value: string; providerName: string; providerId: string; icon: string }[] = [];
      const enabledProviders = state.providers.filter((p) => p.enabled);
      for (const p of enabledProviders) {
        for (const m of p.models) {
          list.push({
            label: `${m.name} (${p.name.split(' ')[0]})`,
            value: m.id,
            providerName: p.name,
            providerId: p.id,
            icon: p.icon,
          });
        }
      }
      // 容错：若没有启用任何服务商，保底提供默认 gpt-6.1-sol
      if (list.length === 0) {
        list.push({
          label: 'gpt-6.1-sol (专属网关)',
          value: 'gpt-6.1-sol',
          providerName: '自定义 API 网关',
          providerId: 'custom',
          icon: 'i-lucide-server',
        });
      }
      return list;
    },
    // 当前激活的系统 Prompt
    currentSystemPrompt(state): string {
      const activePreset = state.systemPromptPresets.find((p) => p.id === state.activePromptPresetId);
      return activePreset ? activePreset.prompt : state.systemPrompt;
    },
  },
  actions: {
    setTheme(theme: 'light' | 'dark' | 'auto') {
      this.theme = theme;
    },
    updateMemo(text: string) {
      this.memoNote = text;
    },
    // 切换服务商启用状态
    toggleProvider(providerId: string, enabled: boolean) {
      const p = this.providers.find((item) => item.id === providerId);
      if (p) {
        p.enabled = enabled;
      }
    },
    // 更新服务商基础配置
    updateProvider(providerId: string, updates: Partial<AiProviderConfig>) {
      const index = this.providers.findIndex((item) => item.id === providerId);
      const existing = this.providers[index];
      if (index !== -1 && existing) {
        this.providers[index] = { ...existing, ...updates, id: existing.id };
        // 同步旧兼容字段
        if (providerId === 'custom') {
          if (updates.baseUrl) this.customEndpoint = updates.baseUrl;
          if (updates.apiKey) this.openaiKey = updates.apiKey;
        }
      }
    },
    // 向某个服务商添加自定义模型
    addCustomModel(providerId: string, modelId: string, modelName: string) {
      const p = this.providers.find((item) => item.id === providerId);
      if (p) {
        const trimmedId = modelId.trim();
        if (!trimmedId) return;
        const exists = p.models.some((m) => m.id === trimmedId);
        if (!exists) {
          p.models.push({
            id: trimmedId,
            name: modelName.trim() || trimmedId,
            providerId,
            isCustom: true,
          });
        }
      }
    },
    // 从某个服务商移除自定义模型
    removeCustomModel(providerId: string, modelId: string) {
      const p = this.providers.find((item) => item.id === providerId);
      if (p) {
        p.models = p.models.filter((m) => m.id !== modelId);
      }
    },
    // 批量导入远程发现的模型列表
    mergeDiscoveredModels(providerId: string, remoteModelIds: string[]) {
      const p = this.providers.find((item) => item.id === providerId);
      if (p) {
        const existingIds = new Set(p.models.map((m) => m.id));
        for (const id of remoteModelIds) {
          if (!existingIds.has(id)) {
            p.models.push({
              id,
              name: id,
              providerId,
              isCustom: true,
            });
            existingIds.add(id);
          }
        }
      }
    },
    // 设置当前激活的角色预设
    setActivePromptPreset(presetId: string) {
      this.activePromptPresetId = presetId;
      const found = this.systemPromptPresets.find((p) => p.id === presetId);
      if (found) {
        this.systemPrompt = found.prompt;
      }
    },
    // 新增自定义角色预设
    addCustomPromptPreset(preset: Omit<SystemPromptPreset, 'id' | 'isBuiltIn'>) {
      const id = 'custom_' + Date.now();
      this.systemPromptPresets.push({
        id,
        ...preset,
        isBuiltIn: false,
      });
      this.activePromptPresetId = id;
      this.systemPrompt = preset.prompt;
    },
    // 删除自定义角色预设
    deletePromptPreset(presetId: string) {
      this.systemPromptPresets = this.systemPromptPresets.filter((p) => p.id !== presetId);
      if (this.activePromptPresetId === presetId) {
        this.activePromptPresetId = 'general';
        this.systemPrompt = defaultSystemPromptPresets[0]?.prompt ?? '';
      }
    },
    resetSettings() {
      this.theme = 'light';
      this.autoSync = true;
      this.extractorEnabled = true;
      this.notificationEnabled = false;
      this.showBadge = true;
      this.selectedModel = 'gpt-6.1-sol';
      this.openaiKey = 'sk-gI9BZBbEjHozLBOzBtYKLPJBv7X4oaYJQYXg90rERAgvTM12';
      this.deepseekKey = '';
      this.customEndpoint = 'http://66.154.117.189:3000/v1';
      this.temperature = 0.7;
      this.systemPrompt = defaultSystemPromptPresets[0]?.prompt ?? '';
      this.providers = defaultProviders;
      this.inferenceParams = {
        temperature: 0.7,
        topP: 1.0,
        maxTokens: 128000,
        presencePenalty: 0.0,
        frequencyPenalty: 0.0,
        contextRounds: 6,
        stream: true,
        timeoutMs: 60000,
      };
      this.featureRouting = {
        chatStudioModel: 'gpt-6.1-sol',
        sidepanelModel: 'gpt-6.1-sol',
        selectionModel: 'gpt-6.1-sol',
        summaryModel: 'gpt-6.1-sol',
      };
      this.systemPromptPresets = defaultSystemPromptPresets;
      this.activePromptPresetId = 'general';
    },
  },
  persist: {
    storage: extensionPiniaStorage,
  },
});
