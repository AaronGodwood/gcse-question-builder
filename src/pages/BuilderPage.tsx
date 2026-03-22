import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@/components/builder/Canvas';
import { ObjectPalette } from '@/components/builder/ObjectPalette';
import { PropertyPanel } from '@/components/builder/PropertyPanel';
import { Toolbar } from '@/components/builder/Toolbar';
import { MetadataPanel } from '@/components/builder/MetadataPanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useQuestion } from '@/hooks/useQuestion';
import type { CanvasObject } from '@/types/canvas';

export default function BuilderPage() {
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedObject, setSelectedObject] = useState<CanvasObject | null>(null);

  const { undo, redo, selectedIds, removeObjects, duplicateObjects, clearSelection } = useCanvasStore();
  const { save, load } = useQuestion();

  // If we were navigated here with a question to load (e.g. from QuestionBrowser),
  // load it once on mount.
  useEffect(() => {
    const id = sessionStorage.getItem('load_question_id');
    if (id) {
      sessionStorage.removeItem('load_question_id');
      load(id).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Ctrl+S — save (works even in inputs)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      save().catch(() => {});
      return;
    }

    if (isInput) return;

    if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
      e.preventDefault();
      removeObjects(selectedIds);
      return;
    }

    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      if (selectedIds.length > 0) duplicateObjects(selectedIds);
      return;
    }

    if (e.key === 'Escape') {
      clearSelection();
      return;
    }
  }, [undo, redo, selectedIds, removeObjects, duplicateObjects, clearSelection, save]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <ObjectPalette />

        {/* Centre column: canvas + metadata panel stacked */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Canvas
            showGrid={showGrid}
            onObjectSelect={setSelectedObject}
          />
          <MetadataPanel />
        </div>

        <PropertyPanel selected={selectedObject} />
      </div>
    </div>
  );
}
