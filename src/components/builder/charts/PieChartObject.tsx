import { Group, Rect, Arc, Line } from 'react-konva';
import { LatexLabel } from '@/components/builder/LatexLabel';
import type Konva from 'konva';
import type { PieChartObject as PieChartObjectType } from '@/types/canvas';

interface Props {
  obj: PieChartObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<PieChartObjectType>) => void;
}

export function PieChartObject({ obj, isSelected, onSelect, onChange }: Props) {
  const { slices, showTitle, title, style } = obj;
  const W = obj.width;
  const H = obj.height;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>
    onChange({ x: e.target.x(), y: e.target.y() });

  const titleH = showTitle ? style.fontSize + 8 : 0;
  const cx = W / 2;
  const cy = titleH + (H - titleH) / 2;
  const r = Math.min(W, H - titleH) / 2 - 16;

  // Normalise slice values to degrees (total = 360)
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const toDeg = (v: number) => (total > 0 ? (v / total) * 360 : 0);

  // Build cumulative start angles (Konva Arc: angle=0 is 3 o'clock, rotation rotates the whole group)
  // We'll draw from 12 o'clock (−90°) by applying a -90 rotation to the group
  let cumulative = 0;
  const rendered = slices.map((sl) => {
    const angleDeg = toDeg(sl.value);
    const startDeg = cumulative;
    cumulative += angleDeg;
    return { sl, startDeg, angleDeg };
  });

  return (
    <Group
      id={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      scaleX={obj.scaleX}
      scaleY={obj.scaleY}
      draggable={!obj.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
    >
      {/* Title */}
      {showTitle && (
        <LatexLabel
          x={0}
          y={4}
          width={W}
          text={title}
          fontSize={style.fontSize + 1}
          fontFamily="Arial"
          fontStyle="bold"
          fill={style.stroke}
          align="center"
          listening={false}
        />
      )}

      {/* Pie slices — drawn rotated -90° so 0° = 12 o'clock */}
      <Group x={cx} y={cy} rotation={-90}>
        {rendered.map(({ sl, startDeg, angleDeg }) => (
          <Arc
            key={sl.id}
            innerRadius={0}
            outerRadius={r}
            angle={angleDeg}
            rotation={startDeg}
            fill={sl.color}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            listening={false}
          />
        ))}
      </Group>

      {/* Labels — positioned outside the slice midpoint */}
      {rendered.map(({ sl, startDeg, angleDeg }) => {
        if (!sl.showLabel && !sl.showAngle) return null;
        const midAngleRad = ((startDeg + angleDeg / 2 - 90) * Math.PI) / 180;
        const labelR = r + 16;
        const lx = cx + Math.cos(midAngleRad) * labelR;
        const ly = cy + Math.sin(midAngleRad) * labelR;

        // Small tick line from edge to label
        const edgeX = cx + Math.cos(midAngleRad) * (r + 2);
        const edgeY = cy + Math.sin(midAngleRad) * (r + 2);

        const angleDegRounded = Math.round(toDeg(sl.value));
        const labelParts = [
          sl.showLabel ? sl.label : '',
          sl.showAngle ? `${angleDegRounded}°` : '',
        ].filter(Boolean);
        const labelText = labelParts.join(' ');

        return (
          <Group key={sl.id}>
            <Line
              points={[edgeX, edgeY, lx, ly]}
              stroke={style.stroke}
              strokeWidth={0.8}
              listening={false}
            />
            <LatexLabel
              x={lx - 24}
              y={ly - style.fontSize / 2}
              width={48}
              text={labelText}
              fontSize={style.fontSize}
              fontFamily="Arial"
              fill={style.stroke}
              align="center"
              listening={false}
            />
          </Group>
        );
      })}

      {/* Selection highlight */}
      {isSelected && (
        <Rect x={0} y={0} width={W} height={H} stroke="#0096ff" strokeWidth={1.5} dash={[4, 3]} fill="transparent" listening={false} />
      )}

      {/* Hit area */}
      <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
