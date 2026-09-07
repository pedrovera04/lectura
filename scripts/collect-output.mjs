/**
 * Copia el build del frontend a ./dist en la raíz del repo.
 *
 * Vercel busca el "Output Directory" relativo a la raíz del proyecto.
 * Dejando el estático en ./dist funciona tanto si Vercel usa
 * vercel.json#outputDirectory ("dist") como si cae al valor por defecto.
 */
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs';

const SRC = 'frontend/dist';
const OUT = 'dist';

if (!existsSync(SRC)) {
  console.error(`✗ No existe ${SRC}. ¿Falló el build del frontend?`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

console.log(`✓ ${SRC} → ./${OUT}  (${readdirSync(OUT).join(', ')})`);
