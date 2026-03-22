import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { MarkBoxObject } from '@/types/canvas';

interface Props {
  obj: MarkBoxObject;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<MarkBoxObject>) => void;
}

export function MarkBox({ obj, isSelected, onSelect, onChange }: Props) {
  const label = `${obj.marks} mark${obj.marks !== 1 ? 's' : ''}`;
  const w = obj.width;
  const h = obj.height;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  return (
    <Group
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      draggable={!obj.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={w}
        height={h}
        stroke={isSelected ? '#0096ff' : '#000'}
        strokeWidth={isSelected ? 2 : 1.5}
        fill="white"
        cornerRadius={2}
      />
      <Text
        x={0}
        y={0}
        width={w}
        height={h}
        text={label}
        fontSize={11}
        fontFamily="Arial"
        fill="#000"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
}
