import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { env } from '../config/env.js';
import { parseWav } from './wav.service.js';
import { countWords } from '../utils/text.js';
import type { PhonemeResult, WordErrorType, WordResult } from '../types/assessment.types.js';

/**
 * Servicio que ejecuta Azure Speech **Pronunciation Assessment** sobre un audio WAV.
 *
 * ── Decisiones técnicas ─────────────────────────────────────────────
 * 1) Usamos reconocimiento CONTINUO (no `recognizeOnceAsync`) porque el
 *    párrafo tiene varias oraciones y `recognizeOnce` se detiene en la
 *    primera pausa larga, perdiendo parte del texto.
 * 2) Empujamos el PCM del WAV a un PushStream con el formato real leído del
 *    archivo, en vez de asumir 44 bytes de cabecera.
 * 3) `enableMiscue = true` para que Azure detecte palabras omitidas
 *    (Omission) y agregadas (Insertion) comparando contra el ReferenceText.
 * 4) Los datos POR PALABRA se devuelven tal cual los entrega Azure. Los
 *    valores GLOBALES se agregan entre segmentos siguiendo el método
 *    recomendado por Microsoft para evaluación continua (promedio de
 *    accuracy/fluency ponderado por duración; prosodia = promedio; y
 *    completitud = palabras de referencia efectivamente leídas).
 */

// Estructura mínima del JSON que devuelve Azure por cada segmento reconocido.
interface AzurePhoneme {
  Phoneme?: string;
  PronunciationAssessment?: { AccuracyScore?: number };
}
interface AzureWord {
  Word: string;
  Offset?: number;
  Duration?: number;
  PronunciationAssessment?: {
    AccuracyScore?: number;
    ErrorType?: string;
  };
  Phonemes?: AzurePhoneme[];
}
interface AzureNBest {
  PronunciationAssessment?: {
    AccuracyScore?: number;
    FluencyScore?: number;
    CompletenessScore?: number;
    PronScore?: number;
    ProsodyScore?: number;
  };
  Words?: AzureWord[];
}
interface AzureJsonResult {
  NBest?: AzureNBest[];
}

interface Segment {
  accuracy: number;
  fluency: number;
  prosody: number | null;
  durationTicks: number;
  words: AzureWord[];
}

export interface RawAssessment {
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number | null;
  wordsPerMinute: number;
  duration: number;
  recognizedText: string;
  words: WordResult[];
}

export class NoSpeechError extends Error {
  constructor() {
    super('No pudimos escuchar la lectura. Revisa el micrófono e inténtalo otra vez.');
    this.name = 'NoSpeechError';
  }
}

export class AzureAssessmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AzureAssessmentError';
  }
}

const VALID_ERROR_TYPES: WordErrorType[] = [
  'None',
  'Mispronunciation',
  'Omission',
  'Insertion',
  'UnexpectedBreak',
  'MissingBreak',
  'Monotone',
];

function toErrorType(value: string | undefined): WordErrorType {
  const match = VALID_ERROR_TYPES.find((t) => t === value);
  return match ?? 'None';
}

/**
 * Ejecuta la evaluación de pronunciación.
 * @param wavBuffer  Audio WAV PCM (mono, idealmente 16 kHz / 16 bits).
 * @param referenceText  Texto que el niño debía leer.
 * @param language  Locale de reconocimiento, p. ej. "es-CL".
 */
export function assessPronunciation(
  wavBuffer: Buffer,
  referenceText: string,
  language: string,
): Promise<RawAssessment> {
  const wav = parseWav(wavBuffer);

  const speechConfig = sdk.SpeechConfig.fromSubscription(env.azure.key, env.azure.region);
  speechConfig.speechRecognitionLanguage = language;

  // Empujamos el PCM con el formato real del archivo.
  const format = sdk.AudioStreamFormat.getWaveFormatPCM(
    wav.sampleRate,
    wav.bitsPerSample,
    wav.channels,
  );
  const pushStream = sdk.AudioInputStream.createPushStream(format);
  const arrayBuffer = wav.pcm.buffer.slice(
    wav.pcm.byteOffset,
    wav.pcm.byteOffset + wav.pcm.byteLength,
  );
  pushStream.write(arrayBuffer as ArrayBuffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

  // Configuración de la evaluación de pronunciación (escenario de lectura).
  const paConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    /* enableMiscue */ true,
  );
  // Prosodia: disponible en varios locales; si Azure no la entrega, la tratamos como null.
  paConfig.enableProsodyAssessment = true;

  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  paConfig.applyTo(recognizer);

  const segments: Segment[] = [];

  return new Promise<RawAssessment>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      try {
        recognizer.close();
      } catch {
        /* noop */
      }
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        resolve(aggregate(segments, referenceText, wav.durationSeconds));
      } catch (err) {
        reject(err);
      }
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    // Salvaguarda: si Azure nunca cierra la sesión, no dejamos la petición colgada.
    const safety = setTimeout(() => finish(), 60_000);

    recognizer.recognized = (_s, e) => {
      if (e.result.reason !== sdk.ResultReason.RecognizedSpeech) return;
      const json = e.result.properties.getProperty(
        sdk.PropertyId.SpeechServiceResponse_JsonResult,
      );
      if (!json) return;

      let parsed: AzureJsonResult;
      try {
        parsed = JSON.parse(json) as AzureJsonResult;
      } catch {
        return;
      }
      const nbest = parsed.NBest?.[0];
      if (!nbest?.Words?.length) return;

      const words = nbest.Words;
      const first = words[0];
      const last = words[words.length - 1];
      const durationTicks =
        (last.Offset ?? 0) + (last.Duration ?? 0) - (first.Offset ?? 0) || 1;

      segments.push({
        accuracy: nbest.PronunciationAssessment?.AccuracyScore ?? 0,
        fluency: nbest.PronunciationAssessment?.FluencyScore ?? 0,
        prosody:
          typeof nbest.PronunciationAssessment?.ProsodyScore === 'number'
            ? nbest.PronunciationAssessment.ProsodyScore
            : null,
        durationTicks,
        words,
      });
    };

    recognizer.canceled = (_s, e) => {
      clearTimeout(safety);
      if (e.reason === sdk.CancellationReason.Error) {
        fail(
          new AzureAssessmentError(
            `Azure canceló el reconocimiento: ${e.errorDetails || 'error desconocido'}`,
          ),
        );
      } else {
        finish();
      }
    };

    recognizer.sessionStopped = () => {
      clearTimeout(safety);
      finish();
    };

    recognizer.startContinuousRecognitionAsync(
      () => {
        /* reconocimiento iniciado */
      },
      (err) => {
        clearTimeout(safety);
        fail(new AzureAssessmentError(`No se pudo iniciar el reconocimiento: ${err}`));
      },
    );
  });
}

