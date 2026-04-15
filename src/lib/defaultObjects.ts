import type {
  ShapeObject,
  GraphObject,
  TextObject,
  MarkBoxObject,
  ShapeType,
  CircleDiagramObject,
  TableObject,
  TableCell,
  NumberLineObject,
  VennDiagramObject,
  BarChartObject,
  PieChartObject,
  ProbTreeObject,
  BearingObject,
} from '@/types/canvas';

const THREED_TYPES = ['cuboid', 'cone', 'frustum', 'cylinder', 'triangular-prism'] as const;
const is3DType = (t: ShapeType): boolean => (THREED_TYPES as readonly string[]).includes(t);

export function createShape(shapeType: ShapeType, x = 100, y = 100): ShapeObject {
  const isCircle = shapeType === 'circle' || shapeType === 'semicircle' || shapeType === 'sector';
  const is3D = is3DType(shapeType);
  const size = is3D ? 180 : isCircle ? 120 : shapeType.startsWith('triangle') ? 140 : 160;

  return {
    id: crypto.randomUUID(),
    type: 'shape',
    shapeType,
    x,
    y,
    width: size,
    height: shapeType === 'circle' ? size : is3D ? size * 0.8 : size * 0.75,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    dimensions: {
      sides: defaultSides(shapeType),
      angles: defaultAngles(shapeType),
      radius: isCircle ? 60 : null,
      sectorAngle: shapeType === 'sector' ? 90 : null,
      compoundDimensions: null,
    },
    style: {
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      dashed: false,
    },
    annotations: {
      rightAngleMarkers: shapeType === 'triangle-right' ? [0] : [],
      equalSideMarkers: {},
      parallelMarkers: {},
      heightLine: { show: false, label: 'h', dashed: true },
    },
    notToScale: false,
  };
}

function defaultSides(shapeType: ShapeType) {
  const s = (id: string, length: number, label?: string) => ({
    id,
    length,
    label: label ?? `${length} cm`,
    showLabel: true,
    labelPosition: 'outside' as const,
  });

  switch (shapeType) {
    case 'triangle-right':
      return [s('a', 6), s('c', 10), s('b', 8)];
    case 'triangle-isosceles':
      return [s('a', 7), s('b', 7), s('c', 10)];
    case 'triangle-equilateral':
      return [s('a', 8), s('b', 8), s('c', 8)];
    case 'triangle-scalene':
      return [s('a', 5), s('b', 7), s('c', 9)];
    case 'rectangle':
      return [s('w', 12), s('h', 8)];
    case 'square':
      return [s('a', 10)];
    case 'parallelogram':
      return [s('a', 12), s('b', 8)];
    case 'rhombus':
      return [s('a', 8)];
    case 'trapezium':
      return [s('a', 6), s('b', 10), s('h', 5)];
    case 'circle':
    case 'semicircle':
      return [s('r', 5, 'r = 5 cm')];
    case 'sector':
      return [s('r', 5, 'r = 5 cm')];
    case 'l-shape':
    case 't-shape':
    case 'compound-step':
      return [s('a', 12), s('b', 8), s('c', 5), s('d', 4)];
    case 'cuboid':
      return [s('l', 8, 'l = 8 cm'), s('w', 5, 'w = 5 cm'), s('h', 6, 'h = 6 cm')];
    case 'cone':
      return [s('r', 4, 'r = 4 cm'), s('l', 10, 'l = 10 cm'), s('h', 9, 'h = 9 cm')];
    case 'frustum':
      return [s('r1', 3, 'r\u2081 = 3 cm'), s('r2', 6, 'r\u2082 = 6 cm'), s('h', 8, 'h = 8 cm')];
    case 'cylinder':
      return [s('r', 4, 'r = 4 cm'), s('h', 9, 'h = 9 cm')];
    case 'triangular-prism':
      return [s('a', 5, 'a = 5 cm'), s('b', 6, 'b = 6 cm'), s('l', 10, 'l = 10 cm')];
    default:
      return [];
  }
}

function defaultAngles(shapeType: ShapeType) {
  const a = (id: string, value: number) => ({
    id,
    value,
    label: `${value}°`,
    showLabel: false,
    showArc: false,
  });

  switch (shapeType) {
    case 'triangle-right':
      return [a('A', 90), a('B', 35), a('C', 55)];
    case 'triangle-equilateral':
      return [a('A', 60), a('B', 60), a('C', 60)];
    case 'triangle-isosceles':
      return [a('A', 70), a('B', 55), a('C', 55)];
    case 'triangle-scalene':
      return [a('A', 80), a('B', 60), a('C', 40)];
    default:
      return [];
  }
}

