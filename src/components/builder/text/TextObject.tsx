import { useRef } from 'react';
import { Text, Group } from 'react-konva';
import type Konva from 'konva';
import type { TextObject as TextObjectType } from '@/types/canvas';

interface Props {
  obj: TextObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<TextObjectType>) => void;
}

export function TextObject({ obj, onSelect, onChange }: Props) {
  const textRef = useRef<Konva.Text>(null);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = () => {
    if (!textRef.current) return;
    const node = textRef.current;
    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(50, node.width() * node.scaleX()),
      scaleX: 1,
      scaleY: 1,
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  return (
    <Group>
      <Text
        ref={textRef}
        x={obj.x}
        y={obj.y}
        text={obj.content}
        fontSize={obj.fontSize}
        fontFamily={obj.fontFamily}
        fontStyle={`${obj.fontStyle === 'italic' ? 'italic ' : ''}${obj.fontWeight === 'bold' ? 'bold' : 'normal'}`}
        align={obj.textAlign}
        fill={obj.fill}
        width={obj.width}
        rotation={obj.rotation}
        draggable={!obj.locked}
        onClick={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
    </Group>
  );
}
