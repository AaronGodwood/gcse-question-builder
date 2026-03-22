import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Download, Trash2, BookPlus, Upload } from 'lucide-react';
import { cn, toSuperscript } from '@/lib/cn';
import type { Question } from '@/types/question';
import { useQuestions } from '@/hooks/useQuestions';
import { useWorksheetStore } from '@/stores/worksheetStore';
import { FilterPanel } from './FilterPanel';
import { QuestionCard } from './QuestionCard';
import { ImportExport } from './ImportExport';

type ViewMode = 'grid' | 'list';

const GRADE_COLOURS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600', 2: 'bg-slate-100 text-slate-600',
  3: 'bg-yellow-100 text-yellow-700', 4: 'bg-yellow-100 text-yellow-700',
  5: 'bg-orange-100 text-orange-700', 6: 'bg-orange-100 text-orange-700',
  7: 'bg-emerald-100 text-emerald-700', 8: 'bg-emerald-100 text-emerald-700',
  9: 'bg-purple-100 text-purple-700',
};

export function QuestionBrowser() {
  const navigate = useNavigate();
  const {
    questions, loading, filters, setFilters, resetFilters,
    sort, setSort, deleteQuestion, duplicateQuestion,
  } = useQuestions();

  const { addQuestion } = useWorksheetStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImportExport, setShowImportExport] = useState(false);

  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedIds((prev) => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      }
      if (prev.size === 1 && prev.has(id)) return new Set();
      return new Set([id]);
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteQuestion(id);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteQuestion]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) await deleteQuestion(id);
    setSelectedIds(new Set());
  }, [selectedIds, deleteQuestion]);

  const handleDuplicate = useCallback((id: string) => duplicateQuestion(id), [duplicateQuestion]);

  const handleExport = useCallback((question: Question) => {
    const blob = new Blob([JSON.stringify(question, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${question.title || 'question'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleBulkExport = useCallback(() => {
    const selected = questions.filter((q) => selectedIds.has(q.id));
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [questions, selectedIds]);

  const handleAddBulkToWorksheet = useCallback(() => {
    for (const id of selectedIds) addQuestion(id);
  }, [selectedIds, addQuestion]);

  const selectAll = () => setSelectedIds(new Set(questions.map((q) => q.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left filter sidebar */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        sort={sort}
        setSort={setSort}
        totalCount={questions.length}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            {hasSelection ? (
              <>
                <span className="text-sm text-slate-600 font-medium">{selectedIds.size} selected</span>
                <button
                  onClick={handleAddBulkToWorksheet}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <BookPlus className="h-3.5 w-3.5" />
                  Add to worksheet
                </button>
                <button
                  onClick={handleBulkExport}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Deselect all
                </button>
              </>
            ) : (
              <button
                onClick={selectAll}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Select all ({questions.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportExport(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Import / Export
            </button>

            {/* View toggle */}
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'h-7 w-7 flex items-center justify-center transition-colors',
                  viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'
                )}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-7 w-7 flex items-center justify-center transition-colors',
                  viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'
                )}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : questions.length === 0 ? (
            <EmptyState />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selected={selectedIds.has(q.id)}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                />
              ))}
            </div>
          ) : (
            <ListView
              questions={questions}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onAddToWorksheet={(id) => addQuestion(id)}
              navigate={navigate}
            />
          )}
        </div>
      </div>

      {showImportExport && (
        <ImportExport onClose={() => setShowImportExport(false)} />
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

type NavigateFn = ReturnType<typeof useNavigate>;

function ListView({
  questions, selectedIds, onSelect, onDelete, onDuplicate, onExport, onAddToWorksheet, navigate,
}: {
  questions: Question[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (q: Question) => void;
  onAddToWorksheet: (id: string) => void;
  navigate: NavigateFn;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1.5fr_1fr_5rem_5rem_5rem_7rem] gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        <span>Title / Topic</span>
        <span>Question</span>
        <span>Grade</span>
        <span>Marks</span>
        <span>Calculator</span>
        <span />
      </div>
      {questions.map((q) => (
        <ListRow
          key={q.id}
          question={q}
          selected={selectedIds.has(q.id)}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onExport={onExport}
          onAddToWorksheet={onAddToWorksheet}
          navigate={navigate}
        />
      ))}
    </div>
  );
}

function ListRow({
  question: q, selected, onSelect, onDelete, onDuplicate, onExport, onAddToWorksheet, navigate,
}: {
  question: Question;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (q: Question) => void;
  onAddToWorksheet: (id: string) => void;
  navigate: NavigateFn;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(q.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div
      className={cn(
        'group grid grid-cols-[1.5fr_1fr_5rem_5rem_5rem_7rem] gap-2 px-3 py-2.5 border-b border-slate-100 last:border-0 items-center',
        selected ? 'bg-emerald-50' : 'hover:bg-slate-50'
      )}
    >
      {/* Title + topic */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="shrink-0 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect(q.id, e.shiftKey || e.ctrlKey); }}
        >
          <div className={cn(
            'w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors',
            selected ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300 opacity-0 group-hover:opacity-100'
          )}>
            {selected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{q.title || 'Untitled'}</p>
          {q.topic && (
            <p className="text-[10px] text-slate-400 truncate">
              {q.topic}{q.subtopic ? ` · ${q.subtopic}` : ''}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 line-clamp-2">{q.question_text ? toSuperscript(q.question_text) : '—'}</p>

      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit', GRADE_COLOURS[q.target_grade] ?? 'bg-slate-100 text-slate-600')}>
        Grade {q.target_grade}
      </span>

      <span className="text-xs text-slate-600">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>

      <span className="text-xs text-slate-600">
        {q.calculator === 'either' ? '—' : q.calculator === 'calculator' ? 'Calc' : 'Non-calc'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ListRowBtn title="Edit" onClick={() => { sessionStorage.setItem('load_question_id', q.id); navigate('/builder'); }} />
        <ListRowBtn title="Add to worksheet" onClick={() => onAddToWorksheet(q.id)} />
        <ListRowBtn title="Duplicate" onClick={() => onDuplicate(q.id)} />
        <ListRowBtn title="Export JSON" onClick={() => onExport(q)} />
        <ListRowBtn
          title={confirmDelete ? 'Confirm delete' : 'Delete'}
          onClick={handleDelete}
          danger
        />
      </div>
    </div>
  );
}

const LIST_ROW_ICONS: Record<string, string> = {
  Edit: '✏️',
  'Add to worksheet': '📋',
  Duplicate: '⧉',
  'Export JSON': '⬇',
  Delete: '🗑',
  'Confirm delete': '🗑',
};

function ListRowBtn({ title, onClick, danger }: { title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'h-6 w-6 flex items-center justify-center rounded text-sm transition-colors',
        danger ? 'hover:bg-red-50' : 'hover:bg-slate-100'
      )}
    >
      {LIST_ROW_ICONS[title] ?? '•'}
    </button>
  );
}

// ─── Empty / loading ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-lg font-medium">No questions found</p>
      <p className="text-sm mt-1">Adjust your filters or create a question in the Builder.</p>
    </div>
  );
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return viewMode === 'grid' ? (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse">
          <div className="h-36 bg-slate-100" />
          <div className="p-2.5 space-y-2">
            <div className="h-3 bg-slate-100 rounded w-3/4" />
            <div className="h-2 bg-slate-100 rounded w-full" />
            <div className="h-2 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="border border-slate-200 rounded-lg overflow-hidden animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-50 border-b border-slate-100 last:border-0" />
      ))}
    </div>
  );
}
