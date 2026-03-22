import { useRef, useEffect } from 'react';
import { Group, Rect } from 'react-konva';
import type Konva from 'konva';
import type { GraphObject as GraphObjectType } from '@/types/canvas';
import { GridRenderer } from './GridRenderer';
import { AxisRenderer } from './AxisRenderer';
import { PlotRenderer } from './PlotRenderer';
import { PointsRenderer } from './PointsRenderer';

interface Props {
  graph: GraphObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<GraphObjectType>) => void;
}

export function GraphObject({ graph, isSelected, onSelect, onChange }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const { graphSettings: s } = graph;
  const w = graph.width;
  const h = graph.height;

  const PAD = 30;
  const innerW = w - PAD * 1.5;
  const innerH = h - PAD * 1.5;

  const toPixel = (gx: number, gy: number) => ({
    px: PAD + ((gx - s.xMin) / (s.xMax - s.xMin)) * innerW,
    py: PAD + ((s.yMax - gy) / (s.yMax - s.yMin)) * innerH,
  });

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  // When the Transformer resizes this group, convert the Konva-level scale back
  // into real width/height values so the graph re-renders at the new size.
  // We use `w` and `h` from the store (captured in this render) rather than
  // node.width() which returns an unreliable bounding-box value for Groups.
  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;
    const newW = Math.max(80, Math.round(w * node.scaleX()));
    const newH = Math.max(80, Math.round(h * node.scaleY()));
    // Reset Konva-level scale so it doesn't compound on the next transform
    node.scaleX(1);
    node.scaleY(1);
    onChange({
      x: node.x(),
      y: node.y(),
      width: newW,
      height: newH,
      rotation: node.rotation(),
    });
  };

  // Override getClientRect so the Transformer uses the stored w×h as the
  // bounding box, rather than sampling all children (which can extend far
  // outside the visible area for curves like quadratics).
  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    node.getClientRect = (config?: { skipTransform?: boolean; skipShadow?: boolean; skipStroke?: boolean; relativeTo?: Konva.Container }) => {
      const { x, y } = node.getAbsolutePosition();
      const scaleX = node.getAbsoluteScale().x;
      const scaleY = node.getAbsoluteScale().y;
      if (config?.relativeTo) {
        const rel = config.relativeTo.getAbsolutePosition();
        return { x: x - rel.x, y: y - rel.y, width: w * scaleX, height: h * scaleY };
      }
      if (config?.skipTransform) {
        return { x: 0, y: 0, width: w, height: h };
      }
      return { x, y, width: w * scaleX, height: h * scaleY };
    };
  });

  const bgColor = s.backgroundColor === 'transparent' ? undefined : (s.backgroundColor || 'white');

  return (
    <Group
      ref={groupRef}
      id={graph.id}
      x={graph.x}
      y={graph.y}
      width={w}
      height={h}
      rotation={graph.rotation}
      draggable={!graph.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Background + border — outside clip group so border isn't cut off */}
      <Rect
        x={0} y={0}
        width={w} height={h}
        fill={bgColor}
        stroke={isSelected ? '#0096ff' : '#ccc'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={2}
      />

      {/* Clip inner renderers so plots can't overflow the box */}
      <Group clipFunc={(ctx) => { ctx.rect(0, 0, w, h); }}>
        <GridRenderer graph={graph} toPixel={toPixel} width={w} height={h} />
        <AxisRenderer graph={graph} toPixel={toPixel} width={w} height={h} />
        <PlotRenderer graph={graph} toPixel={toPixel} width={w} height={h} />
        <PointsRenderer graph={graph} toPixel={toPixel} />
      </Group>
    </Group>
  );
}
