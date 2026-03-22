import { Group, Line, Circle as KonvaCircle, Arc, Wedge, Ellipse, Text } from 'react-konva';
import type Konva from 'konva';
import type { ShapeObject as ShapeObjectType } from '@/types/canvas';
import { getShapePoints, flattenPoints } from '@/lib/shapeGeometry';
import { ShapeLabels } from './ShapeLabels';

interface Props {
  shape: ShapeObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<ShapeObjectType>) => void;
}

const THREED = ['cuboid', 'cone', 'frustum', 'cylinder', 'triangular-prism'] as const;
type ThreeDType = typeof THREED[number];
const is3D = (t: string): t is ThreeDType => (THREED as readonly string[]).includes(t);

export function ShapeObject({ shape, isSelected, onSelect, onChange }: Props) {
  const { shapeType, width, height, style } = shape;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  const strokeFillProps = {
    fill: style.fill === 'transparent' ? undefined : style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    dash: style.dashed ? [6, 3] : undefined,
  };

  const isCircular =
    shapeType === 'circle' ||
    shapeType === 'semicircle' ||
    shapeType === 'sector';

  const shape3D = is3D(shapeType);

  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      scaleX={shape.scaleX}
      scaleY={shape.scaleY}
      draggable={!shape.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
    >
      {shape3D ? (
        <ThreeDShape shape={shape} />
      ) : isCircular ? (
        <CircularShape shape={shape} strokeFillProps={strokeFillProps} />
      ) : (
        <>
          <Line
            points={flattenPoints(getShapePoints(shapeType, width, height))}
            closed
            {...strokeFillProps}
            listening={false}
          />
          <ShapeLabels shape={shape} />
        </>
      )}

      {/* Invisible hit area */}
      {!isCircular && (
        <Line
          points={flattenPoints(getShapePoints(shapeType, width, height))}
          closed
          fill="rgba(0,0,0,0)"
          stroke="transparent"
          strokeWidth={12}
        />
      )}

      {/* Selection highlight */}
      {isSelected && !isCircular && (
        <Line
          points={flattenPoints(getShapePoints(shapeType, width, height))}
          closed
          stroke="#0096ff"
          strokeWidth={2}
          dash={[4, 3]}
          fill={undefined}
          listening={false}
        />
      )}
    </Group>
  );
}

// ─── Circular shapes ─────────────────────────────────────────────────────────

function CircularShape({
  shape,
  strokeFillProps,
}: {
  shape: ShapeObjectType;
  strokeFillProps: object;
}) {
  const r = shape.dimensions.radius ?? 60;
  const { shapeType } = shape;

  if (shapeType === 'circle') {
    return <KonvaCircle x={r} y={r} radius={r} {...strokeFillProps} />;
  }

  if (shapeType === 'semicircle') {
    return (
      <Arc
        x={r} y={r}
        innerRadius={0} outerRadius={r}
        angle={180} rotation={0}
        {...strokeFillProps}
      />
    );
  }

  const sectorAngle = shape.dimensions.sectorAngle ?? 90;
  return (
    <Wedge
      x={r} y={r}
      radius={r}
      angle={sectorAngle}
      rotation={-90}
      {...strokeFillProps}
    />
  );
}

// ─── 3D solid shapes ──────────────────────────────────────────────────────────

