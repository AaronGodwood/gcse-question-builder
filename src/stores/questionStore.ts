import { create } from 'zustand';
import type { QuestionFormData } from '@/types/question';

interface QuestionState {
  currentId: string | null;
  formData: QuestionFormData;
  isDirty: boolean;

  setCurrentId: (id: string | null) => void;
  setFormData: (data: Partial<QuestionFormData>) => void;
  resetFormData: () => void;
  setDirty: (dirty: boolean) => void;
}

const defaultFormData: QuestionFormData = {
  title: '',
  question_text: '',
  mark_scheme: '',
  topic: '',
  subtopic: '',
  target_grade: 5,
  marks: 1,
  calculator: 'either',
  paper: 'any',
  answer_space_lines: 4,
  tags: [],
};

export const useQuestionStore = create<QuestionState>((set) => ({
  currentId: null,
  formData: { ...defaultFormData },
  isDirty: false,

  setCurrentId: (id) => set({ currentId: id }),

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
      isDirty: true,
    })),

  resetFormData: () =>
    set({ formData: { ...defaultFormData }, currentId: null, isDirty: false }),

  setDirty: (dirty) => set({ isDirty: dirty }),
}));
