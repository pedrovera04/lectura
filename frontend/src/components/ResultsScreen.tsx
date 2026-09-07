import { useState } from 'react';
import type { AssessmentResult, WordResult } from '../types/assessment';
import { ScoreBar } from './ScoreBar';
import { HighlightedText } from './HighlightedText';
import { WordDetailModal } from './WordDetailModal';
import { overallHeadline, scoreLevel } from '../lib/scores';

interface ResultsScreenProps {
  result: AssessmentResult;
  onTryAgain: () => void;
  onNewText: () => void;
}

/** Pantalla completa de resultados, sencilla y amigable para el niño. */
export function ResultsScreen({ result, onTryAgain, onNewText }: ResultsScreenProps) {
  const [selectedWord, setSelectedWord] = useState<WordResult | null>(null);
  const overall = scoreLevel(result.pronunciationScore);

  return (
    <div className="mx-auto max-w-3xl animate-pop-in pb-10">
      {/* 1) Resultado general */}
      <section className="mb-6 rounded-3xl bg-white/90 p-8 text-center shadow-lg">
        <div className="mb-2 text-7xl animate-float" aria-hidden>
          {overall.emoji}
        </div>
        <h2 className="text-4xl font-extrabold text-brand-700">
          {result.feedback.headline || overallHeadline(result.pronunciationScore)}
        </h2>
        <div className="mt-4 inline-flex items-baseline gap-2 rounded-full bg-brand-50 px-6 py-2">
          <span className="text-lg font-semibold text-brand-900/70">Resultado general</span>
          <span className={`text-3xl font-extrabold ${overall.textClass}`}>
            {result.pronunciationScore}%
          </span>
        </div>
      </section>

      {/* 2–6) Puntajes */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <ScoreBar label="Precisión" icon="🎯" score={result.accuracyScore} />
        <ScoreBar label="Fluidez" icon="🌊" score={result.fluencyScore} />
        <ScoreBar label="Completitud" icon="✅" score={result.completenessScore} />
        <ScoreBar label="Pronunciación" icon="🗣️" score={result.pronunciationScore} />
        {result.prosodyScore !== null && (
          <ScoreBar label="Entonación" icon="🎵" score={result.prosodyScore} />
        )}
      </section>

      {/* 6) Velocidad de lectura */}
      <section className="mb-6 flex items-center justify-center gap-4 rounded-3xl bg-white/90 p-5 shadow-sm">
        <span className="text-4xl" aria-hidden>
          ⏱️
        </span>
        <div className="text-center">
          <div className="text-lg font-semibold text-brand-900/70">Velocidad de lectura</div>
          <div className="text-2xl font-extrabold text-brand-700">
            {result.wordsPerMinute} palabras por minuto
          </div>
          <div className="text-sm font-semibold text-brand-900/50">
            Leíste durante {result.duration} segundos
          </div>
        </div>
      </section>

      {/* 7) Texto leído con errores resaltados */}
      <section className="mb-6 rounded-3xl bg-white/90 p-8 shadow-sm">
        <h3 className="mb-4 text-2xl font-extrabold text-brand-700">Tu lectura 📄</h3>
        <HighlightedText result={result} onWordClick={setSelectedWord} />
      </section>

      {/* 8) Recomendaciones (feedback educativo) */}
      <section className="mb-8 rounded-3xl bg-gradient-to-br from-brand-50 to-emerald-50 p-8 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-2xl font-extrabold text-brand-700">
          <span aria-hidden>💬</span> Consejos para ti
        </h3>
        <p className="mb-4 text-xl leading-relaxed text-brand-900">{result.feedback.message}</p>
        {result.feedback.tips.length > 0 && (
          <ul className="space-y-2">
            {result.feedback.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-lg text-brand-900">
                <span aria-hidden className="mt-0.5 text-xl">
                  ✨
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 9–10) Botones de acción */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <button
          onClick={onTryAgain}
          className="rounded-full bg-brand-500 px-8 py-4 text-xl font-bold text-white shadow-lg shadow-brand-500/30 transition hover:scale-105 hover:bg-brand-600 active:scale-95"
        >
          🔁 Intentar nuevamente
        </button>
        <button
          onClick={onNewText}
          className="rounded-full bg-emerald-500 px-8 py-4 text-xl font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-600 active:scale-95"
        >
          📚 Leer otro texto
        </button>
      </div>

      <WordDetailModal word={selectedWord} onClose={() => setSelectedWord(null)} />
    </div>
  );
}
