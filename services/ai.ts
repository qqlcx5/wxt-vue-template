import { createParser } from 'eventsource-parser';
import { useSettingsStore } from '@/stores';
import { browser } from 'wxt/browser';
import { extractWebContent } from '@/services/extractor';
import type { AiProviderConfig, AiInferenceParameters } from '@/types/ai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TokenStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
  baseURL?: string;
  feature?: 'chatStudio' | 'sidepanel' | 'selection' | 'summary';
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  contextRounds?: number;
  stream?: boolean;
  maxRetries?: number;
  customHeaders?: Record<string, string>;
  signal?: AbortSignal;
  onChunk?: (delta: string, accumulated: string) => void;
  onFinish?: (fullText: string, stats: TokenStats) => void;
  onError?: (error: Error) => void;
}

export interface StreamChatHandle {
  abort: () => void;
  promise: Promise<string>;
}

export interface ResolvedAiConfig {
  model: string;
  baseURL: string;
  apiKey: string;
  customHeaders: Record<string, string>;
  inferenceParams: AiInferenceParameters;
  provider?: AiProviderConfig;
}

/**
 * 估算文本大致 Token 数量（中英混合约 2.5 - 3.5 字符 / Token）
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3);
}

/**
 * 延迟等待（用于指数退避重试）
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 获取完整 API 与推理配置（兼容多服务商路由、场景路由、Pinia 与 Background 环境）
 */
export async function resolveApiConfig(
  customModel?: string,
  customKey?: string,
  customEndpoint?: string,
  feature?: 'chatStudio' | 'sidepanel' | 'selection' | 'summary',
): Promise<ResolvedAiConfig> {
  let settings: any = {};
  try {
    const store = useSettingsStore();
    settings = {
      model: store.selectedModel,
      openaiKey: store.openaiKey,
      deepseekKey: store.deepseekKey,
      endpoint: store.customEndpoint,
      providers: store.providers,
      inferenceParams: store.inferenceParams,
      featureRouting: store.featureRouting,
    };
  } catch {
    const local = await browser.storage.local.get('settings');
    if (local?.settings) {
      try {
        settings = typeof local.settings === 'string' ? JSON.parse(local.settings) : local.settings;
      } catch {}
    }
  }

  const providers: AiProviderConfig[] = settings.providers || [];
  const inferenceParams: AiInferenceParameters = settings.inferenceParams || {
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 4096,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    contextRounds: 6,
    stream: true,
    timeoutMs: 60000,
  };

  // 1. 确定最终模型 ID
  let targetModel = customModel;
  if (!targetModel && feature && settings.featureRouting) {
    const routingKey = `${feature}Model` as keyof typeof settings.featureRouting;
    targetModel = settings.featureRouting[routingKey];
  }
  if (!targetModel) {
    targetModel = settings.model || 'gpt-6.1-sol';
  }

  // 2. 根据模型寻址对应的 Provider
  let matchedProvider: AiProviderConfig | undefined;

  // 如果显式传入了 endpoint，优先视为临时自定义网关
  if (customEndpoint) {
    matchedProvider = {
      id: 'adhoc',
      name: '自定义端点',
      icon: 'i-lucide-server',
      enabled: true,
      baseUrl: customEndpoint,
      apiKey: customKey || settings.openaiKey || '',
      models: [{ id: targetModel, name: targetModel, providerId: 'adhoc' }],
    };
  } else {
    // 遍历所有已启用的服务商，匹配模型列表
    matchedProvider = providers
      .filter((p) => p.enabled)
      .find((p) => p.models.some((m) => m.id === targetModel));

    // 若未在启用服务商的模型列表中找到，优先选用自定义服务商 (custom) 或首个启用的服务商
    if (!matchedProvider) {
      matchedProvider =
        providers.find((p) => p.id === 'custom' && p.enabled) ||
        providers.find((p) => p.enabled) ||
        providers[0];
    }
  }

  // 3. 解析端点、密钥与自定义请求头
  let baseURL = customEndpoint || matchedProvider?.baseUrl || settings.endpoint || 'http://66.154.117.189:3000/v1';
  let apiKey = customKey || matchedProvider?.apiKey || settings.openaiKey || 'sk-gI9BZBbEjHozLBOzBtYKLPJBv7X4oaYJQYXg90rERAgvTM12';
  const customHeaders = { ...(matchedProvider?.customHeaders || {}) };

  baseURL = baseURL.replace(/\/+$/, '');

  return {
    model: targetModel,
    baseURL,
    apiKey,
    customHeaders,
    inferenceParams,
    provider: matchedProvider,
  };
}

