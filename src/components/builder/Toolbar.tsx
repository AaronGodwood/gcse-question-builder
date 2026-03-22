import {
  Undo2, Redo2, Grid3X3, ZoomIn, ZoomOut,
  Save, Trash2, Copy, ChevronUp, ChevronDown, FilePlus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCanvasStore } from '@/stores/canvasStore';
import { useQuestion } from '@/hooks/useQuestion';
import { useQuestionStore } from '@/stores/questionStore';
import { useState } from 'react';

interface Props {
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
}

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export function Toolbar({ showGrid, onToggleGrid, zoom, onZoomChange }: Props) {
  const {
    undo, redo, history, historyIndex,
    selectedIds, removeObjects, duplicateObjects, reorderObject,
  } = useCanvasStore();
  const { isDirty } = useQuestionStore();
  const { save, newQuestion } = useQuestion();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedIds.length > 0;
  const singleSelected = selectedIds.length === 1;

  const cycleZoom = (dir: 1 | -1) => {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const next = dir === 1
      ? ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, idx + 1)]
      : ZOOM_LEVELS[Math.max(0, idx - 1)];
    onZoomChange(next ?? zoom);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await save();
      setSaveMsg('Saved');
    } catch {
      setSaveMsg('Error saving');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  };

  return (
    <div className="h-10 bg-slate-800 flex items-center gap-1 px-2 shrink-0">
      {/* History */}
      <ToolbarGroup>
        <ToolbarBtn icon={<Undo2 className="h-4 w-4" />} label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
        <ToolbarBtn icon={<Redo2 className="h-4 w-4" />} label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo} />
      </ToolbarGroup>

      <Divider />

      {/* Selection */}
      <ToolbarGroup>
        <ToolbarBtn
          icon={<Copy className="h-4 w-4" />}
          label="Duplicate (Ctrl+D)"
          disabled={!hasSelection}
          onClick={() => duplicateObjects(selectedIds)}
        />
        <ToolbarBtn
          icon={<Trash2 className="h-4 w-4" />}
          label="Delete (Del)"
          disabled={!hasSelection}
          onClick={() => removeObjects(selectedIds)}
          danger
        />
      </ToolbarGroup>

      <Divider />

      {/* Layers */}
      <ToolbarGroup>
        <ToolbarBtn
          icon={<ChevronUp className="h-4 w-4" />}
          label="Bring forward"
          disabled={!singleSelected}
          onClick={() => reorderObject(selectedIds[0], 'forward')}
        />
        <ToolbarBtn
          icon={<ChevronDown className="h-4 w-4" />}
          label="Send backward"
          disabled={!singleSelected}
          onClick={() => reorderObject(selectedIds[0], 'backward')}
        />
      </ToolbarGroup>

      <Divider />

      {/* Grid */}
      <ToolbarBtn
        icon={<Grid3X3 className="h-4 w-4" />}
        label="Toggle grid"
        active={showGrid}
        onClick={onToggleGrid}
      />

      <Divider />

      {/* Zoom */}
      <ToolbarGroup>
        <ToolbarBtn icon={<ZoomOut className="h-4 w-4" />} label="Zoom out" onClick={() => cycleZoom(-1)} />
        <button
          className="px-2 text-xs text-slate-300 hover:bg-slate-700 rounded h-7 min-w-[48px] tabular-nums transition-colors"
          onClick={() => onZoomChange(1)}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolbarBtn icon={<ZoomIn className="h-4 w-4" />} label="Zoom in" onClick={() => cycleZoom(1)} />
      </ToolbarGroup>

      <div className="flex-1" />

      {/* New question */}
      <ToolbarBtn
        icon={<FilePlus className="h-4 w-4" />}
        label="New question"
        onClick={newQuestion}
      />

      <Divider />

      {/* Save */}
      <div className="flex items-center gap-2">
        {saveMsg && (
          <span className={cn('text-xs', saveMsg === 'Saved' ? 'text-emerald-400' : 'text-red-400')}>
            {saveMsg}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors',
            isDirty
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300',
            saving && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : isDirty ? 'Save*' : 'Saved'}
        </button>
      </div>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-5 bg-slate-700 mx-1" />;
}

interface ToolbarBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}

function ToolbarBtn({ icon, label, onClick, disabled, active, danger }: ToolbarBtnProps) {
  return (
    <button
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded transition-colors',
        disabled
          ? 'text-slate-600 cursor-not-allowed'
          : danger
          ? 'text-slate-400 hover:bg-red-900/40 hover:text-red-400'
          : active
          ? 'bg-emerald-600/30 text-emerald-400'
          : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
      )}
    >
      {icon}
    </button>
  );
}
