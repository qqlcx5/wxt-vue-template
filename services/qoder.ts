/**
 * Qoder 官方用量与模型分析服务 (Pure Qoder Official Telemetry Service)
 * 100% 依托 Qoder 官方云端接口 (qoder.com)，基于官方 Cookie 会话实现零风险安全分析
 */

import { browser } from 'wxt/browser';

export interface QoderUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
}

export interface QoderQuotaSummary {
  used_value: number;
  limit_value: number;
  remaining_value: number;
  usage_percentage: number;
  unit: string;
}

export interface QoderQuotaDetail {
  id: string;
  limit_value: number;
  used_value: number;
  remaining_value: number;
  unit: string;
  is_active: boolean;
  usage_percentage: number;
  expires_at: number;
  source: string;
  status: string;
}

export interface QoderQuota {
  user_id: string;
  quota_key: string;
  status: string;
  plan_quota?: {
    quota_summary: QoderQuotaSummary;
    quota_detail: QoderQuotaDetail[];
  };
  resource_package_quota?: {
    quota_summary: QoderQuotaSummary;
  };
  dedicated_resource_package_quota?: {
    quota_summary: QoderQuotaSummary;
  };
  total_quota?: {
    quota_summary: QoderQuotaSummary;
    quota_detail: QoderQuotaDetail[];
  };
  lastResetAt?: number;
  nextResetAt?: number;
}

export interface QoderDailyTrendItem {
  date: string;
  groupKey: string;
  credits: number;
  referenceCost: number;
  messageCount: number;
}

export interface QoderDailyTrend {
  groupBy: string;
  total: number;
  peak: number;
  peakDate: string;
  avgCreditsPerSession: number;
  avgCreditsPerConversation: number;
  trend: QoderDailyTrendItem[];
}

export interface QoderHistoryItem {
  time: number;
  begin_at: number;
  finish_at: number;
  duration_ms: number;
  duration_sec: number;
  session_id: string;
  business_id: string;
  name: string;
  source: string; // "IDE" | "CLI"
  operation: string; // "Agent"
  kind: string;
  credits: number;
  original_credits: number;
  model_category: string; // "Fast", "GLM-5.3", "Qwen3.8-Max", etc.
  cost: number;
}

export interface QoderHistoriesResponse {
  data: QoderHistoryItem[];
  summary: {
    credits: number;
    cost: number;
    original_credits: number;
    original_cost: number;
  };
  total_size: number;
  avg_duration_sec: number;
}

export interface QoderOverview {
  aiShareRate: number; // e.g. 19.77%
  acceptedLinesEdit: number; // e.g. 17780
  tabCompletionCount: number; // e.g. 9
  weeklyActiveUserCount: number;
  aiLinesChanged: number; // e.g. 7123
  totalLinesChanged: number; // e.g. 36021
  aiLinesCommitted: number; // e.g. 6301
  totalLinesCommitted: number; // e.g. 18305
  cumulativeActiveDays: number; // e.g. 7
  maxConsecutiveDays: number; // e.g. 13
  lastActiveDate: string;
  sessionCount: number; // e.g. 115
}

export interface QoderHeatmapItem {
  date: string;
  value: number;
}

export interface QoderHeatmap {
  year: number;
  unit: string;
  levels: number[];
  items: QoderHeatmapItem[];
  total: number;
}

export interface AuthCheckResult {
  authenticated: boolean;
  user?: QoderUser;
  error?: string;
  status?: number;
}

const BASE_URL = 'https://qoder.com';

/**
 * 探测当前官方登录状态
 */
export async function checkAuth(): Promise<AuthCheckResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        authenticated: false,
        status: res.status,
        error: '登录凭证已过期或尚未在浏览器中登录 Qoder',
      };
    }

    if (!res.ok) {
      return {
        authenticated: false,
        status: res.status,
        error: `请求失败 HTTP ${res.status}`,
      };
    }

    const user: QoderUser = await res.json();
    return {
      authenticated: true,
      user,
      status: 200,
    };
  } catch (err: any) {
    return {
      authenticated: false,
      error: err?.message || '网络连接异常',
    };
  }
}

/**
 * 打开 Qoder 官方登录页面
 */
export async function openLoginPage(): Promise<void> {
  try {
    if (browser?.tabs?.create) {
      await browser.tabs.create({ url: 'https://qoder.com/account/login' });
      return;
    }
  } catch {}
  window.open('https://qoder.com/account/login', '_blank');
}

/**
 * 打开全屏工作台页面
 */
export async function openDashboardPage(): Promise<void> {
  try {
    if (browser?.tabs?.create) {
      await browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html' as any) });
      return;
    }
  } catch {}
  window.open('/dashboard.html', '_blank');
}

/**
 * 获取官方账户多池配额与重置周期
 */
