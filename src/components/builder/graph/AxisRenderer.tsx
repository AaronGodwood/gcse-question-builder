import { Line, Text } from 'react-konva';
import type { GraphObject } from '@/types/canvas';

interface Props {
  graph: GraphObject;
  toPixel: (x: number, y: number) => { px: number; py: number };
  width: number;
  height: number;
}

const TICK = 5;
const NUM_OFFSET = 10;
const ARROW = 8;

export function AxisRenderer({ graph, toPixel, width, height }: Props) {
  const { graphSettings: s } = graph;
  if (!s.showAxes) return null;

  const { px: x0, py: y0 } = toPixel(0, 0);
  // Clamp axis position to within canvas
  const axisX = Math.max(2, Math.min(width - 2, x0));
  const axisY = Math.max(2, Math.min(height - 2, y0));

  const elements: React.ReactNode[] = [];

  // X axis
  elements.push(
    <Line
      key="x-axis"
      points={[0, axisY, width - ARROW, axisY]}
      stroke={s.axisColor}
      strokeWidth={1.5}
      listening={false}
    />,
    // arrowhead
    <Line
      key="x-arrow"
      points={[width - ARROW, axisY - 4, width, axisY, width - ARROW, axisY + 4]}
      stroke={s.axisColor}
      strokeWidth={1.5}
      closed={false}
      listening={false}
    />
  );

  // Y axis
  elements.push(
    <Line
      key="y-axis"
      points={[axisX, height, axisX, ARROW]}
      stroke={s.axisColor}
      strokeWidth={1.5}
      listening={false}
    />,
    // arrowhead
    <Line
      key="y-arrow"
      points={[axisX - 4, ARROW, axisX, 0, axisX + 4, ARROW]}
      stroke={s.axisColor}
      strokeWidth={1.5}
      closed={false}
      listening={false}
    />
  );

  // Axis labels
  if (s.showAxisLabels) {
    elements.push(
      <Text
        key="x-label"
        x={width - 6}
        y={axisY + 6}
        text={s.xLabel}
        fontSize={12}
        fontFamily="Arial"
        fontStyle="italic"
        fill={s.axisColor}
        listening={false}
      />,
      <Text
        key="y-label"
        x={axisX + 6}
        y={4}
        text={s.yLabel}
        fontSize={12}
        fontFamily="Arial"
        fontStyle="italic"
        fill={s.axisColor}
        listening={false}
      />
    );
  }

  if (!s.showAxisNumbers) return <>{elements}</>;

  // X axis numbers & ticks
  for (
    let x = Math.ceil(s.xMin / s.xStep) * s.xStep;
    x <= s.xMax + 1e-9;
    x += s.xStep
  ) {
    if (Math.abs(x) < 1e-9) continue; // skip 0
    const { px } = toPixel(x, 0);
    const label = formatNum(x);

    elements.push(
      <Line
        key={`xt-${x}`}
        points={[px, axisY - TICK, px, axisY + TICK]}
        stroke={s.axisColor}
        strokeWidth={1}
        listening={false}
      />,
      <Text
        key={`xn-${x}`}
        x={px - 12}
        y={axisY + NUM_OFFSET}
        text={label}
        fontSize={10}
        fontFamily="Arial"
        fill={s.axisColor}
        align="center"
        width={24}
        listening={false}
      />
    );
  }

  // Y axis numbers & ticks
  for (
    let y = Math.ceil(s.yMin / s.yStep) * s.yStep;
    y <= s.yMax + 1e-9;
    y += s.yStep
  ) {
    if (Math.abs(y) < 1e-9) continue;
    const { py } = toPixel(0, y);
    const label = formatNum(y);

    elements.push(
      <Line
        key={`yt-${y}`}
        points={[axisX - TICK, py, axisX + TICK, py]}
        stroke={s.axisColor}
        strokeWidth={1}
        listening={false}
      />,
      <Text
        key={`yn-${y}`}
        x={axisX - NUM_OFFSET - 20}
        y={py - 6}
        text={label}
        fontSize={10}
        fontFamily="Arial"
        fill={s.axisColor}
        align="right"
        width={20}
        listening={false}
      />
    );
  }

  // Origin label
  elements.push(
    <Text
      key="origin"
      x={axisX - 14}
      y={axisY + NUM_OFFSET}
      text="O"
      fontSize={10}
      fontFamily="Arial"
      fill={s.axisColor}
      listening={false}
    />
  );

  return <>{elements}</>;
}

function formatNum(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}
