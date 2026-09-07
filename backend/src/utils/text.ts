/**
 * Utilidades de texto para trabajar con el texto de referencia.
 */

/** Normaliza una palabra: minúsculas y sin signos de puntuación ni acentos. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9ñü]/gi, ''); // quita puntuación
}

/** Cuenta las palabras "de verdad" del texto de referencia. */
export function countWords(text: string): number {
  return tokenizeWords(text).length;
}

/** Devuelve solo los tokens que son palabras (ignora puntuación suelta). */
export function tokenizeWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((t) => normalizeWord(t))
    .filter((t) => t.length > 0);
}
