export type Role = 'tutor' | 'tutee';

export interface Profile {
  id: string;
  role: Role;
  display_name: string;
  created_by: string | null;
}

export interface TutorTutee {
  tutor_id: string;
  tutee_id: string;
}

export interface WorksheetAssignment {
  id: string;
  worksheet_id: string;
  tutee_id: string;
  assigned_by: string;
  assigned_at: string;
}