/**
 * 远程模型列表探测：向服务商 /v1/models 发起探测
 */
export async function fetchRemoteModels(
  providerId: string,
): Promise<{ success: boolean; models: string[]; error?: string }> {
  let settings: any = {};
  try {
    const store = useSettingsStore();
    settings = store.$state;
  } catch {
    const local = await browser.storage.local.get('settings');
    if (local?.settings) {
      try {
        settings = typeof local.settings === 'string' ? JSON.parse(local.settings) : local.settings;
      } catch {}
    }
  }

  const provider = settings.providers?.find((p: any) => p.id === providerId);
  if (!provider) return { success: false, models: [], error: '未找到该服务商配置' };
  if (!provider.baseUrl) return { success: false, models: [], error: '该服务商未配置 Base URL' };

  const baseURL = provider.baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(provider.customHeaders || {}),
    };
    if (provider.apiKey) {
      headers.Authorization = `Bearer ${provider.apiKey}`;
    }

    const res = await fetch(`${baseURL}/models`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, models: [], error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    const models = rawList
      .map((item: any) => (typeof item === 'string' ? item : item.id))
      .filter(Boolean) as string[];

    return { success: true, models };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { success: false, models: [], error: err.message || '网络连接超时或无法访问' };
  }
}

/**
 * 针对特定服务商与模型进行连通性与 Ping 延时测试
 */
export async function testProviderConnection(
  providerId: string,
  modelId?: string,
): Promise<{ success: boolean; latencyMs: number; reply?: string; error?: string }> {
  const startTime = Date.now();
  let settings: any = {};
  try {
    const store = useSettingsStore();
    settings = store.$state;
  } catch {
    const local = await browser.storage.local.get('settings');
    if (local?.settings) {
      try {
        settings = typeof local.settings === 'string' ? JSON.parse(local.settings) : local.settings;
      } catch {}
    }
  }

  const provider = settings.providers?.find((p: any) => p.id === providerId);
  if (!provider) {
    return { success: false, latencyMs: 0, error: '未找到服务商配置' };
  }

  const model = modelId || provider.models?.[0]?.id || 'gpt-6.1-sol';
  const baseURL = provider.baseUrl.replace(/\/+$/, '');
  const apiKey = provider.apiKey;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(provider.customHeaders || {}),
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 15,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, latencyMs, error: `HTTP ${res.status}: ${errText.slice(0, 150)}` };
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Pong';
    return { success: true, latencyMs, reply };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - startTime, error: err.message };
  }
}

/**
 * 测试 AI 服务连通性 (兼容旧版调用)
 */
export async function testAiConnection(
  customModel?: string,
  customKey?: string,
  customEndpoint?: string,
): Promise<{ success: boolean; latencyMs: number; reply?: string; error?: string }> {
  const startTime = Date.now();
  try {
    const config = await resolveApiConfig(customModel, customKey, customEndpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.customHeaders,
    };
    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    const res = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 15,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, latencyMs, error: `HTTP ${res.status}: ${errText.slice(0, 120)}` };
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Pong';
    return { success: true, latencyMs, reply };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - startTime, error: err.message };
  }
}

/**
 * 通用 SSE 流式大模型调用引擎（集成多服务商、场景路由、历史对话截断、全参数调优与指数退避重试）
 */
