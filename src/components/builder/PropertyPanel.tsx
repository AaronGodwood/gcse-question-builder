import { cn } from '@/lib/cn';
import { useCanvasStore } from '@/stores/canvasStore';
import type {
  CanvasObject,
  ShapeObject,
  GraphObject,
  TextObject,
  MarkBoxObject,
  PlotSettings,
  CircleDiagramObject,
  CircleDiagramPoint,
  CircleDiagramLine,
  CircleDiagramAngle,
  TableObject,
  NumberLineObject,
  NumberLineMarker,
  NumberLineRegion,
  VennDiagramObject,
  BarChartObject,
  BarChartBar,
  PieChartObject,
  PieSlice,
  ProbTreeObject,
  ProbTreeNode,
  BearingObject,
} from '@/types/canvas';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  selected: CanvasObject | null;
}

export function PropertyPanel({ selected }: Props) {
  const { updateObject } = useCanvasStore();

  if (!selected) {
    return (
      <aside className="w-[260px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-4 text-sm text-slate-400 text-center mt-8">
          Select an object to edit its properties
        </div>
      </aside>
    );
  }

  const update = (updates: Partial<CanvasObject>) =>
    updateObject(selected.id, updates);

  return (
    <aside className="w-[260px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-200">
        Properties — {selected.type}
      </div>

      {/* Common: position */}
      <Section title="Position">
        <Row label="X">
          <NumInput
            value={Math.round(selected.x)}
            onChange={(v) => update({ x: v })}
          />
        </Row>
        <Row label="Y">
          <NumInput
            value={Math.round(selected.y)}
            onChange={(v) => update({ y: v })}
          />
        </Row>
        <Row label="W">
          <NumInput
            value={Math.round(selected.width)}
            onChange={(v) => update({ width: Math.max(20, v) })}
          />
        </Row>
        <Row label="H">
          <NumInput
            value={Math.round(selected.height)}
            onChange={(v) => update({ height: Math.max(20, v) })}
          />
        </Row>
        <Row label="Rot">
          <NumInput
            value={Math.round(selected.rotation)}
            onChange={(v) => update({ rotation: v })}
          />
        </Row>
      </Section>

      {/* Type-specific panels */}
      {selected.type === 'shape' && (
        <ShapeProperties shape={selected as ShapeObject} update={update as (u: Partial<ShapeObject>) => void} />
      )}
      {selected.type === 'graph' && (
        <GraphProperties graph={selected as GraphObject} update={update as (u: Partial<GraphObject>) => void} />
      )}
      {selected.type === 'text' && (
        <TextProperties obj={selected as TextObject} update={update as (u: Partial<TextObject>) => void} />
      )}
      {selected.type === 'mark-box' && (
        <MarkBoxProperties obj={selected as MarkBoxObject} update={update as (u: Partial<MarkBoxObject>) => void} />
      )}
      {selected.type === 'circle-diagram' && (
        <CircleDiagramProperties diagram={selected as CircleDiagramObject} update={update as (u: Partial<CircleDiagramObject>) => void} />
      )}
      {selected.type === 'table' && (
        <TableProperties table={selected as TableObject} update={update as (u: Partial<TableObject>) => void} />
      )}
      {selected.type === 'number-line' && (
        <NumberLineProperties obj={selected as NumberLineObject} update={update as (u: Partial<NumberLineObject>) => void} />
      )}
      {selected.type === 'venn-diagram' && (
        <VennDiagramProperties obj={selected as VennDiagramObject} update={update as (u: Partial<VennDiagramObject>) => void} />
      )}
      {selected.type === 'bar-chart' && (
        <BarChartProperties obj={selected as BarChartObject} update={update as (u: Partial<BarChartObject>) => void} />
      )}
      {selected.type === 'pie-chart' && (
        <PieChartProperties obj={selected as PieChartObject} update={update as (u: Partial<PieChartObject>) => void} />
      )}
      {selected.type === 'prob-tree' && (
        <ProbTreeProperties obj={selected as ProbTreeObject} update={update as (u: Partial<ProbTreeObject>) => void} />
      )}
      {selected.type === 'bearing' && (
        <BearingProperties obj={selected as BearingObject} update={update as (u: Partial<BearingObject>) => void} />
      )}
    </aside>
  );
}

