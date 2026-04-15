import { Group, Circle, Rect } from 'react-konva';
import { LatexLabel } from '@/components/builder/LatexLabel';
import type Konva from 'konva';
import type { VennDiagramObject as VennDiagramObjectType } from '@/types/canvas';

interface Props {
  obj: VennDiagramObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<VennDiagramObjectType>) => void;
}

export function VennDiagramObject({ obj, isSelected, onSelect, onChange }: Props) {
  const { circleA, circleB, regionLabels, universalSet, style } = obj;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const W = obj.width;
  const H = obj.height;
  const { stroke, strokeWidth, fontSize } = style;

  // Compute approximate region label positions
  // A-only region: left part of A not overlapping B
  const aOnlyX = circleA.x - circleA.r * 0.55;
  const aOnlyY = circleA.y;

  // B-only region: right part of B not overlapping A
  const bOnlyX = circleB.x + circleB.r * 0.55;
  const bOnlyY = circleB.y;

  // Intersection: midpoint between centres
  const interX = (circleA.x + circleB.x) / 2;
  const interY = (circleA.y + circleB.y) / 2;

  // Outside region: top-left corner
  const outsideX = 12;
  const outsideY = 14;

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
      {/* Universal set border */}
      <Rect
        x={2}
        y={2}
        width={W - 4}
        height={H - 4}
        stroke={stroke}
        strokeWidth={strokeWidth * 0.75}
        fill="transparent"
        listening={false}
      />

      {/* Universal set label (ξ) */}
      {universalSet.show && (
        <LatexLabel
          x={6}
          y={6}
          text={universalSet.label}
          fontSize={fontSize + 2}
          fontFamily="Arial"
          fontStyle="italic"
          fill={stroke}
          listening={false}
        />
      )}

      {/* Circle A fill */}
      <Circle
        x={circleA.x}
        y={circleA.y}
        radius={circleA.r}
        fill={circleA.color}
        opacity={circleA.opacity}
        listening={false}
      />

      {/* Circle B fill */}
      <Circle
        x={circleB.x}
        y={circleB.y}
        radius={circleB.r}
        fill={circleB.color}
        opacity={circleB.opacity}
        listening={false}
      />

      {/* Circle A outline */}
      <Circle
        x={circleA.x}
        y={circleA.y}
        radius={circleA.r}
        fill="transparent"
        stroke={stroke}
        strokeWidth={strokeWidth}
        listening={false}
      />

      {/* Circle B outline */}
      <Circle
        x={circleB.x}
        y={circleB.y}
        radius={circleB.r}
        fill="transparent"
        stroke={stroke}
        strokeWidth={strokeWidth}
        listening={false}
      />

      {/* Circle A label */}
      <LatexLabel
        x={circleA.x - circleA.r}
        y={circleA.y - circleA.r - fontSize - 4}
        width={circleA.r * 2}
        text={circleA.label}
        fontSize={fontSize}
        fontFamily="Arial"
        fontStyle="italic bold"
        fill={stroke}
        align="center"
        listening={false}
      />

      {/* Circle B label */}
      <LatexLabel
        x={circleB.x - circleB.r}
        y={circleB.y - circleB.r - fontSize - 4}
        width={circleB.r * 2}
        text={circleB.label}
        fontSize={fontSize}
        fontFamily="Arial"
        fontStyle="italic bold"
        fill={stroke}
        align="center"
        listening={false}
      />

      {/* Region labels */}
      {regionLabels.aOnly.show && regionLabels.aOnly.text && (
        <LatexLabel
          x={aOnlyX - 24}
          y={aOnlyY - fontSize / 2}
          width={48}
          text={regionLabels.aOnly.text}
          fontSize={fontSize}
          fontFamily="Arial"
          fill={stroke}
          align="center"
          listening={false}
        />
      )}
      {regionLabels.intersection.show && regionLabels.intersection.text && (
        <LatexLabel
          x={interX - 24}
          y={interY - fontSize / 2}
          width={48}
          text={regionLabels.intersection.text}
          fontSize={fontSize}
          fontFamily="Arial"
          fill={stroke}
          align="center"
          listening={false}
        />
      )}
      {regionLabels.bOnly.show && regionLabels.bOnly.text && (
        <LatexLabel
          x={bOnlyX - 24}
          y={bOnlyY - fontSize / 2}
          width={48}
          text={regionLabels.bOnly.text}
          fontSize={fontSize}
          fontFamily="Arial"
          fill={stroke}
          align="center"
          listening={false}
        />
      )}
      {regionLabels.outside.show && regionLabels.outside.text && (
        <LatexLabel
          x={outsideX}
          y={outsideY + fontSize + 4}
          text={regionLabels.outside.text}
          fontSize={fontSize}
          fontFamily="Arial"
          fill={stroke}
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

      {/* Invisible hit area */}
      <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