export function streamChat(options: StreamChatOptions): StreamChatHandle {
  const controller = new AbortController();
  const signal = options.signal || controller.signal;
  const maxRetries = options.maxRetries ?? 2;

  const promise = new Promise<string>(async (resolve, reject) => {
    let accumulated = '';
    let serverStats: TokenStats | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      if (signal.aborted) {
        resolve(accumulated);
        return;
      }

      try {
        const config = await resolveApiConfig(
          options.model,
          options.apiKey,
          options.baseURL,
          options.feature,
        );

        if (
          !config.apiKey &&
          !config.baseURL.includes('localhost') &&
          !config.baseURL.includes('127.0.0.1')
        ) {
          throw new Error('未配置 API 密钥，请在扩展【偏好设置 (Options)】中填入 API Key 后重试。');
        }

        const url = `${config.baseURL}/chat/completions`;

        // 1. 历史对话轮数截断 (Context Rounds)
        const contextRounds =
          options.contextRounds ?? config.inferenceParams.contextRounds ?? 6;
        let processedMessages = [...options.messages];
        if (contextRounds > 0 && processedMessages.length > contextRounds * 2 + 1) {
          const systemMsgs = processedMessages.filter((m) => m.role === 'system');
          const nonSystemMsgs = processedMessages.filter((m) => m.role !== 'system');
          const slicedHistory = nonSystemMsgs.slice(-contextRounds * 2);
          processedMessages = [...systemMsgs, ...slicedHistory];
        }

        // 2. 组装请求参数
        const requestBody: any = {
          model: config.model,
          messages: processedMessages,
          stream: options.stream ?? config.inferenceParams.stream ?? true,
          temperature: options.temperature ?? config.inferenceParams.temperature ?? 0.7,
          top_p: options.top_p ?? config.inferenceParams.topP ?? 1.0,
          stream_options: { include_usage: true },
        };

        const maxTokens = options.max_tokens ?? config.inferenceParams.maxTokens;
        if (maxTokens && maxTokens > 0) {
          requestBody.max_tokens = maxTokens;
        }

        if (config.inferenceParams.presencePenalty !== undefined && config.inferenceParams.presencePenalty !== 0) {
          requestBody.presence_penalty = config.inferenceParams.presencePenalty;
        }
        if (config.inferenceParams.frequencyPenalty !== undefined && config.inferenceParams.frequencyPenalty !== 0) {
          requestBody.frequency_penalty = config.inferenceParams.frequencyPenalty;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...config.customHeaders,
          ...(options.customHeaders || {}),
        };
        if (config.apiKey) {
          headers.Authorization = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal,
        });

        // 针对限流 429 或服务异常 503 进行指数退避自动重试
        if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[AI Engine] 请求受限 (HTTP ${response.status})，将在 ${delay}ms 后进行第 ${attempt} 次重试...`);
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          let errMsg = `API 请求失败 [HTTP ${response.status}]`;
          try {
            const errJson = await response.json();
            errMsg = errJson.error?.message || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        if (!response.body) {
          throw new Error('未收到有效的 ReadableStream 响应体');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        const parser = createParser({
          onEvent(event) {
            if (event.data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(event.data);
              if (parsed.usage) {
                serverStats = {
                  promptTokens: parsed.usage.prompt_tokens || 0,
                  completionTokens: parsed.usage.completion_tokens || 0,
                  totalTokens: parsed.usage.total_tokens || 0,
                };
              }

              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.text ||
                '';

              if (delta) {
                accumulated += delta;
                options.onChunk?.(delta, accumulated);
              }
            } catch {}
          },
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }

        // 计算最终 Token 统计
        const stats: TokenStats = serverStats || {
          promptTokens: options.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0),
          completionTokens: estimateTokens(accumulated),
          totalTokens:
            options.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0) +
            estimateTokens(accumulated),
        };

        options.onFinish?.(accumulated, stats);
        resolve(accumulated);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          resolve(accumulated);
          return;
        }

        if (attempt < maxRetries && !signal.aborted) {
          attempt++;
          const delay = 1000 * attempt;
          console.warn(`[AI Engine] 网络通信异常，正在执行第 ${attempt} 次重试...`);
          await sleep(delay);
          continue;
        }

        options.onError?.(err);
        reject(err);
        return;
      }
    }
  });

  return {
    abort: () => controller.abort(),
    promise,
  };
}

/**
 * 智能管线 1：结合 Defuddle 网页正文提取器，进行网页一键 3 句核心摘要
 */
export async function summarizePageWithDefuddle(
  docOrHtml: Document | string,
  url = window.location.href,
  options?: Omit<StreamChatOptions, 'messages'>,
): Promise<StreamChatHandle> {
  const extracted = await extractWebContent(docOrHtml, url);
  const prompt = `网页标题：${extracted.title}\n\n网页正文：\n${extracted.content.slice(0, 8000)}`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是一位资深内容分析专家。请根据提供的网页正文，提炼出 3-5 条核心论点，并给出 1 句精炼的全局结论。请使用清晰的 Markdown 列表形式输出，禁止废话寒暄。',
    },
    { role: 'user', content: prompt },
  ];

  return streamChat({ feature: 'summary', ...options, messages });
}

/**
 * 智能管线 2：代码逻辑解释与重构优化
 */
export function explainAndOptimizeCode(
  code: string,
  language = 'TypeScript',
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `你是一位顶级 ${language} 架构师。请对用户提供的代码进行专业分析：\n1. 解释核心实现思路与执行流；\n2. 指出潜在的边界漏洞、性能瓶颈或坏味道；\n3. 给出重构优化后的完整优雅实现（附带 Markdown 代码块与注释）。`,
    },
    { role: 'user', content: `\`\`\`${language}\n${code}\n\`\`\`` },
  ];

  return streamChat({ ...options, messages });
}

