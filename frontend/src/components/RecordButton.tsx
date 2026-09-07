import { formatSeconds } from '../lib/scores';

interface RecordButtonProps {
  recording: boolean;
  seconds: number;
  onStart: () => void;
  onStop: () => void;
}

/** Botón grande de grabar / terminar, con indicador visual y contador. */
export function RecordButton({ recording, seconds, onStart, onStop }: RecordButtonProps) {
  if (!recording) {
    return (
      <button
        onClick={onStart}
        className="flex items-center gap-3 rounded-full bg-emerald-500 px-8 py-5 text-2xl font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-600 active:scale-95"
      >
        <span aria-hidden>🎙️</span>
        Comenzar a leer
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3" aria-live="polite">
        <span className="relative flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 animate-pulse-ring" />
          <span className="relative inline-flex h-5 w-5 rounded-full bg-rose-500" />
        </span>
        <span className="text-2xl font-bold tabular-nums text-rose-600">
          {formatSeconds(seconds)}
        </span>
      </div>
      <button
        onClick={onStop}
        className="flex items-center gap-3 rounded-full bg-rose-500 px-8 py-5 text-2xl font-bold text-white shadow-lg shadow-rose-500/30 transition hover:scale-105 hover:bg-rose-600 active:scale-95"
      >
        <span aria-hidden>⏹️</span>
        Terminar lectura
      </button>
    </div>
  );
}
