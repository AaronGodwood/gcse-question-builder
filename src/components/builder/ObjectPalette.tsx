import { BarChart2, Type, Hash } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCanvasStore } from '@/stores/canvasStore';
import {
  createShape,
  createGraph,
  createText,
  createMarkBox,
  createCircleDiagram,
  createTable,
  createNumberLine,
  createVennDiagram,
  createBarChart,
  createPieChart,
  createProbTree,
  createBearing,
} from '@/lib/defaultObjects';
import type { ShapeType } from '@/types/canvas';

interface PaletteItem {
  label: string;
  icon?: React.ReactNode;
  preview?: React.ReactNode;
  action: () => void;
  group: string;
}

const SHAPE_DROP_X = 120;
const SHAPE_DROP_Y = 80;

function usePaletteItems() {
  const { addObject } = useCanvasStore();

  const shape = (type: ShapeType) => () =>
    addObject(createShape(type, SHAPE_DROP_X, SHAPE_DROP_Y));

  return [
    // Triangles
    { group: 'Triangles', label: 'Right', preview: <RightTriIcon />, action: shape('triangle-right') },
    { group: 'Triangles', label: 'Isosceles', preview: <IsoTriIcon />, action: shape('triangle-isosceles') },
    { group: 'Triangles', label: 'Equilateral', preview: <EquiTriIcon />, action: shape('triangle-equilateral') },
    { group: 'Triangles', label: 'Scalene', preview: <ScaleneTriIcon />, action: shape('triangle-scalene') },
    // Quadrilaterals
    { group: 'Quadrilaterals', label: 'Rectangle', preview: <RectIcon />, action: shape('rectangle') },
    { group: 'Quadrilaterals', label: 'Square', preview: <SquareIcon />, action: shape('square') },
    { group: 'Quadrilaterals', label: 'Parallelogram', preview: <ParallelIcon />, action: shape('parallelogram') },
    { group: 'Quadrilaterals', label: 'Trapezium', preview: <TrapIcon />, action: shape('trapezium') },
    { group: 'Quadrilaterals', label: 'Rhombus', preview: <RhombusIcon />, action: shape('rhombus') },
    // Circles
    { group: 'Circles', label: 'Circle', preview: <CircleIcon />, action: shape('circle') },
    { group: 'Circles', label: 'Semicircle', preview: <SemiIcon />, action: shape('semicircle') },
    { group: 'Circles', label: 'Sector', preview: <SectorIcon />, action: shape('sector') },
    { group: 'Circles', label: 'Diagram', preview: <CircleDiagramIcon />, action: () => addObject(createCircleDiagram(SHAPE_DROP_X, SHAPE_DROP_Y)) },
    // Compound
    { group: 'Compound', label: 'L-shape', preview: <LShapeIcon />, action: shape('l-shape') },
    { group: 'Compound', label: 'T-shape', preview: <TShapeIcon />, action: shape('t-shape') },
    { group: 'Compound', label: 'Step', preview: <StepIcon />, action: shape('compound-step') },
    // 3D Shapes
    { group: '3D Shapes', label: 'Cuboid', preview: <CuboidIcon />, action: shape('cuboid') },
    { group: '3D Shapes', label: 'Cone', preview: <ConeIcon />, action: shape('cone') },
    { group: '3D Shapes', label: 'Frustum', preview: <FrustumIcon />, action: shape('frustum') },
    { group: '3D Shapes', label: 'Cylinder', preview: <CylinderIcon />, action: shape('cylinder') },
    { group: '3D Shapes', label: 'Prism', preview: <PrismIcon />, action: shape('triangular-prism') },
    // Other
    { group: 'Other', label: 'Graph', icon: <BarChart2 className="h-5 w-5" />, action: () => addObject(createGraph()) },
    { group: 'Other', label: 'Text', icon: <Type className="h-5 w-5" />, action: () => addObject(createText()) },
    { group: 'Other', label: 'Marks', icon: <Hash className="h-5 w-5" />, action: () => addObject(createMarkBox()) },
    { group: 'Other', label: 'Table', preview: <TableIcon />, action: () => addObject(createTable(SHAPE_DROP_X, SHAPE_DROP_Y)) },
    { group: 'Other', label: 'Number Line', preview: <NumberLineIcon />, action: () => addObject(createNumberLine(SHAPE_DROP_X, SHAPE_DROP_Y)) },
    { group: 'Other', label: 'Venn', preview: <VennIcon />, action: () => addObject(createVennDiagram(SHAPE_DROP_X, SHAPE_DROP_Y)) },
    { group: 'Charts', label: 'Bar Chart', preview: <BarChartIcon />, action: () => addObject(createBarChart(SHAPE_DROP_X, SHAPE_DROP_Y, 'bar')) },
    { group: 'Charts', label: 'Histogram', preview: <HistogramIcon />, action: () => addObject(createBarChart(SHAPE_DROP_X, SHAPE_DROP_Y, 'histogram')) },
    { group: 'Charts', label: 'Pie Chart', preview: <PieIcon />, action: () => addObject(createPieChart(SHAPE_DROP_X, SHAPE_DROP_Y)) },
    { group: 'Charts', label: 'Prob Tree', preview: <ProbTreeIcon />, action: () => addObject(createProbTree(SHAPE_DROP_X, SHAPE_DROP_Y)) },
    { group: 'Charts', label: 'Bearing', preview: <BearingIcon />, action: () => addObject(createBearing(SHAPE_DROP_X, SHAPE_DROP_Y)) },
  ] as PaletteItem[];
}

