import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { WorksheetAssignment } from '@/types/profile';

export function useWorksheetAssignments(worksheetId: string | null) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<WorksheetAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!worksheetId) return;
    setLoading(true);
    const { data } = await supabase
      .from('worksheet_assignments')
      .select('*')
      .eq('worksheet_id', worksheetId);
    setAssignments((data as WorksheetAssignment[]) ?? []);
    setLoading(false);
  }, [worksheetId]);

  useEffect(() => { refresh(); }, [refresh]);

  const assign = useCallback(async (tuteeIds: string[]) => {
    if (!worksheetId || !user) return;
    const rows = tuteeIds.map((tutee_id) => ({
      worksheet_id: worksheetId,
      tutee_id,
      assigned_by: user.id,
    }));
    await supabase.from('worksheet_assignments').upsert(rows, { onConflict: 'worksheet_id,tutee_id' });
    await refresh();
  }, [worksheetId, user, refresh]);

  const unassign = useCallback(async (tuteeId: string) => {
    if (!worksheetId) return;
    await supabase
      .from('worksheet_assignments')
      .delete()
      .eq('worksheet_id', worksheetId)
      .eq('tutee_id', tuteeId);
    await refresh();
  }, [worksheetId, refresh]);

  const assignedTuteeIds = assignments.map((a) => a.tutee_id);

  return { assignments, assignedTuteeIds, loading, assign, unassign, refresh };
}
