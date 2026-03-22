import { useState } from 'react';
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useQuestionStore } from '@/stores/questionStore';
import { useTopics } from '@/hooks/useTopics';
import type { CalculatorType, PaperType } from '@/types/question';

export function MetadataPanel() {
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { formData, setFormData } = useQuestionStore();
  const { topics } = useTopics();

  const selectedTopic = topics.find((t) => t.name === formData.topic);
  const subtopics = selectedTopic?.subtopics ?? [];

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ tags: [...formData.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData({ tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>Question Details</span>
          {formData.title && (
            <span className="text-xs text-slate-400 font-normal truncate max-w-[200px]">
              — {formData.title}
            </span>
          )}
          {formData.topic && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              {formData.topic}
            </span>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
      </button>

      {/* Panel body */}
      {open && (
        <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-x-6 gap-y-3 max-h-[420px] overflow-y-auto border-t border-slate-100">

          {/* Title — full width */}
          <div className="col-span-2">
            <Label>Title</Label>
            <input
              className={inputCls}
              placeholder="e.g. Right-angled triangle area"
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
            />
          </div>

          {/* Question text — full width */}
          <div className="col-span-2">
            <Label>Question text</Label>
            <textarea
              className={cn(inputCls, 'resize-none')}
              rows={2}
              placeholder="e.g. Calculate the area of the triangle. Give your answer in cm²."
              value={formData.question_text}
              onChange={(e) => setFormData({ question_text: e.target.value })}
            />
          </div>

          {/* Topic */}
          <div>
            <Label>Topic</Label>
            <select
              className={inputCls}
              value={formData.topic}
              onChange={(e) => setFormData({ topic: e.target.value, subtopic: '' })}
            >
              <option value="">— Select topic —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Subtopic */}
          <div>
            <Label>Subtopic</Label>
            <select
              className={inputCls}
              value={formData.subtopic}
              onChange={(e) => setFormData({ subtopic: e.target.value })}
              disabled={subtopics.length === 0}
            >
              <option value="">— Select subtopic —</option>
              {subtopics.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Target grade */}
          <div>
            <Label>Target grade <span className="text-emerald-600 font-semibold ml-1">{formData.target_grade}</span></Label>
            <input
              type="range"
              min={1} max={9} step={1}
              value={formData.target_grade}
              onChange={(e) => setFormData({ target_grade: parseInt(e.target.value) })}
              className="w-full accent-emerald-600 mt-1"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              {[1,2,3,4,5,6,7,8,9].map((g) => <span key={g}>{g}</span>)}
            </div>
          </div>

          {/* Marks */}
          <div>
            <Label>Marks</Label>
            <input
              type="number"
              min={1} max={20}
              className={inputCls}
              value={formData.marks}
              onChange={(e) => setFormData({ marks: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>

          {/* Calculator */}
          <div>
            <Label>Calculator</Label>
            <RadioGroup
              value={formData.calculator}
              onChange={(v) => setFormData({ calculator: v as CalculatorType })}
              options={[
                { value: 'calculator', label: 'Calculator' },
                { value: 'non-calculator', label: 'Non-calc' },
                { value: 'either', label: 'Either' },
              ]}
            />
          </div>

          {/* Paper */}
          <div>
            <Label>Paper</Label>
            <RadioGroup
              value={formData.paper}
              onChange={(v) => setFormData({ paper: v as PaperType })}
              options={[
                { value: '1', label: 'P1' },
                { value: '2', label: 'P2' },
                { value: '3', label: 'P3' },
                { value: 'any', label: 'Any' },
              ]}
            />
          </div>

          {/* Answer space lines */}
          <div>
            <Label>Answer lines</Label>
            <input
              type="number"
              min={0} max={20}
              className={inputCls}
              value={formData.answer_space_lines}
              onChange={(e) => setFormData({ answer_space_lines: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </div>

          {/* Tags — full width */}
          <div className="col-span-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-1">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                className={cn(inputCls, 'flex-1')}
                placeholder="Add tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <button
                onClick={addTag}
                className="px-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mark scheme — full width */}
          <div className="col-span-2">
            <Label>Mark scheme</Label>
            <textarea
              className={cn(inputCls, 'resize-none font-mono text-xs')}
              rows={3}
              placeholder="e.g. ½ × 6 × 8 = 24 cm² [M1 A1]"
              value={formData.mark_scheme}
              onChange={(e) => setFormData({ mark_scheme: e.target.value })}
            />
          </div>

        </div>
      )}
    </div>
  );
}

// ---------- Primitives ----------

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {children}
    </label>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white';

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs border transition-colors',
            value === opt.value
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