// ---------- Shape ----------
function ShapeProperties({
  shape,
  update,
}: {
  shape: ShapeObject;
  update: (u: Partial<ShapeObject>) => void;
}) {
  const { dimensions, style, notToScale } = shape;

  const updateSide = (id: string, field: string, value: unknown) => {
    update({
      dimensions: {
        ...dimensions,
        sides: dimensions.sides.map((s) =>
          s.id === id ? { ...s, [field]: value } : s
        ),
      },
    });
  };

  const updateAngle = (id: string, field: string, value: unknown) => {
    update({
      dimensions: {
        ...dimensions,
        angles: dimensions.angles.map((a) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      },
    });
  };

  return (
    <>
      <Section title="Sides">
        {dimensions.sides.map((side) => (
          <div key={side.id} className="mb-2">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] text-slate-400 w-4 font-mono">{side.id}</span>
              <NumInput
                value={side.length ?? 0}
                onChange={(v) => updateSide(side.id, 'length', v)}
                small
              />
              <input
                className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={side.label}
                onChange={(e) => updateSide(side.id, 'label', e.target.value)}
                placeholder="label"
              />
              <ToggleBtn
                active={side.showLabel}
                onClick={() => updateSide(side.id, 'showLabel', !side.showLabel)}
                title="Show label"
              >
                L
              </ToggleBtn>
            </div>
          </div>
        ))}
      </Section>

      {dimensions.angles.length > 0 && (
        <Section title="Angles">
          {dimensions.angles.map((angle) => (
            <Row key={angle.id} label={angle.id}>
              <NumInput
                value={angle.value ?? 0}
                onChange={(v) => updateAngle(angle.id, 'value', v)}
                small
              />
              <ToggleBtn
                active={angle.showArc}
                onClick={() => updateAngle(angle.id, 'showArc', !angle.showArc)}
                title="Show arc"
              >
                ∠
              </ToggleBtn>
              <ToggleBtn
                active={angle.showLabel}
                onClick={() => updateAngle(angle.id, 'showLabel', !angle.showLabel)}
                title="Show label"
              >
                L
              </ToggleBtn>
            </Row>
          ))}
        </Section>
      )}

      <Section title="Style">
        <Row label="Stroke">
          <ColorInput
            value={style.stroke}
            onChange={(v) => update({ style: { ...style, stroke: v } })}
          />
        </Row>
        <Row label="Fill">
          <ColorInput
            value={style.fill === 'transparent' ? '#ffffff' : style.fill}
            onChange={(v) => update({ style: { ...style, fill: v } })}
          />
          <ToggleBtn
            active={style.fill === 'transparent'}
            onClick={() =>
              update({ style: { ...style, fill: style.fill === 'transparent' ? '#ffffff' : 'transparent' } })
            }
            title="Transparent fill"
          >
            T
          </ToggleBtn>
        </Row>
        <Row label="Width">
          <NumInput
            value={style.strokeWidth}
            onChange={(v) => update({ style: { ...style, strokeWidth: v } })}
            small
          />
        </Row>
        <Row label="Dashed">
          <ToggleBtn
            active={style.dashed}
            onClick={() => update({ style: { ...style, dashed: !style.dashed } })}
          >
            - - -
          </ToggleBtn>
        </Row>
      </Section>

      {!['circle', 'semicircle', 'sector'].includes(shape.shapeType) && (
        <Section title="Labels">
          <Row label="Not to scale">
            <ToggleBtn
              active={notToScale}
              onClick={() => update({ notToScale: !notToScale })}
            >
              {notToScale ? 'On' : 'Off'}
            </ToggleBtn>
          </Row>
        </Section>
      )}
    </>
  );
}

