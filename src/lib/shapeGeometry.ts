import type { ShapeType } from '@/types/canvas';

export interface Point {
  x: number;
  y: number;
}

/**
 * Given a shape type and bounding box dimensions, return the polygon vertices
 * normalised to (0,0)→(width,height). All shapes are rendered from their
 * declared dimensions, not freeform vertices.
 */
export function getShapePoints(
  shapeType: ShapeType,
  width: number,
  height: number,
  extra?: {
    sectorAngle?: number;          // degrees, for sector
    cutoutW?: number;              // for compound shapes, fraction of width
    cutoutH?: number;              // for compound shapes, fraction of height
  }
): Point[] {
  const w = width;
  const h = height;

  switch (shapeType) {
    case 'rectangle':
    case 'square':
      return [
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: h }, { x: 0, y: h },
      ];

    case 'triangle-right':
      // Right angle at bottom-left: side 0=base, side 1=hypotenuse, side 2=height
      return [
        { x: 0, y: h }, { x: w, y: h }, { x: 0, y: 0 },
      ];

    case 'triangle-isosceles':
      return [
        { x: w / 2, y: 0 }, { x: w, y: h }, { x: 0, y: h },
      ];

    case 'triangle-equilateral': {
      // Equilateral: apex centred, base full width
      const apex_y = h - (w * Math.sqrt(3)) / 2;
      return [
        { x: w / 2, y: Math.max(0, apex_y) },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }

    case 'triangle-scalene':
      // Scalene: apex offset to ~1/3
      return [
        { x: w * 0.3, y: 0 }, { x: w, y: h }, { x: 0, y: h },
      ];

    case 'parallelogram': {
      const offset = w * 0.2;
      return [
        { x: offset, y: 0 }, { x: w, y: 0 },
        { x: w - offset, y: h }, { x: 0, y: h },
      ];
    }

    case 'rhombus':
      return [
        { x: w / 2, y: 0 }, { x: w, y: h / 2 },
        { x: w / 2, y: h }, { x: 0, y: h / 2 },
      ];

    case 'trapezium': {
      const inset = w * 0.2;
      return [
        { x: inset, y: 0 }, { x: w - inset, y: 0 },
        { x: w, y: h }, { x: 0, y: h },
      ];
    }

    case 'l-shape': {
      const cx = extra?.cutoutW ?? 0.5;
      const cy = extra?.cutoutH ?? 0.5;
      return [
        { x: 0, y: 0 }, { x: w * cx, y: 0 },
        { x: w * cx, y: h * cy }, { x: w, y: h * cy },
        { x: w, y: h }, { x: 0, y: h },
      ];
    }

    case 't-shape': {
      const armW = extra?.cutoutW ?? 0.3;
      const armH = extra?.cutoutH ?? 0.5;
      const leftX = (w - w * armW) / 2;
      const rightX = leftX + w * armW;
      return [
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: h * armH }, { x: rightX, y: h * armH },
        { x: rightX, y: h }, { x: leftX, y: h },
        { x: leftX, y: h * armH }, { x: 0, y: h * armH },
      ];
    }

    case 'compound-step': {
      const cx = extra?.cutoutW ?? 0.5;
      const cy = extra?.cutoutH ?? 0.5;
      return [
        { x: 0, y: 0 }, { x: w * cx, y: 0 },
        { x: w * cx, y: h * cy }, { x: w, y: h * cy },
        { x: w, y: h }, { x: 0, y: h },
      ];
    }

    // ── 3D solids — return silhouette polygon (for hit-testing / selection only)
    // Actual rendering is handled by ThreeDShape in ShapeObject.tsx
    case 'cuboid': {
      const ox = w * 0.30, oy = h * 0.27;
      const fw = w - ox;
      return [
        { x: 0, y: h },          // FL_b
        { x: fw, y: h },         // FR_b
        { x: w, y: h - oy },     // BR_b
        { x: w, y: 0 },          // BR_t
        { x: ox, y: 0 },         // BL_t
        { x: 0, y: oy },         // FL_t
      ];
    }

    case 'cone':
      return [
        { x: w / 2, y: 0 },   // apex
        { x: 0, y: h },        // baseL
        { x: w, y: h },        // baseR
      ];

    case 'frustum': {
      const topRx = w * 0.28;
      return [
        { x: w / 2 - topRx, y: h * 0.18 },  // topL
        { x: w / 2 + topRx, y: h * 0.18 },  // topR
        { x: w, y: h * 0.82 },               // botR
        { x: 0, y: h * 0.82 },               // botL
      ];
    }

    case 'cylinder':
      return [
        { x: 0, y: h * 0.18 },  // tL
        { x: w, y: h * 0.18 },  // tR
        { x: w, y: h - h * 0.18 },  // bR
        { x: 0, y: h - h * 0.18 },  // bL
      ];

    case 'triangular-prism': {
      const ox = w * 0.42, oy = h * 0.22;
      const ftA = { x: w * 0.05, y: h };
      const ftB = { x: w * 0.48, y: h };
      const ftC = { x: w * 0.26, y: h * 0.20 };
      return [
        ftA,
        ftB,
        { x: ftB.x + ox, y: ftB.y - oy },  // btB
        { x: ftC.x + ox, y: ftC.y - oy },  // btC
        { x: ftA.x + ox, y: ftA.y - oy },  // btA
        ftC,
      ];
    }

    // circle / semicircle / sector are handled separately with Konva arc
    default:
      return [];
  }
}

