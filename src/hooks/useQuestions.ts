import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Question, QuestionFilters } from '@/types/question';

const DEFAULT_FILTERS: QuestionFilters = {
  topics: [],
  subtopics: [],
  gradeMin: 1,
  gradeMax: 9,
  calculator: 'all',
  paper: 'all',
  tags: [],
  search: '',
};

export type SortField = 'created_at' | 'updated_at' | 'topic' | 'target_grade' | 'marks';
export type SortDir = 'asc' | 'desc';

interface UseQuestionsResult {
  questions: Question[];
  loading: boolean;
  filters: QuestionFilters;
  setFilters: (f: Partial<QuestionFilters>) => void;
  resetFilters: () => void;
  sort: { field: SortField; dir: SortDir };
  setSort: (field: SortField, dir: SortDir) => void;
  refresh: () => void;
  deleteQuestion: (id: string) => Promise<void>;
  duplicateQuestion: (id: string) => Promise<string>;
}

export function useQuestions(): UseQuestionsResult {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersState] = useState<QuestionFilters>(DEFAULT_FILTERS);
  const [sort, setSortState] = useState<{ field: SortField; dir: SortDir }>({
    field: 'updated_at',
    dir: 'desc',
  });
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('questions')
      .select('*')
      .eq('user_id', user.id)
      .order(sort.field, { ascending: sort.dir === 'asc' });

    if (filters.topics.length > 0) {
      query = query.in('topic', filters.topics);
    }
    if (filters.subtopics.length > 0) {
      query = query.in('subtopic', filters.subtopics);
    }
    if (filters.calculator !== 'all') {
      query = query.eq('calculator', filters.calculator);
    }
    if (filters.paper !== 'all') {
      query = query.eq('paper', filters.paper);
    }
    if (filters.gradeMin > 1) {
      query = query.gte('target_grade', filters.gradeMin);
    }
    if (filters.gradeMax < 9) {
      query = query.lte('target_grade', filters.gradeMax);
    }
    if (filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.search.trim()) {
      query = query.or(
        `title.ilike.%${filters.search}%,question_text.ilike.%${filters.search}%`
      );
    }

    query.then(({ data }) => {
      setQuestions((data as Question[]) ?? []);
      setLoading(false);
    });
  }, [user, filters, sort, tick]);

  const setFilters = useCallback((f: Partial<QuestionFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  const setSort = useCallback((field: SortField, dir: SortDir) => {
    setSortState({ field, dir });
  }, []);

  const deleteQuestion = useCallback(async (id: string) => {
    await supabase.from('questions').delete().eq('id', id);
    refresh();
  }, [refresh]);

  const duplicateQuestion = useCallback(async (id: string): Promise<string> => {
    const { data: src } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    if (!src || !user) throw new Error('Question not found');

    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = src as Question & { id: string; created_at: string; updated_at: string };
    const { data: newQ } = await supabase
      .from('questions')
      .insert({ ...rest, user_id: user.id, title: `${rest.title} (copy)` })
      .select('id')
      .single();
    refresh();
    return (newQ as { id: string }).id;
  }, [user, refresh]);

  return {
    questions, loading, filters, setFilters, resetFilters,
    sort, setSort, refresh, deleteQuestion, duplicateQuestion,
  };
}
