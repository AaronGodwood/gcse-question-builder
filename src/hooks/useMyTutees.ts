import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/profile';

export function useMyTutees() {
  const { user } = useAuth();
  const [tutees, setTutees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('tutor_tutee')
      .select('tutee_id, profiles!tutor_tutee_tutee_id_fkey(id, role, display_name, created_by)')
      .eq('tutor_id', user.id);

    const profiles = (data ?? []).map((row) => row.profiles as unknown as Profile).filter(Boolean);
    setTutees(profiles);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { tutees, loading, refresh };
}
