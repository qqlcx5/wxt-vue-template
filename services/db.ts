import Dexie, { type Table } from 'dexie';

export interface SavedArticle {
  id?: number;
  url: string;
  title: string;
  content: string; // Markdown or clean text
  author?: string;
  createdAt: number;
  tags?: string[];
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
