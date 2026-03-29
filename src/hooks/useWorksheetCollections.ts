import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Worksheet } from '@/types/worksheet';

export interface AssignedWorksheet {
  id: string;
  worksheet_id: string;
  assigned_by: string;
  assigned_at: string;
  completed_at: string | null;
  worksheet: Worksheet;
}

export function useTuteeAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignedWorksheet[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('worksheet_assignments')
      .select('*, worksheet:worksheets(*)')
      .eq('tutee_id', user.id)
      .order('assigned_at', { ascending: false });
    setAssignments((data as AssignedWorksheet[]) ?? []);
    setLoading(false);
  }, [user]);

  const markComplete = useCallback(async (assignmentId: string) => {
    await supabase
      .from('worksheet_assignments')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', assignmentId);
    setAssignments((prev) =>
      prev.map((a) => a.id === assignmentId ? { ...a, completed_at: new Date().toISOString() } : a)
    );
  }, []);

  const markIncomplete = useCallback(async (assignmentId: string) => {
    await supabase
      .from('worksheet_assignments')
      .update({ completed_at: null })
      .eq('id', assignmentId);
    setAssignments((prev) =>
      prev.map((a) => a.id === assignmentId ? { ...a, completed_at: null } : a)
    );
  }, []);

  return { assignments, loading, refresh, markComplete, markIncomplete };
}

export function useWorksheetCollections() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('worksheet_collections')
      .select('worksheet_id')
      .eq('tutee_id', user.id);
    setSavedIds(new Set((data ?? []).map((r: { worksheet_id: string }) => r.worksheet_id)));
    setLoading(false);
  }, [user]);

  const save = useCallback(async (worksheetId: string) => {
    if (!user) return;
    await supabase.from('worksheet_collections').insert({ tutee_id: user.id, worksheet_id: worksheetId });
    setSavedIds((prev) => new Set([...prev, worksheetId]));
  }, [user]);

  const unsave = useCallback(async (worksheetId: string) => {
    if (!user) return;
    await supabase.from('worksheet_collections').delete().eq('tutee_id', user.id).eq('worksheet_id', worksheetId);
    setSavedIds((prev) => { const next = new Set(prev); next.delete(worksheetId); return next; });
  }, [user]);

  return { savedIds, loading, refresh, save, unsave };
}
