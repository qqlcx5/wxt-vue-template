import { defineStore } from 'pinia';
import { db, type SavedArticle } from '@/services/db';

export const useArticlesStore = defineStore('articles', {
  state: () => ({
    articles: [] as SavedArticle[],
    loading: false,
    searchQuery: '',
  }),
  getters: {
    filteredArticles(state): SavedArticle[] {
      if (!state.searchQuery.trim()) {
        return state.articles;
      }
      const query = state.searchQuery.toLowerCase();
      return state.articles.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query),
      );
    },
    totalCount(state): number {
      return state.articles.length;
    },
  },
  actions: {
    async loadArticles() {
      this.loading = true;
      try {
        this.articles = await db.articles.orderBy('createdAt').reverse().toArray();
      } catch (err) {
        console.error('[ArticlesStore] Failed to load articles from Dexie:', err);
      } finally {
        this.loading = false;
      }
    },
    async addArticle(article: Omit<SavedArticle, 'id'>) {
      try {
        const id = await db.articles.add(article);
        await this.loadArticles();
        return id;
      } catch (err) {
        console.error('[ArticlesStore] Failed to add article:', err);
        throw err;
      }
    },
    async deleteArticle(id: number) {
      try {
        await db.articles.delete(id);
        await this.loadArticles();
      } catch (err) {
        console.error('[ArticlesStore] Failed to delete article:', err);
        throw err;
      }
    },
    async clearAll() {
      try {
        await db.articles.clear();
        await this.loadArticles();
      } catch (err) {
        console.error('[ArticlesStore] Failed to clear articles:', err);
        throw err;
      }
    },
    async exportJSON(): Promise<string> {
      const all = await db.articles.toArray();
      return JSON.stringify(all, null, 2);
    },
    async importJSON(jsonStr: string): Promise<number> {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) {
          throw new Error('无效的备份文件格式，请确保为 JSON 数组');
        }
        const cleaned = parsed.map((item: any) => ({
          url: String(item.url || ''),
          title: String(item.title || '无标题'),
          content: String(item.content || ''),
          author: item.author ? String(item.author) : undefined,
          createdAt: Number(item.createdAt || Date.now()),
          tags: Array.isArray(item.tags) ? item.tags : [],
        }));
        await db.articles.bulkAdd(cleaned);
        await this.loadArticles();
        return cleaned.length;
      } catch (err) {
        console.error('[ArticlesStore] Failed to import JSON:', err);
        throw err;
      }
    },
  },
});