function ThreeDShape({ shape }: { shape: ShapeObjectType }) {
  const { shapeType, width: w, height: h, style, dimensions } = shape;
  const sw = style.strokeWidth;
  const col = style.stroke;
  const dash: number[] = [5, 3];

  const edge = (pts: number[], dashed = false) => (
    <Line points={pts} stroke={col} strokeWidth={sw} dash={dashed ? dash : undefined} listening={false} />
  );

  const label = (x: number, y: number, text: string) => (
    <Text x={x - 20} y={y - 8} text={text} fontSize={11} fontFamily="Arial" fill={col} align="center" width={40} listening={false} />
  );

  const side = (i: number) => dimensions.sides[i];
  const lbl = (i: number) => side(i)?.showLabel ? side(i)?.label ?? '' : '';

  if (shapeType === 'cuboid') {
    // Oblique projection
    const ox = w * 0.28, oy = h * 0.25;
    const fw = w - ox, fh = h - oy;

    const FL_t = [0,  oy];       const FR_t = [fw, oy];
    const FL_b = [0,  oy + fh];  const FR_b = [fw, oy + fh];
    const BL_t = [ox, 0];        const BR_t = [ox + fw, 0];
    const BL_b = [ox, fh];       const BR_b = [ox + fw, fh];

    // label each dimension once, outside the silhouette:
    // side[0] = length → below front-bottom edge
    // side[1] = depth  → above-right of top-right oblique edge
    // side[2] = height → right of front-right vertical edge
    const midX = (a: number[], b: number[]) => (a[0] + b[0]) / 2;
    const midY = (a: number[], b: number[]) => (a[1] + b[1]) / 2;

    return (
      <>
        {edge([...FL_t, ...FR_t])}
        {edge([...FR_t, ...FR_b])}
        {edge([...FR_b, ...FL_b])}
        {edge([...FL_b, ...FL_t])}
        {edge([...FL_t, ...BL_t])}
        {edge([...BL_t, ...BR_t])}
        {edge([...BR_t, ...FR_t])}
        {edge([...FR_b, ...BR_b])}
        {edge([...BR_b, ...BR_t])}
        {edge([...BL_t, ...BL_b], true)}
        {edge([...BL_b, ...BR_b], true)}
        {edge([...BL_b, ...FL_b], true)}
        {/* length: below front-bottom */}
        {lbl(0) && label(midX(FL_b, FR_b), oy + fh + 14, lbl(0))}
        {/* depth: above the BR_t→FR_t oblique edge (top-right), offset up-right */}
        {lbl(1) && label(midX(BR_t, FR_t) + 20, midY(BR_t, FR_t) - 22, lbl(1))}
        {/* height: right of front-right vertical edge */}
        {lbl(2) && label(FR_t[0] + 24, midY(FR_t, FR_b), lbl(2))}
        {shape.notToScale && (
          <Text x={0} y={oy + fh + 24} text="Diagram NOT accurately drawn" fontSize={9} fontFamily="Arial" fontStyle="italic" fill="#555" width={w} align="center" />
        )}
      </>
    );
  }

  if (shapeType === 'cone') {
    const cx = w / 2;
    const eRx = w / 2;
    const eRy = h * 0.13;
    const baseY = h - eRy;
    // Label positions: radius along base, slant left, slant right — all clear of shape
    return (
      <>
        {edge([cx, 0, 0, baseY])}
        {edge([cx, 0, w, baseY])}
        {/* Front (bottom) half of base ellipse — solid */}
        <Ellipse x={cx} y={baseY} radiusX={eRx} radiusY={eRy}
          stroke={col} strokeWidth={sw} fill={undefined}
          clipFunc={(ctx: CanvasRenderingContext2D) => { ctx.rect(-eRx - 2, 0, (eRx + 2) * 2, eRy + 2); }}
          listening={false}
        />
        {/* Back (top) half — dashed */}
        <Ellipse x={cx} y={baseY} radiusX={eRx} radiusY={eRy}
          stroke={col} strokeWidth={sw} dash={dash} fill={undefined}
          clipFunc={(ctx: CanvasRenderingContext2D) => { ctx.rect(-eRx - 2, -(eRy + 2), (eRx + 2) * 2, eRy + 2); }}
          listening={false}
        />
        {/* Labels: r (below base centre), l (left of left slant), h (right of right slant) */}
        {lbl(0) && label(cx, baseY + eRy + 14, lbl(0))}
        {lbl(1) && label(cx * 0.25, baseY * 0.45, lbl(1))}
        {lbl(2) && label(w + 22, baseY / 2 - 4, lbl(2))}
        {shape.notToScale && (
          <Text x={0} y={h + 16} text="Diagram NOT accurately drawn" fontSize={9} fontFamily="Arial" fontStyle="italic" fill="#555" width={w} align="center" />
        )}
      </>
    );
  }

  if (shapeType === 'cylinder') {
    const cx = w / 2;
    const eRx = w / 2;
    const eRy = h * 0.13;
    const topY = eRy;
    const botY = h - eRy;
    return (
      <>
        {/* Top ellipse — full solid */}
        <Ellipse x={cx} y={topY} radiusX={eRx} radiusY={eRy}
          stroke={col} strokeWidth={sw} fill={style.fill === 'transparent' ? undefined : style.fill}
          listening={false}
        />
        {/* Bottom ellipse front half — solid */}
        <Ellipse x={cx} y={botY} radiusX={eRx} radiusY={eRy}
          stroke={col} strokeWidth={sw} fill={undefined}
          clipFunc={(ctx: CanvasRenderingContext2D) => { ctx.rect(-eRx - 2, 0, (eRx + 2) * 2, eRy + 2); }}
          listening={false}
        />
        {/* Bottom ellipse back half — dashed */}
        <Ellipse x={cx} y={botY} radiusX={eRx} radiusY={eRy}
          stroke={col} strokeWidth={sw} dash={dash} fill={undefined}
          clipFunc={(ctx: CanvasRenderingContext2D) => { ctx.rect(-eRx - 2, -(eRy + 2), (eRx + 2) * 2, eRy + 2); }}
          listening={false}
        />
        {edge([0, topY, 0, botY])}
        {edge([w, topY, w, botY])}
        {/* Labels: r (above top ellipse centre), h (right of right edge) */}
        {lbl(0) && label(cx, topY - eRy - 14, lbl(0))}
        {lbl(1) && label(w + 22, (topY + botY) / 2, lbl(1))}
        {shape.notToScale && (
          <Text x={0} y={h + 16} text="Diagram NOT accurately drawn" fontSize={9} fontFamily="Arial" fontStyle="italic" fill="#555" width={w} align="center" />
        )}
      </>
    );
  }

  if (shapeType === 'frustum') {
    const cx = w / 2;
    const topRx = w * 0.25, topRy = h * 0.09;
    const botRx = w / 2,    botRy = h * 0.13;
    const topY = topRy, botY = h - botRy;
    return (
      <>
        {/* Top ellipse — full solid */}
        <Ellipse x={cx} y={topY} radiusX={topRx} radiusY={topRy}
          stroke={col} strokeWidth={sw} fill={undefined} listening={false}
        />
        {/* Bottom front half — solid */}
        <Ellipse x={cx} y={botY} radiusX={botRx} radiusY={botRy}
          stroke={col} strokeWidth={sw} fill={undefined}
          clipFunc={(ctx: CanvasRenderingContext2D) => { ctx.rect(-botRx - 2, 0, (botRx + 2) * 2, botRy + 2); }}
          listening={false}
        />
        {/* Bottom back half — dashed */}
        <Ellipse x={cx} y={botY} radiusX={botRx} radiusY={botRy}
          stroke={col} strokeWidth={sw} dash={dash} fill={undefined}
          clipFunc={(ctx: CanvasRenderingContext2D) => { ctx.rect(-botRx - 2, -(botRy + 2), (botRx + 2) * 2, botRy + 2); }}
          listening={false}
        />
        {edge([cx - topRx, topY, cx - botRx, botY])}
        {edge([cx + topRx, topY, cx + botRx, botY])}
        {/* Labels: r1 (above top), r2 (below bottom), h (right of right slant) */}
        {lbl(0) && label(cx, topY - topRy - 14, lbl(0))}
        {lbl(1) && label(cx, botY + botRy + 14, lbl(1))}
        {lbl(2) && label(cx + botRx + 8, (topY + botY) / 2, lbl(2))}
        {shape.notToScale && (
          <Text x={0} y={h + 16} text="Diagram NOT accurately drawn" fontSize={9} fontFamily="Arial" fontStyle="italic" fill="#555" width={w} align="center" />
        )}
      </>
    );
  }

  if (shapeType === 'triangular-prism') {
    const ox = w * 0.42, oy = h * 0.22;
    const ftA = [w * 0.05, h * 0.78];
    const ftB = [w * 0.48, h * 0.78];
    const ftC = [w * 0.26, h * 0.18];
    const btA = [ftA[0] + ox, ftA[1] - oy];
    const btB = [ftB[0] + ox, ftB[1] - oy];
    const btC = [ftC[0] + ox, ftC[1] - oy];

    const midX = (a: number[], b: number[]) => (a[0] + b[0]) / 2;
    const midY = (a: number[], b: number[]) => (a[1] + b[1]) / 2;

    return (
      <>
        {edge([...ftA, ...ftB])}
        {edge([...ftB, ...ftC])}
        {edge([...ftC, ...ftA])}
        {edge([...ftC, ...btC])}
        {edge([...ftB, ...btB])}
        {edge([...ftA, ...btA])}
        {edge([...btC, ...btB])}
        {edge([...btC, ...btA])}
        {edge([...btA, ...btB], true)}
        {/* side[0] = triangle base (a): below front-bottom edge */}
        {lbl(0) && label(midX(ftA, ftB), ftA[1] + 14, lbl(0))}
        {/* side[1] = triangle height (b): left of front-left slant */}
        {lbl(1) && label(midX(ftA, ftC) - 16, midY(ftA, ftC) - 8, lbl(1))}
        {/* side[2] = length (l): above the top connecting edge (ftC→btC), offset up */}
        {lbl(2) && label(midX(ftC, btC) + 6, midY(ftC, btC) - 16, lbl(2))}
        {shape.notToScale && (
          <Text x={0} y={h} text="Diagram NOT accurately drawn" fontSize={9} fontFamily="Arial" fontStyle="italic" fill="#555" width={w} align="center" />
        )}
      </>
    );
  }

  return null;
}
