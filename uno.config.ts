import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: [
    // 基础弹性盒常用类
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    ['flex-col-center', 'flex flex-col items-center justify-center'],

    // 经典 Apple 风格设计令牌
    ['apple-glass', 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/10'],
    ['apple-card', 'bg-white dark:bg-zinc-800/90 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none'],
    ['apple-subtle', 'bg-black/[0.04] dark:bg-white/[0.08]'],
    ['apple-segmented', 'inline-flex p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.04]'],
    ['apple-btn', 'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium text-sm transition-all duration-150 active:scale-[0.97] cursor-pointer select-none focus-visible:outline-none'],
  ],
  theme: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif',
    },
    colors: {
      apple: {
        blue: {
          DEFAULT: '#007AFF',
          hover: '#0062CC',
          subtle: 'rgba(0, 122, 255, 0.1)',
        },
        green: {
          DEFAULT: '#34C759',
          hover: '#28A745',
          subtle: 'rgba(52, 199, 89, 0.1)',
        },
        red: {
          DEFAULT: '#FF3B30',
          hover: '#D72C21',
          subtle: 'rgba(255, 59, 48, 0.1)',
        },
        orange: {
          DEFAULT: '#FF9500',
          subtle: 'rgba(255, 149, 0, 0.1)',
        },
        purple: {
          DEFAULT: '#AF52DE',
          subtle: 'rgba(175, 82, 222, 0.1)',
        },
        indigo: {
          DEFAULT: '#5856D6',
          subtle: 'rgba(88, 86, 214, 0.1)',
        },
        teal: {
          DEFAULT: '#5AC8FA',
          subtle: 'rgba(90, 200, 250, 0.1)',
        },
        bg: '#F5F5F7',
        canvas: '#FBFBFD',
        card: '#FFFFFF',
      },
    },
  },
});
