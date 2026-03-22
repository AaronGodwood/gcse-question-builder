import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTopics } from '@/hooks/useTopics';
import type { QuestionFilters } from '@/types/question';
import type { SortField, SortDir } from '@/hooks/useQuestions';

interface Props {
  filters: QuestionFilters;
  setFilters: (f: Partial<QuestionFilters>) => void;
  resetFilters: () => void;
  sort: { field: SortField; dir: SortDir };
  setSort: (field: SortField, dir: SortDir) => void;
  totalCount: number;
}

export function FilterPanel({ filters, setFilters, resetFilters, sort, setSort, totalCount }: Props) {
  const { topics } = useTopics();
  const selectedTopic = topics.find((t) => filters.topics.includes(t.name));
  const subtopics = selectedTopic?.subtopics ?? [];

  const toggleTopic = (name: string) => {
    const already = filters.topics.includes(name);
    setFilters({
      topics: already ? filters.topics.filter((t) => t !== name) : [...filters.topics, name],
      subtopics: [],
    });
  };

  const toggleSubtopic = (name: string) => {
    const already = filters.subtopics.includes(name);
    setFilters({ subtopics: already ? filters.subtopics.filter((s) => s !== name) : [...filters.subtopics, name] });
  };

  const isFiltered =
    filters.topics.length > 0 ||
    filters.subtopics.length > 0 ||
    filters.calculator !== 'all' ||
    filters.paper !== 'all' ||
    filters.gradeMin > 1 ||
    filters.gradeMax < 9 ||
    filters.tags.length > 0 ||
    filters.search.trim() !== '';

  return (
    <aside className="w-[220px] shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Filters
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{totalCount} questions</span>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-slate-400 hover:text-emerald-600 transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <input
          type="search"
          placeholder="Search questions…"
          className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
      </div>

      <Divider />

      {/* Sort */}
      <FilterSection title="Sort by">
        <select
          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
          value={`${sort.field}:${sort.dir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(':') as [SortField, SortDir];
            setSort(field, dir);
          }}
        >
          <option value="updated_at:desc">Last modified</option>
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="topic:asc">Topic (A–Z)</option>
          <option value="target_grade:asc">Grade (low–high)</option>
          <option value="target_grade:desc">Grade (high–low)</option>
          <option value="marks:asc">Marks (low–high)</option>
          <option value="marks:desc">Marks (high–low)</option>
        </select>
      </FilterSection>

      <Divider />

      {/* Topic */}
      <FilterSection title="Topic">
        <div className="space-y-0.5">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTopic(t.name)}
              className={cn(
                'w-full text-left px-2 py-1 rounded text-xs transition-colors',
                filters.topics.includes(t.name)
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Subtopic — only shown when exactly one topic selected */}
      {filters.topics.length === 1 && subtopics.length > 0 && (
        <>
          <Divider />
          <FilterSection title="Subtopic">
            <div className="space-y-0.5">
              {subtopics.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubtopic(s)}
                  className={cn(
                    'w-full text-left px-2 py-1 rounded text-xs transition-colors',
                    filters.subtopics.includes(s)
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </FilterSection>
        </>
      )}

      <Divider />

      {/* Grade range */}
      <FilterSection title={`Grade ${filters.gradeMin}–${filters.gradeMax}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 w-6">Min</span>
            <input
              type="range" min={1} max={9} step={1}
              value={filters.gradeMin}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setFilters({ gradeMin: v, gradeMax: Math.max(v, filters.gradeMax) });
              }}
              className="flex-1 accent-emerald-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 w-6">Max</span>
            <input
              type="range" min={1} max={9} step={1}
              value={filters.gradeMax}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setFilters({ gradeMax: v, gradeMin: Math.min(v, filters.gradeMin) });
              }}
              className="flex-1 accent-emerald-600"
            />
          </div>
        </div>
      </FilterSection>

      <Divider />

      {/* Calculator */}
      <FilterSection title="Calculator">
        <div className="flex flex-wrap gap-1">
          {(['all', 'calculator', 'non-calculator', 'either'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilters({ calculator: v })}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] border transition-colors',
                filters.calculator === v
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              )}
            >
              {v === 'all' ? 'All' : v === 'calculator' ? 'Calc' : v === 'non-calculator' ? 'Non-calc' : 'Either'}
            </button>
          ))}
        </div>
      </FilterSection>

      <Divider />

      {/* Paper */}
      <FilterSection title="Paper">
        <div className="flex flex-wrap gap-1">
          {(['all', '1', '2', '3', 'any'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilters({ paper: v })}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] border transition-colors',
                filters.paper === v
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              )}
            >
              {v === 'all' ? 'All' : v === 'any' ? 'Any' : `P${v}`}
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 mx-3" />;
}
