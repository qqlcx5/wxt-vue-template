/**
 * 可插拔特性模块包 (Pluggable Feature Modules)
 * 业务特性与底层脚手架内核 (core/) 彻底解耦，按需引用或删除
 */

// 1. AI 智能流式推理模块
export * as AiFeature from '@/services/ai';
export type * from '@/types/ai';

// 2. 深度沉浸式文稿阅读器模块
export { default as DocumentReader } from '@/components/reader/DocumentReader.vue';
export * from '@/utils/markdown/pipeline';
export * from '@/utils/markdown/highlighter';

// 3. 网页视觉剪藏与截屏模块
export * from '@/services/screenshot';

// 4. 离线全文索引与知识库模块
export * from '@/services/db';
export * from '@/services/extractor';
