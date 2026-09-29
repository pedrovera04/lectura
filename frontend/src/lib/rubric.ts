import { NIVELES, type Nivel } from './scores';
import type { AssessmentResult } from '../types/assessment';

/** Puntaje de Azure sobre el que se decide el nivel. */
export type Metrica =
  | 'pronunciationScore'
  | 'accuracyScore'
  | 'fluencyScore'
  | 'completenessScore'
  | 'prosodyScore';

export const METRICAS: { id: Metrica; etiqueta: string; ayuda: string }[] = [
  { id: 'pronunciationScore', etiqueta: 'Pronunciación general', ayuda: 'Puntaje global de Azure (recomendado).' },
  { id: 'accuracyScore', etiqueta: 'Precisión', ayuda: 'Qué tan bien suena cada palabra.' },
  { id: 'fluencyScore', etiqueta: 'Fluidez', ayuda: 'Ritmo y pausas al leer.' },
  { id: 'completenessScore', etiqueta: 'Completitud', ayuda: 'Cuántas palabras del texto se leyeron.' },
  { id: 'prosodyScore', etiqueta: 'Entonación', ayuda: 'Si Azure no la entrega, se usa la pronunciación general.' },
];

export interface NivelRubrica {
  etiqueta: string;
  descripcion: string;
  minimo: number;
  ppmMin: number;
}

export interface Rubric {
  metrica: Metrica;
  /** De mejor a peor nivel. Siempre 4. */
  niveles: NivelRubrica[];
}

export const RUBRICA_POR_DEFECTO: Rubric = {
  metrica: 'pronunciationScore',
  niveles: NIVELES.map(({ etiqueta, descripcion, minimo, ppmMin }) => ({ etiqueta, descripcion, minimo, ppmMin })),
};

const KEY = 'lectura.rubrica.v1';

/** Devuelve los errores de validación (vacío si la rúbrica es válida). */
export function validarRubrica(r: Rubric): string[] {
  const errores: string[] = [];
  const n = r.niveles;
  n.forEach((nivel, i) => {
    if (!nivel.etiqueta.trim()) errores.push(`El nivel ${i + 1} necesita un nombre.`);
    if (!Number.isFinite(nivel.minimo) || nivel.minimo < 0 || nivel.minimo > 100)
      errores.push(`"${nivel.etiqueta || `Nivel ${i + 1}`}": el puntaje mínimo debe estar entre 0 y 100.`);
    if (!Number.isFinite(nivel.ppmMin) || nivel.ppmMin < 0 || nivel.ppmMin > 300)
      errores.push(`"${nivel.etiqueta || `Nivel ${i + 1}`}": la velocidad debe estar entre 0 y 300 palabras por minuto.`);
  });
  for (let i = 0; i < n.length - 1; i++) {
    if (n[i].minimo <= n[i + 1].minimo)
      errores.push(`El puntaje de "${n[i].etiqueta || `Nivel ${i + 1}`}" debe ser mayor que el del nivel siguiente.`);
    if (n[i].ppmMin < n[i + 1].ppmMin)
      errores.push(`La velocidad de "${n[i].etiqueta || `Nivel ${i + 1}`}" no puede ser menor que la del nivel siguiente.`);
  }
  return errores;
}

export function cargarRubrica(): Rubric {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return RUBRICA_POR_DEFECTO;
    const r = JSON.parse(raw) as Rubric;
    if (
      METRICAS.some((m) => m.id === r.metrica) &&
      Array.isArray(r.niveles) &&
      r.niveles.length === NIVELES.length &&
      validarRubrica(r).length === 0
    )
      return r;
  } catch {
    /* almacenamiento no disponible o dato dañado */
  }
  return RUBRICA_POR_DEFECTO;
}

export function guardarRubrica(r: Rubric): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* sin almacenamiento: la rúbrica vale solo para esta sesión */
  }
}

export function borrarRubrica(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada que borrar */
  }
}

/** Niveles listos para mostrar: rúbrica + personaje y mensaje fijos. */
export function nivelesDe(r: Rubric): Nivel[] {
  return r.niveles.map((n, i) => ({ ...NIVELES[i], ...n, id: NIVELES[i].id }));
}

export function puntajeDe(r: Rubric, res: AssessmentResult): number {
  return res[r.metrica] ?? res.pronunciationScore;
}

/** El mejor nivel cuyo puntaje Y velocidad mínimos se cumplen a la vez. */
export function clasificar(r: Rubric, res: AssessmentResult): number {
  const puntaje = puntajeDe(r, res);
  const i = r.niveles.findIndex((n) => puntaje >= n.minimo && res.wordsPerMinute >= n.ppmMin);
  return i === -1 ? r.niveles.length - 1 : i;
}
