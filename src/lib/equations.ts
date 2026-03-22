import * as math from 'mathjs';

export type EquationType = 'explicit' | 'vertical' | 'circle' | 'inequality';

export interface ParsedEquation {
  type: EquationType;
  // explicit: y = f(x)
  evalY?: (x: number) => number | null;
  // vertical line: x = c
  verticalX?: number;
  // circle: (x-h)^2 + (y-k)^2 = r^2
  circle?: { h: number; k: number; r: number };
  // inequality
  inequality?: {
    operator: '<' | '<=' | '>' | '>=';
    evalBoundary: (x: number) => number | null;
  };
  error?: string;
}

/**
 * Normalise user input to a parseable form.
 * Handles: "y = 2x + 1", "y=x^2", "x = 3", "x^2 + y^2 = 25",
 *          "(x-2)^2 + (y+1)^2 = 9", "y < 2x+1", "y >= x^2 - 4"
 */
function normalise(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')   // 2x → 2*x, 2(x → 2*(x
    .replace(/([a-zA-Z)])(\d)/g, '$1*$2')   // x2 → x*2 (rare)
    .replace(/\^/g, '^');                   // keep ^ as-is (mathjs handles it)
}

function safeEval(expr: math.MathNode, x: number): number | null {
  try {
    const result = (expr as math.MathNode & { evaluate: (scope: Record<string, number>) => number }).evaluate({ x });
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

export function parseEquation(raw: string): ParsedEquation {
  if (!raw || !raw.trim()) return { type: 'explicit', error: 'Empty equation' };

  const input = normalise(raw);

  // Detect inequality operators
  const inequalityMatch = input.match(/^y\s*(<=|>=|<|>)\s*(.+)$/i);
  if (inequalityMatch) {
    const op = inequalityMatch[1] as '<' | '<=' | '>' | '>=';
    const rhs = inequalityMatch[2];
    try {
      const expr = math.parse(rhs);
      return {
        type: 'inequality',
        inequality: {
          operator: op,
          evalBoundary: (x) => safeEval(expr, x),
        },
      };
    } catch (e) {
      return { type: 'explicit', error: `Cannot parse: ${rhs}` };
    }
  }

  // Vertical line: x = c
  const verticalMatch = input.match(/^x\s*=\s*([+-]?\d*\.?\d+)$/i);
  if (verticalMatch) {
    return { type: 'vertical', verticalX: parseFloat(verticalMatch[1]) };
  }

  // Circle: x^2 + y^2 = r^2  or  (x-h)^2 + (y-k)^2 = r^2
  // Try standard form first
  const stdCircle = input.match(/^x\^2\s*\+\s*y\^2\s*=\s*(.+)$/i);
  if (stdCircle) {
    try {
      const r2 = math.evaluate(stdCircle[1]) as number;
      if (r2 > 0) return { type: 'circle', circle: { h: 0, k: 0, r: Math.sqrt(r2) } };
    } catch { /* fall through */ }
  }

  // Shifted circle: (x-h)^2 + (y-k)^2 = r^2
  const shiftedCircle = input.match(
    /^\(x([+-]\d*\.?\d*)\)\^2\s*\+\s*\(y([+-]\d*\.?\d*)\)\^2\s*=\s*(.+)$/i
  );
  if (shiftedCircle) {
    try {
      const h = -parseFloat(shiftedCircle[1] || '0');
      const k = -parseFloat(shiftedCircle[2] || '0');
      const r2 = math.evaluate(shiftedCircle[3]) as number;
      if (r2 > 0) return { type: 'circle', circle: { h, k, r: Math.sqrt(r2) } };
    } catch { /* fall through */ }
  }

  // Explicit: y = f(x)  (strip "y =" if present)
  const explicitMatch = input.match(/^y\s*=\s*(.+)$/i);
  const rhs = explicitMatch ? explicitMatch[1] : input;

  try {
    const expr = math.parse(rhs);
    return {
      type: 'explicit',
      evalY: (x) => safeEval(expr, x),
    };
  } catch (e) {
    return { type: 'explicit', error: `Cannot parse: ${rhs}` };
  }
}

/**
 * Sample an explicit equation across [xMin, xMax] at `steps` points.
 * Returns segments (arrays of points) split at discontinuities / asymptotes.
 */
export function sampleEquation(
  evalY: (x: number) => number | null,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  steps = 400
): Array<Array<{ x: number; y: number }>> {
  const segments: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];

  const dx = (xMax - xMin) / steps;
  const yRange = yMax - yMin;
  const JUMP_THRESHOLD = yRange * 3; // gap bigger than this = asymptote break

  let prevY: number | null = null;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    const y = evalY(x);

    if (y === null || !isFinite(y)) {
      if (current.length > 1) segments.push(current);
      current = [];
      prevY = null;
      continue;
    }

    // Break segment at apparent asymptotes
    if (prevY !== null && Math.abs(y - prevY) > JUMP_THRESHOLD) {
      if (current.length > 1) segments.push(current);
      current = [];
    }

    current.push({ x, y });
    prevY = y;
  }

  if (current.length > 1) segments.push(current);
  return segments;
}

/**
 * Sample a circle into arc points.
 * Returns upper and lower semicircle as separate segments.
 */
export function sampleCircle(
  circle: { h: number; k: number; r: number },
  xMin: number,
  xMax: number,
  steps = 200
): Array<Array<{ x: number; y: number }>> {
  const { h, k, r } = circle;
  const upper: Array<{ x: number; y: number }> = [];
  const lower: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const x = h + r * Math.cos(angle);
    const y = k + r * Math.sin(angle);
    if (x >= xMin && x <= xMax) {
      if (angle <= Math.PI) upper.push({ x, y });
      else lower.push({ x, y });
    }
  }

  // Full circle as one segment using parametric
  const full: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    full.push({ x: h + r * Math.cos(angle), y: k + r * Math.sin(angle) });
  }
  return [full];
}

/**
 * Find approximate intersection points between two sampled segment sets.
 * Uses sign-change detection on the difference.
 */
export function findIntersections(
  eq1: (x: number) => number | null,
  eq2: (x: number) => number | null,
  xMin: number,
  xMax: number,
  steps = 800
): Array<{ x: number; y: number }> {
  const intersections: Array<{ x: number; y: number }> = [];
  const dx = (xMax - xMin) / steps;

  let prevDiff: number | null = null;
  let prevX = xMin;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    const y1 = eq1(x);
    const y2 = eq2(x);
    if (y1 === null || y2 === null) { prevDiff = null; continue; }

    const diff = y1 - y2;

    if (prevDiff !== null && Math.sign(diff) !== Math.sign(prevDiff) && Math.abs(diff) < 10) {
      // Binary search for more precise crossing
      const xMid = (prevX + x) / 2;
      const yMid = ((eq1(xMid) ?? 0) + (eq2(xMid) ?? 0)) / 2;
      intersections.push({ x: Math.round(xMid * 100) / 100, y: Math.round(yMid * 100) / 100 });
    }

    prevDiff = diff;
    prevX = x;
  }

  return intersections;
}
