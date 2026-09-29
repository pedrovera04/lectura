/** Niveles, personajes y utilidades de presentación de los resultados. */

export const PERSONAJES = ['lalo', 'vivi', 'carlos', 'greta'] as const;
export type Personaje = (typeof PERSONAJES)[number];
export const img = (nombre: Personaje) => `/img/${nombre}.png`;

export const PALETA_MARCA = ['#bd121f', '#312783', '#fcc31b', '#ff451a', '#4687d0', '#9adee1'];

export interface Nivel {
  id: string;
  etiqueta: string;
  descripcion: string;
  /** Puntaje general mínimo (0–100) para alcanzar el nivel. */
  minimo: number;
  /** Velocidad mínima (palabras por minuto) para alcanzar el nivel. */
  ppmMin: number;
  personaje: Personaje;
  mensaje: string;
}

/** Niveles por defecto (de mejor a peor). Los personajes y mensajes son fijos; el resto se configura en la rúbrica. */
export const NIVELES: Nivel[] = [
  {
    id: 'excelente',
    etiqueta: 'Excelente',
    descripcion: 'Lee con claridad, buen ritmo y casi sin errores.',
    minimo: 90,
    ppmMin: 85,
    personaje: 'carlos',
    mensaje: '¡Leíste de maravilla!',
  },
  {
    id: 'muy-bien',
    etiqueta: 'Muy bien',
    descripcion: 'Lee con seguridad; solo algunas palabras por pulir.',
    minimo: 75,
    ppmMin: 60,
    personaje: 'vivi',
    mensaje: '¡Muy bien! Ya lees con mucha seguridad.',
  },
  {
    id: 'en-camino',
    etiqueta: 'En camino',
    descripcion: 'Lee la mayoría de las palabras; sigue practicando el ritmo.',
    minimo: 60,
    ppmMin: 30,
    personaje: 'lalo',
    mensaje: '¡Vas muy bien! Cada día lees mejor.',
  },
  {
    id: 'practicando',
    etiqueta: 'Practicando',
    descripcion: 'Está empezando a reconocer las palabras completas.',
    minimo: 0,
    ppmMin: 0,
    personaje: 'greta',
    mensaje: '¡Buen comienzo! Sigamos practicando juntos.',
  },
];

/** Números con coma decimal, como se escriben en Chile. */
export const num = (valor: number, decimales = 1): string =>
  Number(valor).toLocaleString('es-CL', { maximumFractionDigits: decimales });

export function formatTime(total: number): string {
  const t = Math.max(0, Math.floor(total));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
