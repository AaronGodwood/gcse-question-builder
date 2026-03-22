import type { CanvasData } from './canvas';

export type CalculatorType = 'calculator' | 'non-calculator' | 'either';
export type PaperType = '1' | '2' | '3' | 'any';

export interface Question {
  id: string;
  user_id: string;
  title: string;
  question_text: string;
  canvas_data: CanvasData | null;
  mark_scheme: string;
  topic: string;
  subtopic: string;
  target_grade: number;
  marks: number;
  calculator: CalculatorType;
  paper: PaperType;
  answer_space_lines: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface QuestionFormData {
  title: string;
  question_text: string;
  mark_scheme: string;
  topic: string;
  subtopic: string;
  target_grade: number;
  marks: number;
  calculator: CalculatorType;
  paper: PaperType;
  answer_space_lines: number;
  tags: string[];
}

export interface QuestionFilters {
  topics: string[];
  subtopics: string[];
  gradeMin: number;
  gradeMax: number;
  calculator: CalculatorType | 'all';
  paper: PaperType | 'all';
  tags: string[];
  search: string;
}

export interface Topic {
  id: number;
  name: string;
  subtopics: string[];
  display_order: number;
}
