import { Group, Rect, Line, Text, Arc, Arrow } from 'react-konva';
import type Konva from 'konva';
import type { BearingObject as BearingObjectType } from '@/types/canvas';

interface Props {
  obj: BearingObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<BearingObjectType>) => void;
}

export function BearingObject({ obj, isSelected, onSelect, onChange }: Props) {
  const { bearing, showNorthLine, showBearingLine, showArc, showLabel, northLabel, bearingLabel, arcRadius, style } = obj;
  const W = obj.width;
  const H = obj.height;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>
    onChange({ x: e.target.x(), y: e.target.y() });

  // Origin point — lower-centre so the North line has room above
  const cx = W / 2;
  const cy = H * 0.55;

  // North line extends upward
  const northLen = cy - 12;
  // Bearing line length
  const bearingLen = Math.min(W, H) * 0.38;

  // Bearing angle: 0° = North (up), clockwise
  const bearingRad = ((bearing - 90) * Math.PI) / 180;
  const bx = cx + Math.cos(bearingRad) * bearingLen;
  const by = cy + Math.sin(bearingRad) * bearingLen;

  // Arc: Konva Arc rotation=0 starts at 3 o'clock. We want it from North (12 o'clock = -90°).
  // rotation=-90 rotates the start to 12 o'clock, angle=bearing sweeps clockwise.
  const label = bearingLabel || `${String(bearing).padStart(3, '0')}°`;

  // Arc label positioned at mid-angle, outside the arc radius
  const midBearingRad = ((bearing / 2 - 90) * Math.PI) / 180;
  const labelR = arcRadius + 14;
  const labelX = cx + Math.cos(midBearingRad) * labelR;
  const labelY = cy + Math.sin(midBearingRad) * labelR;

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
      {/* North line with arrowhead */}
      {showNorthLine && (
        <Arrow
          points={[cx, cy, cx, cy - northLen]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          fill={style.stroke}
          pointerLength={7}
          pointerWidth={6}
          listening={false}
        />
      )}

      {/* North label */}
      {showNorthLine && (
        <Text
          x={cx - 12}
          y={cy - northLen - style.fontSize - 4}
          width={24}
          text={northLabel}
          fontSize={style.fontSize + 1}
          fontFamily="Arial"
          fontStyle="bold"
          fill={style.stroke}
          align="center"
          listening={false}
        />
      )}

      {/* Bearing line */}
      {showBearingLine && (
        <Line
          points={[cx, cy, bx, by]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          listening={false}
        />
      )}

      {/* Angle arc — swept clockwise from North */}
      {showArc && bearing > 0 && (
        <Arc
          x={cx}
          y={cy}
          innerRadius={0}
          outerRadius={arcRadius}
          angle={bearing}
          rotation={-90}     // start at 12 o'clock
          fill="rgba(0,0,0,0.06)"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth * 0.75}
          listening={false}
        />
      )}

      {/* Bearing label at mid-arc */}
      {showLabel && bearing > 0 && (
        <Text
          x={labelX - 20}
          y={labelY - style.fontSize / 2}
          width={40}
          text={label}
          fontSize={style.fontSize}
          fontFamily="Arial"
          fill={style.stroke}
          align="center"
          listening={false}
        />
      )}

      {/* Origin dot */}
      <Line
        points={[cx - 3, cy, cx + 3, cy]}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        listening={false}
      />
      <Line
        points={[cx, cy - 3, cx, cy + 3]}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        listening={false}
      />

      {isSelected && (
        <Rect x={0} y={0} width={W} height={H} stroke="#0096ff" strokeWidth={1.5} dash={[4, 3]} fill="transparent" listening={false} />
      )}
      <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
