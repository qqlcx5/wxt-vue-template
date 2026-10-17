import { marked, Marked, type TokenizerAndRendererExtension } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import markedFootnote from 'marked-footnote';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import markedKatex from 'marked-katex-extension';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export interface AstBlockToken {
  type: string;
  raw: string;
  text?: string;
  lang?: string;
}

// 独立的纯净 AST Block 分块 Lexer 实例（避免被 footnote 等复杂的 inline 插件污染上下文）
const blockLexer = new Marked();

const SANITIZE_OPTIONS = {
  ADD_TAGS: [
    'img', 'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt',
    'mroot', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'semantics', 'annotation',
    'menclose', 'munderover', 'munder', 'mover', 'mark', 'svg', 'path', 'rect',
    'circle', 'line', 'polygon', 'polyline', 'g', 'button', 'span', 'code', 'pre'
  ],
  ADD_ATTR: [
    'src', 'alt', 'title', 'width', 'height', 'loading', 'srcset', 'sizes',
    'id', 'controls', 'class', 'style', 'aria-hidden', 'role', 'xmlns',
    'encoding', 'mathvariant', 'data-code', 'data-lang', 'data-target',
    'data-hl-id', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
    'stroke-linejoin', 'd', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2',
    'type', 'target', 'rel', 'href'
  ],
};

let isPipelineConfigured = false;

