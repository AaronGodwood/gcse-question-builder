import { create } from 'zustand';
import type { WorksheetQuestionSettings, WorksheetSettings } from '@/types/worksheet';

interface WorksheetState {
  currentId: string | null;
  questionIds: string[];
  questionSettings: WorksheetQuestionSettings[];
  settings: WorksheetSettings;

  setCurrentId: (id: string | null) => void;
  addQuestion: (questionId: string) => void;
  removeQuestion: (questionId: string) => void;
  reorderQuestions: (newOrder: string[]) => void;
  updateQuestionSettings: (questionId: string, updates: Partial<WorksheetQuestionSettings>) => void;
  updateSettings: (updates: Partial<WorksheetSettings>) => void;
  reset: () => void;
}

const defaultSettings: WorksheetSettings = {
  title: 'Maths Worksheet',
  description: '',
  date_field: true,
  name_field: true,
  show_total_marks: true,
  calculator: 'either',
  time_allowed: '',
};

export const useWorksheetStore = create<WorksheetState>((set) => ({
  currentId: null,
  questionIds: [],
  questionSettings: [],
  settings: { ...defaultSettings },

  setCurrentId: (id) => set({ currentId: id }),

  addQuestion: (questionId) =>
    set((state) => {
      if (state.questionIds.includes(questionId)) return state;
      const newSettings: WorksheetQuestionSettings = {
        question_id: questionId,
        include_answer_space: true,
        answer_lines: 4,
        question_number: null,
      };
      return {
        questionIds: [...state.questionIds, questionId],
        questionSettings: [...state.questionSettings, newSettings],
      };
    }),

  removeQuestion: (questionId) =>
    set((state) => ({
      questionIds: state.questionIds.filter((id) => id !== questionId),
      questionSettings: state.questionSettings.filter(
        (s) => s.question_id !== questionId
      ),
    })),

  reorderQuestions: (newOrder) => set({ questionIds: newOrder }),

  updateQuestionSettings: (questionId, updates) =>
    set((state) => {
      const exists = state.questionSettings.some((s) => s.question_id === questionId);
      if (exists) {
        return {
          questionSettings: state.questionSettings.map((s) =>
            s.question_id === questionId ? { ...s, ...updates } : s
          ),
        };
      }
      // Upsert: add a default entry with the provided updates
      const newEntry: WorksheetQuestionSettings = {
        question_id: questionId,
        include_answer_space: true,
        answer_lines: 4,
        question_number: null,
        ...updates,
      };
      return { questionSettings: [...state.questionSettings, newEntry] };
    }),

  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),

  reset: () =>
    set({ currentId: null, questionIds: [], questionSettings: [], settings: { ...defaultSettings } }),
}));
