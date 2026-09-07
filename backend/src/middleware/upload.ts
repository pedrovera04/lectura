import multer from 'multer';
import { env } from '../config/env.js';

/**
 * Configuración de la subida de audio.
 * - Almacenamiento en memoria (el archivo es pequeño y va directo a Azure).
 * - Límite de tamaño configurable (MAX_AUDIO_MB).
 * - Validación de tipo MIME: solo audio.
 */

const ALLOWED_MIME = new Set([
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/vnd.wave',
]);

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxAudioBytes,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de audio no permitido: ${file.mimetype}. Se espera WAV.`));
    }
  },
}).single('audio');
