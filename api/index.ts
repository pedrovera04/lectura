/**
 * Punto de entrada serverless para Vercel.
 *
 * Vercel expone cualquier archivo dentro de /api como una Serverless Function.
 * Aquí reutilizamos EXACTAMENTE la misma app Express del backend
 * (../backend/dist/app.js, generado por `tsc`) y la exportamos como handler.
 *
 * El `vercel.json` reescribe /api/* hacia esta función, así que Express
 * recibe la ruta original (/api/health, /api/reading/evaluate) y la resuelve
 * con sus propios routers, sin cambios.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let app: Handler;

try {
  // Import dinámico: si el backend no está compilado o faltan variables de
  // entorno obligatorias (AZURE_SPEECH_KEY/REGION), lo capturamos y
  // respondemos con un error legible en vez de un 500 opaco.
  const mod = await import('../backend/dist/app.js');
  app = mod.createApp() as unknown as Handler;
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  app = (_req, res) => {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error:
          'El backend no está configurado correctamente. ' +
          'Revisa las variables de entorno en Vercel (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION). ' +
          `Detalle: ${message}`,
      }),
    );
  };
}

export default app;
