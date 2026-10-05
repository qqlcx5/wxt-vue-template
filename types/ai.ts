export interface AiModelConfig {
  id: string; // e.g. 'gpt-6.1-sol', 'gpt-4o'
  name: string; // e.g. 'GPT-6.1-Sol (专属推理引擎)'
  providerId: string; // e.g. 'custom', 'openai', 'deepseek'
  contextLength?: number; // e.g. 128000
  isCustom?: boolean;
}

export interface AiProviderConfig {
  id: string; // 'custom' | 'openai' | 'deepseek' | 'claude' | 'gemini' | 'ollama' | 'openrouter' | 'siliconflow' | 'moonshot' | string
  name: string;
  icon: string;
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  models: AiModelConfig[];
  customHeaders?: Record<string, string>;
  protocol?: 'openai' | 'anthropic' | 'gemini' | 'ollama';
}

export interface AiInferenceParameters {
  temperature: number; // 0.0 - 2.0 (默认 1)
  topP: number; // 0.0 - 1.0 (默认 1.0)
  maxTokens: number; // 0 为无限制，默认 4096
  presencePenalty: number; // -2.0 - 2.0 (默认 0.0)
  frequencyPenalty: number; // -2.0 - 2.0 (默认 0.0)
  contextRounds: number; // 历史对话轮数 (默认 6 轮)
  stream: boolean; // 是否流式输出 (默认 true)
  timeoutMs: number; // 超时毫秒数 (默认 60000)
}

export interface FeatureModelRouting {
  chatStudioModel: string; // 全屏工作台默认模型
  sidepanelModel: string; // 侧边栏 Copilot 默认模型
  selectionModel: string; // 划词悬浮胶囊默认模型
  summaryModel: string; // 网页速览默认模型
}

export interface SystemPromptPreset {
  id: string;
  title: string;
  icon: string;
  description: string;
  prompt: string;
  isBuiltIn?: boolean;
}
