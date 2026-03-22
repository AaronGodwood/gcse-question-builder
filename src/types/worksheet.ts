export interface WorksheetQuestionSettings {
  question_id: string;
  include_answer_space: boolean;
  answer_lines: number;
  question_number: number | null; // null = auto
}

export interface WorksheetSettings {
  title: string;
  description: string;
  date_field: boolean;
  name_field: boolean;
  show_total_marks: boolean;
  calculator: 'calculator' | 'non-calculator' | 'either';
  time_allowed: string;
}

export interface Worksheet {
  id: string;
  user_id: string;
  title: string;
  description: string;
  question_ids: string[];
  settings: WorksheetSettings & {
    question_settings: WorksheetQuestionSettings[];
  };
  created_at: string;
  updated_at: string;
}
