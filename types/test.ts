export interface Answer {
  id: string;
  text: string;
  code?: string;
  equation?: string;
  graph?: GraphConfig;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  code?: string;
  equation?: string;
  graph?: GraphConfig;
  answers: Answer[];
}

export interface TestVersion {
  id: string; // Now will be A, B, C, etc.
  title: string;
  questions: Question[];
}

export interface GraphConfig {
  equation: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  step: number;
  showGrid?: boolean;
  showPoints?: boolean;
}

export interface TestMetadata {
  title: string;
  date: string;
  totalPoints?: number;
}

