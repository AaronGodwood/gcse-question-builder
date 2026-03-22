import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Stage,
  Layer,
  Line,
  Rect,
  Transformer,
} from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { ShapeObject } from './shapes/ShapeObject';
import { TextObject } from './text/TextObject';
import { MarkBox } from './markbox/MarkBox';
import { GraphObject } from './graph/GraphObject';
import { CircleDiagramObject } from './shapes/CircleDiagramObject';
import { TableObject } from './table/TableObject';
import { NumberLineObject } from './numberline/NumberLineObject';
import { VennDiagramObject } from './venn/VennDiagramObject';
import { BarChartObject } from './charts/BarChartObject';
import { PieChartObject } from './charts/PieChartObject';
import { ProbTreeObject } from './probtree/ProbTreeObject';
import { BearingObject } from './bearing/BearingObject';
import type {
  CanvasObject,
  ShapeObject as ShapeObjectType,
  TextObject as TextObjectType,
  MarkBoxObject,
  GraphObject as GraphObjectType,
  CircleDiagramObject as CircleDiagramObjectType,
  TableObject as TableObjectType,
  NumberLineObject as NumberLineObjectType,
  VennDiagramObject as VennDiagramObjectType,
  BarChartObject as BarChartObjectType,
  PieChartObject as PieChartObjectType,
  ProbTreeObject as ProbTreeObjectType,
  BearingObject as BearingObjectType,
} from '@/types/canvas';

const CANVAS_WIDTH = 794;   // A4 width at 96dpi
const CANVAS_HEIGHT = 1123; // A4 height at 96dpi
const GRID_SIZE = 20;

interface Props {
  showGrid: boolean;
  onObjectSelect: (obj: CanvasObject | null) => void;
}

