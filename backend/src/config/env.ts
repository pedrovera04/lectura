import 'dotenv/config';

/**
 * Carga y valida la configuración desde variables de entorno.
 * Falla temprano (al iniciar) si falta algo obligatorio para Azure,
 * para no descubrir el error recién cuando llega la primera petición.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Falta la variable de entorno obligatoria "${name}". ` +
        `Revisa tu archivo .env (puedes copiarlo desde .env.example).`,
    );
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

export const env = {
  port: Number(optional('PORT', '3001')),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),

  azure: {
    key: required('AZURE_SPEECH_KEY'),
    region: required('AZURE_SPEECH_REGION'),
  },

  defaultLanguage: optional('DEFAULT_LANGUAGE', 'es-CL'),
  maxAudioBytes: Number(optional('MAX_AUDIO_MB', '10')) * 1024 * 1024,

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY?.trim() || '',
    model: optional('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
    get enabled(): boolean {
      return this.apiKey !== '';
    },
  },
} as const;
