import { useEffect, useState, useMemo } from 'react';
import { Text, Group, Image as KonvaImage, Rect } from 'react-konva';
import {
  parseInlineLatex,
  ensureMathImage,
  getResolvedMathImage,
  hasLatex,
  type MathImage,
} from '@/lib/latex';

// Drop-in replacement for Konva <Text> that interprets `$…$` as inline LaTeX.
// API: intentionally mirrors the subset of <Text> props used across the app.
// Multi-line wrapping is not supported when LaTeX is present — labels in this
// codebase are short; long prose use TextObject with plain text.

interface Props {
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
  listening?: boolean;
  rotation?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
}

export function LatexLabel(props: Props) {
  const {
    x = 0, y = 0,
    text,
    fontSize = 11,
    fontFamily = 'Arial',
    fontStyle,
    fill = '#000',
    align = 'left',
    width,
    height,
    listening,
    rotation,
    verticalAlign,
    lineHeight,
  } = props;

  const isLatex = hasLatex(text);
  const runs = useMemo(() => (isLatex ? parseInlineLatex(text) : []), [text, isLatex]);
  const [, force] = useState(0);

  // Ensure every math run is cached; trigger re-render when one resolves.
  useEffect(() => {
    if (!isLatex) return;
    let cancelled = false;
    Promise.all(
      runs.map((r) =>
        r.type === 'math'
          ? ensureMathImage(r.value, fontSize, fill, r.display)
          : Promise.resolve(),
      ),
    ).then(() => { if (!cancelled) force((n) => n + 1); });
    return () => { cancelled = true; };
  }, [runs, fontSize, fill, isLatex]);

  // Fast path — no LaTeX, render plain Text and preserve original wrapping.
  if (!isLatex) {
    return (
      <Text
        x={x} y={y}
        text={text ?? ''}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fill={fill}
        align={align}
        width={width}
        height={height}
        listening={listening}
        rotation={rotation}
        verticalAlign={verticalAlign}
        lineHeight={lineHeight}
      />
    );
  }

  // Measure every run (text via Konva's util, math via cached image).
  const measured = runs.map((r) => {
    if (r.type === 'text') {
      return { run: r, w: measureText(r.value, fontSize, fontFamily, fontStyle), h: fontSize, img: null as MathImage | null };
    }
    const img = getResolvedMathImage(r.value, fontSize, fill, r.display);
    return { run: r, w: img?.width ?? fontSize * r.value.length * 0.5, h: img?.height ?? fontSize * 1.2, img };
  });

  const totalW = measured.reduce((s, m) => s + m.w, 0);

  // Horizontal offset for align when width is provided.
  let xOffset = 0;
  if (width && width > 0) {
    if (align === 'center') xOffset = (width - totalW) / 2;
    else if (align === 'right') xOffset = width - totalW;
  }

  // Vertical anchor: align text baselines. Konva Text's y is its top; math images
  // have their own height. We centre math images on the text's visual centre.
  const textCentreY = fontSize * 0.5;

  let cursor = xOffset;
  return (
    <Group x={x} y={y} rotation={rotation} listening={listening}>
      {listening !== false && (
        <Rect
          x={xOffset}
          y={0}
          width={Math.max(1, totalW)}
          height={Math.max(fontSize * 1.2, ...measured.map((m) => m.h))}
          fill="rgba(0,0,0,0)"
        />
      )}
      {measured.map((m, i) => {
        const el = (() => {
          if (m.run.type === 'text') {
            const node = (
              <Text
                key={i}
                x={cursor}
                y={0}
                text={m.run.value}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontStyle={fontStyle}
                fill={fill}
                listening={false}
              />
            );
            cursor += m.w;
            return node;
          }
          const img = m.img;
          if (!img) {
            // Placeholder while loading — matches sizing so layout doesn't jump once resolved.
            const node = <Text key={i} x={cursor} y={0} text={m.run.value} fontSize={fontSize} fontFamily={fontFamily} fill={fill} listening={false} />;
            cursor += m.w;
            return node;
          }
          const imgY = textCentreY - m.h / 2;
          const node = (
            <KonvaImage
              key={i}
              x={cursor}
              y={imgY}
              image={img.image}
              width={img.width}
              height={img.height}
              listening={false}
            />
          );
          cursor += m.w;
          return node;
        })();
        return el;
      })}
    </Group>
  );
}

// Measure plain text run width using an off-screen canvas 2D context so this works
// synchronously during render.
const measureCtx: CanvasRenderingContext2D | null =
  typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

function measureText(s: string, fontSize: number, fontFamily: string, fontStyle?: string): number {
  if (!measureCtx) return s.length * fontSize * 0.5;
  measureCtx.font = `${fontStyle ?? ''} ${fontSize}px ${fontFamily}`.trim();
  return measureCtx.measureText(s).width;
}
