import { Group, Rect, Line, Text, Arrow } from 'react-konva';
import type Konva from 'konva';
import type { BarChartObject as BarChartObjectType } from '@/types/canvas';

interface Props {
  obj: BarChartObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<BarChartObjectType>) => void;
}

// All padding kept inside [0,W]×[0,H] — no negative coordinates.
// PAD_LEFT must fit: y-label font + gap + widest tick number.
const PAD_LEFT   = 52;
const PAD_BOTTOM = 42;
const PAD_TOP    = 14;
const PAD_RIGHT  = 14;

export function BarChartObject({ obj, isSelected, onSelect, onChange }: Props) {
  const { bars, mode, xLabel, yLabel, yMax, showValues, barColor, style } = obj;
  const W = obj.width;
  const H = obj.height;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>
    onChange({ x: e.target.x(), y: e.target.y() });

  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const originX = PAD_LEFT;
  const originY = PAD_TOP + plotH;

  const maxVal = yMax ?? Math.max(...bars.map((b) => b.value), 1);
  const toY = (v: number) => originY - (v / maxVal) * plotH;

  // Nice y-axis tick interval
  const rawStep = maxVal / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const niceStep  = Math.ceil(rawStep / magnitude) * magnitude || 1;
  const yTicks: number[] = [];
  for (let v = 0; v <= maxVal + niceStep * 0.5; v += niceStep) yTicks.push(v);

  const gap   = mode === 'bar' ? 0.18 : 0;
  const slotW = bars.length > 0 ? plotW / bars.length : 20;
  const barW  = slotW * (1 - gap);

  // Rotated y-label: rotation=-90 means the text runs bottom→top.
  // After rotation the text box's left edge maps to the *bottom* on screen,
  // and its y value maps to how far right (in screen coords) the text sits.
  // We want the label centred vertically over the plot area and
  // positioned at the very left of the bounding box (y ≈ 0).
  const plotCentreY = PAD_TOP + plotH / 2;

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
      {/* Y-axis label — Group rotates around (0, plotCentreY) so all coords stay >= 0 */}
      {yLabel && (
        <Group x={0} y={plotCentreY} rotation={-90} listening={false}>
          <Text
            x={-plotH / 2}
            y={2}
            width={plotH}
            text={yLabel}
            fontSize={style.fontSize}
            fontFamily="Arial"
            fill={style.axisColor}
            align="center"
            listening={false}
          />
        </Group>
      )}

      {/* Y-axis ticks, numbers, grid lines */}
      {yTicks.map((v) => {
        const ty = toY(v);
        return (
          <Group key={`yt-${v}`}>
            <Line
              points={[originX - 4, ty, originX, ty]}
              stroke={style.axisColor}
              strokeWidth={style.strokeWidth * 0.75}
              listening={false}
            />
            <Text
              x={style.fontSize + 4}
              y={ty - style.fontSize / 2}
              width={originX - style.fontSize - 10}
              text={String(v)}
              fontSize={style.fontSize}
              fontFamily="Arial"
              fill={style.axisColor}
              align="right"
              listening={false}
            />
            <Line
              points={[originX, ty, originX + plotW, ty]}
              stroke="#e5e7eb"
              strokeWidth={0.8}
              listening={false}
            />
          </Group>
        );
      })}

      {/* Bars + x-axis tick labels */}
      {bars.map((bar, i) => {
        const bx = originX + i * slotW + slotW * gap * 0.5;
        const by = toY(bar.value);
        const bh = originY - by;
        const fill = bar.color || barColor;
        return (
          <Group key={bar.id}>
            <Rect
              x={bx}
              y={by}
              width={barW}
              height={bh}
              fill={fill}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              listening={false}
            />
            <Text
              x={originX + i * slotW}
              y={originY + 5}
              width={slotW}
              text={bar.label}
              fontSize={style.fontSize}
              fontFamily="Arial"
              fill={style.axisColor}
              align="center"
              listening={false}
            />
            {showValues && (
              <Text
                x={bx}
                y={by - style.fontSize - 2}
                width={barW}
                text={String(bar.value)}
                fontSize={style.fontSize}
                fontFamily="Arial"
                fill={style.axisColor}
                align="center"
                listening={false}
              />
            )}
          </Group>
        );
      })}

      {/* Y-axis arrow */}
      <Arrow
        points={[originX, originY, originX, PAD_TOP]}
        stroke={style.axisColor}
        strokeWidth={style.strokeWidth}
        fill={style.axisColor}
        pointerLength={6}
        pointerWidth={5}
        listening={false}
      />

      {/* X-axis arrow */}
      <Arrow
        points={[originX, originY, originX + plotW + 8, originY]}
        stroke={style.axisColor}
        strokeWidth={style.strokeWidth}
        fill={style.axisColor}
        pointerLength={6}
        pointerWidth={5}
        listening={false}
      />

      {/* X-axis label */}
      {xLabel && (
        <Text
          x={originX}
          y={H - style.fontSize - 2}
          width={plotW}
          text={xLabel}
          fontSize={style.fontSize}
          fontFamily="Arial"
          fill={style.axisColor}
          align="center"
          listening={false}
        />
      )}

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

      {/* Hit area */}
      <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
