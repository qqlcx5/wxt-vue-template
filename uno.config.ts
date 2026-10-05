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
    // 基础交互与设计令牌
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    ['flex-col-center', 'flex flex-col items-center justify-center'],
    ['btn-base', 'inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none'],
    ['card-panel', 'rounded-xl bg-zinc-800/80 border border-white/10 backdrop-blur-md p-4 shadow-lg shadow-black/20'],
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#10b981', // emerald-500
        hover: '#059669',
      },
    },
  },
});
