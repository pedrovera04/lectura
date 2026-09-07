import type { Passage } from '../lib/passages';
import { useRecorder } from '../hooks/useRecorder';
import { RecordButton } from './RecordButton';
import type { Recording } from '../services/recorder';

interface ReadingScreenProps {
  passage: Passage;
  onFinish: (recording: Recording) => void;
}

/**
 * Módulo de lectura. Muestra el párrafo con tipografía grande y permite
 * grabar. Mientras el niño lee NO se muestran puntuaciones ni errores.
 */
export function ReadingScreen({ passage, onFinish }: ReadingScreenProps) {
  const { status, seconds, error, start, stop } = useRecorder();
  const recording = status === 'recording';

  const handleStop = async () => {
    const recorded = await stop();
    if (recorded) onFinish(recorded);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center animate-pop-in">
      <div className="mb-5 flex items-center gap-3 text-3xl font-extrabold text-brand-700">
        <span aria-hidden>{passage.emoji}</span>
        <h2>{passage.title}</h2>
      </div>

      <div className="mb-8 w-full rounded-3xl bg-white/90 p-8 shadow-lg">
        <p className="text-2xl leading-relaxed text-brand-900 sm:text-3xl sm:leading-relaxed">
          {passage.text}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 w-full rounded-2xl bg-rose-100 px-5 py-4 text-center text-lg font-semibold text-rose-700"
        >
          {error}
        </div>
      )}

      <RecordButton
        recording={recording}
        seconds={seconds}
        onStart={start}
        onStop={handleStop}
      />

      <p className="mt-6 max-w-md text-center text-base font-semibold text-brand-900/60">
        {recording
          ? 'Lee con calma y en voz clara. Cuando termines, presiona el botón rojo.'
          : 'Cuando estés listo, presiona el botón verde y comienza a leer.'}
      </p>
    </div>
  );
}
