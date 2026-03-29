import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Circle, BookOpen, Download, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTuteeAssignments } from '@/hooks/useWorksheetCollections';
import { useWorksheetCollections } from '@/hooks/useWorksheetCollections';
import { useWorksheets, useTutorWorksheets } from '@/hooks/useWorksheet';
import { generatePdf } from '@/lib/pdfExport';
import { supabase } from '@/lib/supabase';
import type { Worksheet } from '@/types/worksheet';
import type { Question } from '@/types/question';
import { cn } from '@/lib/cn';

function Section({
  title, count, defaultOpen = true, children,
}: {
  title: string; count: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{count}</span>
        </div>
      </button>
      {open && <div className="border-t border-slate-100 divide-y divide-slate-100">{children}</div>}
    </div>
  );
}

async function fetchQuestionsForWorksheet(worksheet: Worksheet): Promise<Question[]> {
  if (worksheet.question_ids.length === 0) return [];
  const { data } = await supabase
    .from('questions')
    .select('*')
    .in('id', worksheet.question_ids);
  return (data as Question[]) ?? [];
}

function WorksheetRow({
  worksheet,
  badge,
  actions,
}: {
  worksheet: Worksheet;
  badge?: React.ReactNode;
  actions: React.ReactNode;
}) {
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    setExporting(true);
    const questions = await fetchQuestionsForWorksheet(worksheet);
    await generatePdf({ worksheet, questions });
    setExporting(false);
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-900 truncate">{worksheet.title || 'Untitled Worksheet'}</p>
          {badge}
        </div>
        {worksheet.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{worksheet.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDownload}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exporting…' : 'PDF'}
        </button>
        {actions}
      </div>
    </div>
  );
}

export default function TuteeWorksheetsPage() {
  const { user } = useAuth();
  const { assignments, loading: loadingAssignments, refresh: refreshAssignments, markComplete, markIncomplete } = useTuteeAssignments();
  const { worksheets: myWorksheets, loading: loadingMine, refresh: refreshMine, deleteWorksheet } = useWorksheets();
  const { worksheets: tutorWorksheets, loading: loadingTutor, refresh: refreshTutor } = useTutorWorksheets();
  const { savedIds, refresh: refreshSaved, save, unsave } = useWorksheetCollections();

  useEffect(() => {
    refreshAssignments();
    refreshMine();
    refreshTutor();
    refreshSaved();
  }, [refreshAssignments, refreshMine, refreshTutor, refreshSaved]);

  const assigned = assignments.filter((a) => !a.completed_at);
  const completed = assignments.filter((a) => !!a.completed_at);

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">

        <div>
          <h1 className="text-xl font-semibold text-slate-900">Worksheets</h1>
          <p className="text-sm text-slate-500 mt-1">Your assigned, personal, and tutor worksheets.</p>
        </div>

        {/* Assigned */}
        <Section title="Assigned" count={assigned.length}>
          {loadingAssignments ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600" /></div>
          ) : assigned.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No worksheets assigned yet.</p>
          ) : assigned.map((a) => (
            <WorksheetRow
              key={a.id}
              worksheet={a.worksheet}
              badge={<span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">Assigned</span>}
              actions={
                <button
                  onClick={() => markComplete(a.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                >
                  <Circle className="h-3.5 w-3.5" />
                  Mark done
                </button>
              }
            />
          ))}
        </Section>

        {/* Completed */}
        <Section title="Completed" count={completed.length} defaultOpen={false}>
          {completed.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No completed worksheets yet.</p>
          ) : completed.map((a) => (
            <WorksheetRow
              key={a.id}
              worksheet={a.worksheet}
              badge={<span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">Completed</span>}
              actions={
                <button
                  onClick={() => markIncomplete(a.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Undo
                </button>
              }
            />
          ))}
        </Section>

        {/* My Worksheets */}
        <Section title="My Worksheets" count={myWorksheets.length}>
          {loadingMine ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600" /></div>
          ) : myWorksheets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">You haven't created any worksheets yet.</p>
          ) : myWorksheets.map((w) => (
            <WorksheetRow
              key={w.id}
              worksheet={w}
              actions={
                <button
                  onClick={() => deleteWorksheet(w.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  Delete
                </button>
              }
            />
          ))}
        </Section>

        {/* Explore — tutor's public worksheets */}
        <Section title="Explore" count={tutorWorksheets.length}>
          {loadingTutor ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600" /></div>
          ) : tutorWorksheets.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
              <BookOpen className="h-6 w-6" />
              <p className="text-sm">No public worksheets from your tutor yet.</p>
            </div>
          ) : tutorWorksheets.map((w) => (
            <WorksheetRow
              key={w.id}
              worksheet={w}
              badge={
                savedIds.has(w.id)
                  ? <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">Saved</span>
                  : undefined
              }
              actions={
                savedIds.has(w.id) ? (
                  <button
                    onClick={() => unsave(w.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    Saved
                  </button>
                ) : (
                  <button
                    onClick={() => save(w.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    Save
                  </button>
                )
              }
            />
          ))}
        </Section>

      </div>
    </div>
  );
}
