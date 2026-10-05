import { defineStore } from 'pinia';
import { extensionPiniaStorage } from '@/utils/storage';

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
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: 'light',
    autoSync: true,
    extractorEnabled: true,
    notificationEnabled: false,
    showBadge: true,
    selectedModel: 'gpt4o',
    memoNote: '这是一个支持跨 Popup、SidePanel、Options 即时双向持久化同步的随手速记便笺。',
    openaiKey: '',
    deepseekKey: '',
    customEndpoint: '',
  }),
  actions: {
    setTheme(theme: 'light' | 'dark' | 'auto') {
      this.theme = theme;
    },
    updateMemo(text: string) {
      this.memoNote = text;
    },
    resetSettings() {
      this.theme = 'light';
      this.autoSync = true;
      this.extractorEnabled = true;
      this.notificationEnabled = false;
      this.showBadge = true;
      this.selectedModel = 'gpt4o';
      this.openaiKey = '';
      this.deepseekKey = '';
      this.customEndpoint = '';
    },
  },
  persist: {
    storage: extensionPiniaStorage,
  },
});
