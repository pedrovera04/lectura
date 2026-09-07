import type { AssessmentResult } from '../types/assessment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface EvaluateParams {
  audio: Blob;
  referenceText: string;
  language?: string;
}

/**
 * Envía el audio y el texto de referencia al backend y devuelve la evaluación.
 */
export async function evaluateReading({
  audio,
  referenceText,
  language,
}: EvaluateParams): Promise<AssessmentResult> {
  const formData = new FormData();
  formData.append('audio', audio, 'lectura.wav');
  formData.append('referenceText', referenceText);
  if (language) formData.append('language', language);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/reading/evaluate`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.');
  }

  if (!response.ok) {
    let message = 'Ocurrió un problema al revisar tu lectura.';
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(message);
  }

  return (await response.json()) as AssessmentResult;
}
