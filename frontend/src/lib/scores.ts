/** Utilidades para convertir puntajes en etiquetas y colores amables. */

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface ScoreLevel {
  label: string;
  /** Clases Tailwind para la barra de progreso. */
  barClass: string;
  /** Clases Tailwind para el texto del porcentaje. */
  textClass: string;
  emoji: string;
}

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 85) {
    return { label: '¡Genial!', barClass: 'bg-emerald-500', textClass: 'text-emerald-600', emoji: '🌟' };
  }
  if (score >= 70) {
    return { label: '¡Muy bien!', barClass: 'bg-brand-500', textClass: 'text-brand-600', emoji: '👍' };
  }
  if (score >= 55) {
    return { label: 'Vas bien', barClass: 'bg-amber-500', textClass: 'text-amber-600', emoji: '💪' };
  }
  return { label: 'A practicar', barClass: 'bg-rose-500', textClass: 'text-rose-600', emoji: '🎯' };
}

export function overallHeadline(score: number): string {
  if (score >= 90) return '¡Excelente lectura!';
  if (score >= 75) return '¡Muy bien!';
  if (score >= 60) return '¡Vas por buen camino!';
  return '¡Sigue practicando!';
}
