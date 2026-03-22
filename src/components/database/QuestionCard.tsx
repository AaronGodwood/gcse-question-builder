import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil, Copy, Trash2, Download, BookPlus,
  Calculator, FileText,
} from 'lucide-react';
import { cn, toSuperscript } from '@/lib/cn';
import type { Question } from '@/types/question';
import { useWorksheetStore } from '@/stores/worksheetStore';

interface Props {
  question: Question;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (question: Question) => void;
}

const GRADE_COLOURS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-slate-100 text-slate-600',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-yellow-100 text-yellow-700',
  5: 'bg-orange-100 text-orange-700',
  6: 'bg-orange-100 text-orange-700',
  7: 'bg-emerald-100 text-emerald-700',
  8: 'bg-emerald-100 text-emerald-700',
  9: 'bg-purple-100 text-purple-700',
};

export function QuestionCard({ question: q, selected, onSelect, onDelete, onDuplicate, onExport }: Props) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { addQuestion } = useWorksheetStore();

  const handleOpenInBuilder = () => {
    // Store the ID in sessionStorage so BuilderPage can pick it up
    sessionStorage.setItem('load_question_id', q.id);
    navigate('/builder');
  };

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
        'group relative bg-white border rounded-lg overflow-hidden transition-all duration-150',
        selected
          ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-md'
          : 'border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {/* Selection checkbox */}
      <div
        className="absolute top-2 left-2 z-10"
        onClick={(e) => { e.stopPropagation(); onSelect(q.id, e.shiftKey || e.ctrlKey); }}
      >
        <div className={cn(
          'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer',
          selected
            ? 'bg-emerald-600 border-emerald-600'
            : 'bg-white border-slate-300 opacity-0 group-hover:opacity-100'
        )}>
          {selected && <div className="w-2 h-2 bg-white rounded-sm" />}
        </div>
      </div>

      {/* Canvas preview area */}
      <div
        className="h-36 bg-slate-50 border-b border-slate-100 flex items-center justify-center cursor-pointer"
        onClick={() => onSelect(q.id, false)}
      >
        {q.canvas_data?.objects && q.canvas_data.objects.length > 0 ? (
          <CanvasThumbnail question={q} />
        ) : (
          <span className="text-xs text-slate-300">No diagram</span>
        )}
      </div>

      {/* Card body */}
      <div className="p-2.5">
        {/* Title */}
        <p className="text-sm font-medium text-slate-900 truncate leading-tight">
          {q.title || 'Untitled question'}
        </p>

        {/* Question text preview */}
        {q.question_text && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
            {toSuperscript(q.question_text)}
          </p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', GRADE_COLOURS[q.target_grade] ?? 'bg-slate-100 text-slate-600')}>
            Grade {q.target_grade}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {q.marks} mark{q.marks !== 1 ? 's' : ''}
          </span>
          {q.calculator !== 'either' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-0.5">
              <Calculator className="h-2.5 w-2.5" />
              {q.calculator === 'calculator' ? 'Calc' : 'Non-calc'}
            </span>
          )}
          {q.paper !== 'any' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-0.5">
              <FileText className="h-2.5 w-2.5" />
              P{q.paper}
            </span>
          )}
        </div>

        {/* Topic */}
        {q.topic && (
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {q.topic}{q.subtopic ? ` · ${q.subtopic}` : ''}
          </p>
        )}

        {/* Tags */}
        {q.tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1">
            {q.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] px-1 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                {tag}
              </span>
            ))}
            {q.tags.length > 3 && (
              <span className="text-[9px] text-slate-400">+{q.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Action bar — visible on hover */}
      <div className={cn(
        'border-t border-slate-100 flex items-center justify-between px-1.5 py-1',
        'opacity-0 group-hover:opacity-100 transition-opacity'
      )}>
        <div className="flex items-center gap-0.5">
          <ActionBtn icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" onClick={handleOpenInBuilder} />
          <ActionBtn icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={() => onDuplicate(q.id)} />
          <ActionBtn icon={<BookPlus className="h-3.5 w-3.5" />} label="Add to worksheet" onClick={() => addQuestion(q.id)} />
          <ActionBtn icon={<Download className="h-3.5 w-3.5" />} label="Export JSON" onClick={() => onExport(q)} />
        </div>
        <ActionBtn
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label={confirmDelete ? 'Click again to confirm' : 'Delete'}
          onClick={handleDelete}
          danger
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'h-6 w-6 flex items-center justify-center rounded transition-colors',
        danger
          ? 'text-slate-400 hover:bg-red-50 hover:text-red-500'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      )}
    >
      {icon}
    </button>
  );
}

/** Very lightweight static thumbnail — just counts object types */
function CanvasThumbnail({ question: q }: { question: Question }) {
  const objects = q.canvas_data?.objects ?? [];
  const shapes = objects.filter((o) => o.type === 'shape').length;
  const graphs = objects.filter((o) => o.type === 'graph').length;
  const texts = objects.filter((o) => o.type === 'text').length;
  const marks = objects.filter((o) => o.type === 'mark-box').length;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-2 text-slate-400">
        {shapes > 0 && <span className="text-xs">{shapes} shape{shapes !== 1 ? 's' : ''}</span>}
        {graphs > 0 && <span className="text-xs">{graphs} graph{graphs !== 1 ? 's' : ''}</span>}
        {texts > 0 && <span className="text-xs">{texts} text{texts !== 1 ? 's' : ''}</span>}
        {marks > 0 && <span className="text-xs">{marks} mark box{marks !== 1 ? 'es' : ''}</span>}
      </div>
      <span className="text-[10px] text-slate-300">{objects.length} object{objects.length !== 1 ? 's' : ''} total</span>
    </div>
  );
}