export function ObjectPalette() {
  const items = usePaletteItems();

  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <aside className="w-[180px] bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
        Objects
      </div>
      {groups.map((group) => (
        <div key={group}>
          <div className="px-3 pt-2 pb-0.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
            {group}
          </div>
          <div className="grid grid-cols-3 gap-1 px-2 pb-1">
            {items
              .filter((i) => i.group === group)
              .map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 rounded-md text-[10px] text-slate-500',
                    'hover:bg-emerald-50 hover:text-emerald-700 border border-transparent',
                    'hover:border-emerald-200 transition-colors cursor-pointer'
                  )}
                  title={item.label}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {item.preview ?? item.icon}
                  </div>
                  <span className="leading-tight text-center">{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

// SVG mini-preview icons for each shape
function RightTriIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="2,30 30,30 2,4" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function IsoTriIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="16,3 30,29 2,29" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function EquiTriIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="16,3 31,29 1,29" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function ScaleneTriIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="8,3 30,29 2,29" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function RectIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><rect x="2" y="8" width="28" height="16" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function SquareIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><rect x="4" y="4" width="24" height="24" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function ParallelIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="6,6 28,6 26,26 4,26" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function TrapIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="8,6 24,6 30,26 2,26" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function RhombusIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="16,2 30,16 16,30 2,16" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function CircleIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><circle cx="16" cy="16" r="13" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function SemiIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><path d="M4,20 A12,12 0 0,1 28,20 Z" fill="none" stroke="#374151" strokeWidth="2"/><line x1="4" y1="20" x2="28" y2="20" stroke="#374151" strokeWidth="2"/></svg>;
}
function SectorIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><path d="M16,16 L28,16 A12,12 0 0,1 16,28 Z" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function LShapeIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="2,2 14,2 14,14 28,14 28,30 2,30" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function TShapeIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="2,2 30,2 30,12 20,12 20,30 12,30 12,12 2,12" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function StepIcon() {
  return <svg viewBox="0 0 32 32" className="w-7 h-7"><polygon points="2,2 16,2 16,16 30,16 30,30 2,30" fill="none" stroke="#374151" strokeWidth="2"/></svg>;
}
function CircleDiagramIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <circle cx="16" cy="16" r="12" fill="none" stroke="#374151" strokeWidth="2"/>
      <circle cx="16" cy="4" r="1.5" fill="#374151"/>
      <circle cx="26" cy="22" r="1.5" fill="#374151"/>
      <circle cx="6" cy="22" r="1.5" fill="#374151"/>
      <line x1="16" y1="4" x2="26" y2="22" stroke="#374151" strokeWidth="1.5"/>
      <line x1="16" y1="4" x2="6" y2="22" stroke="#374151" strokeWidth="1.5"/>
      <line x1="26" y1="22" x2="6" y2="22" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  );
}
function CuboidIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <polygon points="2,22 22,22 28,16 28,4 8,4 2,10" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <line x1="2" y1="10" x2="22" y2="10" stroke="#374151" strokeWidth="1.8"/>
      <line x1="22" y1="10" x2="28" y2="4" stroke="#374151" strokeWidth="1.8"/>
      <line x1="22" y1="10" x2="22" y2="22" stroke="#374151" strokeWidth="1.8"/>
    </svg>
  );
}
function ConeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <ellipse cx="16" cy="26" rx="13" ry="4" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <line x1="16" y1="3" x2="3" y2="26" stroke="#374151" strokeWidth="1.8"/>
      <line x1="16" y1="3" x2="29" y2="26" stroke="#374151" strokeWidth="1.8"/>
    </svg>
  );
}
function FrustumIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <ellipse cx="16" cy="25" rx="13" ry="4" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <ellipse cx="16" cy="9" rx="7" ry="2.5" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <line x1="3" y1="25" x2="9" y2="9" stroke="#374151" strokeWidth="1.8"/>
      <line x1="29" y1="25" x2="23" y2="9" stroke="#374151" strokeWidth="1.8"/>
    </svg>
  );
}
function CylinderIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <ellipse cx="16" cy="8" rx="13" ry="4" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <ellipse cx="16" cy="24" rx="13" ry="4" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <line x1="3" y1="8" x2="3" y2="24" stroke="#374151" strokeWidth="1.8"/>
      <line x1="29" y1="8" x2="29" y2="24" stroke="#374151" strokeWidth="1.8"/>
    </svg>
  );
}
function TableIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <rect x="2" y="2" width="28" height="28" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <rect x="2" y="2" width="28" height="9" fill="#c0c0c0" stroke="#374151" strokeWidth="1.8"/>
      <line x1="2" y1="11" x2="30" y2="11" stroke="#374151" strokeWidth="1.2"/>
      <line x1="2" y1="20" x2="30" y2="20" stroke="#374151" strokeWidth="1.2"/>
      <line x1="11" y1="2" x2="11" y2="30" stroke="#374151" strokeWidth="1.2"/>
      <line x1="21" y1="2" x2="21" y2="30" stroke="#374151" strokeWidth="1.2"/>
    </svg>
  );
}
function PrismIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <polygon points="3,28 16,28 9,10" fill="none" stroke="#374151" strokeWidth="1.8"/>
      <line x1="3" y1="28" x2="12" y2="20" stroke="#374151" strokeWidth="1.8"/>
      <line x1="16" y1="28" x2="25" y2="20" stroke="#374151" strokeWidth="1.8"/>
      <line x1="9" y1="10" x2="18" y2="2" stroke="#374151" strokeWidth="1.8"/>
      <polygon points="12,20 25,20 18,2" fill="none" stroke="#374151" strokeWidth="1.8"/>
    </svg>
  );
}
function NumberLineIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      {/* axis line with arrows */}
      <line x1="3" y1="16" x2="29" y2="16" stroke="#374151" strokeWidth="2"/>
      <polygon points="29,16 25,14 25,18" fill="#374151"/>
      <polygon points="3,16 7,14 7,18" fill="#374151"/>
      {/* ticks */}
      <line x1="10" y1="13" x2="10" y2="19" stroke="#374151" strokeWidth="1.5"/>
      <line x1="16" y1="13" x2="16" y2="19" stroke="#374151" strokeWidth="1.5"/>
      <line x1="22" y1="13" x2="22" y2="19" stroke="#374151" strokeWidth="1.5"/>
      {/* open circle marker */}
      <circle cx="22" cy="16" r="3.5" fill="white" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  );
}
function VennIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <rect x="1" y="1" width="30" height="30" fill="none" stroke="#374151" strokeWidth="1.2" rx="1"/>
      <circle cx="12" cy="16" r="9" fill="rgba(59,130,246,0.2)" stroke="#374151" strokeWidth="1.5"/>
      <circle cx="20" cy="16" r="9" fill="rgba(239,68,68,0.2)" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  );
}
function BarChartIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <line x1="4" y1="28" x2="28" y2="28" stroke="#374151" strokeWidth="1.5"/>
      <line x1="4" y1="4"  x2="4"  y2="28" stroke="#374151" strokeWidth="1.5"/>
      <rect x="6"  y="18" width="5" height="10" fill="#60a5fa" stroke="#374151" strokeWidth="1"/>
      <rect x="13" y="10" width="5" height="18" fill="#60a5fa" stroke="#374151" strokeWidth="1"/>
      <rect x="20" y="14" width="5" height="14" fill="#60a5fa" stroke="#374151" strokeWidth="1"/>
    </svg>
  );
}
function HistogramIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <line x1="4" y1="28" x2="28" y2="28" stroke="#374151" strokeWidth="1.5"/>
      <line x1="4" y1="4"  x2="4"  y2="28" stroke="#374151" strokeWidth="1.5"/>
      <rect x="5"  y="20" width="6" height="8"  fill="#a78bfa" stroke="#374151" strokeWidth="1"/>
      <rect x="11" y="12" width="6" height="16" fill="#a78bfa" stroke="#374151" strokeWidth="1"/>
      <rect x="17" y="8"  width="6" height="20" fill="#a78bfa" stroke="#374151" strokeWidth="1"/>
      <rect x="23" y="16" width="4" height="12" fill="#a78bfa" stroke="#374151" strokeWidth="1"/>
    </svg>
  );
}
function PieIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      <path d="M16,16 L16,3 A13,13 0 0,1 29,16 Z" fill="#60a5fa" stroke="#374151" strokeWidth="1"/>
      <path d="M16,16 L29,16 A13,13 0 0,1 16,29 Z" fill="#f87171" stroke="#374151" strokeWidth="1"/>
      <path d="M16,16 L16,29 A13,13 0 0,1 3,16 Z" fill="#4ade80" stroke="#374151" strokeWidth="1"/>
      <path d="M16,16 L3,16 A13,13 0 0,1 16,3 Z" fill="#facc15" stroke="#374151" strokeWidth="1"/>
    </svg>
  );
}
function ProbTreeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      {/* root dot */}
      <circle cx="4" cy="16" r="2" fill="#374151"/>
      {/* first branches */}
      <line x1="6" y1="16" x2="14" y2="9"  stroke="#374151" strokeWidth="1.5"/>
      <line x1="6" y1="16" x2="14" y2="23" stroke="#374151" strokeWidth="1.5"/>
      <circle cx="14" cy="9"  r="2" fill="#374151"/>
      <circle cx="14" cy="23" r="2" fill="#374151"/>
      {/* second branches top */}
      <line x1="16" y1="9"  x2="27" y2="5"  stroke="#374151" strokeWidth="1.5"/>
      <line x1="16" y1="9"  x2="27" y2="13" stroke="#374151" strokeWidth="1.5"/>
      {/* second branches bottom */}
      <line x1="16" y1="23" x2="27" y2="19" stroke="#374151" strokeWidth="1.5"/>
      <line x1="16" y1="23" x2="27" y2="27" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  );
}
function BearingIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      {/* North arrow */}
      <line x1="16" y1="18" x2="16" y2="4" stroke="#374151" strokeWidth="1.8"/>
      <polygon points="16,3 14,8 18,8" fill="#374151"/>
      <text x="14" y="3" fontSize="5" fill="#374151" fontFamily="Arial" fontWeight="bold">N</text>
      {/* bearing line ~075° */}
      <line x1="16" y1="18" x2="28" y2="15" stroke="#374151" strokeWidth="1.8"/>
      {/* arc */}
      <path d="M16,11 A7,7 0 0,1 23,16" fill="none" stroke="#374151" strokeWidth="1.2"/>
      {/* origin cross */}
      <line x1="13" y1="18" x2="19" y2="18" stroke="#374151" strokeWidth="1.2"/>
      <line x1="16" y1="15" x2="16" y2="21" stroke="#374151" strokeWidth="1.2"/>
    </svg>
  );
}
