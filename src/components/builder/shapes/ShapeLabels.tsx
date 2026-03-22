import { Text, Line, Arc } from 'react-konva';
import {
  centroid,
  flattenPoints,
  getShapePoints,
  midpoint,
  outwardNormal,
  rightAngleMarkerPoints,
} from '@/lib/shapeGeometry';
import type { ShapeObject } from '@/types/canvas';

interface Props {
  shape: ShapeObject;
}

const THREED_TYPES = ['cuboid', 'cone', 'frustum', 'cylinder', 'triangular-prism'];

export function ShapeLabels({ shape }: Props) {
  const { shapeType, width, height, dimensions, annotations } = shape;
  // 3D shapes handle their own labels inside ThreeDShape
  if (THREED_TYPES.includes(shapeType)) return null;
  const pts = getShapePoints(shapeType, width, height);
  if (pts.length < 2) return null;

  const c = centroid(pts);
  const elements: React.ReactNode[] = [];

  // Side labels
  dimensions.sides.forEach((side, i) => {
    if (!side.showLabel || !side.label) return;
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (!a || !b) return;
    const pos = outwardNormal(a, b, c, 18);
    elements.push(
      <Text
        key={`side-${side.id}`}
        x={pos.x - 20}
        y={pos.y - 8}
        text={side.label}
        fontSize={11}
        fontFamily="Arial"
        fill="#000"
        align="center"
        width={40}
      />
    );
  });

  // Angle arcs + labels
  dimensions.angles.forEach((angle, i) => {
    if (!angle.showArc && !angle.showLabel) return;
    const vertex = pts[i];
    if (!vertex) return;
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];
    if (!prev || !next) return;

    const toPrev = { x: prev.x - vertex.x, y: prev.y - vertex.y };
    const toNext = { x: next.x - vertex.x, y: next.y - vertex.y };
    const lenPrev = Math.sqrt(toPrev.x ** 2 + toPrev.y ** 2) || 1;
    const lenNext = Math.sqrt(toNext.x ** 2 + toNext.y ** 2) || 1;

    const anglePrev = (Math.atan2(toPrev.y, toPrev.x) * 180) / Math.PI;
    const angleNext = (Math.atan2(toNext.y, toNext.x) * 180) / Math.PI;

    let sweep = angleNext - anglePrev;
    if (sweep < 0) sweep += 360;
    if (sweep > 180) sweep -= 360;

    const arcR = Math.min(lenPrev, lenNext, 20) * 0.4 + 8;

    if (angle.showArc) {
      elements.push(
        <Arc
          key={`arc-${angle.id}`}
          x={vertex.x}
          y={vertex.y}
          innerRadius={arcR}
          outerRadius={arcR}
          angle={Math.abs(sweep)}
          rotation={sweep >= 0 ? anglePrev : anglePrev + sweep}
          stroke="#000"
          strokeWidth={1.2}
          fill="transparent"
          listening={false}
        />
      );
    }

    if (angle.showLabel && angle.label) {
      const bisectorAngle = anglePrev + sweep / 2;
      const bisRad = (bisectorAngle * Math.PI) / 180;
      const labelDist = arcR + 10;
      elements.push(
        <Text
          key={`anglabel-${angle.id}`}
          x={vertex.x + Math.cos(bisRad) * labelDist - 14}
          y={vertex.y + Math.sin(bisRad) * labelDist - 7}
          text={angle.label}
          fontSize={10}
          fontFamily="Arial"
          fill="#000"
          align="center"
          width={28}
          listening={false}
        />
      );
    }
  });

  // Right angle markers
  annotations.rightAngleMarkers.forEach((vertexIdx) => {
    const vertex = pts[vertexIdx];
    const prev = pts[(vertexIdx - 1 + pts.length) % pts.length];
    const next = pts[(vertexIdx + 1) % pts.length];
    if (!vertex || !prev || !next) return;
    const markerPts = rightAngleMarkerPoints(vertex, prev, next, 10);
    elements.push(
      <Line
        key={`ra-${vertexIdx}`}
        points={markerPts}
        stroke="#000"
        strokeWidth={1.5}
        closed={false}
        listening={false}
      />
    );
  });

  // Not to scale label
  if (shape.notToScale) {
    elements.push(
      <Text
        key="nts"
        x={0}
        y={height + 6}
        text="Diagram NOT accurately drawn"
        fontSize={9}
        fontFamily="Arial"
        fontStyle="italic"
        fill="#555"
        width={width}
        align="center"
      />
    );
  }

  // Equal side markers (tick marks)
  Object.entries(annotations.equalSideMarkers).forEach(([sideId, tickCount]) => {
    const idx = dimensions.sides.findIndex((s) => s.id === sideId);
    if (idx < 0) return;
    const a = pts[idx];
    const b = pts[(idx + 1) % pts.length];
    if (!a || !b) return;
    const mid = midpoint(a, b);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const tickSize = 5;
    for (let t = 0; t < (tickCount as number); t++) {
      const offset = (t - ((tickCount as number) - 1) / 2) * 5;
      const tx = mid.x + (dx / len) * offset;
      const ty = mid.y + (dy / len) * offset;
      elements.push(
        <Line
          key={`tick-${sideId}-${t}`}
          points={[
            tx + nx * tickSize, ty + ny * tickSize,
            tx - nx * tickSize, ty - ny * tickSize,
          ]}
          stroke="#000"
          strokeWidth={1.5}
          listening={false}
        />
      );
    }
  });

  return <>{elements}</>;
}

// Re-export flattenPoints for use in shape renderers
export { flattenPoints };
