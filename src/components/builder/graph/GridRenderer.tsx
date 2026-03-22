import { Line, Rect } from 'react-konva';
import type { GraphObject } from '@/types/canvas';

interface Props {
  graph: GraphObject;
  toPixel: (x: number, y: number) => { px: number; py: number };
  width: number;
  height: number;
}

export function GridRenderer({ graph, toPixel, width, height }: Props) {
  const { graphSettings: s } = graph;
  const lines: React.ReactNode[] = [];

  // Background
  lines.push(
    <Rect
      key="bg"
      x={0} y={0}
      width={width} height={height}
      fill={s.backgroundColor}
      listening={false}
    />
  );

  if (!s.showGrid) return <>{lines}</>;

  // Minor grid (every 0.5 step if enabled)
  if (s.showMinorGrid) {
    const minorStep = Math.min(s.xStep, s.yStep) / 2;
    for (let x = Math.ceil(s.xMin / minorStep) * minorStep; x <= s.xMax; x += minorStep) {
      if (Math.abs(x % s.xStep) < 1e-9) continue; // skip major
      const { px } = toPixel(x, 0);
      lines.push(
        <Line
          key={`mg-v-${x}`}
          points={[px, 0, px, height]}
          stroke={s.gridColor}
          strokeWidth={0.5}
          opacity={0.5}
          listening={false}
        />
      );
    }
    for (let y = Math.ceil(s.yMin / minorStep) * minorStep; y <= s.yMax; y += minorStep) {
      if (Math.abs(y % s.yStep) < 1e-9) continue;
      const { py } = toPixel(0, y);
      lines.push(
        <Line
          key={`mg-h-${y}`}
          points={[0, py, width, py]}
          stroke={s.gridColor}
          strokeWidth={0.5}
          opacity={0.5}
          listening={false}
        />
      );
    }
  }

  // Major grid
  for (let x = Math.ceil(s.xMin / s.xStep) * s.xStep; x <= s.xMax + 1e-9; x += s.xStep) {
    const { px } = toPixel(x, 0);
    lines.push(
      <Line
        key={`g-v-${x}`}
        points={[px, 0, px, height]}
        stroke={s.gridColor}
        strokeWidth={1}
        listening={false}
      />
    );
  }
  for (let y = Math.ceil(s.yMin / s.yStep) * s.yStep; y <= s.yMax + 1e-9; y += s.yStep) {
    const { py } = toPixel(0, y);
    lines.push(
      <Line
        key={`g-h-${y}`}
        points={[0, py, width, py]}
        stroke={s.gridColor}
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