/**
 * 智能管线 3：学术语法与期刊级英语润色
 */
export function academicPolish(
  text: string,
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是一位资深国际顶级期刊（Nature / IEEE）资深审稿人。请对用户提供的段落进行学术级精细润色，消除口语化用词，增强句式衔接与学术严谨度。\n请按如下格式输出：\n### 润色后内容\n[润色后的段落]\n\n### 核心修改点说明\n- 修改理由 1\n- 修改理由 2',
    },
    { role: 'user', content: text },
  ];

  return streamChat({ ...options, messages });
}

/**
 * 智能管线 4：双语精准流式翻译
 */
export function bilingualTranslate(
  text: string,
  targetLang = '中文',
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `你是一位精通跨国母语化表达的翻译官。请将用户的内容翻译为地道流利的${targetLang}。直接输出译文文本，保留原有段落换行与 Markdown 格式。`,
    },
    { role: 'user', content: text },
  ];

  return streamChat({ feature: 'selection', ...options, messages });
}

/**
 * 通用助手工具函数：提炼内容摘要
 */
export function summarizeContent(
  text: string,
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是一位高效专业的内容摘要助手。请针对用户提供的内容，以精炼、结构化的 Markdown 列表提炼出 3-5 条核心论点，禁止冗余寒暄。',
    },
    { role: 'user', content: text },
  ];
  return streamChat({ feature: 'summary', ...options, messages });
}

/**
 * 通用助手工具函数：通俗解释术语或概念
 */
export function explainContent(
  text: string,
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是一位知识渊博、表达通俗的讲解专家。请针对用户选中的概念、术语或句子，用简洁易懂的语言进行解释，必要时举一个简短生动的例子。请使用 Markdown 格式排版。',
    },
    { role: 'user', content: text },
  ];
  return streamChat({ feature: 'selection', ...options, messages });
}

/**
 * 通用助手工具函数：专业双语翻译
 */
export function translateContent(
  text: string,
  targetLang = '中文',
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  return bilingualTranslate(text, targetLang, options);
}

/**
 * 通用助手工具函数：文字修饰与润色
 */
export function polishContent(
  text: string,
  options?: Omit<StreamChatOptions, 'messages'>,
): StreamChatHandle {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是一位资深文学与技术编辑。请在保留原意的前提下，优化用户的语言表达，修正语病，增强段落的表现力与流畅度。直接返回润色后的版本。',
    },
    { role: 'user', content: text },
  ];
  return streamChat({ ...options, messages });
}