/** Agrega los segmentos en un único resultado global. */
function aggregate(
  segments: Segment[],
  referenceText: string,
  durationSeconds: number,
): RawAssessment {
  const allWords = segments.flatMap((s) => s.words);
  if (allWords.length === 0) {
    throw new NoSpeechError();
  }

  const totalTicks = segments.reduce((acc, s) => acc + s.durationTicks, 0) || 1;

  // Accuracy y Fluency: promedio ponderado por duración de los puntajes de Azure.
  const accuracyScore = Math.round(
    segments.reduce((acc, s) => acc + s.accuracy * s.durationTicks, 0) / totalTicks,
  );
  const fluencyScore = Math.round(
    segments.reduce((acc, s) => acc + s.fluency * s.durationTicks, 0) / totalTicks,
  );

  // Prosodia: promedio de los segmentos que la reportaron.
  const prosodyValues = segments
    .map((s) => s.prosody)
    .filter((p): p is number => typeof p === 'number');
  const prosodyScore =
    prosodyValues.length > 0
      ? Math.round(prosodyValues.reduce((a, b) => a + b, 0) / prosodyValues.length)
      : null;

  // Completitud: palabras de referencia que sí se leyeron.
  const referenceWordCount = Math.max(1, countWords(referenceText));
  const omittedCount = allWords.filter(
    (w) => (w.PronunciationAssessment?.ErrorType ?? 'None') === 'Omission',
  ).length;
  const completenessScore = Math.round(
    Math.min(100, Math.max(0, ((referenceWordCount - omittedCount) / referenceWordCount) * 100)),
  );

  // Puntaje global de pronunciación (ponderación documentada por Microsoft).
  const pronunciationScore = Math.round(
    prosodyScore !== null
      ? accuracyScore * 0.4 + prosodyScore * 0.2 + fluencyScore * 0.2 + completenessScore * 0.2
      : accuracyScore * 0.6 + fluencyScore * 0.2 + completenessScore * 0.2,
  );

  // Palabras por minuto: palabras de referencia efectivamente leídas.
  const readWords = allWords.filter((w) => {
    const t = w.PronunciationAssessment?.ErrorType ?? 'None';
    return t !== 'Omission' && t !== 'Insertion';
  }).length;
  const wordsPerMinute =
    durationSeconds > 0 ? Math.round(readWords / (durationSeconds / 60)) : 0;

  // Texto reconocido (lo que el niño realmente dijo, sin las omisiones).
  const recognizedText = allWords
    .filter((w) => (w.PronunciationAssessment?.ErrorType ?? 'None') !== 'Omission')
    .map((w) => w.Word)
    .join(' ');

  const words: WordResult[] = allWords.map((w) => {
    const pa = w.PronunciationAssessment;
    const phonemes: PhonemeResult[] | undefined = w.Phonemes?.map((p) => ({
      phoneme: p.Phoneme ?? '',
      accuracyScore:
        typeof p.PronunciationAssessment?.AccuracyScore === 'number'
          ? p.PronunciationAssessment.AccuracyScore
          : null,
    }));

    return {
      text: w.Word,
      accuracyScore: typeof pa?.AccuracyScore === 'number' ? pa.AccuracyScore : null,
      errorType: toErrorType(pa?.ErrorType),
      offset: w.Offset,
      duration: w.Duration,
      phonemes: phonemes && phonemes.length > 0 ? phonemes : undefined,
    };
  });

  return {
    pronunciationScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
    wordsPerMinute,
    duration: Math.round(durationSeconds),
    recognizedText,
    words,
  };
}
