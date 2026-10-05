import { sendToBackground } from '@/utils/messaging';
import { db } from '@/services/db';

export interface ScreenshotResult {
  dataUrl: string;
}

/**
 * 捕获当前浏览器窗口可视区域高画质截图
 */
export async function captureVisibleScreenshot(): Promise<string> {
  const res = await sendToBackground('CAPTURE_SCREENSHOT');
  if (!res?.success || !res?.dataUrl) {
    throw new Error(res?.error || '截图捕获失败');
  }
  return res.dataUrl;
}

/**
 * 触发本地 PNG 文件下载
 */
export function downloadScreenshot(dataUrl: string, filename?: string) {
  const name =
    filename || `screenshot-${document.title.slice(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '_')}-${Date.now()}.png`;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  a.click();
}

/**
 * 将截图作为快照存入 Dexie 本地数据库
 */
export async function saveScreenshotToArticles(dataUrl: string, title?: string): Promise<number> {
  const articleTitle = `[快照截图] ${title || document.title || '网页可视区域'}`;
  const id = await db.articles.add({
    url: window.location.href,
    title: articleTitle,
    content: `![页面截图](${dataUrl})`,
    createdAt: Date.now(),
    tags: ['可视截图', '图像快照'],
  });
  return id as number;
}