// ---------- Graph ----------
function GraphProperties({
  graph,
  update,
}: {
  graph: GraphObject;
  update: (u: Partial<GraphObject>) => void;
}) {
  const { graphSettings, plots } = graph;

  const updateSettings = (updates: Partial<typeof graphSettings>) =>
    update({ graphSettings: { ...graphSettings, ...updates } });

  const updatePlot = (id: string, updates: Partial<PlotSettings>) =>
    update({
      plots: plots.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });

  const addPlot = () =>
    update({
      plots: [
        ...plots,
        {
          id: crypto.randomUUID(),
          equation: 'y = x',
          type: 'line' as const,
          color: '#000000',
          strokeWidth: 2,
          dashed: false,
          showLabel: true,
          label: 'y = x',
        },
      ],
    });

  const removePlot = (id: string) =>
    update({ plots: plots.filter((p) => p.id !== id) });

  return (
    <>
      <Section title="Axis Range">
        <Row label="x min"><NumInput value={graphSettings.xMin} onChange={(v) => updateSettings({ xMin: v })} small /></Row>
        <Row label="x max"><NumInput value={graphSettings.xMax} onChange={(v) => updateSettings({ xMax: v })} small /></Row>
        <Row label="y min"><NumInput value={graphSettings.yMin} onChange={(v) => updateSettings({ yMin: v })} small /></Row>
        <Row label="y max"><NumInput value={graphSettings.yMax} onChange={(v) => updateSettings({ yMax: v })} small /></Row>
        <Row label="x step"><NumInput value={graphSettings.xStep} onChange={(v) => updateSettings({ xStep: v })} small /></Row>
        <Row label="y step"><NumInput value={graphSettings.yStep} onChange={(v) => updateSettings({ yStep: v })} small /></Row>
      </Section>

      <Section title="Appearance">
        <Row label="Background">
          <ToggleBtn
            active={graphSettings.backgroundColor === 'transparent'}
            onClick={() => updateSettings({
              backgroundColor: graphSettings.backgroundColor === 'transparent' ? '#ffffff' : 'transparent',
            })}
          >
            Transparent
          </ToggleBtn>
        </Row>
        <Row label="Grid">
          <ToggleBtn active={graphSettings.showGrid} onClick={() => updateSettings({ showGrid: !graphSettings.showGrid })}>
            {graphSettings.showGrid ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Numbers">
          <ToggleBtn active={graphSettings.showAxisNumbers} onClick={() => updateSettings({ showAxisNumbers: !graphSettings.showAxisNumbers })}>
            {graphSettings.showAxisNumbers ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section
        title="Plots"
        action={
          <button onClick={addPlot} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {plots.length === 0 && (
          <p className="text-xs text-gray-400 px-1">No plots yet. Click + to add.</p>
        )}
        {plots.map((plot) => (
          <div key={plot.id} className="mb-2 border border-slate-200 rounded p-1.5 bg-white">
            <div className="flex items-center gap-1 mb-1">
              <input
                className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                value={plot.equation}
                onChange={(e) =>
                  updatePlot(plot.id, { equation: e.target.value, label: e.target.value })
                }
                placeholder="y = 2x + 1"
              />
              <button
                onClick={() => removePlot(plot.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <ColorInput
                value={plot.color}
                onChange={(v) => updatePlot(plot.id, { color: v })}
              />
              <ToggleBtn
                active={plot.dashed}
                onClick={() => updatePlot(plot.id, { dashed: !plot.dashed })}
              >
                - -
              </ToggleBtn>
              <ToggleBtn
                active={plot.showLabel}
                onClick={() => updatePlot(plot.id, { showLabel: !plot.showLabel })}
              >
                L
              </ToggleBtn>
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}

// ---------- Text ----------
function TextProperties({
  obj,
  update,
}: {
  obj: TextObject;
  update: (u: Partial<TextObject>) => void;
}) {
  return (
    <>
      <Section title="Content">
        <textarea
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs resize-none"
          rows={4}
          value={obj.content}
          onChange={(e) => update({ content: e.target.value })}
        />
      </Section>
      <Section title="Font">
        <Row label="Size">
          <NumInput value={obj.fontSize} onChange={(v) => update({ fontSize: v })} small />
        </Row>
        <Row label="Color">
          <ColorInput value={obj.fill} onChange={(v) => update({ fill: v })} />
        </Row>
        <Row label="Bold">
          <ToggleBtn
            active={obj.fontWeight === 'bold'}
            onClick={() => update({ fontWeight: obj.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            B
          </ToggleBtn>
        </Row>
        <Row label="Italic">
          <ToggleBtn
            active={obj.fontStyle === 'italic'}
            onClick={() => update({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })}
          >
            I
          </ToggleBtn>
        </Row>
        <Row label="Align">
          {(['left', 'center', 'right'] as const).map((a) => (
            <ToggleBtn
              key={a}
              active={obj.textAlign === a}
              onClick={() => update({ textAlign: a })}
            >
              {a[0].toUpperCase()}
            </ToggleBtn>
          ))}
        </Row>
      </Section>
    </>
  );
}

// ---------- Mark box ----------
function MarkBoxProperties({
  obj,
  update,
}: {
  obj: MarkBoxObject;
  update: (u: Partial<MarkBoxObject>) => void;
}) {
  return (
    <Section title="Marks">
      <Row label="Marks">
        <NumInput
          value={obj.marks}
          onChange={(v) => update({ marks: Math.max(1, Math.round(v)) })}
          small
        />
      </Row>
    </Section>
  );
}

// ---------- Circle Diagram ----------
function CircleDiagramProperties({
  diagram,
  update,
}: {
  diagram: CircleDiagramObject;
  update: (u: Partial<CircleDiagramObject>) => void;
}) {
  const { radius, points, lines, angles, style, notToScale } = diagram;

  const LABEL_PAD = 24;

  const updatePoint = (id: string, field: keyof CircleDiagramPoint, value: unknown) =>
    update({ points: points.map((p) => (p.id === id ? { ...p, [field]: value } : p)) });

  const addPoint = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedLabels = new Set(points.map((p) => p.label));
    const label = letters.split('').find((l) => !usedLabels.has(l)) ?? 'P';
    const id = label;
    update({
      points: [
        ...points,
        { id, label, position: 'circumference', angleDeg: 0 },
      ],
    });
  };

  const removePoint = (id: string) => {
    update({
      points: points.filter((p) => p.id !== id),
      lines: lines.filter((l) => l.fromPointId !== id && l.toPointId !== id),
      angles: angles.filter((a) => a.vertexPointId !== id && a.fromPointId !== id && a.toPointId !== id),
    });
  };

  const updateLine = (id: string, field: keyof CircleDiagramLine, value: unknown) =>
    update({ lines: lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)) });

  const addLine = () => {
    if (points.length < 2) return;
    update({
      lines: [
        ...lines,
        {
          id: crypto.randomUUID(),
          fromPointId: points[0].id,
          toPointId: points[1].id,
          lineType: 'chord',
          style: 'solid',
          equalTickGroup: null,
        },
      ],
    });
  };

  const removeLine = (id: string) =>
    update({ lines: lines.filter((l) => l.id !== id) });

  const updateAngle = (id: string, field: keyof CircleDiagramAngle, value: unknown) =>
    update({ angles: angles.map((a) => (a.id === id ? { ...a, [field]: value } : a)) });

  const addAngle = () => {
    if (points.length < 3) return;
    update({
      angles: [
        ...angles,
        {
          id: crypto.randomUUID(),
          vertexPointId: points[0].id,
          fromPointId: points[1].id,
          toPointId: points[2].id,
          label: 'x',
          showArc: true,
          showLabel: true,
        },
      ],
    });
  };

  const removeAngle = (id: string) =>
    update({ angles: angles.filter((a) => a.id !== id) });

  return (
    <>
      <Section title="Circle">
        <Row label="Radius">
          <NumInput
            value={radius}
            onChange={(v) => {
              const r = Math.max(20, Math.round(v));
              update({ radius: r, width: r * 2 + LABEL_PAD * 2, height: r * 2 + LABEL_PAD * 2 });
            }}
          />
        </Row>
        <Row label="Stroke">
          <ColorInput value={style.stroke} onChange={(v) => update({ style: { ...style, stroke: v } })} />
        </Row>
        <Row label="Fill">
          <ColorInput
            value={style.fill === 'transparent' ? '#ffffff' : style.fill}
            onChange={(v) => update({ style: { ...style, fill: v } })}
          />
          <ToggleBtn
            active={style.fill === 'transparent'}
            onClick={() => update({ style: { ...style, fill: style.fill === 'transparent' ? '#ffffff' : 'transparent' } })}
            title="Transparent"
          >
            T
          </ToggleBtn>
        </Row>
        <Row label="Width">
          <NumInput
            value={style.strokeWidth}
            onChange={(v) => update({ style: { ...style, strokeWidth: v } })}
            small
          />
        </Row>
        <Row label="Not to scale">
          <ToggleBtn active={notToScale} onClick={() => update({ notToScale: !notToScale })}>
            {notToScale ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section
        title="Points"
        action={
          <button onClick={addPoint} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {points.map((pt) => (
          <div key={pt.id} className="mb-2 border border-slate-200 rounded p-1.5 bg-white">
            <div className="flex items-center gap-1 mb-1">
              <input
                className="w-10 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                value={pt.label}
                onChange={(e) => updatePoint(pt.id, 'label', e.target.value)}
                placeholder="A"
              />
              <select
                className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={pt.position}
                onChange={(e) => updatePoint(pt.id, 'position', e.target.value)}
              >
                <option value="circumference">Circ</option>
                <option value="centre">Centre</option>
                <option value="external">External</option>
              </select>
              <button onClick={() => removePoint(pt.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {pt.position === 'circumference' && (
              <Row label="Angle°">
                <NumInput value={pt.angleDeg} onChange={(v) => updatePoint(pt.id, 'angleDeg', v)} small />
              </Row>
            )}
          </div>
        ))}
      </Section>

      <Section
        title="Lines"
        action={
          <button onClick={addLine} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {lines.length === 0 && <p className="text-xs text-gray-400">No lines yet.</p>}
        {lines.map((line) => (
          <div key={line.id} className="mb-2 border border-slate-200 rounded p-1.5 bg-white">
            <div className="flex items-center gap-1 mb-1">
              <select
                className="w-12 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={line.fromPointId}
                onChange={(e) => updateLine(line.id, 'fromPointId', e.target.value)}
              >
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <span className="text-xs text-gray-400">→</span>
              <select
                className="w-12 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={line.toPointId}
                onChange={(e) => updateLine(line.id, 'toPointId', e.target.value)}
              >
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <button onClick={() => removeLine(line.id)} className="text-gray-400 hover:text-red-500 ml-auto">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <ToggleBtn
                active={line.style === 'dashed'}
                onClick={() => updateLine(line.id, 'style', line.style === 'dashed' ? 'solid' : 'dashed')}
              >
                - -
              </ToggleBtn>
              <select
                className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={line.equalTickGroup ?? ''}
                onChange={(e) => updateLine(line.id, 'equalTickGroup', e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">No ticks</option>
                <option value="1">1 tick</option>
                <option value="2">2 ticks</option>
                <option value="3">3 ticks</option>
              </select>
            </div>
          </div>
        ))}
      </Section>

      <Section
        title="Angles"
        action={
          <button onClick={addAngle} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {angles.length === 0 && <p className="text-xs text-gray-400">No angles yet.</p>}
        {angles.map((ang) => (
          <div key={ang.id} className="mb-2 border border-slate-200 rounded p-1.5 bg-white">
            <div className="flex items-center gap-1 mb-1">
              <select
                className="w-12 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={ang.vertexPointId}
                onChange={(e) => updateAngle(ang.id, 'vertexPointId', e.target.value)}
              >
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <select
                className="w-12 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={ang.fromPointId}
                onChange={(e) => updateAngle(ang.id, 'fromPointId', e.target.value)}
              >
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <select
                className="w-12 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={ang.toPointId}
                onChange={(e) => updateAngle(ang.id, 'toPointId', e.target.value)}
              >
                {points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <button onClick={() => removeAngle(ang.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <input
                className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={ang.label}
                onChange={(e) => updateAngle(ang.id, 'label', e.target.value)}
                placeholder="x"
              />
              <ToggleBtn
                active={ang.showArc}
                onClick={() => updateAngle(ang.id, 'showArc', !ang.showArc)}
                title="Show arc"
              >
                ∠
              </ToggleBtn>
              <ToggleBtn
                active={ang.showLabel}
                onClick={() => updateAngle(ang.id, 'showLabel', !ang.showLabel)}
                title="Show label"
              >
                L
              </ToggleBtn>
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}

// ---------- Table ----------
function TableProperties({
  table,
  update,
}: {
  table: TableObject;
  update: (u: Partial<TableObject>) => void;
}) {
  const { rows, cols, cells, colWidths, rowHeight, style } = table;

  const updateCell = (r: number, c: number, content: string) => {
    const next = cells.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? { ...cell, content } : cell))
    );
    update({ cells: next });
  };

  const toggleShaded = (r: number, c: number) => {
    const next = cells.map((row, ri) =>
      row.map((cell, ci) =>
        ri === r && ci === c ? { ...cell, shaded: !cell.shaded, bold: !cell.shaded } : cell
      )
    );
    update({ cells: next });
  };

  const addRow = () => {
    const newRow = Array.from({ length: cols }, (_, c) => ({
      content: '',
      bold: style.headerCol && c === 0,
      align: 'center' as const,
      shaded: style.headerCol && c === 0,
    }));
    const newCells = [...cells, newRow];
    update({ cells: newCells, rows: rows + 1, height: (rows + 1) * rowHeight });
  };

  const removeRow = () => {
    if (rows <= 1) return;
    update({ cells: cells.slice(0, -1), rows: rows - 1, height: (rows - 1) * rowHeight });
  };

  const addCol = () => {
    const newCells = cells.map((row, r) => [
      ...row,
      { content: '', bold: style.headerRow && r === 0, align: 'center' as const, shaded: style.headerRow && r === 0 },
    ]);
    const newColW = 80;
    const newColWidths = [...colWidths, newColW];
    update({ cells: newCells, cols: cols + 1, colWidths: newColWidths, width: table.width + newColW });
  };

  const removeCol = () => {
    if (cols <= 1) return;
    const newCells = cells.map((row) => row.slice(0, -1));
    const removedW = colWidths[colWidths.length - 1];
    const newColWidths = colWidths.slice(0, -1);
    update({ cells: newCells, cols: cols - 1, colWidths: newColWidths, width: table.width - removedW });
  };

  return (
    <>
      <Section title="Structure">
        <Row label="Rows">
          <NumInput value={rows} onChange={() => {}} small />
          <button onClick={addRow} className="px-1.5 py-0.5 rounded text-xs border border-gray-200 hover:border-gray-400">+</button>
          <button onClick={removeRow} className="px-1.5 py-0.5 rounded text-xs border border-gray-200 hover:border-gray-400">−</button>
        </Row>
        <Row label="Cols">
          <NumInput value={cols} onChange={() => {}} small />
          <button onClick={addCol} className="px-1.5 py-0.5 rounded text-xs border border-gray-200 hover:border-gray-400">+</button>
          <button onClick={removeCol} className="px-1.5 py-0.5 rounded text-xs border border-gray-200 hover:border-gray-400">−</button>
        </Row>
        <Row label="Row H">
          <NumInput value={rowHeight} onChange={(v) => update({ rowHeight: Math.max(20, v), height: rows * Math.max(20, v) })} small />
        </Row>
        <Row label="Col W">
          <NumInput
            value={colWidths[0] ?? 80}
            onChange={(v) => {
              const cw = Math.max(30, v);
              update({ colWidths: Array(cols).fill(cw) as number[], width: cols * cw });
            }}
            small
          />
        </Row>
      </Section>

      <Section title="Style">
        <Row label="Stroke">
          <ColorInput value={style.stroke} onChange={(v) => update({ style: { ...style, stroke: v } })} />
        </Row>
        <Row label="Font sz">
          <NumInput value={style.fontSize} onChange={(v) => update({ style: { ...style, fontSize: v } })} small />
        </Row>
        <Row label="Header row">
          <ToggleBtn
            active={style.headerRow}
            onClick={() => update({ style: { ...style, headerRow: !style.headerRow } })}
          >
            {style.headerRow ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Header col">
          <ToggleBtn
            active={style.headerCol}
            onClick={() => update({ style: { ...style, headerCol: !style.headerCol } })}
          >
            {style.headerCol ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section title="Cells">
        <div className="space-y-1">
          {cells.map((row, r) => (
            <div key={r} className="flex gap-0.5">
              {row.map((cell, c) => (
                <div key={c} className="relative flex-1 min-w-0">
                  <input
                    className={cn(
                      'w-full border rounded px-1 py-0.5 text-xs text-center',
                      cell.shaded ? 'bg-slate-200 border-slate-400' : 'bg-white border-slate-200'
                    )}
                    value={cell.content}
                    onChange={(e) => updateCell(r, c, e.target.value)}
                    onDoubleClick={() => toggleShaded(r, c)}
                    title="Double-click to toggle shading"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          ))}
          <p className="text-[10px] text-slate-400 pt-1">Double-click a cell to toggle shading</p>
        </div>
      </Section>
    </>
  );
}

// ---------- Number Line ----------
function NumberLineProperties({
  obj,
  update,
}: {
  obj: NumberLineObject;
  update: (u: Partial<NumberLineObject>) => void;
}) {
  const { min, max, step, showTicks, showNumbers, leftArrow, rightArrow, markers, regions, style } = obj;

  const addMarker = () => {
    const m: NumberLineMarker = {
      id: crypto.randomUUID(),
      value: 0,
      style: 'open',
      label: '0',
      showLabel: true,
    };
    update({ markers: [...markers, m] });
  };

  const updateMarker = (id: string, field: string, value: unknown) =>
    update({ markers: markers.map((m) => (m.id === id ? { ...m, [field]: value } : m)) });

  const removeMarker = (id: string) =>
    update({ markers: markers.filter((m) => m.id !== id) });

  const addRegion = () => {
    const r: NumberLineRegion = {
      id: crypto.randomUUID(),
      fromValue: min,
      toValue: max,
      color: '#3b82f6',
      opacity: 0.25,
    };
    update({ regions: [...regions, r] });
  };

  const updateRegion = (id: string, field: string, value: unknown) =>
    update({ regions: regions.map((r) => (r.id === id ? { ...r, [field]: value } : r)) });

  const removeRegion = (id: string) =>
    update({ regions: regions.filter((r) => r.id !== id) });

  return (
    <>
      <Section title="Axis">
        <Row label="Min">
          <NumInput value={min} onChange={(v) => update({ min: v })} small />
        </Row>
        <Row label="Max">
          <NumInput value={max} onChange={(v) => update({ max: v })} small />
        </Row>
        <Row label="Step">
          <NumInput value={step} onChange={(v) => update({ step: Math.max(0.1, v) })} small />
        </Row>
        <Row label="Ticks">
          <ToggleBtn active={showTicks} onClick={() => update({ showTicks: !showTicks })}>
            {showTicks ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Numbers">
          <ToggleBtn active={showNumbers} onClick={() => update({ showNumbers: !showNumbers })}>
            {showNumbers ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="← Arrow">
          <ToggleBtn active={leftArrow} onClick={() => update({ leftArrow: !leftArrow })}>
            {leftArrow ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="→ Arrow">
          <ToggleBtn active={rightArrow} onClick={() => update({ rightArrow: !rightArrow })}>
            {rightArrow ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section title="Style">
        <Row label="Stroke">
          <ColorInput value={style.stroke} onChange={(v) => update({ style: { ...style, stroke: v } })} />
        </Row>
        <Row label="Font sz">
          <NumInput value={style.fontSize} onChange={(v) => update({ style: { ...style, fontSize: v } })} small />
        </Row>
      </Section>

      <Section
        title="Markers"
        action={
          <button onClick={addMarker} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {markers.length === 0 && (
          <p className="text-[10px] text-slate-400">No markers — click + to add</p>
        )}
        {markers.map((m) => (
          <div key={m.id} className="border border-slate-200 rounded p-1.5 bg-white space-y-1 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Value</span>
              <button onClick={() => removeMarker(m.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <Row label="Value">
              <NumInput value={m.value} onChange={(v) => updateMarker(m.id, 'value', v)} small />
            </Row>
            <Row label="Label">
              <input
                className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={m.label}
                onChange={(e) => updateMarker(m.id, 'label', e.target.value)}
              />
            </Row>
            <Row label="Style">
              <ToggleBtn
                active={m.style === 'closed'}
                onClick={() => updateMarker(m.id, 'style', m.style === 'closed' ? 'open' : 'closed')}
              >
                {m.style === 'closed' ? '● Closed' : '○ Open'}
              </ToggleBtn>
            </Row>
            <Row label="Show lbl">
              <ToggleBtn active={m.showLabel} onClick={() => updateMarker(m.id, 'showLabel', !m.showLabel)}>
                {m.showLabel ? 'On' : 'Off'}
              </ToggleBtn>
            </Row>
          </div>
        ))}
      </Section>

      <Section
        title="Regions"
        action={
          <button onClick={addRegion} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {regions.length === 0 && (
          <p className="text-[10px] text-slate-400">No regions — click + to add</p>
        )}
        {regions.map((r) => (
          <div key={r.id} className="border border-slate-200 rounded p-1.5 bg-white space-y-1 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Region</span>
              <button onClick={() => removeRegion(r.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <Row label="From">
              <NumInput value={r.fromValue} onChange={(v) => updateRegion(r.id, 'fromValue', v)} small />
            </Row>
            <Row label="To">
              <NumInput value={r.toValue} onChange={(v) => updateRegion(r.id, 'toValue', v)} small />
            </Row>
            <Row label="Colour">
              <ColorInput value={r.color} onChange={(v) => updateRegion(r.id, 'color', v)} />
            </Row>
          </div>
        ))}
      </Section>
    </>
  );
}

// ---------- Venn Diagram ----------
function VennDiagramProperties({
  obj,
  update,
}: {
  obj: VennDiagramObject;
  update: (u: Partial<VennDiagramObject>) => void;
}) {
  const { circleA, circleB, regionLabels, universalSet, style } = obj;

  const updateRegionLabel = (key: keyof typeof regionLabels, field: string, value: unknown) =>
    update({ regionLabels: { ...regionLabels, [key]: { ...regionLabels[key], [field]: value } } });

  return (
    <>
      <Section title="Style">
        <Row label="Stroke">
          <ColorInput value={style.stroke} onChange={(v) => update({ style: { ...style, stroke: v } })} />
        </Row>
        <Row label="Font sz">
          <NumInput value={style.fontSize} onChange={(v) => update({ style: { ...style, fontSize: v } })} small />
        </Row>
      </Section>

      <Section title="Circle A">
        <Row label="Label">
          <input
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            value={circleA.label}
            onChange={(e) => update({ circleA: { ...circleA, label: e.target.value } })}
          />
        </Row>
        <Row label="Colour">
          <ColorInput value={circleA.color} onChange={(v) => update({ circleA: { ...circleA, color: v } })} />
        </Row>
        <Row label="Opacity">
          <NumInput value={Math.round(circleA.opacity * 100)} onChange={(v) => update({ circleA: { ...circleA, opacity: Math.min(1, Math.max(0, v / 100)) } })} small />
          <span className="text-[10px] text-slate-400">%</span>
        </Row>
      </Section>

      <Section title="Circle B">
        <Row label="Label">
          <input
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            value={circleB.label}
            onChange={(e) => update({ circleB: { ...circleB, label: e.target.value } })}
          />
        </Row>
        <Row label="Colour">
          <ColorInput value={circleB.color} onChange={(v) => update({ circleB: { ...circleB, color: v } })} />
        </Row>
        <Row label="Opacity">
          <NumInput value={Math.round(circleB.opacity * 100)} onChange={(v) => update({ circleB: { ...circleB, opacity: Math.min(1, Math.max(0, v / 100)) } })} small />
          <span className="text-[10px] text-slate-400">%</span>
        </Row>
      </Section>

      <Section title="Region Labels">
        {(
          [
            ['aOnly', 'A only'],
            ['intersection', 'Intersect'],
            ['bOnly', 'B only'],
            ['outside', 'Outside'],
          ] as [keyof typeof regionLabels, string][]
        ).map(([key, label]) => (
          <div key={key} className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-slate-500">{label}</span>
              <ToggleBtn
                active={regionLabels[key].show}
                onClick={() => updateRegionLabel(key, 'show', !regionLabels[key].show)}
              >
                {regionLabels[key].show ? 'Shown' : 'Hidden'}
              </ToggleBtn>
            </div>
            <input
              className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={regionLabels[key].text}
              placeholder="e.g. 12, {2,4,6}…"
              onChange={(e) => updateRegionLabel(key, 'text', e.target.value)}
            />
          </div>
        ))}
      </Section>

      <Section title="Universal Set">
        <Row label="Label">
          <input
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            value={universalSet.label}
            onChange={(e) => update({ universalSet: { ...universalSet, label: e.target.value } })}
          />
        </Row>
        <Row label="Show">
          <ToggleBtn active={universalSet.show} onClick={() => update({ universalSet: { ...universalSet, show: !universalSet.show } })}>
            {universalSet.show ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>
    </>
  );
}

// ---------- Bar Chart ----------
function BarChartProperties({
  obj,
  update,
}: {
  obj: BarChartObject;
  update: (u: Partial<BarChartObject>) => void;
}) {
  const { bars, mode, xLabel, yLabel, yMax, showValues, barColor, style } = obj;

  const addBar = () => {
    const b: BarChartBar = { id: crypto.randomUUID(), label: '', value: 1, color: '' };
    update({ bars: [...bars, b] });
  };

  const updateBar = (id: string, field: string, value: unknown) =>
    update({ bars: bars.map((b) => (b.id === id ? { ...b, [field]: value } : b)) });

  const removeBar = (id: string) =>
    update({ bars: bars.filter((b) => b.id !== id) });

  return (
    <>
      <Section title="Chart">
        <Row label="Mode">
          <ToggleBtn active={mode === 'bar'} onClick={() => update({ mode: 'bar' })}>Bar</ToggleBtn>
          <ToggleBtn active={mode === 'histogram'} onClick={() => update({ mode: 'histogram' })}>Hist</ToggleBtn>
        </Row>
        <Row label="X label">
          <input className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400" value={xLabel} onChange={(e) => update({ xLabel: e.target.value })} />
        </Row>
        <Row label="Y label">
          <input className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400" value={yLabel} onChange={(e) => update({ yLabel: e.target.value })} />
        </Row>
        <Row label="Y max">
          <input
            type="number"
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            value={yMax ?? ''}
            placeholder="auto"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              update({ yMax: isNaN(v) ? null : v });
            }}
          />
        </Row>
        <Row label="Values">
          <ToggleBtn active={showValues} onClick={() => update({ showValues: !showValues })}>
            {showValues ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section title="Style">
        <Row label="Bar colour">
          <ColorInput value={barColor} onChange={(v) => update({ barColor: v })} />
        </Row>
        <Row label="Stroke">
          <ColorInput value={style.stroke} onChange={(v) => update({ style: { ...style, stroke: v } })} />
        </Row>
        <Row label="Font sz">
          <NumInput value={style.fontSize} onChange={(v) => update({ style: { ...style, fontSize: v } })} small />
        </Row>
      </Section>

      <Section
        title="Bars"
        action={
          <button onClick={addBar} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {bars.map((b) => (
          <div key={b.id} className="flex items-center gap-1 mb-1">
            <input
              className="flex-1 min-w-0 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={b.label}
              placeholder="Label"
              onChange={(e) => updateBar(b.id, 'label', e.target.value)}
            />
            <NumInput value={b.value} onChange={(v) => updateBar(b.id, 'value', v)} small />
            <input
              type="color"
              title="Override bar colour (blank = default)"
              className="w-5 h-5 rounded border border-slate-200 cursor-pointer p-0 shrink-0"
              value={b.color || barColor}
              onChange={(e) => updateBar(b.id, 'color', e.target.value)}
            />
            <button onClick={() => removeBar(b.id)} className="text-red-400 hover:text-red-600 shrink-0">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {bars.length === 0 && <p className="text-[10px] text-slate-400">No bars — click + to add</p>}
      </Section>
    </>
  );
}

// ---------- Pie Chart ----------
function PieChartProperties({
  obj,
  update,
}: {
  obj: PieChartObject;
  update: (u: Partial<PieChartObject>) => void;
}) {
  const { slices, showTitle, title, style } = obj;

  const addSlice = () => {
    const s: PieSlice = { id: crypto.randomUUID(), label: '', value: 90, color: '#94a3b8', showLabel: true, showAngle: true };
    update({ slices: [...slices, s] });
  };

  const updateSlice = (id: string, field: string, value: unknown) =>
    update({ slices: slices.map((s) => (s.id === id ? { ...s, [field]: value } : s)) });

  const removeSlice = (id: string) =>
    update({ slices: slices.filter((s) => s.id !== id) });

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <>
      <Section title="Chart">
        <Row label="Title">
          <ToggleBtn active={showTitle} onClick={() => update({ showTitle: !showTitle })}>
            {showTitle ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        {showTitle && (
          <Row label="Text">
            <input className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400" value={title} onChange={(e) => update({ title: e.target.value })} />
          </Row>
        )}
        <Row label="Font sz">
          <NumInput value={style.fontSize} onChange={(v) => update({ style: { ...style, fontSize: v } })} small />
        </Row>
        <p className="text-[10px] text-slate-400 pt-0.5">Total: {total}° ({total === 360 ? '✓' : `${360 - total}° remaining`})</p>
      </Section>

      <Section
        title="Slices"
        action={
          <button onClick={addSlice} className="text-emerald-600 hover:text-emerald-800">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {slices.map((s) => (
          <div key={s.id} className="border border-slate-200 rounded p-1.5 bg-white mb-1 space-y-1">
            <div className="flex items-center gap-1">
              <input
                className="flex-1 min-w-0 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={s.label}
                placeholder="Label"
                onChange={(e) => updateSlice(s.id, 'label', e.target.value)}
              />
              <input
                type="color"
                className="w-5 h-5 rounded border border-slate-200 cursor-pointer p-0 shrink-0"
                value={s.color}
                onChange={(e) => updateSlice(s.id, 'color', e.target.value)}
              />
              <button onClick={() => removeSlice(s.id)} className="text-red-400 hover:text-red-600 shrink-0">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <Row label="Angle°">
              <NumInput value={s.value} onChange={(v) => updateSlice(s.id, 'value', Math.max(1, v))} small />
            </Row>
            <div className="flex gap-1">
              <ToggleBtn active={s.showLabel} onClick={() => updateSlice(s.id, 'showLabel', !s.showLabel)}>Label</ToggleBtn>
              <ToggleBtn active={s.showAngle} onClick={() => updateSlice(s.id, 'showAngle', !s.showAngle)}>Angle</ToggleBtn>
            </div>
          </div>
        ))}
        {slices.length === 0 && <p className="text-[10px] text-slate-400">No slices — click + to add</p>}
      </Section>
    </>
  );
}

// ---------- Probability Tree ----------
function ProbTreeProperties({
  obj,
  update,
}: {
  obj: ProbTreeObject;
  update: (u: Partial<ProbTreeObject>) => void;
}) {
  const { nodes, showOutcomes, showProducts } = obj;

  const root = nodes.find((n) => n.parentId === null);

  const updateNode = (id: string, field: keyof ProbTreeNode, value: string) =>
    update({ nodes: nodes.map((n) => (n.id === id ? { ...n, [field]: value } : n)) });

  const addBranch = (parentId: string) => {
    const sibs = nodes.filter((n) => n.parentId === parentId);
    const newNode: ProbTreeNode = {
      id: crypto.randomUUID(),
      parentId,
      label: String.fromCharCode(65 + sibs.length),
      probability: '1/' + (sibs.length + 1),
      outcome: '',
    };
    update({ nodes: [...nodes, newNode] });
  };

  const removeNode = (id: string) => {
    // Remove node and all its descendants
    const toRemove = new Set<string>();
    const mark = (nid: string) => {
      toRemove.add(nid);
      nodes.filter((n) => n.parentId === nid).forEach((n) => mark(n.id));
    };
    mark(id);
    update({ nodes: nodes.filter((n) => !toRemove.has(n.id)) });
  };

  // Render nodes grouped by level
  const nonRoot = nodes.filter((n) => n.parentId !== null);

  return (
    <>
      <Section title="Options">
        <Row label="Outcomes">
          <ToggleBtn active={showOutcomes} onClick={() => update({ showOutcomes: !showOutcomes })}>
            {showOutcomes ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Products">
          <ToggleBtn active={showProducts} onClick={() => update({ showProducts: !showProducts })}>
            {showProducts ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section
        title="Branches"
        action={
          root ? (
            <button onClick={() => addBranch(root.id)} className="text-emerald-600 hover:text-emerald-800" title="Add first-stage branch">
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      >
        {nonRoot.map((node) => {
          const isLeaf = nodes.filter((n) => n.parentId === node.id).length === 0;
          const depth = (() => {
            let d = 0, cur: ProbTreeNode | undefined = node;
            while (cur?.parentId !== null) { d++; cur = nodes.find((n) => n.id === cur!.parentId); }
            return d;
          })();
          return (
            <div key={node.id} className="mb-1 border border-slate-200 rounded p-1.5 bg-white" style={{ marginLeft: (depth - 1) * 8 }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-400">Level {depth}</span>
                <div className="flex gap-1">
                  {isLeaf && (
                    <button onClick={() => addBranch(node.id)} className="text-emerald-500 hover:text-emerald-700" title="Add child branch">
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                  <button onClick={() => removeNode(node.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <Row label="Label">
                <input
                  className="w-20 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  value={node.label}
                  onChange={(e) => updateNode(node.id, 'label', e.target.value)}
                />
              </Row>
              <Row label="P(branch)">
                <input
                  className="w-20 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  value={node.probability}
                  placeholder="e.g. 1/3"
                  onChange={(e) => updateNode(node.id, 'probability', e.target.value)}
                />
              </Row>
              {isLeaf && showOutcomes && (
                <Row label="Outcome">
                  <input
                    className="w-20 border border-slate-200 rounded px-1 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    value={node.outcome}
                    placeholder="e.g. HH"
                    onChange={(e) => updateNode(node.id, 'outcome', e.target.value)}
                  />
                </Row>
              )}
            </div>
          );
        })}
        {nonRoot.length === 0 && <p className="text-[10px] text-slate-400">Click + to add branches</p>}
      </Section>
    </>
  );
}

// ---------- Bearing ----------
function BearingProperties({
  obj,
  update,
}: {
  obj: BearingObject;
  update: (u: Partial<BearingObject>) => void;
}) {
  const { bearing, showNorthLine, showBearingLine, showArc, showLabel, northLabel, bearingLabel, arcRadius, style } = obj;

  return (
    <>
      <Section title="Bearing">
        <Row label="Bearing°">
          <NumInput
            value={bearing}
            onChange={(v) => update({ bearing: Math.min(359, Math.max(0, Math.round(v))) })}
            small
          />
        </Row>
        <Row label="Arc radius">
          <NumInput value={arcRadius} onChange={(v) => update({ arcRadius: Math.max(10, v) })} small />
        </Row>
      </Section>

      <Section title="Show">
        <Row label="North line">
          <ToggleBtn active={showNorthLine} onClick={() => update({ showNorthLine: !showNorthLine })}>
            {showNorthLine ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Bear. line">
          <ToggleBtn active={showBearingLine} onClick={() => update({ showBearingLine: !showBearingLine })}>
            {showBearingLine ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Arc">
          <ToggleBtn active={showArc} onClick={() => update({ showArc: !showArc })}>
            {showArc ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
        <Row label="Label">
          <ToggleBtn active={showLabel} onClick={() => update({ showLabel: !showLabel })}>
            {showLabel ? 'On' : 'Off'}
          </ToggleBtn>
        </Row>
      </Section>

      <Section title="Labels">
        <Row label="North">
          <input
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            value={northLabel}
            onChange={(e) => update({ northLabel: e.target.value })}
          />
        </Row>
        <Row label="Bear.">
          <input
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            value={bearingLabel}
            placeholder="auto"
            onChange={(e) => update({ bearingLabel: e.target.value })}
          />
        </Row>
        <Row label="Stroke">
          <ColorInput value={style.stroke} onChange={(v) => update({ style: { ...style, stroke: v } })} />
        </Row>
        <Row label="Font sz">
          <NumInput value={style.fontSize} onChange={(v) => update({ style: { ...style, fontSize: v } })} small />
        </Row>
      </Section>
    </>
  );
}

// ---------- Primitives ----------
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500 w-12 shrink-0">{label}</span>
      <div className="flex items-center gap-1 flex-1">{children}</div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  small,
}: {
  value: number;
  onChange: (v: number) => void;
  small?: boolean;
}) {
  return (
    <input
      type="number"
      className={cn(
        'border border-slate-200 rounded px-1.5 py-0.5 text-xs tabular-nums bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400',
        small ? 'w-16' : 'w-20'
      )}
      value={value}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'px-1.5 py-0.5 rounded text-xs border transition-colors',
        active
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
      )}
    >
      {children}
    </button>
  );
}
