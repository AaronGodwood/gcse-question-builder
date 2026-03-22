import { useRef, useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Question } from '@/types/question';

interface Props {
  onClose: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'previewing' | 'importing' | 'done' | 'error';

interface ParsedQuestion {
  question: Partial<Question>;
  valid: boolean;
  errors: string[];
}

function validateQuestion(raw: unknown): ParsedQuestion {
  const q = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof q.title !== 'string') errors.push('Missing or invalid title');
  if (typeof q.question_text !== 'string') errors.push('Missing question_text');
  if (typeof q.target_grade !== 'number' || q.target_grade < 1 || q.target_grade > 9)
    errors.push('target_grade must be 1–9');
  if (typeof q.marks !== 'number' || q.marks < 0) errors.push('marks must be a non-negative number');
  if (!['calculator', 'non-calculator', 'either'].includes(q.calculator as string))
    errors.push('calculator must be "calculator", "non-calculator", or "either"');
  if (!['1', '2', '3', 'any'].includes(q.paper as string))
    errors.push('paper must be "1", "2", "3", or "any"');
  if (!Array.isArray(q.tags)) errors.push('tags must be an array');

  return {
    question: q as Partial<Question>,
    valid: errors.length === 0,
    errors,
  };
}

export function ImportExport({ onClose }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('parsing');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const items: unknown[] = Array.isArray(raw) ? raw : [raw];
        const results = items.map(validateQuestion);
        setParsed(results);
        setStatus('previewing');
      } catch {
        setErrorMsg('File is not valid JSON.');
        setStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!user) return;
    const valid = parsed.filter((p) => p.valid);
    if (valid.length === 0) return;

    setStatus('importing');
    let count = 0;

    for (const { question: q } of valid) {
      const { id: _id, created_at: _ca, updated_at: _ua, user_id: _uid, ...rest } = q as Question;
      await supabase.from('questions').insert({
        ...rest,
        user_id: user.id,
        title: rest.title ?? 'Imported question',
        tags: rest.tags ?? [],
      });
      count++;
    }

    setImportedCount(count);
    setStatus('done');
  };

  const reset = () => {
    setParsed([]);
    setStatus('idle');
    setErrorMsg('');
    setImportedCount(0);
  };

  const validCount = parsed.filter((p) => p.valid).length;
  const invalidCount = parsed.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col overflow-hidden max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Import / Export Questions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Export all */}
          <ExportAllSection onClose={onClose} />

          <div className="border-t border-gray-100" />

          {/* Import */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Import from JSON</h3>
            <p className="text-xs text-gray-500 mb-3">
              Upload a <code>.json</code> file — either a single question object or an array of questions.
              Each question must include: <code>title</code>, <code>question_text</code>, <code>target_grade</code>,{' '}
              <code>marks</code>, <code>calculator</code>, <code>paper</code>, <code>tags</code>.
            </p>

            {status === 'idle' && (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
              >
                <Upload className="h-4 w-4" />
                Choose JSON file…
              </button>
            )}

            {status === 'parsing' && (
              <p className="text-sm text-gray-400 animate-pulse">Parsing file…</p>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg}
                <button onClick={reset} className="ml-auto text-xs text-red-500 hover:underline">Try again</button>
              </div>
            )}

            {(status === 'previewing' || status === 'importing') && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  {validCount > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {validCount} valid
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      {invalidCount} invalid
                    </span>
                  )}
                </div>

                {/* Preview list */}
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {parsed.map((p, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 border-b border-gray-100 last:border-0 text-xs ${
                        p.valid ? 'bg-white' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${p.valid ? 'text-gray-800' : 'text-red-700'}`}>
                          {(p.question.title as string) || `Question ${i + 1}`}
                        </span>
                        {p.valid
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          : <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        }
                      </div>
                      {p.errors.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-red-600">
                          {p.errors.map((err, j) => <li key={j}>• {err}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    disabled={validCount === 0 || status === 'importing'}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {status === 'importing'
                      ? 'Importing…'
                      : `Import ${validCount} question${validCount !== 1 ? 's' : ''}`
                    }
                  </button>
                  <button onClick={reset} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {status === 'done' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <p className="text-sm font-medium text-gray-700">
                  Successfully imported {importedCount} question{importedCount !== 1 ? 's' : ''}!
                </p>
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// ─── Export all section ───────────────────────────────────────────────────────

function ExportAllSection({ onClose: _onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    if (!user) return;
    setExporting(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setExporting(false);

    const questions = data ?? [];
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-questions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Export all questions</h3>
      <p className="text-xs text-gray-500 mb-3">
        Download all your questions as a single JSON file. You can re-import this file later or use it as a backup.
      </p>
      <button
        onClick={handleExportAll}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        {exporting ? 'Exporting…' : 'Export all as JSON'}
      </button>
    </div>
  );
}