/** Flatten Point[] to Konva-compatible flat number array */
export function flattenPoints(points: Point[]): number[] {
  return points.flatMap((p) => [p.x, p.y]);
}

/**
 * Calculate a right-angle marker path (two lines forming a small square)
 * at the given vertex, between the two adjacent edges.
 */
export function rightAngleMarkerPoints(
  vertex: Point,
  prev: Point,
  next: Point,
  size = 10
): number[] {
  const v1 = normalise({ x: prev.x - vertex.x, y: prev.y - vertex.y });
  const v2 = normalise({ x: next.x - vertex.x, y: next.y - vertex.y });
  const p1 = { x: vertex.x + v1.x * size, y: vertex.y + v1.y * size };
  const p2 = { x: vertex.x + v2.x * size, y: vertex.y + v2.y * size };
  const corner = { x: p1.x + v2.x * size, y: p1.y + v2.y * size };
  return [p1.x, p1.y, corner.x, corner.y, p2.x, p2.y];
}

function normalise(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/** Midpoint of two points */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Outward normal of a segment (for label placement) */
export function outwardNormal(a: Point, b: Point, centroid: Point, dist = 16): Point {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Two candidate normals
  const n1 = { x: -dy / len, y: dx / len };
  const n2 = { x: dy / len, y: -dx / len };
  // Pick the one pointing away from centroid
  const d1 = (mx + n1.x - centroid.x) ** 2 + (my + n1.y - centroid.y) ** 2;
  const d2 = (mx + n2.x - centroid.x) ** 2 + (my + n2.y - centroid.y) ** 2;
  const n = d1 > d2 ? n1 : n2;
  return { x: mx + n.x * dist, y: my + n.y * dist };
}

export function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * Generate tick mark lines perpendicular to segment a→b at its midpoint.
 * Returns an array of flat [x1,y1,x2,y2] arrays, one per tick.
 */
export function tickMarkPoints(a: Point, b: Point, tickCount: number, tickSize = 6): number[][] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular unit vector
  const px = -dy / len, py = dx / len;
  const spacing = tickSize * 0.7;
  const offset = ((tickCount - 1) / 2) * spacing;
  const ticks: number[][] = [];
  for (let i = 0; i < tickCount; i++) {
    // Shift along the segment direction
    const along = (i * spacing - offset);
    const tx = mx + (dx / len) * along;
    const ty = my + (dy / len) * along;
    ticks.push([
      tx - px * tickSize, ty - py * tickSize,
      tx + px * tickSize, ty + py * tickSize,
    ]);
  }
  return ticks;
}
