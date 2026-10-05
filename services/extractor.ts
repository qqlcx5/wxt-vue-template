import Defuddle from 'defuddle';
import DOMPurify from 'dompurify';
import MiniSearch from 'minisearch';

export interface ExtractedResult {
  title: string;
  content: string;
  author?: string;
  publishedTime?: string;
  wordCount?: number;
}

/**
 * 网页正文提取与清洗服务
 */
export async function extractWebContent(
  docOrHtml: Document | string,
  url = window.location.href,
): Promise<ExtractedResult> {
  const doc =
    typeof docOrHtml === 'string'
      ? new DOMParser().parseFromString(docOrHtml, 'text/html')
      : docOrHtml;

  const defuddle = new Defuddle(doc as any, { url });
  const result = await defuddle.parse();

  return {
    title: result.title || doc.title || 'Untitled',
    content: DOMPurify.sanitize(result.content || ''),
    author: result.author,
    publishedTime: result.published,
    wordCount: result.wordCount,
  };
}

/**
 * 初始化客户端轻量级全文检索引擎
 */
export function createSearchIndex() {
  return new MiniSearch({
    fields: ['title', 'content'], // 搜索字段
    storeFields: ['title', 'url', 'createdAt'], // 返回字段
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
}
