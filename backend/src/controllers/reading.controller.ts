import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { assessPronunciation } from '../services/azurePronunciation.service.js';
import { buildFeedback } from '../services/feedback.service.js';
import type { AssessmentResult } from '../types/assessment.types.js';

// Validación del cuerpo (los campos de texto llegan como parte del multipart/form-data).
const bodySchema = z.object({
  referenceText: z
    .string()
    .trim()
    .min(3, 'El texto de referencia es obligatorio.')
    .max(2000, 'El texto de referencia es demasiado largo.'),
  language: z
    .string()
    .trim()
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'El idioma debe tener el formato "es-CL".')
    .optional(),
});

/**
 * POST /api/reading/evaluate
 * Recibe: audio (WAV), referenceText, language.
 * Devuelve: AssessmentResult en JSON.
 */
export async function evaluateReading(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file || !req.file.buffer?.length) {
      res.status(400).json({ error: 'No se recibió ningún archivo de audio.' });
      return;
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
      return;
    }

    const { referenceText } = parsed.data;
    const language = parsed.data.language ?? env.defaultLanguage;

    // 1) Azure Pronunciation Assessment (datos objetivos, sin inventar nada).
    const raw = await assessPronunciation(req.file.buffer, referenceText, language);

    // 2) Feedback educativo (Claude si está configurado; si no, reglas locales).
    const feedback = await buildFeedback(raw);

    const result: AssessmentResult = {
      pronunciationScore: raw.pronunciationScore,
      accuracyScore: raw.accuracyScore,
      fluencyScore: raw.fluencyScore,
      completenessScore: raw.completenessScore,
      prosodyScore: raw.prosodyScore,
      wordsPerMinute: raw.wordsPerMinute,
      duration: raw.duration,
      referenceText,
      recognizedText: raw.recognizedText,
      words: raw.words,
      feedback,
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
}
