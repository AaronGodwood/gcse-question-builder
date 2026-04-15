import Konva from 'konva';
import { hasLatex, parseInlineLatex, ensureMathImage, getResolvedMathImage, renderInlineToHtml } from '@/lib/latex';
import { KATEX_INLINE_CSS } from '@/lib/katexInlineCss';
import type { CanvasData, CanvasObject } from '@/types/canvas';

// Imperative Konva analogue of <LatexLabel>. Accepts the same config that
// would be passed to `new Konva.Text({...})` and adds either:
//   • a plain Konva.Text (fast path, no LaTeX), or
//   • a Konva.Group containing Konva.Text runs interleaved with Konva.Image
//     math snippets, resolved via the shared KaTeX image cache.
//
// Returns a promise that resolves once any math images have loaded so callers
// can await them before snapshotting the Konva stage to a data URL.

export interface LatexTextConfig {
  x?: number;
  y?: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  listening?: boolean;
  rotation?: number;
}

export async function addLatexText(parent: Konva.Group | Konva.Layer, cfg: LatexTextConfig): Promise<void> {
  const text = cfg.text ?? '';
  if (!hasLatex(text)) {
    parent.add(new Konva.Text({
      x: cfg.x,
      y: cfg.y,
      text,
      fontSize: cfg.fontSize,
      fontFamily: cfg.fontFamily,
      fontStyle: cfg.fontStyle,
      fill: cfg.fill,
      align: cfg.align,
      width: cfg.width,
      height: cfg.height,
      verticalAlign: cfg.verticalAlign,
      listening: cfg.listening,
      rotation: cfg.rotation,
    }));
    return;
  }

  const runs = parseInlineLatex(text);
  const fontSize = cfg.fontSize ?? 11;
  const fontFamily = cfg.fontFamily ?? 'Arial';
  const fill = cfg.fill ?? '#000';

  // Resolve all math runs in parallel.
  const resolved = await Promise.all(
    runs.map((r) =>
      r.type === 'math' ? ensureMathImage(r.value, fontSize, fill, r.display) : Promise.resolve(null),
    ),
  );

  // Measure plain-text runs.
  const ctx = getMeasureCtx();
  ctx.font = `${cfg.fontStyle ?? ''} ${fontSize}px ${fontFamily}`.trim();
  const widths = runs.map((r, i) => {
    if (r.type === 'text') return ctx.measureText(r.value).width;
    return resolved[i]?.width ?? 0;
  });
  const totalW = widths.reduce((s, w) => s + w, 0);

  let xOffset = 0;
  if (cfg.width && cfg.width > 0) {
    if (cfg.align === 'center') xOffset = (cfg.width - totalW) / 2;
    else if (cfg.align === 'right') xOffset = cfg.width - totalW;
  }

  const textCentreY = fontSize * 0.5;

  const group = new Konva.Group({
    x: cfg.x ?? 0,
    y: cfg.y ?? 0,
    rotation: cfg.rotation,
    listening: cfg.listening,
  });

  let cursor = xOffset;
  runs.forEach((r, i) => {
    const w = widths[i];
    if (r.type === 'text') {
      group.add(new Konva.Text({
        x: cursor, y: 0,
        text: r.value,
        fontSize, fontFamily,
        fontStyle: cfg.fontStyle,
        fill,
        listening: false,
      }));
    } else {
      const img = resolved[i];
      if (img) {
        group.add(new Konva.Image({
          x: cursor,
          y: textCentreY - img.height / 2,
          image: img.image,
          width: img.width,
          height: img.height,
          listening: false,
        }));
      }
    }
    cursor += w;
  });

  parent.add(group);
}

let _ctx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D {
  if (_ctx) return _ctx;
  _ctx = document.createElement('canvas').getContext('2d')!;
  return _ctx;
}

