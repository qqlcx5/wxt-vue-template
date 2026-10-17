import { isDev } from '../env/detect';

export interface Logger {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

const SCOPE_COLORS: Record<string, string> = {
  Background: '#AF52DE',
  Content: '#34C759',
  Popup: '#007AFF',
  Sidepanel: '#FF9500',
  Reader: '#5856D6',
  Messaging: '#5AC8FA',
  Storage: '#FF2D55',
};

/**
 * 创建统一的彩色结构化日志记录器
 */
export function createLogger(scope: string): Logger {
  const color = SCOPE_COLORS[scope] || '#007AFF';

  const formatPrefix = () => {
    return [
      `%c[${scope}]`,
      `background: ${color}; color: white; padding: 1px 5px; border-radius: 3px; font-weight: bold; font-size: 11px;`,
    ];
  };

  return {
    debug(...args: any[]) {
      if (!isDev()) return;
      const [tag, style] = formatPrefix();
      console.debug(tag, style, ...args);
    },
    info(...args: any[]) {
      const [tag, style] = formatPrefix();
      console.info(tag, style, ...args);
    },
    warn(...args: any[]) {
      const [tag, style] = formatPrefix();
      console.warn(tag, style, ...args);
    },
    error(...args: any[]) {
      const [tag, style] = formatPrefix();
      console.error(tag, style, ...args);
    },
  };
}
