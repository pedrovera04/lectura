import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import readingRoutes from './routes/reading.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // Chequeo de salud (útil para Railway/Render y para probar rápido).
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      azure: Boolean(env.azure.key && env.azure.region),
      aiFeedback: env.anthropic.enabled,
      defaultLanguage: env.defaultLanguage,
    });
  });

  app.use('/api/reading', readingRoutes);

  // Manejador de errores al final de la cadena.
  app.use(errorHandler);

  return app;
}