/** Synchronous variant — assumes math images are already in the resolved cache. */
export function addLatexTextSync(parent: Konva.Group | Konva.Layer, cfg: LatexTextConfig): void {
  const text = cfg.text ?? '';
  if (!hasLatex(text)) {
    parent.add(new Konva.Text({
      x: cfg.x, y: cfg.y,
      text,
      fontSize: cfg.fontSize,
      fontFamily: cfg.fontFamily,
      fontStyle: cfg.fontStyle,
      fill: cfg.fill,
      align: cfg.align,
      width: cfg.width,
      height: cfg.height,
      verticalAlign: cfg.verticalAlign,
      listening: cfg.listening,
      rotation: cfg.rotation,
    }));
    return;
  }

  const runs = parseInlineLatex(text);
  const fontSize = cfg.fontSize ?? 11;
  const fontFamily = cfg.fontFamily ?? 'Arial';
  const fill = cfg.fill ?? '#000';

  const ctx = getMeasureCtx();
  ctx.font = `${cfg.fontStyle ?? ''} ${fontSize}px ${fontFamily}`.trim();
  const widths: number[] = [];
  const imgs: ReturnType<typeof getResolvedMathImage>[] = [];
  for (const r of runs) {
    if (r.type === 'text') {
      widths.push(ctx.measureText(r.value).width);
      imgs.push(null);
    } else {
      const img = getResolvedMathImage(r.value, fontSize, fill, r.display);
      imgs.push(img);
      widths.push(img?.width ?? 0);
    }
  }
  const totalW = widths.reduce((s, w) => s + w, 0);

  let xOffset = 0;
  if (cfg.width && cfg.width > 0) {
    if (cfg.align === 'center') xOffset = (cfg.width - totalW) / 2;
    else if (cfg.align === 'right') xOffset = cfg.width - totalW;
  }
  const textCentreY = fontSize * 0.5;

  const group = new Konva.Group({
    x: cfg.x ?? 0,
    y: cfg.y ?? 0,
    rotation: cfg.rotation,
    listening: cfg.listening,
  });

  let cursor = xOffset;
  runs.forEach((r, i) => {
    const w = widths[i];
    if (r.type === 'text') {
      group.add(new Konva.Text({
        x: cursor, y: 0,
        text: r.value,
        fontSize, fontFamily, fontStyle: cfg.fontStyle, fill,
        listening: false,
      }));
    } else {
      const img = imgs[i];
      if (img) {
        group.add(new Konva.Image({
          x: cursor, y: textCentreY - img.height / 2,
          image: img.image, width: img.width, height: img.height, listening: false,
        }));
      }
    }
    cursor += w;
  });

  parent.add(group);
}

/** Walk a canvas object tree and preload every LaTeX math run found in user labels. */
export async function preloadCanvasLatex(data: CanvasData): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  const preload = (s: string | undefined | null, fontSize: number, color = '#000') => {
    if (!s || !hasLatex(s)) return;
    for (const r of parseInlineLatex(s)) {
      if (r.type === 'math') tasks.push(ensureMathImage(r.value, fontSize, color, r.display));
    }
  };

  for (const obj of data.objects) collectLatexFromObject(obj, preload);
  await Promise.all(tasks);
}

