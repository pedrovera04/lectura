import { scoreLevel } from '../lib/scores';

interface ScoreBarProps {
  label: string;
  icon: string;
  score: number;
}

/** Barra de progreso grande y legible para mostrar un puntaje 0–100. */
export function ScoreBar({ label, icon, score }: ScoreBarProps) {
  const level = scoreLevel(score);
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold text-brand-900">
          <span aria-hidden>{icon}</span>
          {label}
        </span>
        <span className={`text-xl font-extrabold ${level.textClass}`}>{clamped}%</span>
      </div>
      <div
        className="h-5 w-full overflow-hidden rounded-full bg-brand-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${clamped} por ciento`}
      >
        <div
          className={`h-full rounded-full ${level.barClass} animate-grow-bar transition-all`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
