import { Group, Line, Circle, Arrow, Rect } from 'react-konva';
import { LatexLabel } from '@/components/builder/LatexLabel';
import type Konva from 'konva';
import type { NumberLineObject as NumberLineObjectType } from '@/types/canvas';

interface Props {
  obj: NumberLineObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<NumberLineObjectType>) => void;
}

export function NumberLineObject({ obj, isSelected, onSelect, onChange }: Props) {
  const { min, max, step, showTicks, showNumbers, leftArrow, rightArrow, markers, regions, style } = obj;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const W = obj.width;
  const H = obj.height;
  const lineY = H / 2;
  const arrowPad = 14; // space for arrowhead at each end
  const lineX0 = arrowPad;
  const lineX1 = W - arrowPad;
  const lineLen = lineX1 - lineX0;

  const range = max - min;

  // Map a numeric value to an x position on the line
  const toX = (v: number) => lineX0 + ((v - min) / range) * lineLen;

  const tickH = 8;
  const { stroke, strokeWidth, fontSize } = style;

  // Build tick positions
  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v = Math.round((v + step) * 1e9) / 1e9) {
    ticks.push(v);
  }

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
      {/* Shaded regions */}
      {regions.map((region) => {
        const rx0 = Math.max(lineX0, toX(region.fromValue));
        const rx1 = Math.min(lineX1, toX(region.toValue));
        if (rx1 <= rx0) return null;
        return (
          <Rect
            key={region.id}
            x={rx0}
            y={lineY - 12}
            width={rx1 - rx0}
            height={24}
            fill={region.color}
            opacity={region.opacity}
            listening={false}
          />
        );
      })}

      {/* Main axis line with arrows */}
      {leftArrow ? (
        <Arrow
          points={[lineX1, lineY, lineX0, lineY]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={stroke}
          pointerLength={8}
          pointerWidth={6}
          listening={false}
        />
      ) : (
        <Line points={[lineX0, lineY, lineX1, lineY]} stroke={stroke} strokeWidth={strokeWidth} listening={false} />
      )}
      {rightArrow && (
        <Arrow
          points={[lineX0, lineY, lineX1, lineY]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={stroke}
          pointerLength={8}
          pointerWidth={6}
          listening={false}
        />
      )}

      {/* Ticks + numbers */}
      {showTicks && ticks.map((v) => {
        const tx = toX(v);
        return (
          <Line
            key={`t-${v}`}
            points={[tx, lineY - tickH, tx, lineY + tickH]}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.75}
            listening={false}
          />
        );
      })}
      {showNumbers && ticks.map((v) => {
        const tx = toX(v);
        const label = Number.isInteger(v) ? String(v) : v.toFixed(1);
        return (
          <LatexLabel
            key={`n-${v}`}
            x={tx - 16}
            y={lineY + tickH + 3}
            width={32}
            text={label}
            fontSize={fontSize}
            fontFamily="Arial"
            fill={stroke}
            align="center"
            listening={false}
          />
        );
      })}

      {/* Markers (open/closed circles) */}
      {markers.map((m) => {
        const mx = toX(m.value);
        return (
          <Group key={m.id}>
            <Circle
              x={mx}
              y={lineY}
              radius={6}
              fill={m.style === 'closed' ? stroke : 'white'}
              stroke={stroke}
              strokeWidth={strokeWidth}
              listening={false}
            />
            {m.showLabel && m.label && (
              <LatexLabel
                x={mx - 20}
                y={lineY - 24}
                width={40}
                text={m.label}
                fontSize={fontSize}
                fontFamily="Arial"
                fill={stroke}
                align="center"
                listening={false}
              />
            )}
          </Group>
        );
      })}

      {/* Selection highlight */}
      {isSelected && (
        <Rect
          x={0}
          y={0}
          width={W}
          height={H}
          stroke="#0096ff"
          strokeWidth={1.5}
          dash={[4, 3]}
          fill="transparent"
          listening={false}
        />
      )}

      {/* Invisible hit area */}
      <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
