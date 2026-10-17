export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface HighlightAnchor {
  id: string;
  text: string;
  prefix: string; // 选区前 25 个字符上下文，彻底消除重复词错位
  suffix: string; // 选区后 25 个字符上下文
  color: HighlightColor;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export const HIGHLIGHT_COLORS: Array<{ color: HighlightColor; label: string; bg: string; border: string }> = [
  { color: 'yellow', label: '日光黄', bg: 'rgba(250, 204, 21, 0.35)', border: 'rgba(202, 138, 4, 0.5)' },
  { color: 'green', label: '薄荷绿', bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(22, 101, 52, 0.5)' },
  { color: 'blue', label: '天蓝色', bg: 'rgba(59, 130, 246, 0.25)', border: 'rgba(30, 58, 138, 0.5)' },
  { color: 'pink', label: '珊瑚粉', bg: 'rgba(244, 114, 182, 0.3)', border: 'rgba(190, 24, 93, 0.5)' },
  { color: 'purple', label: '鸢尾紫', bg: 'rgba(168, 85, 247, 0.25)', border: 'rgba(107, 33, 168, 0.5)' },
];

/**
 * 清除容器内现有的所有高亮标记，并将被拆开的文本节点复原
 */
export function clearMarks(container: HTMLElement): void {
  const marks = container.querySelectorAll<HTMLElement>('mark[data-hl-id]');
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  }
}

/**
 * 遍历容器纯文本节点，定位最佳匹配的起始位置（上下文锚点打分法）
 */
function findBestAnchorIndex(fullDomText: string, anchor: HighlightAnchor): number {
  if (!anchor.text) return -1;
  const targetText = anchor.text;

  // 1. 若拥有前缀与后缀，优先尝试精准连缀匹配
  if (anchor.prefix && anchor.suffix) {
    const combined = anchor.prefix + targetText + anchor.suffix;
    const combinedIdx = fullDomText.indexOf(combined);
    if (combinedIdx !== -1) {
      return combinedIdx + anchor.prefix.length;
    }
  }

  // 2. 遍历全文本中该词出现的所有候选位置，计算与 prefix / suffix 的上下文重合分
  let bestIdx = -1;
  let bestScore = -1;
  let fromIdx = 0;

  while ((fromIdx = fullDomText.indexOf(targetText, fromIdx)) !== -1) {
    const candidateIdx = fromIdx;
    let score = 0;

    if (anchor.prefix) {
      const actualPre = fullDomText.substring(Math.max(0, candidateIdx - anchor.prefix.length), candidateIdx);
      if (actualPre === anchor.prefix) score += 20;
      else if (anchor.prefix.endsWith(actualPre) || actualPre.endsWith(anchor.prefix)) score += 10;
    }

    if (anchor.suffix) {
      const actualSuf = fullDomText.substring(candidateIdx + targetText.length, candidateIdx + targetText.length + anchor.suffix.length);
      if (actualSuf === anchor.suffix) score += 20;
      else if (anchor.suffix.startsWith(actualSuf) || actualSuf.startsWith(anchor.suffix)) score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = candidateIdx;
    }

    fromIdx += targetText.length;
  }

  // 3. 兜底策略：若打分无明显区分，返回首次出现位置
  return bestIdx !== -1 ? bestIdx : fullDomText.indexOf(targetText);
}

/**
 * 基于 W3C Web Annotation 算法，安全将高亮渲染至 DOM，绝不跨越破坏 HTML 标签
 */
export function applyMarks(container: HTMLElement, highlights: HighlightAnchor[]): void {
  clearMarks(container);
  if (!highlights || highlights.length === 0) return;

  for (const hl of highlights) {
    if (!hl.text) continue;

    // 收集所有纯文本节点与对应偏移区间
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        if (parent.closest('mark[data-hl-id]')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Array<{ node: Text; start: number; length: number; text: string }> = [];
    let cumulative = 0;
    let n: Node | null;

    while ((n = walker.nextNode())) {
      const tn = n as Text;
      const text = tn.nodeValue || '';
      textNodes.push({ node: tn, start: cumulative, length: text.length, text });
      cumulative += text.length;
    }

    const fullDomText = textNodes.map((t) => t.text).join('');
    const matchStart = findBestAnchorIndex(fullDomText, hl);
    if (matchStart === -1) continue;

    const matchEnd = matchStart + hl.text.length;

    // 筛选出所有与 [matchStart, matchEnd) 相交的文本节点进行原子级切分与包裹
    for (const item of textNodes) {
      const itemStart = item.start;
      const itemEnd = item.start + item.length;

      // 无交集
      if (itemEnd <= matchStart || itemStart >= matchEnd) {
        continue;
      }

      // 计算本 TextNode 内需包裹的相对位置
      const localStart = Math.max(0, matchStart - itemStart);
      const localEnd = Math.min(item.length, matchEnd - itemStart);

      if (localStart >= localEnd) continue;

      try {
        let nodeToWrap = item.node;

        // 若开始位置大于 0，切断前置无高亮部分
        if (localStart > 0) {
          nodeToWrap = nodeToWrap.splitText(localStart);
        }

        // 若切分后长度超出高亮部分，切断后置无高亮部分
        const wrapLen = localEnd - localStart;
        if (nodeToWrap.nodeValue && nodeToWrap.nodeValue.length > wrapLen) {
          nodeToWrap.splitText(wrapLen);
        }

        const mark = document.createElement('mark');
        mark.dataset.hlId = hl.id;
        mark.className = `hl-mark hl-${hl.color || 'yellow'}`;
        if (hl.note) {
          mark.dataset.hlNote = hl.note;
          mark.title = `批注: ${hl.note}`;
        }

        const parent = nodeToWrap.parentNode;
        if (parent) {
          parent.insertBefore(mark, nodeToWrap);
          mark.appendChild(nodeToWrap);
        }
      } catch (e) {
        console.warn('[Highlighter] Failed to wrap text segment:', e);
      }
    }
  }
}

/**
 * 从用户当前浏览器选择区域创建高亮锚点实体
 */
export function createAnchorFromSelection(
  container: HTMLElement,
  color: HighlightColor = 'yellow',
  note?: string
): HighlightAnchor | null {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const text = range.toString().trim();
  if (!text) return null;

  // 抓取全容器文本以获取前后 25 字符上下文
  const preRange = range.cloneRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);

  const fullText = container.textContent || '';
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + text.length;

  const prefix = fullText.substring(Math.max(0, startOffset - 25), startOffset);
  const suffix = fullText.substring(endOffset, Math.min(fullText.length, endOffset + 25));

  const now = Date.now();
  const id = 'hl-' + now + '-' + Math.random().toString(36).slice(2, 7);

  return {
    id,
    text,
    prefix,
    suffix,
    color,
    note: note?.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 寻找被点击的 mark 对应的原始高亮数据
 */
export function findHighlightByMark(
  markEl: HTMLElement,
  highlights: HighlightAnchor[]
): HighlightAnchor | undefined {
  const id = markEl.dataset.hlId;
  if (!id) return undefined;
  return highlights.find((h) => h.id === id);
}

/**
 * 视口平滑滚动跳转至指定高亮，并施加高保真脉冲闪烁动画
 */
export function jumpToHighlight(container: HTMLElement, highlightId: string): void {
  const mark = container.querySelector<HTMLElement>(`mark[data-hl-id="${highlightId}"]`);
  if (!mark) return;

  mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  mark.classList.add('hl-flash');
  setTimeout(() => {
    mark.classList.remove('hl-flash');
  }, 1600);
}
