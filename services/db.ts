import Dexie, { type Table } from 'dexie';

import type { HighlightAnchor } from '@/utils/markdown/highlighter';

export interface SavedArticle {
  id?: number;
  url: string;
  title: string;
  content: string; // Markdown or clean text
  author?: string;
  createdAt: number;
  tags?: string[];
  highlights?: HighlightAnchor[];
  translationMarkdown?: string;
  readProgress?: number;
  wordCount?: number;
}

/**
 * 将可能包含 Vue 3 Proxy / 响应式拦截器 / 嵌套引用的对象转换为纯 JavaScript 原生对象
 * 避免 IndexedDB 抛出 DataCloneError: #<Object> could not be cloned
 */
export function toCloneableRaw<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    if (Array.isArray(obj)) {
      return obj.map((item) => toCloneableRaw(item)) as any;
    }
    const plain: any = {};
    for (const key of Object.keys(obj as any)) {
      plain[key] = toCloneableRaw((obj as any)[key]);
    }
    return plain as T;
  }
}

export class ExtensionDatabase extends Dexie {
  articles!: Table<SavedArticle, number>;

  constructor() {
    super('ExtensionDatabase');
    this.version(1).stores({
      articles: '++id, url, title, createdAt, *tags',
    });
  }
}

export const db = new ExtensionDatabase();

// 自动拦截代理：对 db.articles 的 add / put 进行深度原生脱水，防止 Vue 3 Proxy 渗入 IndexedDB
const originalArticlesAdd = db.articles.add.bind(db.articles);
db.articles.add = function (item: SavedArticle, key?: any) {
  return originalArticlesAdd(toCloneableRaw(item), key);
};

const originalArticlesPut = db.articles.put.bind(db.articles);
db.articles.put = function (item: SavedArticle, key?: any) {
  return originalArticlesPut(toCloneableRaw(item), key);
};