function setupMarkedPipeline(): void {
  if (isPipelineConfigured) return;
  isPipelineConfigured = true;

  if (typeof marked.use === 'function') {
    // 1. 学术脚注与标题 GFM 锚点生成
    marked.use(markedFootnote(), gfmHeadingId());

    // 2. KaTeX 数学公式支持：$行内公式$ 与 $$行间公式$$（开启 nonStandard 兼容与中文字符/标点紧密贴合的公式）
    marked.use(
      markedKatex({
        throwOnError: false,
        output: 'htmlAndMathml',
        nonStandard: true,
      })
    );

    // 3. 中文标点粗斜体引号容错补丁（修复 marked v18 遇到 **“ 中文引号时 emStrong 解析跳过的 Bug）
    marked.use({
      hooks: {
        preprocess(src: string): string {
          return src.replace(/\*\*(["\u201c\u201d\u2018\u2019'])/gu, '**\u200b$1');
        },
      },
    });

    // 4. 双向链接 [[Wikilinks]] 支持
    const wikilinkExtension: TokenizerAndRendererExtension = {
      name: 'wikilink',
      level: 'inline',
      start(src: string) {
        return src.indexOf('[[');
      },
      tokenizer(src: string) {
        const match = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(src);
        if (!match) return undefined;
        const target = (match[1] || '').trim();
        const label = (match[2] || '').trim() || target;
        return {
          type: 'wikilink',
          raw: match[0],
          target,
          label,
        } as any;
      },
      renderer(token: any) {
        const target = String(token.target || '').replace(/"/g, '&quot;');
        const label = String(token.label || token.target || '').replace(/</g, '&lt;');
        return `<a href="#" class="am-wikilink" data-target="${target}">[[${label}]]</a>`;
      },
    };
    marked.use({ extensions: [wikilinkExtension] });

    // 5. GitHub 风格 Callout / Alerts 支持 (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
    // 并在 AST 阶段直接生成 macOS 风格代码高亮视窗，彻底消除 DOM 暴力重排
    marked.use({
      renderer: {
        // macOS 风格代码块直接输出
        code(token: any) {
          const text = token.text || '';
          const lang = (token.lang || '').trim();
          let highlighted = '';

          try {
            if (lang && hljs.getLanguage(lang)) {
              highlighted = hljs.highlight(text, { language: lang }).value;
            } else {
              highlighted = hljs.highlightAuto(text).value;
            }
          } catch {
            highlighted = text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          }

          const escapedCode = encodeURIComponent(text);
          const langDisplay = lang || 'text';

          return `<div class="mac-code-block" data-lang="${langDisplay}">
  <div class="mac-code-header">
    <div class="mac-traffic-lights">
      <span class="mac-dot mac-dot-red"></span>
      <span class="mac-dot mac-dot-yellow"></span>
      <span class="mac-dot mac-dot-green"></span>
      <span class="mac-lang-badge">${langDisplay}</span>
    </div>
    <button type="button" class="mac-copy-btn" data-code="${escapedCode}" title="复制代码">
      <svg class="mac-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="mac-copy-text">复制</span>
    </button>
  </div>
  <pre class="mac-code-body"><code class="hljs">${highlighted}</code></pre>
</div>\n`;
        },

        // Callout 警示框与普通引用
        blockquote(token: any) {
          const rawText = token.text || '';
          const match = rawText.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n)?([\s\S]*)$/i);
          if (match) {
            const type = match[1].toLowerCase();
            const content = match[2];
            const innerHtml = marked.parse(content, { async: false }) as string;
            return `<div class="markdown-alert markdown-alert-${type}">
  <div class="markdown-alert-title">
    <span class="markdown-alert-icon"></span>
    <span class="markdown-alert-type">${type.toUpperCase()}</span>
  </div>
  <div class="markdown-alert-content">${innerHtml}</div>
</div>\n`;
          }
          return `<blockquote>\n${(this as any).parser.parse(token.tokens)}</blockquote>\n`;
        },
      },
    });
  }
}

/**
 * 完整渲染 Markdown 为安全 HTML
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';
  setupMarkedPipeline();
  try {
    const rawHtml = marked.parse(md, { async: false }) as string;
    return sanitizeHtml(rawHtml);
  } catch (err) {
    console.error('[MarkdownPipeline] Parse error:', err);
    return `<div class="text-red-500 py-2">Markdown 解析错误: ${String(err)}</div>`;
  }
}

/**
 * 清洗外部 HTML 片段（自适应浏览器与无 DOM 环境）
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof DOMPurify?.sanitize === 'function') {
    return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
  }
  if (typeof window !== 'undefined' && typeof (DOMPurify as any) === 'function') {
    try {
      const purifier = (DOMPurify as any)(window);
      if (typeof purifier?.sanitize === 'function') {
        return purifier.sanitize(html, SANITIZE_OPTIONS);
      }
    } catch {}
  }
  return html;
}

/**
 * 从 Markdown 文本中快速提取 H1-H4 目录项（无需渲染 DOM）
 */
export function extractHeadings(md: string): TocEntry[] {
  if (!md) return [];
  const tokens = blockLexer.lexer(md);
  const headings: TocEntry[] = [];

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth >= 1 && token.depth <= 4) {
      const text = token.text.trim();
      const slug = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');

      headings.push({
        id: slug || `heading-${headings.length + 1}`,
        text,
        level: token.depth,
      });
    }
  }

  return headings;
}

/**
 * 基于 Markdown AST Lexer 将全文拆解为不可破坏的语义块（Block Tokens）
 * 用于段落级双语对照翻译，保证代码块、表格、列表完整性
 */
export function splitAstBlocks(md: string): AstBlockToken[] {
  if (!md) return [];
  const tokens = blockLexer.lexer(md);
  return tokens
    .filter((t) => t.type !== 'space')
    .map((t) => ({
      type: t.type,
      raw: t.raw,
      text: (t as any).text || '',
      lang: (t as any).lang || '',
    }));
}

/**
 * 统计字数（CJK 字符 + 西文单词）
 */
export function countWords(text: string): number {
  if (!text) return 0;
  // 匹配汉字、日韩文字符
  const cjk = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  // 匹配英文单词
  const words = (text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, ' ').match(/[a-zA-Z0-9_\-]+/g) || []).length;
  return cjk + words;
}

/**
 * 粗略预估 Token 数量（用于大模型上下文预算）
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cjk = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const nonCjk = text.length - cjk;
  // CJK 通常 1 字符约 0.6~1.2 token，西文约 4 字符 1 token
  return Math.ceil(cjk * 0.9 + nonCjk * 0.3);
}

/**
 * 预估阅读耗时（分钟，基于平均每分钟 350 字）
 */
export function estimateReadingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 350));
}
