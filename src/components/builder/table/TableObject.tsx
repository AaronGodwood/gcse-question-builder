import { Group, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { TableObject as TableObjectType } from '@/types/canvas';

interface Props {
  table: TableObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<TableObjectType>) => void;
}

export function TableObject({ table, isSelected, onSelect, onChange }: Props) {
  const { rows, cols, cells, colWidths, rowHeight, style } = table;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const totalW = colWidths.reduce((s, w) => s + w, 0);
  const totalH = rows * rowHeight;

  // Compute x offset for each column
  const colX: number[] = [];
  let cx = 0;
  for (const cw of colWidths) { colX.push(cx); cx += cw; }

  return (
    <Group
      id={table.id}
      x={table.x}
      y={table.y}
      rotation={table.rotation}
      scaleX={table.scaleX}
      scaleY={table.scaleY}
      draggable={!table.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
    >
      {/* Cell backgrounds + text */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cell = cells[r]?.[c];
          const x = colX[c];
          const y = r * rowHeight;
          const cw = colWidths[c];
          const shaded =
            cell?.shaded ||
            (style.headerRow && r === 0) ||
            (style.headerCol && c === 0);

          return (
            <Group key={`${r}-${c}`}>
              <Rect
                x={x} y={y}
                width={cw} height={rowHeight}
                fill={shaded ? '#d0d0d0' : '#ffffff'}
                listening={false}
              />
              <Text
                x={x + 4} y={y}
                width={cw - 8} height={rowHeight}
                text={cell?.content ?? ''}
                fontSize={style.fontSize}
                fontFamily={style.fontFamily}
                fontStyle={cell?.bold ? 'bold' : 'normal'}
                align={cell?.align ?? 'center'}
                verticalAlign="middle"
                fill="#000000"
                listening={false}
              />
            </Group>
          );
        })
      )}

      {/* Grid lines */}
      {/* Outer border */}
      <Rect
        x={0} y={0}
        width={totalW} height={totalH}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        fill="transparent"
        listening={false}
      />
      {/* Internal horizontal lines */}
      {Array.from({ length: rows - 1 }, (_, r) => (
        <Line
          key={`hr-${r}`}
          points={[0, (r + 1) * rowHeight, totalW, (r + 1) * rowHeight]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth * 0.75}
          listening={false}
        />
      ))}
      {/* Internal vertical lines */}
      {Array.from({ length: cols - 1 }, (_, c) => (
        <Line
          key={`vc-${c}`}
          points={[colX[c + 1], 0, colX[c + 1], totalH]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth * 0.75}
          listening={false}
        />
      ))}

      {/* Selection highlight */}
      {isSelected && (
        <Rect
          x={0} y={0}
          width={totalW} height={totalH}
          stroke="#0096ff"
          strokeWidth={2}
          dash={[4, 3]}
          fill="transparent"
          listening={false}
        />
      )}

      {/* Invisible hit area */}
      <Rect x={0} y={0} width={totalW} height={totalH} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
