import { Group, Line, Circle as KonvaCircle, Arc, Text } from 'react-konva';
import type Konva from 'konva';
import type { CircleDiagramObject as CircleDiagramObjectType, CircleDiagramPoint } from '@/types/canvas';
import { tickMarkPoints } from '@/lib/shapeGeometry';

const LABEL_PAD = 24;

interface Props {
  diagram: CircleDiagramObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<CircleDiagramObjectType>) => void;
}

function pointToPixel(
  pt: CircleDiagramPoint,
  cx: number, cy: number, r: number,
): { px: number; py: number } {
  if (pt.position === 'centre') return { px: cx, py: cy };
  if (pt.position === 'circumference') {
    const rad = ((pt.angleDeg - 90) * Math.PI) / 180;
    return { px: cx + r * Math.cos(rad), py: cy + r * Math.sin(rad) };
  }
  return { px: cx + (pt.externalX ?? 0), py: cy + (pt.externalY ?? 0) };
}

function labelOffset(
  px: number, py: number,
  cx: number, cy: number,
  position: CircleDiagramPoint['position'],
): { dx: number; dy: number } {
  if (position === 'centre') return { dx: 8, dy: -14 };
  const dx = px - cx, dy = py - cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { dx: (dx / len) * 16, dy: (dy / len) * 16 };
}

export function CircleDiagramObject({ diagram, isSelected, onSelect, onChange }: Props) {
  const cx = diagram.radius + LABEL_PAD;
  const cy = diagram.radius + LABEL_PAD;
  const r = diagram.radius;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  // Build pixel map for all points
  const pixelMap: Record<string, { px: number; py: number }> = {};
  for (const pt of diagram.points) {
    pixelMap[pt.id] = pointToPixel(pt, cx, cy, r);
  }

  const { stroke, strokeWidth, fill } = diagram.style;

  return (
    <Group
      id={diagram.id}
      x={diagram.x}
      y={diagram.y}
      rotation={diagram.rotation}
      scaleX={diagram.scaleX}
      scaleY={diagram.scaleY}
      draggable={!diagram.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
    >
      {/* 1. Circle */}
      <KonvaCircle
        x={cx} y={cy} radius={r}
        fill={fill === 'transparent' ? undefined : fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        listening={false}
      />

      {/* 2. Line segments */}
      {diagram.lines.map((line) => {
        const from = pixelMap[line.fromPointId];
        const to   = pixelMap[line.toPointId];
        if (!from || !to) return null;
        return (
          <Line
            key={line.id}
            points={[from.px, from.py, to.px, to.py]}
            stroke={stroke}
            strokeWidth={strokeWidth}
            dash={line.style === 'dashed' ? [6, 3] : undefined}
            listening={false}
          />
        );
      })}

      {/* 3. Equal-tick marks */}
      {diagram.lines
        .filter((l) => l.equalTickGroup !== null)
        .map((line) => {
          const from = pixelMap[line.fromPointId];
          const to   = pixelMap[line.toPointId];
          if (!from || !to) return null;
          const ticks = tickMarkPoints(
            { x: from.px, y: from.py },
            { x: to.px,   y: to.py   },
            line.equalTickGroup!,
          );
          return ticks.map((pts, ti) => (
            <Line
              key={`${line.id}-tick-${ti}`}
              points={pts}
              stroke={stroke}
              strokeWidth={strokeWidth}
              listening={false}
            />
          ));
        })}

      {/* 4. Angle arcs + labels */}
      {diagram.angles.map((ang) => {
        const vertex = pixelMap[ang.vertexPointId];
        const from   = pixelMap[ang.fromPointId];
        const to     = pixelMap[ang.toPointId];
        if (!vertex || !from || !to) return null;

        const toPrev = { x: from.px - vertex.px, y: from.py - vertex.py };
        const toNext = { x: to.px   - vertex.px, y: to.py   - vertex.py };

        const anglePrev = (Math.atan2(toPrev.y, toPrev.x) * 180) / Math.PI;
        const angleNext = (Math.atan2(toNext.y, toNext.x) * 180) / Math.PI;

        let sweep = angleNext - anglePrev;
        if (sweep < 0) sweep += 360;
        if (sweep > 180) sweep -= 360;

        const arcR = 18;
        const bisectorAngle = anglePrev + sweep / 2;
        const bisRad = (bisectorAngle * Math.PI) / 180;
        const labelDist = arcR + 10;

        return (
          <Group key={ang.id}>
            {ang.showArc && (
              <Arc
                x={vertex.px} y={vertex.py}
                innerRadius={arcR} outerRadius={arcR}
                angle={Math.abs(sweep)}
                rotation={sweep >= 0 ? anglePrev : anglePrev + sweep}
                stroke="#000"
                strokeWidth={1.2}
                fill="transparent"
                listening={false}
              />
            )}
            {ang.showLabel && ang.label && (
              <Text
                x={vertex.px + Math.cos(bisRad) * labelDist - 14}
                y={vertex.py + Math.sin(bisRad) * labelDist - 7}
                text={ang.label}
                fontSize={11}
                fontFamily="Arial"
                fill="#000"
                align="center"
                width={28}
                listening={false}
              />
            )}
          </Group>
        );
      })}

      {/* 5. Point labels */}
      {diagram.points.map((pt) => {
        const { px, py } = pixelMap[pt.id];
        const { dx, dy } = labelOffset(px, py, cx, cy, pt.position);
        return (
          <Text
            key={`lbl-${pt.id}`}
            x={px + dx - 7}
            y={py + dy - 7}
            text={pt.label}
            fontSize={12}
            fontFamily="Arial"
            fontStyle="bold"
            fill="#000"
            listening={false}
          />
        );
      })}

      {/* 6. Point dots */}
      {diagram.points.map((pt) => {
        const { px, py } = pixelMap[pt.id];
        return (
          <KonvaCircle
            key={`dot-${pt.id}`}
            x={px} y={py}
            radius={3}
            fill="#000"
            listening={false}
          />
        );
      })}

      {/* 7. Not to scale */}
      {diagram.notToScale && (
        <Text
          x={0} y={diagram.height + 4}
          text="Diagram NOT accurately drawn"
          fontSize={9}
          fontFamily="Arial"
          fontStyle="italic"
          fill="#555"
          width={diagram.width}
          align="center"
          listening={false}
        />
      )}

      {/* 8. Selection highlight */}
      {isSelected && (
        <KonvaCircle
          x={cx} y={cy}
          radius={r + 6}
          stroke="#0096ff"
          strokeWidth={2}
          dash={[4, 3]}
          fill={undefined}
          listening={false}
        />
      )}

      {/* 9. Invisible hit area */}
      <KonvaCircle
        x={cx} y={cy}
        radius={r}
        fill="rgba(0,0,0,0)"
        stroke="transparent"
        strokeWidth={12}
      />
    </Group>
  );
}
