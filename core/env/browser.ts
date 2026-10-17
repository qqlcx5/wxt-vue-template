import { browser as wxtBrowser } from 'wxt/browser';

/**
 * 安全获取当前环境的 Extension API 门面
 * 自动适配原生 Chrome/Firefox、WXT 代理以及 Web Mock 模式
 */
export function getBrowser(): any {
  const g = globalThis as any;
  if (typeof g.browser !== 'undefined' && g.browser?.runtime) {
    return g.browser;
  }
  if (typeof g.chrome !== 'undefined' && g.chrome?.runtime) {
    return g.chrome;
  }
  if (typeof wxtBrowser !== 'undefined' && wxtBrowser) {
    return wxtBrowser;
  }
  return g.browser || g.chrome || {};
}
