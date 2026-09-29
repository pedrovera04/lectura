import { useEffect } from 'react';
import type { WordResult } from '../types/assessment';

interface Props {
  word: WordResult | null;
  onClose: () => void;
}

const ETIQUETAS: Record<WordResult['errorType'], string> = {
  None: 'Bien leída',
  Mispronunciation: 'Pronunciación por mejorar',
  Omission: 'No se leyó',
  Insertion: 'Palabra agregada',
  UnexpectedBreak: 'Pausa en un lugar poco común',
  MissingBreak: 'Faltó una pausa',
  Monotone: 'Entonación muy plana',
};

export function WordDetailModal({ word, onClose }: Props) {
  useEffect(() => {
    if (!word) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, onClose]);

  if (!word) return null;
  const fonemas = word.phonemes?.filter((p) => p.phoneme) ?? [];

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Detalle de la palabra ${word.text}`} onClick={onClose}>
      <div className="modal__caja" onClick={(e) => e.stopPropagation()}>
        <p className="modal__palabra">{word.text}</p>
        <p className="modal__estado">{ETIQUETAS[word.errorType]}</p>

        {typeof word.accuracyScore === 'number' && (
          <div className="modal__puntaje">
            <span>Puntuación de la palabra</span>
            <strong>{word.accuracyScore} %</strong>
          </div>
        )}

        {fonemas.length > 0 && (
          <div>
            <p className="modal__sub">Sonidos (fonemas)</p>
            <div className="fonemas">
              {fonemas.map((p, i) => (
                <span
                  key={i}
                  className={`fonema${(p.accuracyScore ?? 100) >= 70 ? '' : ' fonema--flojo'}`}
                  title={p.accuracyScore !== null ? `${p.accuracyScore} %` : undefined}
                >
                  {p.phoneme}
                  {p.accuracyScore !== null && <small> {p.accuracyScore} %</small>}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="ayuda ayuda--centrada">Prueba decir esta palabra despacio, sonido por sonido.</p>
        <button type="button" className="btn btn--primario" onClick={onClose} autoFocus>Entendido</button>
      </div>
    </div>
  );
}
