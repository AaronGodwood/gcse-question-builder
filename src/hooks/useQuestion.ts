import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCanvasStore } from '@/stores/canvasStore';
import { useQuestionStore } from '@/stores/questionStore';
import { useAuth } from '@/hooks/useAuth';
import type { Question } from '@/types/question';
import type { CanvasObject } from '@/types/canvas';

export function useQuestion() {
  const { user } = useAuth();
  const { objects, setObjects, clearCanvas } = useCanvasStore();
  const {
    currentId, formData,
    setCurrentId, setFormData, resetFormData, setDirty,
  } = useQuestionStore();

  /** Persist current canvas + metadata to Supabase. Returns the question id. */
  const save = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    const canvasData = { width: 794, height: 1123, objects };
    const now = new Date().toISOString();

    if (currentId) {
      const { error } = await supabase
        .from('questions')
        .update({ ...formData, canvas_data: canvasData, updated_at: now })
        .eq('id', currentId);
      if (error) throw error;
      setDirty(false);
      return currentId;
    } else {
      const { data, error } = await supabase
        .from('questions')
        .insert({ user_id: user.id, ...formData, canvas_data: canvasData })
        .select('id')
        .single();
      if (error) throw error;
      setCurrentId(data.id as string);
      setDirty(false);
      return data.id as string;
    }
  }, [user, objects, currentId, formData, setCurrentId, setDirty]);

  /** Load a question from Supabase into the builder. */
  const load = useCallback(async (questionId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;
    const q = data as Question;

    setCurrentId(q.id);
    setFormData({
      title: q.title,
      question_text: q.question_text,
      mark_scheme: q.mark_scheme,
      topic: q.topic,
      subtopic: q.subtopic,
      target_grade: q.target_grade,
      marks: q.marks,
      calculator: q.calculator,
      paper: q.paper,
      answer_space_lines: q.answer_space_lines,
      tags: q.tags,
    });

    if (q.canvas_data?.objects) {
      setObjects(q.canvas_data.objects as CanvasObject[]);
    } else {
      clearCanvas();
    }

    setDirty(false);
  }, [setCurrentId, setFormData, setObjects, clearCanvas, setDirty]);

  /** Start a fresh new question. */
  const newQuestion = useCallback(() => {
    clearCanvas();
    resetFormData();
  }, [clearCanvas, resetFormData]);

  return { save, load, newQuestion, currentId, isDirty: useQuestionStore.getState().isDirty };
}