function collectLatexFromObject(
  obj: CanvasObject,
  add: (s: string | undefined | null, fontSize: number, color?: string) => void,
): void {
  switch (obj.type) {
    case 'text':
      add(obj.content, obj.fontSize, obj.fill);
      return;
    case 'shape':
      for (const s of obj.dimensions.sides) if (s.showLabel) add(s.label, 11, obj.style.stroke);
      for (const a of obj.dimensions.angles) if (a.showLabel) add(a.label, 10, obj.style.stroke);
      return;
    case 'graph':
      add(obj.graphSettings.xLabel, 12, obj.graphSettings.axisColor);
      add(obj.graphSettings.yLabel, 12, obj.graphSettings.axisColor);
      for (const p of obj.plots) if (p.showLabel) add(p.label || p.equation, 10, p.color);
      for (const pt of obj.points) if (pt.showLabel) add(pt.label, 10, pt.color);
      return;
    case 'circle-diagram':
      for (const p of obj.points) add(p.label, 12, '#000');
      for (const a of obj.angles) if (a.showLabel) add(a.label, 11, '#000');
      return;
    case 'table':
      for (const row of obj.cells) for (const c of row) add(c.content, obj.style.fontSize, '#000');
      return;
    case 'number-line':
      for (const m of obj.markers) if (m.showLabel) add(m.label, obj.style.fontSize, obj.style.stroke);
      return;
    case 'venn-diagram':
      add(obj.circleA.label, obj.style.fontSize, obj.style.stroke);
      add(obj.circleB.label, obj.style.fontSize, obj.style.stroke);
      if (obj.universalSet.show) add(obj.universalSet.label, obj.style.fontSize + 2, obj.style.stroke);
      if (obj.regionLabels.aOnly.show) add(obj.regionLabels.aOnly.text, obj.style.fontSize, obj.style.stroke);
      if (obj.regionLabels.bOnly.show) add(obj.regionLabels.bOnly.text, obj.style.fontSize, obj.style.stroke);
      if (obj.regionLabels.intersection.show) add(obj.regionLabels.intersection.text, obj.style.fontSize, obj.style.stroke);
      if (obj.regionLabels.outside.show) add(obj.regionLabels.outside.text, obj.style.fontSize, obj.style.stroke);
      return;
    case 'bar-chart':
      add(obj.xLabel, obj.style.fontSize, obj.style.axisColor);
      add(obj.yLabel, obj.style.fontSize, obj.style.axisColor);
      for (const b of obj.bars) add(b.label, obj.style.fontSize, obj.style.axisColor);
      return;
    case 'pie-chart':
      if (obj.showTitle) add(obj.title, obj.style.fontSize + 1, obj.style.stroke);
      for (const sl of obj.slices) if (sl.showLabel) add(sl.label, obj.style.fontSize, obj.style.stroke);
      return;
    case 'prob-tree':
      for (const n of obj.nodes) {
        add(n.label, obj.style.fontSize, obj.style.stroke);
        add(n.probability, obj.style.fontSize, obj.style.stroke);
        add(n.outcome, obj.style.fontSize, obj.style.stroke);
      }
      return;
    case 'bearing':
      if (obj.showLabel) add(obj.northLabel, obj.style.fontSize + 1, obj.style.stroke);
      if (obj.showLabel) add(obj.bearingLabel, obj.style.fontSize, obj.style.stroke);
      return;
    case 'mark-box':
      return;
  }
}

// ─── Paragraph rasterisation (for question_text → PDF) ─────────────────────────
// Renders a full inline-LaTeX string to a PNG data URL at a known CSS pixel
// width. The caller embeds this into the PDF via pdf.addImage(...). Used when
// the paragraph contains $…$ and the plain pdf.text() path can't handle it.

export interface RenderedParagraph {
  dataUrl: string;
  pxWidth: number;
  pxHeight: number;
}

export async function renderInlineLatexParagraph(opts: {
  text: string;
  cssPxWidth: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  scale?: number;
}): Promise<RenderedParagraph | null> {
  const { text, cssPxWidth, fontSize, fontFamily = 'Arial, sans-serif', color = '#000', scale = 2 } = opts;
  if (!text) return null;

  const html = renderInlineToHtml(text);

  // Measure the rendered HTML off-screen at the target width to learn its height.
  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.visibility = 'hidden';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.width = `${cssPxWidth}px`;
  host.style.fontFamily = fontFamily;
  host.style.fontSize = `${fontSize}px`;
  host.style.color = color;
  host.style.lineHeight = '1.45';
  host.innerHTML = html;
  document.body.appendChild(host);

  await new Promise((r) => requestAnimationFrame(() => r(null)));
  const height = Math.max(1, Math.ceil(host.getBoundingClientRect().height));
  document.body.removeChild(host);

  const css = KATEX_INLINE_CSS;
  const pxW = cssPxWidth;
  const pxH = height;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${fontFamily};font-size:${fontSize}px;color:${color};line-height:1.45;width:${pxW}px">
      <style>${css}</style>
      ${html}
    </div>
  </foreignObject>
</svg>`.trim();

  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  // Rasterise the SVG onto a canvas for a PNG that jsPDF can embed cleanly.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pxW * scale;
  canvas.height = pxH * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pxW, pxH);
  ctx.drawImage(img, 0, 0);

  return { dataUrl: canvas.toDataURL('image/png'), pxWidth: pxW, pxHeight: pxH };
}
