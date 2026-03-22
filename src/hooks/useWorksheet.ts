import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useWorksheetStore } from '@/stores/worksheetStore';
import type { Worksheet } from '@/types/worksheet';

export function useWorksheet() {
  const { user } = useAuth();
  const store = useWorksheetStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    setSaving(true);
    setError(null);

    const payload = {
      user_id: user.id,
      title: store.settings.title || 'Untitled Worksheet',
      description: store.settings.description,
      question_ids: store.questionIds,
      settings: {
        ...store.settings,
        question_settings: store.questionSettings,
      },
    };

    let id = store.currentId;
    if (id) {
      const { error: err } = await supabase
        .from('worksheets')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (err) { setError(err.message); setSaving(false); return null; }
    } else {
      const { data, error: err } = await supabase
        .from('worksheets')
        .insert(payload)
        .select('id')
        .single();
      if (err || !data) { setError(err?.message ?? 'Insert failed'); setSaving(false); return null; }
      id = data.id;
      store.setCurrentId(id);
    }

    setSaving(false);
    return id;
  }, [user, store]);

  const load = useCallback(async (id: string) => {
    const { data, error: err } = await supabase
      .from('worksheets')
      .select('*')
      .eq('id', id)
      .single();
    if (err || !data) return;

    const ws = data as Worksheet;
    store.setCurrentId(ws.id);
    store.reorderQuestions(ws.question_ids);
    store.updateSettings({
      title: ws.settings.title ?? ws.title,
      description: ws.settings.description ?? ws.description,
      date_field: ws.settings.date_field,
      name_field: ws.settings.name_field,
      show_total_marks: ws.settings.show_total_marks,
      calculator: ws.settings.calculator,
      time_allowed: ws.settings.time_allowed,
    });
    // Restore per-question settings, ensuring every id has an entry
    const savedSettings = ws.settings.question_settings ?? [];
    for (const qid of ws.question_ids) {
      const existing = savedSettings.find((s) => s.question_id === qid);
      store.updateQuestionSettings(qid, existing ?? {
        question_id: qid,
        include_answer_space: true,
        answer_lines: 4,
        question_number: null,
      });
    }
  }, [store]);

  const newWorksheet = useCallback(() => {
    store.reset();
  }, [store]);

  return { save, load, newWorksheet, saving, error };
}

export function useWorksheets() {
  const { user } = useAuth();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('worksheets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setWorksheets((data as Worksheet[]) ?? []);
    setLoading(false);
  }, [user]);

  const deleteWorksheet = useCallback(async (id: string) => {
    await supabase.from('worksheets').delete().eq('id', id);
    setWorksheets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { worksheets, loading, refresh, deleteWorksheet };
}
