import { useEffect } from 'react';
import type { WordResult } from '../types/assessment';

interface WordDetailModalProps {
  word: WordResult | null;
  onClose: () => void;
}

const ERROR_LABELS: Record<WordResult['errorType'], string> = {
  None: 'Bien leída',
  Mispronunciation: 'Pronunciación por mejorar',
  Omission: 'No se leyó',
  Insertion: 'Palabra agregada',
  UnexpectedBreak: 'Pausa en un lugar poco común',
  MissingBreak: 'Faltó una pausa',
  Monotone: 'Entonación muy plana',
};

/** Muestra el detalle de una palabra con error. Solo datos reales de Azure. */
export function WordDetailModal({ word, onClose }: WordDetailModalProps) {
  useEffect(() => {
    if (!word) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, onClose]);

  if (!word) return null;

  const phonemes = word.phonemes?.filter((p) => p.phoneme) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de la palabra ${word.text}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-center text-3xl font-extrabold text-brand-700">{word.text}</div>
        <div className="mb-4 text-center text-lg font-semibold text-amber-600">
          {ERROR_LABELS[word.errorType]}
        </div>

        {typeof word.accuracyScore === 'number' && (
          <div className="mb-4 rounded-2xl bg-brand-50 px-4 py-3 text-center">
            <div className="text-sm font-semibold text-brand-900/70">Puntuación de la palabra</div>
            <div className="text-3xl font-extrabold text-brand-600">{word.accuracyScore}%</div>
          </div>
        )}

        {phonemes.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-semibold text-brand-900/70">Sonidos (fonemas):</div>
            <div className="flex flex-wrap gap-2">
              {phonemes.map((p, i) => {
                const good = (p.accuracyScore ?? 100) >= 70;
                return (
                  <span
                    key={i}
                    className={`rounded-lg px-2 py-1 text-sm font-bold ${
                      good ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                    title={p.accuracyScore !== null ? `${p.accuracyScore}%` : undefined}
                  >
                    {p.phoneme}
                    {p.accuracyScore !== null && (
                      <span className="ml-1 opacity-70">{p.accuracyScore}%</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <p className="mb-4 text-center text-base font-semibold text-brand-900/70">
          ¡Prueba diciendo esta palabra despacio, sonido por sonido! 💪
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-full bg-brand-500 py-3 text-lg font-bold text-white transition hover:bg-brand-600"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
