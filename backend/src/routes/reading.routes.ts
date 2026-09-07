import { Router } from 'express';
import { uploadAudio } from '../middleware/upload.js';
import { evaluateReading } from '../controllers/reading.controller.js';

const router = Router();

/**
 * POST /api/reading/evaluate
 * Campos (multipart/form-data):
 *   - audio: archivo WAV
 *   - referenceText: texto que el niño debía leer
 *   - language: locale opcional (por defecto DEFAULT_LANGUAGE)
 */
router.post('/evaluate', uploadAudio, evaluateReading);

export default router;
