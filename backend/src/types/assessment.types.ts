/**
 * Tipos que describen el resultado de la evaluación.
 * Este esquema es el "contrato" que el frontend consume.
 * Los valores numéricos provienen directamente de Azure
 * (los globales se agregan cuando hay varios segmentos; ver azurePronunciation.service.ts).
 */

/** Tipo de error que Azure asigna a cada palabra. */
export type WordErrorType =
  | 'None'
  | 'Mispronunciation'
  | 'Omission'
  | 'Insertion'
  | 'UnexpectedBreak'
  | 'MissingBreak'
  | 'Monotone';

/** Un fonema individual, tal como lo entrega Azure (opcional). */
export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number | null;
}

/** Resultado por palabra. */
export interface WordResult {
  /** Texto de la palabra tal como lo reconoció Azure. */
  text: string;
  /** 0–100. Para omisiones suele ser 0; para inserciones puede no existir. */
  accuracyScore: number | null;
  /** Clasificación del error entregada por Azure. */
  errorType: WordErrorType;
  /** Desplazamiento en ticks (100 ns) dentro del audio, si está disponible. */
  offset?: number;
  duration?: number;
  /** Fonemas con su puntuación, si se solicitó granularidad de fonema. */
  phonemes?: PhonemeResult[];
}

/** Feedback educativo dirigido al niño. */
export interface Feedback {
  /** Frase de encabezado, p. ej. "¡Muy bien!". */
  headline: string;
  /** Texto principal, positivo y en lenguaje sencillo. */
  message: string;
  /** 2–3 recomendaciones concretas. */
  tips: string[];
  /** Origen del feedback: "ai" (Claude) o "rules" (reglas locales). */
  source: 'ai' | 'rules';
}

/** Respuesta completa del endpoint POST /api/reading/evaluate. */
export interface AssessmentResult {
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  /** null si Azure no entregó prosodia para este audio. */
  prosodyScore: number | null;

  /** Velocidad de lectura en palabras por minuto. */
  wordsPerMinute: number;
  /** Duración del audio en segundos. */
  duration: number;

  /** Texto que el niño debía leer (referencia). */
  referenceText: string;
  /** Texto reconstruido de lo que Azure reconoció. */
  recognizedText: string;

  words: WordResult[];

  /** Feedback educativo (Claude o reglas). */
  feedback: Feedback;
}