export async function fetchUsages(): Promise<QoderQuota | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v2/me/usages/big_model_credits`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 获取官方全局每日用量趋势与峰值
 */
export async function fetchDailyTrend(userId: string, days = 7): Promise<QoderDailyTrend | null> {
  try {
    const now = Date.now();
    const startTime = now - days * 86400000;
    const url = `${BASE_URL}/api/v1/me/cost-center/credits/daily-trend?userId=${encodeURIComponent(
      userId,
    )}&startTime=${startTime}&endTime=${now}&groupBy=all`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 获取官方按模型拆解的每日用量趋势 (获取哪个模型用了多少额度)
 */
export async function fetchDailyTrendByModel(userId: string, days = 7): Promise<QoderDailyTrend | null> {
  try {
    const now = Date.now();
    const startTime = now - days * 86400000;
    const url = `${BASE_URL}/api/v1/me/cost-center/credits/daily-trend?userId=${encodeURIComponent(
      userId,
    )}&startTime=${startTime}&endTime=${now}&groupBy=model`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 获取官方原生 IDE 详细调用流水并计算单次执行耗时
 */
export async function fetchHistories(days = 7, pageSize = 100): Promise<QoderHistoriesResponse | null> {
  try {
    const now = Date.now();
    const startTime = now - days * 86400000;
    const url = `${BASE_URL}/api/v1/me/usages/big_model_credits/histories?page=1&page_size=${pageSize}&start_time=${startTime}&end_time=${now}&order_by=begin_at&order=-1`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();

    const rawList = Array.isArray(json.data) ? json.data : [];
    let totalDurationMs = 0;
    let validCount = 0;

    const list: QoderHistoryItem[] = rawList.map((item: any) => {
      const begin = Number(item.begin_at) || Number(item.time) || 0;
      const finish = Number(item.finish_at) || begin;
      const duration_ms = Math.max(0, finish - begin);
      const duration_sec = Math.round((duration_ms / 1000) * 10) / 10;

      if (duration_ms > 0) {
        totalDurationMs += duration_ms;
        validCount++;
      }

      return {
        time: Number(item.time) || begin,
        begin_at: begin,
        finish_at: finish,
        duration_ms,
        duration_sec,
        session_id: item.session_id || '',
        business_id: item.business_id || '',
        name: item.name || '',
        source: item.source || 'IDE',
        operation: item.operation || 'Agent',
        kind: item.kind || '',
        credits: Number(item.credits) || 0,
        original_credits: Number(item.original_credits) || 0,
        model_category: item.model_category || 'Fast',
        cost: Number(item.cost) || 0,
      };
    });

    const avg_duration_sec =
      validCount > 0 ? Math.round((totalDurationMs / validCount / 1000) * 10) / 10 : 0;

    return {
      data: list,
      summary: json.summary || {
        credits: 0,
        cost: 0,
        original_credits: 0,
        original_cost: 0,
      },
      total_size: json.page_result?.total_size || list.length,
      avg_duration_sec,
    };
  } catch {
    return null;
  }
}

/**
 * 获取官方 AI 代码工程效能总览
 */
export async function fetchOverview(days = 7): Promise<QoderOverview | null> {
  try {
    const now = Date.now();
    const startTime = now - days * 86400000;
    const url = `${BASE_URL}/api/v1/me/ai-code/stats/overview?start_date=${startTime}&end_date=${now}`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 获取官方 30 天代码行贡献热力图数据
 */
export async function fetchHeatmap(days = 30): Promise<QoderHeatmap | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/me/ai-code/stats/calendar-heatmap?days=${days}`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface QoderRepoRankingItem {
  repo_name: string;
  aiLinesChanged: number;
  totalLinesChanged: number;
  aiShareRate: number;
  rank: number;
}

/**
 * 获取官方仓库维度的 AI 代码产出排行
 */
export async function fetchRepoRanking(days = 7): Promise<QoderRepoRankingItem[]> {
  try {
    const now = Date.now();
    const startTime = now - days * 86400000;
    const url = `${BASE_URL}/api/v1/me/ai-code/stats/ranking?start_date=${startTime}&end_date=${now}&group_by=repo&sort_by=aiLinesChanged&order=descend&page=1&page_size=10`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json.items) ? json.items : [];
    if (list.length > 0) {
      return list.map((item: any, idx: number) => ({
        repo_name: item.repo_name || item.name || '未知仓库',
        aiLinesChanged: Number(item.aiLinesChanged) || 0,
        totalLinesChanged: Number(item.totalLinesChanged) || 0,
        aiShareRate: Math.round((Number(item.aiShareRate) || 0) * 1000) / 10,
        rank: idx + 1,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * 格式化 Token 计数 (亿 / 万)
 */
export function formatTokenCount(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '0';
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)} 亿`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)} 万`;
  }
  return num.toLocaleString();
}

/**
 * 格式化人民币费用
 */
export function formatCurrency(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '¥0.00';
  return `¥${(Math.round(num * 100) / 100).toFixed(2)}`;
}

/**
 * 计算北京时间每日 10:00 积分重置倒计时
 */
export function getDailyResetCountdown(): { hours: number; minutes: number; seconds: number; text: string } {
  const now = new Date();
  const beijingOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const beijingNowMs = now.getTime() + (beijingOffset + localOffset) * 60 * 1000;
  const beijingDate = new Date(beijingNowMs);

  const target = new Date(beijingDate);
  target.setHours(10, 0, 0, 0);
  if (beijingDate.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = Math.max(0, target.getTime() - beijingDate.getTime());
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  return {
    hours,
    minutes,
    seconds,
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}

/**
 * 计算月度账单重置倒计时
 */
export function getMonthlyResetCountdown(nextResetAt?: number): { days: number; text: string } {
  if (!nextResetAt) return { days: 0, text: '--' };
  const diff = Math.max(0, nextResetAt - Date.now());
  const days = Math.ceil(diff / 86400000);
  return { days, text: `${days} 天后` };
}