export function createGraph(x = 80, y = 60): GraphObject {
  return {
    id: crypto.randomUUID(),
    type: 'graph',
    x,
    y,
    width: 320,
    height: 320,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    graphSettings: {
      xMin: -5,
      xMax: 5,
      yMin: -5,
      yMax: 5,
      xStep: 1,
      yStep: 1,
      showGrid: true,
      showMinorGrid: false,
      showAxes: true,
      showAxisLabels: true,
      showAxisNumbers: true,
      xLabel: 'x',
      yLabel: 'y',
      gridColor: '#e0e0e0',
      axisColor: '#000000',
      backgroundColor: '#ffffff',
    },
    plots: [],
    points: [],
    annotations: {
      showIntersections: false,
      intersectionLabels: false,
    },
  };
}

export function createText(x = 100, y = 100): TextObject {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    x,
    y,
    width: 200,
    height: 40,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    content: 'Text',
    fontSize: 14,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    fill: '#000000',
    latex: false,
    latexContent: null,
  };
}

export function createCircleDiagram(x = 80, y = 60): CircleDiagramObject {
  const radius = 100;
  const pad = 24;
  return {
    id: crypto.randomUUID(),
    type: 'circle-diagram',
    x,
    y,
    width: radius * 2 + pad * 2,
    height: radius * 2 + pad * 2,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    radius,
    points: [
      { id: 'O', label: 'O', position: 'centre',        angleDeg: 0   },
      { id: 'A', label: 'A', position: 'circumference', angleDeg: 270 },  // top
      { id: 'B', label: 'B', position: 'circumference', angleDeg: 30  },  // bottom-right
      { id: 'C', label: 'C', position: 'circumference', angleDeg: 150 },  // bottom-left
    ],
    lines: [
      { id: crypto.randomUUID(), fromPointId: 'A', toPointId: 'B', lineType: 'chord',  style: 'solid', equalTickGroup: null },
      { id: crypto.randomUUID(), fromPointId: 'A', toPointId: 'C', lineType: 'chord',  style: 'solid', equalTickGroup: null },
      { id: crypto.randomUUID(), fromPointId: 'B', toPointId: 'C', lineType: 'chord',  style: 'solid', equalTickGroup: null },
      { id: crypto.randomUUID(), fromPointId: 'O', toPointId: 'A', lineType: 'radius', style: 'solid', equalTickGroup: null },
    ],
    angles: [],
    style: {
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'transparent',
    },
    notToScale: false,
  };
}

export function createTable(x = 80, y = 80, rows = 2, cols = 4): TableObject {
  const colWidth = 80;
  const rowHeight = 36;

  const makeCell = (content = '', shaded = false): TableCell => ({
    content,
    bold: shaded,
    align: 'center',
    shaded,
  });

  const cells: TableCell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => makeCell('', r === 0 || c === 0))
  );

  // Default frequency table headers for a 2-row table
  if (rows === 2 && cols === 4) {
    cells[0][0] = { content: 'Value', bold: true, align: 'center', shaded: true };
    cells[0][1] = { content: '', bold: true, align: 'center', shaded: true };
    cells[0][2] = { content: '', bold: true, align: 'center', shaded: true };
    cells[0][3] = { content: '', bold: true, align: 'center', shaded: true };
    cells[1][0] = { content: 'Frequency', bold: true, align: 'center', shaded: true };
    cells[1][1] = { content: '', bold: false, align: 'center', shaded: false };
    cells[1][2] = { content: '', bold: false, align: 'center', shaded: false };
    cells[1][3] = { content: '', bold: false, align: 'center', shaded: false };
  }

  return {
    id: crypto.randomUUID(),
    type: 'table',
    x,
    y,
    width: cols * colWidth,
    height: rows * rowHeight,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    rows,
    cols,
    cells,
    colWidths: Array(cols).fill(colWidth) as number[],
    rowHeight,
    style: {
      stroke: '#000000',
      strokeWidth: 1.5,
      fontSize: 12,
      fontFamily: 'Arial',
      headerRow: true,
      headerCol: false,
    },
  };
}

export function createNumberLine(x = 80, y = 100): NumberLineObject {
  return {
    id: crypto.randomUUID(),
    type: 'number-line',
    x,
    y,
    width: 500,
    height: 70,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    min: -5,
    max: 5,
    step: 1,
    showTicks: true,
    showNumbers: true,
    leftArrow: true,
    rightArrow: true,
    markers: [],
    regions: [],
    style: {
      stroke: '#000000',
      strokeWidth: 2,
      fontSize: 12,
    },
  };
}

export function createVennDiagram(x = 80, y = 60): VennDiagramObject {
  return {
    id: crypto.randomUUID(),
    type: 'venn-diagram',
    x,
    y,
    width: 360,
    height: 260,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    circleA: { label: 'A', x: 130, y: 130, r: 90, color: '#3b82f6', opacity: 0.15 },
    circleB: { label: 'B', x: 230, y: 130, r: 90, color: '#ef4444', opacity: 0.15 },
    regionLabels: {
      aOnly:        { text: '', show: true },
      intersection: { text: '', show: true },
      bOnly:        { text: '', show: true },
      outside:      { text: '', show: false },
    },
    universalSet: { label: 'ξ', show: true },
    style: {
      stroke: '#000000',
      strokeWidth: 2,
      fontSize: 13,
    },
  };
}

