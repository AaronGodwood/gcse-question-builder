import { Line, Text } from 'react-konva';
import type { GraphObject, PlotSettings } from '@/types/canvas';
import {
  parseEquation,
  sampleEquation,
  sampleCircle,
} from '@/lib/equations';
import { toSuperscript } from '@/lib/cn';

interface Props {
  graph: GraphObject;
  toPixel: (x: number, y: number) => { px: number; py: number };
  width: number;
  height: number;
}

const LABEL_MARGIN = 18;
const LABEL_GAP_X = 40; // px horizontal clearance between label and any other curve/label
const LABEL_GAP_Y = 14; // px vertical clearance

// Sample another plot's pixel y-value at a given pixel x, for collision testing.
function otherPlotPyAt(
  px: number,
  otherEvalY: (x: number) => number | null,
  s: GraphObject['graphSettings'],
  toPixel: Props['toPixel'],
): number | null {
  // Convert px back to graph x
  const PAD = 30;
  const innerW = (toPixel(s.xMax, 0).px - PAD);
  const gx = s.xMin + ((px - PAD) / innerW) * (s.xMax - s.xMin);
  const gy = otherEvalY(gx);
  if (gy === null) return null;
  return toPixel(0, gy).py;
}

// Find a visible label position that doesn't collide with other curves, labels, or axes.
function findLabelPos(
  evalY: (x: number) => number | null,
  xMin: number,
  xMax: number,
  toPixel: Props['toPixel'],
  width: number,
  height: number,
  usedPositions: Array<{ px: number; py: number }>,
  otherEvalFns: Array<(x: number) => number | null>,
  s: GraphObject['graphSettings'],
): { px: number; py: number } | null {
  // Pixel positions of the x and y axes
  const { px: axisPx } = toPixel(0, 0); // x position of y-axis
  const { py: axisPy } = toPixel(0, 0); // y position of x-axis
  const AXIS_GAP = 16; // minimum px gap between label box and axis line

  for (let t = 0.05; t <= 0.95; t += 0.025) {
    const lx = xMin + (xMax - xMin) * t;
    const ly = evalY(lx);
    if (ly === null) continue;
    const pos = toPixel(lx, ly);
    if (
      pos.py >= LABEL_MARGIN && pos.py <= height - LABEL_MARGIN &&
      pos.px >= LABEL_MARGIN && pos.px <= width - LABEL_MARGIN
    ) {
      // Reject if too close to a previously placed label
      const nearLabel = usedPositions.some(
        (u) => Math.abs(u.px - pos.px) < LABEL_GAP_X && Math.abs(u.py - pos.py) < LABEL_GAP_Y * 2
      );
      if (nearLabel) continue;

      // Reject if the label text box overlaps another curve at the same x range
      const labelTop = pos.py - 18;
      const labelBottom = pos.py + 4;
      const nearCurve = otherEvalFns.some((fn) => {
        const otherPy = otherPlotPyAt(pos.px, fn, s, toPixel);
        if (otherPy === null) return false;
        return otherPy >= labelTop - LABEL_GAP_Y && otherPy <= labelBottom + LABEL_GAP_Y;
      });
      if (nearCurve) continue;

      // Reject if the label box overlaps the x-axis or y-axis line
      if (axisPy >= labelTop - AXIS_GAP && axisPy <= labelBottom + AXIS_GAP) continue; // x-axis
      if (Math.abs(pos.px - axisPx) < AXIS_GAP) continue; // y-axis

      return pos;
    }
  }
  return null;
}

export function PlotRenderer({ graph, toPixel, width, height }: Props) {
  const { graphSettings: s, plots } = graph;

  // Pre-compute all evalY functions once
  const evalFns: Map<string, (x: number) => number | null> = new Map();
  for (const plot of plots) {
    const parsed = parseEquation(plot.equation);
    if (!parsed.error && parsed.type === 'explicit' && parsed.evalY) {
      evalFns.set(plot.id, parsed.evalY);
    }
  }

  // Pre-compute label positions, avoiding overlap with other curves and labels.
  const usedLabelPositions: Array<{ px: number; py: number }> = [];
  const labelPositions: Map<string, { px: number; py: number } | null> = new Map();

  for (const plot of plots) {
    if (!plot.showLabel) { labelPositions.set(plot.id, null); continue; }
    const evalY = evalFns.get(plot.id);
    if (!evalY) { labelPositions.set(plot.id, null); continue; }
    const xMin = plot.domain?.min ?? s.xMin;
    const xMax = plot.domain?.max ?? s.xMax;
    // Other plots' eval functions (not this one)
    const others = [...evalFns.entries()]
      .filter(([id]) => id !== plot.id)
      .map(([, fn]) => fn);
    const pos = findLabelPos(evalY, xMin, xMax, toPixel, width, height, usedLabelPositions, others, s);
    labelPositions.set(plot.id, pos);
    if (pos) usedLabelPositions.push(pos);
  }

  return (
    <>
      {plots.map((plot) => (
        <SinglePlot
          key={plot.id}
          plot={plot}
          s={s}
          toPixel={toPixel}
          height={height}
          labelPos={labelPositions.get(plot.id) ?? null}
        />
      ))}
    </>
  );
}


