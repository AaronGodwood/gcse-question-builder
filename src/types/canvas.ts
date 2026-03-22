// Base properties shared by all canvas objects
export interface BaseCanvasObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  locked: boolean;
  zIndex: number;
}

// Shape types
export type ShapeType =
  | 'triangle-right'
  | 'triangle-isosceles'
  | 'triangle-scalene'
  | 'triangle-equilateral'
  | 'rectangle'
  | 'square'
  | 'parallelogram'
  | 'trapezium'
  | 'rhombus'
  | 'circle'
  | 'semicircle'
  | 'sector'
  | 'l-shape'
  | 't-shape'
  | 'compound-step'
  | 'cuboid'
  | 'cone'
  | 'frustum'
  | 'cylinder'
  | 'triangular-prism';

export interface SideDimension {
  id: string;
  length: number | null;
  label: string;
  showLabel: boolean;
  labelPosition: 'outside' | 'inside';
}

export interface AngleDimension {
  id: string;
  value: number | null;
  label: string;
  showLabel: boolean;
  showArc: boolean;
}

export interface CompoundDimensions {
  template: 'l-shape' | 't-shape' | 'compound-step';
  outerWidth: number;
  outerHeight: number;
  cutoutWidth: number;
  cutoutHeight: number;
  labels: Record<string, { value: string; show: boolean }>;
}

export interface ShapeObject extends BaseCanvasObject {
  type: 'shape';
  shapeType: ShapeType;
  dimensions: {
    sides: SideDimension[];
    angles: AngleDimension[];
    radius: number | null;
    sectorAngle: number | null;
    compoundDimensions: CompoundDimensions | null;
  };
  style: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    dashed: boolean;
  };
  annotations: {
    rightAngleMarkers: number[];
    equalSideMarkers: Record<string, number>;
    parallelMarkers: Record<string, number>;
    heightLine: { show: boolean; label: string; dashed: boolean };
  };
  notToScale: boolean;
}

// Graph types
export interface PlotSettings {
  id: string;
  equation: string;
  type: 'line' | 'curve' | 'inequality';
  color: string;
  strokeWidth: number;
  dashed: boolean;
  showLabel: boolean;
  label: string;
  domain?: { min: number | null; max: number | null };
  fillOpacity?: number;
  boundaryDashed?: boolean;
}

export interface PointSettings {
  x: number;
  y: number;
  label: string;
  showLabel: boolean;
  style: 'filled' | 'open';
  color: string;
}

export interface GraphObject extends BaseCanvasObject {
  type: 'graph';
  graphSettings: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    xStep: number;
    yStep: number;
    showGrid: boolean;
    showMinorGrid: boolean;
    showAxes: boolean;
    showAxisLabels: boolean;
    showAxisNumbers: boolean;
    xLabel: string;
    yLabel: string;
    gridColor: string;
    axisColor: string;
    backgroundColor: string;
  };
  plots: PlotSettings[];
  points: PointSettings[];
  annotations: {
    showIntersections: boolean;
    intersectionLabels: boolean;
  };
}

// Text types
export interface TextObject extends BaseCanvasObject {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  fill: string;
  latex: boolean;
  latexContent: string | null;
}

// Mark box types
export interface MarkBoxObject extends BaseCanvasObject {
  type: 'mark-box';
  marks: number;
  position: 'right' | 'bottom';
  style: 'aqa';
}

// Circle diagram types
export type CirclePointPosition = 'circumference' | 'centre' | 'external';

export interface CircleDiagramPoint {
  id: string;
  label: string;
  position: CirclePointPosition;
  angleDeg: number;       // 0=top, clockwise; used for 'circumference'
  externalX?: number;     // pixel offset from centre for 'external' points
  externalY?: number;
}

export type CircleLineStyle = 'solid' | 'dashed';
export type CircleLineType  = 'chord' | 'radius' | 'diameter' | 'tangent';

export interface CircleDiagramLine {
  id: string;
  fromPointId: string;
  toPointId: string;
  lineType: CircleLineType;
  style: CircleLineStyle;
  equalTickGroup: number | null;  // 1/2/3 = tick group for equal-length marks
}

export interface CircleDiagramAngle {
  id: string;
  vertexPointId: string;
  fromPointId: string;
  toPointId: string;
  label: string;          // free text e.g. 'x', '2x°', '90°'
  showArc: boolean;
  showLabel: boolean;
}

export interface CircleDiagramObject extends BaseCanvasObject {
  type: 'circle-diagram';
  radius: number;
  points: CircleDiagramPoint[];
  lines: CircleDiagramLine[];
  angles: CircleDiagramAngle[];
  style: {
    stroke: string;
    strokeWidth: number;
    fill: string;
  };
  notToScale: boolean;
}