export function createBarChart(x = 60, y = 60, mode: 'bar' | 'histogram' = 'bar'): BarChartObject {
  const defaultBars = mode === 'histogram'
    ? [
        { id: crypto.randomUUID(), label: '0-10',  value: 4,  color: '' },
        { id: crypto.randomUUID(), label: '10-20', value: 7,  color: '' },
        { id: crypto.randomUUID(), label: '20-30', value: 12, color: '' },
        { id: crypto.randomUUID(), label: '30-40', value: 6,  color: '' },
        { id: crypto.randomUUID(), label: '40-50', value: 3,  color: '' },
      ]
    : [
        { id: crypto.randomUUID(), label: 'Mon', value: 5,  color: '' },
        { id: crypto.randomUUID(), label: 'Tue', value: 8,  color: '' },
        { id: crypto.randomUUID(), label: 'Wed', value: 6,  color: '' },
        { id: crypto.randomUUID(), label: 'Thu', value: 9,  color: '' },
        { id: crypto.randomUUID(), label: 'Fri', value: 7,  color: '' },
      ];

  return {
    id: crypto.randomUUID(),
    type: 'bar-chart',
    x,
    y,
    width: 340,
    height: 280,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    bars: defaultBars,
    mode,
    xLabel: mode === 'histogram' ? 'Class interval' : 'Category',
    yLabel: mode === 'histogram' ? 'Frequency density' : 'Frequency',
    yMax: null,
    showValues: false,
    barColor: '#60a5fa',
    style: {
      stroke: '#000000',
      strokeWidth: 1.5,
      fontSize: 11,
      axisColor: '#000000',
    },
  };
}

export function createPieChart(x = 60, y = 60): PieChartObject {
  return {
    id: crypto.randomUUID(),
    type: 'pie-chart',
    x,
    y,
    width: 300,
    height: 300,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    slices: [
      { id: crypto.randomUUID(), label: 'A', value: 90,  color: '#60a5fa', showLabel: true, showAngle: true },
      { id: crypto.randomUUID(), label: 'B', value: 120, color: '#f87171', showLabel: true, showAngle: true },
      { id: crypto.randomUUID(), label: 'C', value: 80,  color: '#4ade80', showLabel: true, showAngle: true },
      { id: crypto.randomUUID(), label: 'D', value: 70,  color: '#facc15', showLabel: true, showAngle: true },
    ],
    showTitle: false,
    title: 'Pie Chart',
    style: {
      stroke: '#000000',
      strokeWidth: 1.5,
      fontSize: 12,
    },
  };
}

export function createProbTree(x = 60, y = 60): ProbTreeObject {
  // Default: two-stage tree, two branches at each stage (coin flip)
  const rootId = 'root';
  const h1Id = crypto.randomUUID();
  const t1Id = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    type: 'prob-tree',
    x,
    y,
    width: 480,
    height: 300,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    nodes: [
      { id: rootId, parentId: null,   label: '',  probability: '',    outcome: '' },
      { id: h1Id,   parentId: rootId, label: 'H', probability: '1/2', outcome: '' },
      { id: t1Id,   parentId: rootId, label: 'T', probability: '1/2', outcome: '' },
      { id: crypto.randomUUID(), parentId: h1Id, label: 'H', probability: '1/2', outcome: 'HH' },
      { id: crypto.randomUUID(), parentId: h1Id, label: 'T', probability: '1/2', outcome: 'HT' },
      { id: crypto.randomUUID(), parentId: t1Id, label: 'H', probability: '1/2', outcome: 'TH' },
      { id: crypto.randomUUID(), parentId: t1Id, label: 'T', probability: '1/2', outcome: 'TT' },
    ],
    showOutcomes: true,
    showProducts: false,
    style: { stroke: '#000000', strokeWidth: 1.5, fontSize: 12 },
  };
}

export function createBearing(x = 80, y = 80): BearingObject {
  return {
    id: crypto.randomUUID(),
    type: 'bearing',
    x,
    y,
    width: 200,
    height: 200,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    bearing: 75,
    showNorthLine: true,
    showBearingLine: true,
    showArc: true,
    showLabel: true,
    northLabel: 'N',
    bearingLabel: '',   // empty = auto show the bearing value
    arcRadius: 40,
    style: { stroke: '#000000', strokeWidth: 1.5, fontSize: 12 },
  };
}

export function createMarkBox(x = 400, y = 100): MarkBoxObject {
  return {
    id: crypto.randomUUID(),
    type: 'mark-box',
    x,
    y,
    width: 90,
    height: 28,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    zIndex: 1,
    marks: 2,
    position: 'right',
    style: 'aqa',
  };
}