export function Canvas({ showGrid, onObjectSelect }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const selectionRectRef = useRef<Konva.Rect>(null);

  const [stagePos, setStagePos] = useState({ x: 40, y: 40 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{
    x: number; y: number; w: number; h: number; visible: boolean;
  }>({ x: 0, y: 0, w: 0, h: 0, visible: false });
  const selectionStartRef = useRef({ x: 0, y: 0 });

  const { objects, selectedIds, setSelectedIds, updateObject, pushHistory } = useCanvasStore();

  // Sync Transformer to selected nodes
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    const selectedNodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    tr.nodes(selectedNodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, objects]);

  // Notify parent of selection change
  useEffect(() => {
    if (selectedIds.length === 1) {
      const obj = objects.find((o) => o.id === selectedIds[0]) ?? null;
      onObjectSelect(obj);
    } else {
      onObjectSelect(null);
    }
  }, [selectedIds, objects, onObjectSelect]);

  // ---------- Zoom ----------
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.08;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition()!;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(4, Math.max(0.25, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [stageScale, stagePos]);

  // ---------- Pan (middle mouse / space+drag) ----------
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX - stagePos.x, y: e.evt.clientY - stagePos.y });
      return;
    }

    // Marquee selection starts on empty canvas area
    const clickedOnEmpty = e.target === e.target.getStage() ||
      e.target.name() === 'canvas-bg' ||
      e.target.name() === 'grid-line';

    if (!clickedOnEmpty) return;

    const stage = stageRef.current!;
    const pos = stage.getRelativePointerPosition()!;
    selectionStartRef.current = pos;
    setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0, visible: true });
    setSelectedIds([]);
  }, [stagePos, setSelectedIds]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      setStagePos({ x: e.evt.clientX - panStart.x, y: e.evt.clientY - panStart.y });
      return;
    }

    if (!selectionRect.visible) return;
    const stage = stageRef.current!;
    const pos = stage.getRelativePointerPosition()!;
    const start = selectionStartRef.current;
    setSelectionRect({
      x: Math.min(pos.x, start.x),
      y: Math.min(pos.y, start.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
      visible: true,
    });
  }, [isPanning, panStart, selectionRect.visible]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) { setIsPanning(false); return; }
    if (!selectionRect.visible) return;

    const box = selectionRect;

    if (box.w > 4 && box.h > 4) {
      const selected = objects.filter((obj) => {
        return (
          obj.x < box.x + box.w &&
          obj.x + obj.width > box.x &&
          obj.y < box.y + box.h &&
          obj.y + obj.height > box.y
        );
      });
      setSelectedIds(selected.map((o) => o.id));
    }

    setSelectionRect((r) => ({ ...r, visible: false }));
  }, [isPanning, selectionRect, objects, setSelectedIds]);

  // ---------- Deselect on stage click ----------
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'canvas-bg' || e.target.name() === 'grid-line') {
      setSelectedIds([]);
    }
  }, [setSelectedIds]);

  // ---------- Grid lines ----------
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      gridLines.push(
        <Line
          key={`vg-${x}`}
          name="grid-line"
          points={[x, 0, x, CANVAS_HEIGHT]}
          stroke="#e8e8e8"
          strokeWidth={x % 100 === 0 ? 0.75 : 0.4}
          listening={false}
        />
      );
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      gridLines.push(
        <Line
          key={`hg-${y}`}
          name="grid-line"
          points={[0, y, CANVAS_WIDTH, y]}
          stroke="#e8e8e8"
          strokeWidth={y % 100 === 0 ? 0.75 : 0.4}
          listening={false}
        />
      );
    }
  }

  // ---------- Sorted objects by zIndex ----------
  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex-1 overflow-hidden bg-slate-300 flex items-start justify-start">
      <Stage
        ref={stageRef}
        width={window.innerWidth - 260 - 280} // subtract sidebars
        height={window.innerHeight - 56}      // subtract header
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        {/* Canvas page (A4 white background) */}
        <Layer>
          <Rect
            name="canvas-bg"
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="white"
            shadowColor="rgba(0,0,0,0.25)"
            shadowBlur={20}
            shadowOffset={{ x: 0, y: 4 }}
          />
          {gridLines}
        </Layer>

        {/* Objects layer */}
        <Layer>
          {sortedObjects.map((obj) => {
            const isSelected = selectedIds.includes(obj.id);

            const handleSelect = (e: Konva.KonvaEventObject<MouseEvent>) => {
              e.cancelBubble = true;
              if (e.evt.shiftKey) {
                setSelectedIds(
                  isSelected
                    ? selectedIds.filter((id) => id !== obj.id)
                    : [...selectedIds, obj.id]
                );
              } else {
                setSelectedIds([obj.id]);
              }
            };

            const handleChange = (updates: Partial<CanvasObject>) => {
              updateObject(obj.id, updates);
            };

            if (obj.type === 'shape') {
              return (
                <ShapeObject
                  key={obj.id}
                  shape={obj as ShapeObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'text') {
              return (
                <TextObject
                  key={obj.id}
                  obj={obj as TextObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'mark-box') {
              return (
                <MarkBox
                  key={obj.id}
                  obj={obj as MarkBoxObject}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'graph') {
              return (
                <GraphObject
                  key={obj.id}
                  graph={obj as GraphObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'circle-diagram') {
              return (
                <CircleDiagramObject
                  key={obj.id}
                  diagram={obj as CircleDiagramObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'table') {
              return (
                <TableObject
                  key={obj.id}
                  table={obj as TableObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'number-line') {
              return (
                <NumberLineObject
                  key={obj.id}
                  obj={obj as NumberLineObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'venn-diagram') {
              return (
                <VennDiagramObject
                  key={obj.id}
                  obj={obj as VennDiagramObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'bar-chart') {
              return (
                <BarChartObject
                  key={obj.id}
                  obj={obj as BarChartObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'pie-chart') {
              return (
                <PieChartObject
                  key={obj.id}
                  obj={obj as PieChartObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'prob-tree') {
              return (
                <ProbTreeObject
                  key={obj.id}
                  obj={obj as ProbTreeObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            if (obj.type === 'bearing') {
              return (
                <BearingObject
                  key={obj.id}
                  obj={obj as BearingObjectType}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onChange={(u) => handleChange(u)}
                />
              );
            }
            return null;
          })}

          {/* Transformer for resize/rotate */}
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox;
              return newBox;
            }}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
            onTransformEnd={() => pushHistory()}
          />
        </Layer>

        {/* Marquee selection rect */}
        <Layer>
          <Rect
            ref={selectionRectRef}
            x={selectionRect.x}
            y={selectionRect.y}
            width={selectionRect.w}
            height={selectionRect.h}
            fill="rgba(0, 150, 255, 0.08)"
            stroke="#0096ff"
            strokeWidth={1}
            dash={[4, 3]}
            visible={selectionRect.visible}
            listening={false}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export { CANVAS_WIDTH, CANVAS_HEIGHT };
