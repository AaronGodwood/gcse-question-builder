import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types/question';

interface UseTopicsResult {
  topics: Topic[];
  loading: boolean;
}

export function useTopics(): UseTopicsResult {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('topics')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        if (data) setTopics(data as Topic[]);
        setLoading(false);
      });
  }, []);

  return { topics, loading };
}