function SinglePlot({
  plot,
  s,
  toPixel,
  height,
  labelPos,
}: {
  plot: PlotSettings;
  s: GraphObject['graphSettings'];
  toPixel: (x: number, y: number) => { px: number; py: number };
  height: number;
  labelPos: { px: number; py: number } | null;
}) {
  const parsed = parseEquation(plot.equation);

  if (parsed.error) {
    // Show error label on canvas
    return (
      <Text
        x={4} y={4}
        text={`⚠ ${plot.equation}`}
        fontSize={10}
        fontFamily="Arial"
        fill="red"
        listening={false}
      />
    );
  }

  const strokeProps = {
    stroke: plot.color,
    strokeWidth: plot.strokeWidth,
    dash: plot.dashed ? [8, 4] : undefined,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    listening: false,
    tension: 0,
  };

  // ---------- Vertical line ----------
  if (parsed.type === 'vertical' && parsed.verticalX !== undefined) {
    const { px } = toPixel(parsed.verticalX, 0);
    const label = `x = ${parsed.verticalX}`;
    return (
      <>
        <Line
          points={[px, 0, px, height]}
          {...strokeProps}
        />
        {plot.showLabel && (
          <Text
            x={px + 4} y={8}
            text={label}
            fontSize={10}
            fontFamily="Arial"
            fill={plot.color}
            listening={false}
          />
        )}
      </>
    );
  }

  // ---------- Circle ----------
  if (parsed.type === 'circle' && parsed.circle) {
    const segments = sampleCircle(parsed.circle, s.xMin, s.xMax, 200);
    return (
      <>
        {segments.map((seg, i) => {
          const flat = seg.flatMap(({ x, y }) => {
            const { px, py } = toPixel(x, y);
            return [px, py];
          });
          return (
            <Line
              key={i}
              points={flat}
              closed={i === 0} // full circle closes
              {...strokeProps}
              tension={0}
            />
          );
        })}
      </>
    );
  }

  // ---------- Inequality ----------
  if (parsed.type === 'inequality' && parsed.inequality) {
    const { operator, evalBoundary } = parsed.inequality;
    const boundarySegments = sampleEquation(
      evalBoundary,
      s.xMin, s.xMax, s.yMin, s.yMax, 400
    );

    // Build a filled polygon for the shaded region
    // Sample boundary points + close with top/bottom edge
    const allBoundaryPts: Array<{ x: number; y: number }> = boundarySegments.flat();
    const shadedFlat: number[] = [];

    // Determine which side to shade
    const above = operator === '>' || operator === '>=';
    const edgeY = above ? s.yMax : s.yMin;

    if (allBoundaryPts.length > 0) {
      // Start from left edge
      const { px: lx } = toPixel(allBoundaryPts[0].x, allBoundaryPts[0].y);
      const { py: edgePy } = toPixel(allBoundaryPts[0].x, edgeY);
      shadedFlat.push(lx, edgePy);

      // Add boundary points
      allBoundaryPts.forEach(({ x, y }) => {
        const { px, py } = toPixel(x, y);
        shadedFlat.push(px, py);
      });

      // Close to right edge
      const last = allBoundaryPts[allBoundaryPts.length - 1];
      const { px: rx } = toPixel(last.x, last.y);
      const { py: edgePy2 } = toPixel(last.x, edgeY);
      shadedFlat.push(rx, edgePy2);
    }

    const boundaryDash = (plot.boundaryDashed ?? (operator === '<' || operator === '>'))
      ? [8, 4]
      : undefined;

    return (
      <>
        {/* Shaded region */}
        {shadedFlat.length > 0 && (
          <Line
            points={shadedFlat}
            closed
            fill={plot.color}
            opacity={plot.fillOpacity ?? 0.15}
            stroke={undefined}
            listening={false}
          />
        )}
        {/* Boundary line */}
        {boundarySegments.map((seg, i) => {
          const flat = seg.flatMap(({ x, y }) => {
            const { px, py } = toPixel(x, y);
            return [px, py];
          });
          return (
            <Line
              key={i}
              points={flat}
              stroke={plot.color}
              strokeWidth={plot.strokeWidth}
              dash={boundaryDash}
              lineCap="round"
              lineJoin="round"
              listening={false}
              tension={0.2}
            />
          );
        })}
      </>
    );
  }

  // ---------- Explicit y = f(x) ----------
  if (parsed.type === 'explicit' && parsed.evalY) {
    const xMin = plot.domain?.min ?? s.xMin;
    const xMax = plot.domain?.max ?? s.xMax;
    const segments = sampleEquation(parsed.evalY, xMin, xMax, s.yMin, s.yMax, 500);

    return (
      <>
        {segments.map((seg, i) => {
          const flat = seg.flatMap(({ x, y }) => {
            const { px, py } = toPixel(x, y);
            return [px, py];
          });
          return (
            <Line
              key={i}
              points={flat}
              {...strokeProps}
            />
          );
        })}

        {plot.showLabel && labelPos && (
          <Text
            x={labelPos.px + 4}
            y={labelPos.py - 18}
            text={toSuperscript(plot.label || plot.equation)}
            fontSize={10}
            fontFamily="Arial"
            fill={plot.color}
            listening={false}
          />
        )}
      </>
    );
  }

  return null;
}
