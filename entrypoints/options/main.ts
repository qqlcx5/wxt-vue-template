import { createApp } from 'vue';
import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import '@/entrypoints/popup/style.css';
import { pinia } from '@/stores';
import App from './App.vue';

const app = createApp(App);
app.use(pinia);
app.mount('#app');
