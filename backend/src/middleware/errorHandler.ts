import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { InvalidWavError } from '../services/wav.service.js';
import { AzureAssessmentError, NoSpeechError } from '../services/azurePronunciation.service.js';

/**
 * Manejador central de errores. Convierte cualquier fallo en una respuesta
 * JSON con un mensaje comprensible para el usuario y el código HTTP correcto.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Errores de subida (multer): archivo muy grande, tipo no permitido, etc.
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El audio es demasiado grande. Intenta con una lectura más corta.'
        : `Error al subir el audio: ${err.message}`;
    res.status(413).json({ error: message });
    return;
  }

  if (err instanceof InvalidWavError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof NoSpeechError) {
    res.status(422).json({ error: err.message });
    return;
  }

  if (err instanceof AzureAssessmentError) {
    console.error('[azure]', err);
    res.status(502).json({
      error: 'Tuvimos un problema al revisar tu lectura. Por favor, inténtalo otra vez.',
    });
    return;
  }

  if (err instanceof Error) {
    console.error('[error]', err);
    res.status(400).json({ error: err.message });
    return;
  }

  console.error('[error desconocido]', err);
  res.status(500).json({ error: 'Ocurrió un error inesperado.' });
}
