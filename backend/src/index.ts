import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`\n🚀 Backend escuchando en http://localhost:${env.port}`);
  console.log(`   Región Azure: ${env.azure.region}`);
  console.log(`   Idioma por defecto: ${env.defaultLanguage}`);
  console.log(`   Feedback con Claude: ${env.anthropic.enabled ? 'activado' : 'desactivado (se usan reglas)'}\n`);
});
