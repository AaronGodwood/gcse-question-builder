import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GripVertical, Trash2, Plus, Download, Save,
  ChevronUp, ChevronDown, Settings, FileText, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { useWorksheetStore } from '@/stores/worksheetStore';
import { useWorksheet, useWorksheets } from '@/hooks/useWorksheet';
import { useAuth, isSuperAdmin } from '@/hooks/useAuth';
import { useMyTutees } from '@/hooks/useMyTutees';
import { useWorksheetAssignments } from '@/hooks/useWorksheetAssignments';
import { generateWorksheetPDF } from '@/lib/pdfExport';
import type { Question } from '@/types/question';
import type { WorksheetQuestionSettings } from '@/types/worksheet';

// ─── Main page ─────────────────────────────────────────────────────────────────

export function WorksheetBuilder() {
  const [tab, setTab] = useState<'builder' | 'saved'>('builder');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 gap-4 shrink-0">
        {(['builder', 'saved'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'builder' ? 'Worksheet Builder' : 'Saved Worksheets'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'builder' ? <BuilderTab /> : <SavedTab onLoad={() => setTab('builder')} />}
      </div>
    </div>
  );
}

// ─── Builder tab ───────────────────────────────────────────────────────────────

function BuilderTab() {
  const navigate = useNavigate();
  const store = useWorksheetStore();
  const { save, saving, newWorksheet } = useWorksheet();
  const { user, profile } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const isTutor = superAdmin || profile?.role === 'tutor';
  const [questions, setQuestions] = useState<Record<string, Question>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Load question data for all questionIds
  useEffect(() => {
    const missing = store.questionIds.filter((id) => !questions[id]);
    if (missing.length === 0) return;
    supabase
      .from('questions')
      .select('*')
      .in('id', missing)
      .then(({ data }) => {
        if (!data) return;
        setQuestions((prev) => {
          const next = { ...prev };
          for (const q of data as Question[]) next[q.id] = q;
          return next;
        });
      });
  }, [store.questionIds, questions]);

  const totalMarks = store.questionIds.reduce((sum, id) => sum + (questions[id]?.marks ?? 0), 0);

  const handleExport = async () => {
    setExporting(true);
    const items = store.questionIds
      .map((id) => {
        const q = questions[id];
        const qs = store.questionSettings.find((s) => s.question_id === id);
        if (!q || !qs) return null;
        return { question: q, settings: qs };
      })
      .filter(Boolean) as { question: Question; settings: WorksheetQuestionSettings }[];

    await generateWorksheetPDF(items, store.settings);
    setExporting(false);
  };

  // Drag reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragEnter = (idx: number) => setDragOver(idx);
  const handleDrop = () => {
    if (dragIdx === null || dragOver === null || dragIdx === dragOver) {
      setDragIdx(null); setDragOver(null); return;
    }
    const newOrder = [...store.questionIds];
    const [removed] = newOrder.splice(dragIdx, 1);
    newOrder.splice(dragOver, 0, removed);
    store.reorderQuestions(newOrder);
    setDragIdx(null); setDragOver(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const o = [...store.questionIds];
    [o[idx - 1], o[idx]] = [o[idx], o[idx - 1]];
    store.reorderQuestions(o);
  };
  const moveDown = (idx: number) => {
    if (idx === store.questionIds.length - 1) return;
    const o = [...store.questionIds];
    [o[idx], o[idx + 1]] = [o[idx + 1], o[idx]];
    store.reorderQuestions(o);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Question list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {store.questionIds.length} question{store.questionIds.length !== 1 ? 's' : ''}
              {totalMarks > 0 && ` · ${totalMarks} marks`}
            </span>
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add questions
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
            <button
              onClick={() => newWorksheet()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
            <button
              onClick={() => save()}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            {isTutor && store.currentId && (
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Assign
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={exporting || store.questionIds.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Generating PDF…' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto p-4">
          {store.questionIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-base font-medium">No questions yet</p>
              <p className="text-sm">Click "Add questions" to pick from your database.</p>
              <button
                onClick={() => setShowPicker(true)}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add questions
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl mx-auto">
              {store.questionIds.map((id, idx) => {
                const q = questions[id];
                const qs = store.questionSettings.find((s) => s.question_id === id);
                return (
                  <QuestionRow
                    key={id}
                    question={q}
                    settings={qs}
                    index={idx}
                    total={store.questionIds.length}
                    isDragOver={dragOver === idx}
                    onRemove={() => store.removeQuestion(id)}
                    onUpdateSettings={(u) => store.updateQuestionSettings(id, u)}
                    onMoveUp={() => moveUp(idx)}
                    onMoveDown={() => moveDown(idx)}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDrop={handleDrop}
                    onEditInBuilder={() => { sessionStorage.setItem('load_question_id', id); navigate('/builder'); }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPicker && <QuestionPicker onClose={() => setShowPicker(false)} />}
      {showSettings && <WorksheetSettingsModal onClose={() => setShowSettings(false)} />}
      {showAssign && store.currentId && (
        <AssignModal worksheetId={store.currentId} onClose={() => setShowAssign(false)} />
      )}
    </div>
  );
}

// ─── Question row ──────────────────────────────────────────────────────────────

function QuestionRow({
  question: q, settings: qs, index, total, isDragOver,
  onRemove, onUpdateSettings, onMoveUp, onMoveDown,
  onDragStart, onDragEnter, onDrop, onEditInBuilder,
}: {
  question: Question | undefined;
  settings: WorksheetQuestionSettings | undefined;
  index: number;
  total: number;
  isDragOver: boolean;
  onRemove: () => void;
  onUpdateSettings: (u: Partial<WorksheetQuestionSettings>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  onEditInBuilder: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        'bg-white border rounded-lg transition-colors',
        isDragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="h-4 w-4 text-slate-300 cursor-grab shrink-0" />
        <span className="text-sm font-bold text-slate-500 w-5 shrink-0">{index + 1}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {q ? (q.title || 'Untitled') : <span className="text-slate-400 italic">Loading…</span>}
          </p>
          {q && (
            <p className="text-xs text-slate-400 truncate">
              {q.topic}{q.subtopic ? ` · ${q.subtopic}` : ''} · Grade {q.target_grade} · {q.marks} mark{q.marks !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onEditInBuilder} title="Edit in builder" className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 text-xs">
            ✏️
          </button>
          <button onClick={() => setExpanded((e) => !e)} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 text-xs" title="Settings">
            ⚙
          </button>
          <button onClick={onRemove} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable per-question settings */}
      {expanded && qs && (
        <div className="px-4 pb-3 border-t border-slate-100 pt-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={qs.include_answer_space}
              onChange={(e) => onUpdateSettings({ include_answer_space: e.target.checked })}
              className="rounded"
            />
            Answer space
          </label>
          {qs.include_answer_space && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              Lines:
              <input
                type="number"
                min={1}
                max={20}
                value={qs.answer_lines}
                onChange={(e) => onUpdateSettings({ answer_lines: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-14 border border-slate-200 rounded px-1.5 py-0.5 text-xs"
              />
            </label>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            Q number:
            <input
              type="number"
              min={1}
              value={qs.question_number ?? ''}
              placeholder="auto"
              onChange={(e) => onUpdateSettings({ question_number: e.target.value ? parseInt(e.target.value) : null })}
              className="w-14 border border-slate-200 rounded px-1.5 py-0.5 text-xs"
            />
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Question picker modal ─────────────────────────────────────────────────────

function QuestionPicker({ onClose }: { onClose: () => void }) {
  const store = useWorksheetStore();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('questions')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setAllQuestions((data as Question[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = allQuestions.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.title?.toLowerCase().includes(s) ||
      q.question_text?.toLowerCase().includes(s) ||
      q.topic?.toLowerCase().includes(s)
    );
  });

  const toggle = (id: string) => {
    if (store.questionIds.includes(id)) store.removeQuestion(id);
    else store.addQuestion(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Add Questions</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-4 py-2 border-b border-slate-100">
          <input
            autoFocus
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-400 animate-pulse">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No questions found</div>
          ) : (
            filtered.map((q) => {
              const added = store.questionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggle(q.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                    added ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                    added ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'
                  )}>
                    {added && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{q.title || 'Untitled'}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {q.topic}{q.subtopic ? ` · ${q.subtopic}` : ''} · Grade {q.target_grade} · {q.marks}m
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">{store.questionIds.length} selected</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Worksheet settings modal ──────────────────────────────────────────────────

function WorksheetSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useWorksheetStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Worksheet Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Title">
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              value={settings.title}
              onChange={(e) => updateSettings({ title: e.target.value })}
            />
          </Field>
          <Field label="Description (optional)">
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm resize-none"
              rows={2}
              value={settings.description}
              onChange={(e) => updateSettings({ description: e.target.value })}
            />
          </Field>
          <Field label="Time allowed (optional)">
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="e.g. 45 minutes"
              value={settings.time_allowed}
              onChange={(e) => updateSettings({ time_allowed: e.target.value })}
            />
          </Field>
          <Field label="Calculator">
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              value={settings.calculator}
              onChange={(e) => updateSettings({ calculator: e.target.value as typeof settings.calculator })}
            >
              <option value="either">Either</option>
              <option value="calculator">Calculator</option>
              <option value="non-calculator">Non-calculator</option>
            </select>
          </Field>
          <div className="flex flex-wrap gap-4">
            <Toggle label="Name field" checked={settings.name_field} onChange={(v) => updateSettings({ name_field: v })} />
            <Toggle label="Date field" checked={settings.date_field} onChange={(v) => updateSettings({ date_field: v })} />
            <Toggle label="Show total marks" checked={settings.show_total_marks} onChange={(v) => updateSettings({ show_total_marks: v })} />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}

// ─── Saved worksheets tab ─────────────────────────────────────────────────────

function SavedTab({ onLoad }: { onLoad: () => void }) {
  const { worksheets, loading, refresh, deleteWorksheet } = useWorksheets();
  const { load } = useWorksheet();

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <div className="p-8 text-center text-sm text-slate-400 animate-pulse">Loading worksheets…</div>;

  if (worksheets.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
      <FileText className="h-10 w-10 opacity-30" />
      <p className="text-base font-medium">No saved worksheets</p>
      <p className="text-sm">Build and save a worksheet first.</p>
    </div>
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-2">
      {worksheets.map((ws) => (
        <div key={ws.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{ws.title}</p>
            <p className="text-xs text-slate-400">
              {ws.question_ids.length} questions · {new Date(ws.updated_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={async () => { await load(ws.id); onLoad(); }}
            className="text-xs px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Open
          </button>
          <button
            onClick={() => deleteWorksheet(ws.id)}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Assign worksheet modal ────────────────────────────────────────────────────

function AssignModal({ worksheetId, onClose }: { worksheetId: string; onClose: () => void }) {
  const { tutees, loading: loadingTutees } = useMyTutees();
  const { assignedTuteeIds, assign, unassign, loading: loadingAssign } = useWorksheetAssignments(worksheetId);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const toggle = async (tuteeId: string) => {
    setPending((p) => new Set(p).add(tuteeId));
    if (assignedTuteeIds.includes(tuteeId)) {
      await unassign(tuteeId);
    } else {
      await assign([tuteeId]);
    }
    setPending((p) => { const s = new Set(p); s.delete(tuteeId); return s; });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-emerald-600" />
          Assign to students
        </h2>

        {loadingTutees || loadingAssign ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
          </div>
        ) : tutees.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No students yet. Add some in the Students page.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {tutees.map((t) => {
              const assigned = assignedTuteeIds.includes(t.id);
              const busy = pending.has(t.id);
              return (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                      {t.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-800">{t.display_name}</span>
                  </div>
                  <button
                    onClick={() => toggle(t.id)}
                    disabled={busy}
                    className={cn(
                      'text-xs px-3 py-1 rounded-md border font-medium transition-colors disabled:opacity-50',
                      assigned
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    )}
                  >
                    {busy ? '…' : assigned ? 'Assigned' : 'Assign'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
