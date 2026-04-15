import { useRef } from 'react';
import { Text, Group } from 'react-konva';
import type Konva from 'konva';
import type { TextObject as TextObjectType } from '@/types/canvas';
import { hasLatex } from '@/lib/latex';
import { LatexLabel } from '@/components/builder/LatexLabel';

interface Props {
  obj: TextObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<TextObjectType>) => void;
}

export function TextObject({ obj, onSelect, onChange }: Props) {
  const textRef = useRef<Konva.Text>(null);
  const groupRef = useRef<Konva.Group>(null);

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

  const fontStyle = `${obj.fontStyle === 'italic' ? 'italic ' : ''}${obj.fontWeight === 'bold' ? 'bold' : 'normal'}`;

  if (hasLatex(obj.content)) {
    return (
      <Group
        ref={groupRef}
        x={obj.x}
        y={obj.y}
        rotation={obj.rotation}
        draggable={!obj.locked}
        onClick={onSelect}
        onDragEnd={handleDragEnd}
      >
        <LatexLabel
          x={0}
          y={0}
          text={obj.content}
          fontSize={obj.fontSize}
          fontFamily={obj.fontFamily}
          fontStyle={fontStyle}
          fill={obj.fill}
          align={obj.textAlign}
          width={obj.width}
        />
      </Group>
    );
  }

  return (
    <Group>
      <Text
        ref={textRef}
        x={obj.x}
        y={obj.y}
        text={obj.content}
        fontSize={obj.fontSize}
        fontFamily={obj.fontFamily}
        fontStyle={fontStyle}
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
