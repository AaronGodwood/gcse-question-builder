import katex from 'katex';
import 'katex/dist/katex.min.css';
import { KATEX_INLINE_CSS } from '@/lib/katexInlineCss';

// ─── Inline parsing ────────────────────────────────────────────────────────────
// Split a string into alternating text / math runs. Math is delimited by $…$ or
// $$…$$ (display). Escaped \$ is treated as a literal dollar sign.

export interface TextRun { type: 'text'; value: string }
export interface MathRun { type: 'math'; value: string; display: boolean }
export type InlineRun = TextRun | MathRun;

const MATH_RE = /\$\$([^$]+?)\$\$|\$([^$]+?)\$/g;

export function hasLatex(s: string | null | undefined): boolean {
  if (!s) return false;
  MATH_RE.lastIndex = 0;
  return MATH_RE.test(s);
}

export function parseInlineLatex(src: string): InlineRun[] {
  if (!src) return [];
  const runs: InlineRun[] = [];
  let lastIndex = 0;
  MATH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MATH_RE.exec(src)) !== null) {
    if (m.index > lastIndex) {
      runs.push({ type: 'text', value: src.slice(lastIndex, m.index) });
    }
    const display = m[1] != null;
    runs.push({ type: 'math', value: (m[1] ?? m[2]).trim(), display });
    lastIndex = MATH_RE.lastIndex;
  }
  if (lastIndex < src.length) {
    runs.push({ type: 'text', value: src.slice(lastIndex) });
  }
  return runs;
}

// ─── KaTeX → HTML (for the question_text PDF path via html2canvas-style render) ─

export function renderMathToHtml(tex: string, display = false): string {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'html' });
  } catch {
    return `<span style="color:#b00">${escapeHtml(tex)}</span>`;
  }
}

export function renderInlineToHtml(src: string): string {
  return parseInlineLatex(src)
    .map((r) => (r.type === 'text' ? escapeHtml(r.value) : renderMathToHtml(r.value, r.display)))
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// ─── KaTeX → raster image (for Konva / jsPDF embedding) ────────────────────────
// We render each math snippet into a hidden DOM node at a controlled font size,
// snapshot it via an SVG <foreignObject> wrapper → data-URL PNG, then load it
// into an HTMLImageElement. Results are cached keyed by (tex, fontSize, color).

export interface MathImage {
  image: HTMLImageElement;
  width: number;
  height: number;
  /** baseline offset from top of image, in px, for aligning with surrounding text */
  baseline: number;
}

interface CacheKey {
  tex: string;
  fontSize: number;
  color: string;
  display: boolean;
}

const imageCache = new Map<string, Promise<MathImage>>();
const resolvedCache = new Map<string, MathImage>();

function cacheKey(k: CacheKey): string {
  return `${k.fontSize}|${k.color}|${k.display ? 'D' : 'I'}|${k.tex}`;
}

// Ensure we have a hidden DOM host for measuring KaTeX renders.
function getMeasureHost(): HTMLDivElement {
  let host = document.getElementById('__latex_measure__') as HTMLDivElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = '__latex_measure__';
    host.style.position = 'absolute';
    host.style.visibility = 'hidden';
    host.style.left = '-99999px';
    host.style.top = '0';
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);
  }
  return host;
}

async function renderMathImage(k: CacheKey): Promise<MathImage> {
  const host = getMeasureHost();
  const el = document.createElement('span');
  el.style.fontSize = `${k.fontSize}px`;
  el.style.color = k.color;
  el.style.display = 'inline-block';
  el.style.lineHeight = '1';
  el.innerHTML = renderMathToHtml(k.tex, k.display);
  host.appendChild(el);

  // Give the browser a tick to lay out the KaTeX HTML so measurements are accurate.
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const rect = el.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));

  // Font-color is applied via `style="color:…"` in the wrapper; fontSize in style.
  // KaTeX CSS with base64-inlined font files travels with the SVG so
  // `<img src="data:image/svg+xml…">` rasterises with the correct glyphs.
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${k.fontSize}px;color:${k.color};line-height:1;display:inline-block">
      <style>${KATEX_INLINE_CSS}</style>
      ${el.innerHTML}
    </div>
  </foreignObject>
</svg>`.trim();

  host.removeChild(el);

  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const image = await loadImage(dataUrl);
  // Baseline: KaTeX renders on a baseline roughly at ~0.8 of the box; we use
  // the html element's offsetHeight vs the dominant text baseline for alignment.
  const baseline = Math.round(height * 0.78);
  return { image, width, height, baseline };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function renderLatexToImage(opts: {
  tex: string;
  fontSize: number;
  color?: string;
  display?: boolean;
}): Promise<MathImage> {
  const k: CacheKey = {
    tex: opts.tex,
    fontSize: opts.fontSize,
    color: opts.color ?? '#000',
    display: opts.display ?? false,
  };
  const key = cacheKey(k);
  const cached = imageCache.get(key);
  if (cached) return cached;
  const p = renderMathImage(k).then((img) => {
    resolvedCache.set(key, img);
    return img;
  });
  imageCache.set(key, p);
  return p;
}

/** Pre-warm the cache for every math run in a string. */
export function preloadInline(src: string, fontSize: number, color = '#000'): Promise<unknown> {
  const runs = parseInlineLatex(src);
  return Promise.all(
    runs
      .filter((r): r is MathRun => r.type === 'math')
      .map((r) => renderLatexToImage({ tex: r.value, fontSize, color, display: r.display })),
  );
}

// A resolved-value mirror of the cache so React renderers can check synchronously.
export function getResolvedMathImage(tex: string, fontSize: number, color = '#000', display = false): MathImage | null {
  return resolvedCache.get(cacheKey({ tex, fontSize, color, display })) ?? null;
}

export async function ensureMathImage(tex: string, fontSize: number, color = '#000', display = false): Promise<MathImage> {
  const existing = resolvedCache.get(cacheKey({ tex, fontSize, color, display }));
  if (existing) return existing;
  return renderLatexToImage({ tex, fontSize, color, display });
}
