/**
 * Tipos del resultado de la evaluación (deben coincidir con el backend).
 */

export type WordErrorType =
  | 'None'
  | 'Mispronunciation'
  | 'Omission'
  | 'Insertion'
  | 'UnexpectedBreak'
  | 'MissingBreak'
  | 'Monotone';

export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number | null;
}

export interface WordResult {
  text: string;
  accuracyScore: number | null;
  errorType: WordErrorType;
  offset?: number;
  duration?: number;
  phonemes?: PhonemeResult[];
}

export interface Feedback {
  headline: string;
  message: string;
  tips: string[];
  source: 'ai' | 'rules';
}

export interface AssessmentResult {
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number | null;
  wordsPerMinute: number;
  duration: number;
  referenceText: string;
  recognizedText: string;
  words: WordResult[];
  feedback: Feedback;
}
