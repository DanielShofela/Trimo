// Fix: Implement type definitions for the application.
export type EvaluationType = 'Control' | 'Homework' | 'Quiz' | 'Project' | 'Oral' | 'Presentation';

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  color: string;
  goal: number;
  icon?: string;
}

export interface Grade {
  id:string;
  subjectId: string;
  periodId: string;
  name?: string; // For planned grades
  grade?: number; // Optional for planned grades
  maxGrade: number;
  type: EvaluationType;
  date: string;
  comment?: string;
  bonus?: number;
}

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: number;
}