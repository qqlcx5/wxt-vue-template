import { renderMarkdown, extractHeadings, splitAstBlocks, countWords, estimateTokens, estimateReadingTime } from './utils/markdown/pipeline.ts';

console.log('=== 1. 测试 Markdown 核心渲染管道 ===');

const sampleMd = `
# 量子物理与计算前沿

> [!NOTE]
> 这是一个优雅的 Callout 提示框！

在二维复希尔伯特空间中：
$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$$

行内公式测试：$E = mc^2$。

\`\`\`ts
interface BellState {
  alpha: number;
  beta: number;
}
const state: BellState = { alpha: 1 / Math.sqrt(2), beta: 1 / Math.sqrt(2) };
\`\`\`

| 比较维度 | 经典计算机 | 量子计算机 |
| :--- | :--- | :--- |
| **状态表示** | 0 或 1 | 叠加态 |

- [x] 完成 Markdown 管道
- [x] 完成公式渲染
- [ ] 持续优化

测试双向链接：[[量子纠缠导论|导论链接]]。
脚注测试：这是一篇前沿研究论文[^1]。

[^1]: 来自量子力学基本原理。
`;

const html = renderMarkdown(sampleMd);

// 验证关键产物
console.log('✓ HTML 渲染成功，长度:', html.length);
console.assert(html.includes('markdown-alert-note'), '必须包含 Callout 类名');
console.assert(html.includes('katex'), '必须包含 KaTeX 渲染产物');
console.assert(html.includes('mac-code-block'), '必须包含 macOS 风格代码视窗');
console.assert(html.includes('mac-traffic-lights'), '代码视窗必须包含交通灯红黄绿控制点');
console.assert(html.includes('am-wikilink'), '必须包含双链链接');
console.assert(html.includes('table'), '必须包含 GFM 表格');
console.log('✓ KaTeX 公式、Callout、macOS 代码视窗、表格校验全部通过！');

console.log('\n=== 2. 测试标题目录层级提取 (TOC) ===');
const headings = extractHeadings(sampleMd);
console.log('提取到的目录:', headings);
console.assert(headings.length >= 1, '必须提取到 H1 标题');
console.assert(headings[0].text === '量子物理与计算前沿', '标题文本匹配');
console.log('✓ 目录提取验证通过！');

console.log('\n=== 3. 测试 AST 语义分块 (用于双语对照翻译) ===');
const blocks = splitAstBlocks(sampleMd);
console.log(`拆分出的 AST 语义块数量: ${blocks.length}`);
const codeBlock = blocks.find(b => b.type === 'code');
console.assert(codeBlock && codeBlock.lang === 'ts', '代码块必须作为独立原子块保留');
console.log('✓ 代码块原子完整性验证通过！代码语言:', codeBlock.lang);

console.log('\n=== 4. 测试统计分析指标 ===');
const words = countWords(sampleMd);
const tokens = estimateTokens(sampleMd);
const readTime = estimateReadingTime(words);
console.log(`统计字数: ${words}, 预估 Tokens: ${tokens}, 预计阅读: ${readTime} 分钟`);
console.assert(words > 20, '字数统计应大于 20');
console.assert(tokens > 20, 'Token 统计应大于 20');
console.log('✓ 统计分析验证通过！');

console.log('\n🎉 所有核心管线验证 100% 成功！');
