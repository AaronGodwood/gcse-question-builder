import { Group, Rect, Line, Text, Circle } from 'react-konva';
import type Konva from 'konva';
import type { ProbTreeObject as ProbTreeObjectType, ProbTreeNode } from '@/types/canvas';

interface Props {
  obj: ProbTreeObjectType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<ProbTreeObjectType>) => void;
}

// Layout constants
const NODE_R   = 4;    // dot radius at branch junction
const PAD_L    = 12;   // left padding
const PAD_R    = 48;   // right padding for outcome labels
const PAD_V    = 16;   // vertical padding top/bottom

export function ProbTreeObject({ obj, isSelected, onSelect, onChange }: Props) {
  const { nodes, showOutcomes, showProducts, style } = obj;
  const W = obj.width;
  const H = obj.height;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>
    onChange({ x: e.target.x(), y: e.target.y() });

  // Build tree structure: children map
  const childrenOf = new Map<string | null, ProbTreeNode[]>();
  for (const n of nodes) {
    const key = n.parentId;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(n);
  }

  const root = nodes.find((n) => n.parentId === null);
  if (!root) return null;

  // Compute depth (max levels below root)
  const depth = (id: string): number => {
    const kids = childrenOf.get(id) ?? [];
    if (kids.length === 0) return 0;
    return 1 + Math.max(...kids.map((k) => depth(k.id)));
  };
  const treeDepth = depth(root.id);

  // Count leaves for vertical spacing
  const leafCount = (id: string): number => {
    const kids = childrenOf.get(id) ?? [];
    if (kids.length === 0) return 1;
    return kids.reduce((s, k) => s + leafCount(k.id), 0);
  };
  const totalLeaves = leafCount(root.id);

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_V * 2;
  const colW  = treeDepth > 0 ? plotW / treeDepth : plotW;

  // Assign y positions via leaf-counting
  const positions = new Map<string, { x: number; y: number }>();

  const assignPositions = (id: string, col: number, yStart: number, yEnd: number) => {
    const cx = PAD_L + col * colW;
    const cy = (yStart + yEnd) / 2;
    positions.set(id, { x: cx, y: cy });

    const kids = childrenOf.get(id) ?? [];
    let cursor = yStart;
    for (const kid of kids) {
      const lc = leafCount(kid.id);
      const span = (lc / totalLeaves) * plotH;
      assignPositions(kid.id, col + 1, cursor, cursor + span);
      cursor += span;
    }
  };
  assignPositions(root.id, 0, PAD_V, PAD_V + plotH);

  // Render edges + labels
  const edges: React.ReactNode[] = [];
  const nodeEls: React.ReactNode[] = [];

  for (const node of nodes) {
    if (node.parentId === null) continue;
    const from = positions.get(node.parentId);
    const to   = positions.get(node.id);
    if (!from || !to) continue;

    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;

    // Perpendicular offset for probability label — push label away from the line
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Unit perpendicular (rotate 90° CCW): (-dy/len, dx/len)
    const perpX = -dy / len;
    const perpY =  dx / len;
    // Always offset upward/left: flip if perpendicular points downward
    const sign = perpY > 0 ? -1 : 1;
    const LABEL_OFFSET = style.fontSize + 3;

    edges.push(
      <Line
        key={`e-${node.id}`}
        points={[from.x, from.y, to.x, to.y]}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        listening={false}
      />
    );

    // Probability label — offset perpendicular to the branch, away from the line
    if (node.probability) {
      edges.push(
        <Text
          key={`p-${node.id}`}
          x={mx + sign * perpX * LABEL_OFFSET - 24}
          y={my + sign * perpY * LABEL_OFFSET - style.fontSize / 2}
          width={48}
          text={node.probability}
          fontSize={style.fontSize}
          fontFamily="Arial"
          fill={style.stroke}
          align="center"
          listening={false}
        />
      );
    }

    // Outcome label — above the endpoint, clear of the dot and incoming branches
    if (node.label) {
      nodeEls.push(
        <Text
          key={`lbl-${node.id}`}
          x={to.x - 20}
          y={to.y - style.fontSize - NODE_R - 3}
          width={40}
          text={node.label}
          fontSize={style.fontSize}
          fontFamily="Arial"
          fontStyle="bold"
          fill={style.stroke}
          align="center"
          listening={false}
        />
      );
    }

    // Leaf: show outcome + product
    const isLeaf = (childrenOf.get(node.id) ?? []).length === 0;
    if (isLeaf) {
      const outcomeX = W - PAD_R + 4;

      if (showOutcomes && node.outcome) {
        nodeEls.push(
          <Text
            key={`out-${node.id}`}
            x={outcomeX}
            y={to.y - style.fontSize / 2}
            width={PAD_R - 6}
            text={node.outcome}
            fontSize={style.fontSize}
            fontFamily="Arial"
            fill={style.stroke}
            listening={false}
          />
        );
      }

      if (showProducts) {
        // Walk up to collect probabilities for this leaf path
        const probs: string[] = [];
        let cur: ProbTreeNode | undefined = node;
        while (cur && cur.parentId !== null) {
          if (cur.probability) probs.unshift(cur.probability);
          cur = nodes.find((n) => n.id === cur!.parentId);
        }
        if (probs.length > 0) {
          nodeEls.push(
            <Text
              key={`prod-${node.id}`}
              x={outcomeX}
              y={to.y + style.fontSize / 2 + 1}
              width={PAD_R - 6}
              text={probs.join('×')}
              fontSize={style.fontSize - 1}
              fontFamily="Arial"
              fill="#6b7280"
              listening={false}
            />
          );
        }
      }
    }
  }

  // Junction dots
  for (const [id, pos] of positions.entries()) {
    if (id === root.id) continue;
    const hasKids = (childrenOf.get(id) ?? []).length > 0;
    if (hasKids) {
      nodeEls.push(
        <Circle
          key={`dot-${id}`}
          x={pos.x}
          y={pos.y}
          radius={NODE_R}
          fill={style.stroke}
          listening={false}
        />
      );
    }
  }

  return (
    <Group
      id={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      scaleX={obj.scaleX}
      scaleY={obj.scaleY}
      draggable={!obj.locked}
      onClick={onSelect}
      onDragEnd={handleDragEnd}
    >
      {edges}
      {nodeEls}

      {isSelected && (
        <Rect x={0} y={0} width={W} height={H} stroke="#0096ff" strokeWidth={1.5} dash={[4, 3]} fill="transparent" listening={false} />
      )}
      <Rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