// Table types
export interface TableCell {
  content: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  shaded: boolean;   // grey header shading
}

export interface TableObject extends BaseCanvasObject {
  type: 'table';
  rows: number;
  cols: number;
  cells: TableCell[][];   // [row][col]
  colWidths: number[];    // px width per column
  rowHeight: number;      // px height per row (uniform)
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
    fontFamily: string;
    headerRow: boolean;   // shade top row
    headerCol: boolean;   // shade left column
  };
}

// Number line types
export type NumberLineMarkerStyle = 'open' | 'closed';

export interface NumberLineMarker {
  id: string;
  value: number;
  style: NumberLineMarkerStyle;  // open circle = strict inequality, closed = inclusive
  label: string;                 // e.g. '-2', 'x', '' for no label
  showLabel: boolean;
}

export interface NumberLineRegion {
  id: string;
  fromValue: number;
  toValue: number;   // use Infinity/-Infinity for open-ended arrows
  color: string;
  opacity: number;
}

export interface NumberLineObject extends BaseCanvasObject {
  type: 'number-line';
  min: number;
  max: number;
  step: number;            // tick spacing
  showTicks: boolean;
  showNumbers: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  markers: NumberLineMarker[];
  regions: NumberLineRegion[];   // shaded inequality regions
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
  };
}

// Venn diagram types
export interface VennRegionLabel {
  text: string;
  show: boolean;
}

export interface VennDiagramObject extends BaseCanvasObject {
  type: 'venn-diagram';
  circleA: { label: string; x: number; y: number; r: number; color: string; opacity: number };
  circleB: { label: string; x: number; y: number; r: number; color: string; opacity: number };
  // Region labels (inside A only, intersection, inside B only, outside both)
  regionLabels: {
    aOnly: VennRegionLabel;
    intersection: VennRegionLabel;
    bOnly: VennRegionLabel;
    outside: VennRegionLabel;
  };
  universalSet: { label: string; show: boolean };
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
  };
}

// Bar chart / histogram types
export interface BarChartBar {
  id: string;
  label: string;        // x-axis category label
  value: number;        // height (frequency or freq density)
  color: string;
}

export interface BarChartObject extends BaseCanvasObject {
  type: 'bar-chart';
  bars: BarChartBar[];
  mode: 'bar' | 'histogram';   // bar = gaps between bars, histogram = no gaps
  xLabel: string;
  yLabel: string;
  yMax: number | null;          // null = auto
  showValues: boolean;          // show value above each bar
  barColor: string;             // default bar fill (overridden per-bar if set)
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
    axisColor: string;
  };
}

// Pie chart types
export interface PieSlice {
  id: string;
  label: string;
  value: number;        // angle in degrees OR raw count/percentage (auto-normalised)
  color: string;
  showLabel: boolean;
  showAngle: boolean;   // show the angle value on the slice
}

export interface PieChartObject extends BaseCanvasObject {
  type: 'pie-chart';
  slices: PieSlice[];
  showTitle: boolean;
  title: string;
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
  };
}

// Probability tree types
export interface ProbTreeNode {
  id: string;
  parentId: string | null;  // null = root (invisible anchor)
  label: string;            // outcome label e.g. 'H', 'Red'
  probability: string;      // fraction/decimal shown on the branch e.g. '1/2', '0.3'
  outcome: string;          // end-of-path label shown at leaf (only used when isLeaf)
}

export interface ProbTreeObject extends BaseCanvasObject {
  type: 'prob-tree';
  nodes: ProbTreeNode[];
  showOutcomes: boolean;       // show combined outcome labels at leaves
  showProducts: boolean;       // show probability products at leaves
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
  };
}

// Bearing diagram types
export interface BearingObject extends BaseCanvasObject {
  type: 'bearing';
  bearing: number;           // 000–359
  showNorthLine: boolean;
  showBearingLine: boolean;
  showArc: boolean;
  showLabel: boolean;
  northLabel: string;        // default 'N'
  bearingLabel: string;      // default shows the bearing value e.g. '075°'
  arcRadius: number;         // px radius of the angle arc
  style: {
    stroke: string;
    strokeWidth: number;
    fontSize: number;
  };
}

// Union type for all canvas objects
export type CanvasObject = ShapeObject | GraphObject | TextObject | MarkBoxObject | CircleDiagramObject | TableObject | NumberLineObject | VennDiagramObject | BarChartObject | PieChartObject | ProbTreeObject | BearingObject;

// Canvas state
export interface CanvasData {
  width: number;
  height: number;
  objects: CanvasObject[];
}
