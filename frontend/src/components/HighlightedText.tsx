import type { AssessmentResult, WordResult } from '../types/assessment';

interface HighlightedTextProps {
  result: AssessmentResult;
  onWordClick: (word: WordResult) => void;
}

interface DisplayToken {
  /** Texto a mostrar (respeta la puntuación del texto original). */
  display: string;
  word: WordResult | null;
}

function normalize(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñü]/gi, '');
}

/**
 * Alinea el texto de referencia (con su puntuación) con las palabras que
 * Azure evaluó. Las inserciones (palabras agregadas) se muestran aparte,
 * porque no forman parte del texto original.
 */
function buildTokens(result: AssessmentResult): DisplayToken[] {
  const referenceTokens = result.referenceText.trim().split(/\s+/);
  // Palabras que corresponden al texto de referencia (excluye inserciones).
  const refWords = result.words.filter((w) => w.errorType !== 'Insertion');

  const tokens: DisplayToken[] = [];
  let idx = 0;
  for (const rawToken of referenceTokens) {
    const core = normalize(rawToken);
    if (core.length === 0) {
      tokens.push({ display: rawToken, word: null });
      continue;
    }
    // Con enableMiscue, las palabras de referencia (sin inserciones)
    // mantienen el mismo orden que el texto original: emparejamos por posición.
    const candidate = refWords[idx];
    tokens.push({ display: rawToken, word: candidate ?? null });
    if (candidate) idx += 1;
  }
  return tokens;
}

function tokenClass(word: WordResult | null): string {
  if (!word) return 'text-brand-900';
  switch (word.errorType) {
    case 'None':
      return 'text-emerald-700';
    case 'Mispronunciation':
      return 'cursor-pointer rounded-md bg-amber-200 px-1 text-amber-900 underline decoration-amber-500 decoration-2 underline-offset-2 hover:bg-amber-300';
    case 'Omission':
      return 'rounded-md bg-slate-200 px-1 text-slate-400 line-through decoration-slate-400';
    case 'UnexpectedBreak':
    case 'MissingBreak':
    case 'Monotone':
      return 'cursor-pointer rounded-md bg-sky-100 px-1 text-sky-800 hover:bg-sky-200';
    default:
      return 'text-brand-900';
  }
}

const CLICKABLE: WordResult['errorType'][] = [
  'Mispronunciation',
  'UnexpectedBreak',
  'MissingBreak',
  'Monotone',
];

export function HighlightedText({ result, onWordClick }: HighlightedTextProps) {
  const tokens = buildTokens(result);
  const insertions = result.words.filter((w) => w.errorType === 'Insertion');

  return (
    <div>
      <p className="text-2xl leading-loose text-brand-900">
        {tokens.map((token, i) => {
          const clickable = token.word && CLICKABLE.includes(token.word.errorType);
          const className = `${tokenClass(token.word)} transition`;
          return (
            <span key={i}>
              {clickable ? (
                <button
                  type="button"
                  className={className}
                  onClick={() => token.word && onWordClick(token.word)}
                  title="Pronunciación por mejorar"
                >
                  {token.display}
                </button>
              ) : (
                <span className={className}>{token.display}</span>
              )}{' '}
            </span>
          );
        })}
      </p>

      {insertions.length > 0 && (
        <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3">
          <p className="text-base font-semibold text-rose-700">
            ➕ Palabras que agregaste (no estaban en el texto):
          </p>
          <p className="mt-1 text-lg text-rose-800">
            {insertions.map((w, i) => (
              <span key={i} className="mr-2 inline-block rounded-md bg-rose-100 px-2 py-0.5">
                {w.text}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Leyenda de colores, sencilla y de alto contraste. */}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-600" /> Bien leída
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400" /> Por mejorar (tócala)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400" /> No se leyó
        </span>
      </div>
    </div>
  );
}
