import { useEffect, useRef, useState } from 'react';
import type { AssessmentResult, WordResult } from '../types/assessment';
import { PALETA_MARCA, img, num } from '../lib/scores';
import { METRICAS, clasificar, nivelesDe, puntajeDe, type Rubric } from '../lib/rubric';
import { WordDetailModal } from './WordDetailModal';

interface Props {
  result: AssessmentResult;
  rubric: Rubric;
  passageId: string;
  studentCode: string;
  onTryAgain: () => void;
  onNewText: () => void;
}

const META_POR_DEFECTO = 85; // si la rúbrica no exige velocidad al mejor nivel

const ICONO_ESTRELLA = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
  </svg>
);

/* ---- Alineación del texto original con las palabras evaluadas --------- */
const normalize = (w: string) =>
  w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñü]/gi, '');

interface Token {
  display: string;
  word: WordResult | null;
}

function buildTokens(result: AssessmentResult): Token[] {
  const refWords = result.words.filter((w) => w.errorType !== 'Insertion');
  let idx = 0;
  return result.referenceText
    .trim()
    .split(/\s+/)
    .map((raw) => {
      if (!normalize(raw)) return { display: raw, word: null };
      const word = refWords[idx] ?? null;
      if (word) idx += 1;
      return { display: raw, word };
    });
}

const CON_DETALLE: WordResult['errorType'][] = ['Mispronunciation', 'UnexpectedBreak', 'MissingBreak', 'Monotone'];

function claseToken(word: WordResult | null): string {
  switch (word?.errorType) {
    case 'Mispronunciation':
      return 'p p--sustitucion';
    case 'Omission':
      return 'p p--omision';
    case 'UnexpectedBreak':
    case 'MissingBreak':
    case 'Monotone':
      return 'p p--pausa';
    default:
      return 'p p--correcta';
  }
}

function lanzarConfeti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.confeti').forEach((n) => n.remove());
  const capa = document.createElement('div');
  capa.className = 'confeti';
  capa.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 70; i++) {
    const pieza = document.createElement('i');
    pieza.style.left = `${Math.random() * 100}%`;
    pieza.style.background = PALETA_MARCA[i % PALETA_MARCA.length];
    pieza.style.setProperty('--dx', `${Math.random() * 180 - 90}px`);
    pieza.style.setProperty('--giro', `${Math.random() * 900 - 450}deg`);
    pieza.style.setProperty('--dur', `${1.9 + Math.random() * 1.4}s`);
    pieza.style.animationDelay = `${Math.random() * 0.35}s`;
    if (i % 3 === 0) pieza.style.borderRadius = '50%';
    capa.appendChild(pieza);
  }
  document.body.appendChild(capa);
  window.setTimeout(() => capa.remove(), 4000);
}

export function ResultsScreen({ result, rubric, passageId, studentCode, onTryAgain, onNewText }: Props) {
  const [selected, setSelected] = useState<WordResult | null>(null);
  const [animate, setAnimate] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const NIVELES = nivelesDe(rubric);
  const score = puntajeDe(rubric, result);
  const metricaNombre = METRICAS.find((m) => m.id === rubric.metrica)?.etiqueta.toLowerCase() ?? 'pronunciación';
  const indice = clasificar(rubric, result);
  const META_VELOCIDAD = NIVELES[0].ppmMin || META_POR_DEFECTO;
  const nivel = NIVELES[indice];
  const estrellas = NIVELES.length - indice;
  const tokens = buildTokens(result);
  const insertions = result.words.filter((w) => w.errorType === 'Insertion');

  const conteo = {
    correcta: result.words.filter((w) => w.errorType === 'None').length,
    mejorar: result.words.filter((w) => CON_DETALLE.includes(w.errorType)).length,
    omitida: result.words.filter((w) => w.errorType === 'Omission').length,
    agregada: insertions.length,
  };

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    if (indice === 0) lanzarConfeti();
    return () => {
      cancelAnimationFrame(id);
      document.querySelectorAll('.confeti').forEach((n) => n.remove());
    };
  }, [indice]);

  const siguiente = indice > 0 ? NIVELES[indice - 1] : null;
  const faltan: string[] = [];
  if (siguiente) {
    if (score < siguiente.minimo) faltan.push(`${siguiente.minimo} % de ${metricaNombre} (hoy ${num(score, 0)} %)`);
    if (result.wordsPerMinute < siguiente.ppmMin)
      faltan.push(`${siguiente.ppmMin} palabras por minuto (hoy ${num(result.wordsPerMinute, 0)})`);
  }

  // Velocidad
  const escalaMax = Math.max(META_VELOCIDAD * 1.35, result.wordsPerMinute * 1.1, 1);
  const radio = 44;
  const circ = 2 * Math.PI * radio;
  const precision = Math.min(100, Math.max(0, result.accuracyScore));

  const descargar = () => {
    const datos = {
      generadoEn: new Date().toISOString(),
      estudiante: studentCode || null,
      rubrica: { ...rubric, nivelAlcanzado: NIVELES[indice].etiqueta, puntajeUsado: score },
      textoId: passageId,
      ...result,
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const dd = (n: number) => String(n).padStart(2, '0');
    const sello = `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}-${dd(d.getHours())}${dd(d.getMinutes())}`;
    a.href = url;
    a.download = `lectura-${studentCode || 'sin-codigo'}-${sello}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const metricas: { valor: string; etiqueta: string }[] = [
    { valor: `${num(result.fluencyScore, 0)} %`, etiqueta: 'fluidez' },
    { valor: `${num(result.completenessScore, 0)} %`, etiqueta: 'completitud' },
    { valor: `${num(result.pronunciationScore, 0)} %`, etiqueta: 'pronunciación' },
    ...(result.prosodyScore !== null ? [{ valor: `${num(result.prosodyScore, 0)} %`, etiqueta: 'entonación' }] : []),
    { valor: num(result.wordsPerMinute, 0), etiqueta: 'palabras por minuto' },
    { valor: num(result.duration, 1), etiqueta: 'segundos de lectura' },
  ];

  const leyenda = [
    { clase: 'correcta', texto: `Bien leída (${conteo.correcta})` },
    { clase: 'sustitucion', texto: `Por mejorar (${conteo.mejorar})` },
    { clase: 'omision', texto: `Omitida (${conteo.omitida})` },
    { clase: 'insercion', texto: `Agregada (${conteo.agregada})` },
  ];

  return (
    <section className="pantalla" aria-labelledby="titulo-resultados">
      <h1 id="titulo-resultados" className="visualmente-oculto" tabIndex={-1} ref={titleRef}>Resultados</h1>

      <div className="resultados">
        <section className="logro" aria-labelledby="nivel-valor">
          <img key={score} src={img(nivel.personaje)} alt="" className="logro__personaje" width={360} height={360} />
          <div className="logro__estrellas" role="img" aria-label={`${estrellas} de ${NIVELES.length} estrellas`}>
            {NIVELES.map((n, i) => (
              <span key={n.id} className={`estrella${i < estrellas ? ' encendida' : ''}`}>{ICONO_ESTRELLA}</span>
            ))}
          </div>
          <p className="logro__mensaje">{result.feedback.headline || nivel.mensaje}</p>
          <p className="logro__etiqueta">Calidad lectora</p>
          <p className="logro__nivel" id="nivel-valor">{nivel.etiqueta} · {num(score, 0)} %</p>
          <p className="logro__descripcion">{nivel.descripcion}</p>
          <p className="logro__meta">
            {siguiente ? (
              <>
                <strong>Próxima meta, {siguiente.etiqueta}:</strong> {faltan.join(' y ')}.
              </>
            ) : (
              <>
                <strong>Nivel más alto alcanzado.</strong> ¡Excelente lectura!
              </>
            )}
          </p>
        </section>

        <ol className="escala" aria-label="Niveles de lectura">
          {[...NIVELES].reverse().map((n, i) => {
            const actual = NIVELES.length - 1 - indice;
            return (
              <li
                key={n.id}
                className={`escala__item${i <= actual ? ' alcanzado' : ''}${i === actual ? ' actual' : ''}`}
                aria-current={i === actual ? 'step' : undefined}
              >
                <span className="escala__barra" />
                <span>{n.etiqueta}</span>
              </li>
            );
          })}
        </ol>

        <div className="destacadas">
          <article className="kpi kpi--velocidad">
            <p className="kpi__titulo">Velocidad lectora</p>
            <p className="kpi__valor">
              {num(result.wordsPerMinute, 0)}
              <span className="kpi__unidad">palabras / min</span>
            </p>
            <div
              className="barra-meta"
              role="img"
              aria-label={`${num(result.wordsPerMinute, 0)} de una meta de ${META_VELOCIDAD} palabras por minuto`}
            >
              <div
                className="barra-meta__relleno"
                style={{ width: animate ? `${Math.min(100, (result.wordsPerMinute / escalaMax) * 100)}%` : 0 }}
              />
              <div className="barra-meta__marca" style={{ left: `${(META_VELOCIDAD / escalaMax) * 100}%` }}>
                <span>meta {META_VELOCIDAD}</span>
              </div>
            </div>
            <p className="kpi__nota">Referencia de lectura fluida: {META_VELOCIDAD} por minuto.</p>
          </article>

          <article className="kpi kpi--precision">
            <svg viewBox="0 0 104 104" className="anillo" aria-hidden="true">
              <circle cx="52" cy="52" r={radio} fill="none" strokeWidth="12" className="anillo__fondo" />
              <circle
                cx="52" cy="52" r={radio} fill="none" strokeWidth="12" className="anillo__valor"
                strokeDasharray={circ}
                strokeDashoffset={animate ? circ * (1 - precision / 100) : circ}
              />
            </svg>
            <div className="kpi__texto">
              <p className="kpi__titulo">Precisión</p>
              <p className="kpi__valor">{num(result.accuracyScore, 0)}<span className="kpi__unidad">%</span></p>
              <p className="kpi__nota">Qué tan bien sonó cada palabra que leíste.</p>
            </div>
          </article>
        </div>

        <ul className="metricas">
          {metricas.map((m) => (
            <li key={m.etiqueta} className="metrica">
              <p className="metrica__valor">{m.valor}</p>
              <p className="metrica__etiqueta">{m.etiqueta}</p>
            </li>
          ))}
        </ul>

        <section className="bloque">
          <h2 className="subtitulo">Así leyó, palabra por palabra</h2>
          <ul className="leyenda">
            {leyenda.map((l) => (
              <li key={l.clase}>
                <span className={`p p--${l.clase}`}>abc</span>
                <span>{l.texto}</span>
              </li>
            ))}
          </ul>
          <div className="diff">
            {tokens.map((t, i) => {
              const clickable = t.word && CON_DETALLE.includes(t.word.errorType);
              return (
                <span key={i}>
                  {clickable ? (
                    <button
                      type="button"
                      className={`${claseToken(t.word)} p--boton`}
                      title="Toca para ver el detalle"
                      onClick={() => t.word && setSelected(t.word)}
                    >
                      {t.display}
                    </button>
                  ) : (
                    <span className={claseToken(t.word)} title={t.word?.errorType === 'Omission' ? 'No se leyó' : undefined}>
                      {t.display}
                    </span>
                  )}{' '}
                </span>
              );
            })}
            {insertions.map((w, i) => (
              <span key={`ins-${i}`}>
                <span className="p p--insercion" title="Palabra agregada que no está en el texto">{w.text}</span>{' '}
              </span>
            ))}
          </div>
          {conteo.mejorar > 0 && <p className="ayuda">Toca una palabra resaltada para ver sus sonidos.</p>}
        </section>

        <section className="bloque">
          <h2 className="subtitulo">Lo que se escuchó</h2>
          <p className="fuente-transcripcion">Transcripción automática (Azure Speech).</p>
          <blockquote className="transcripcion">{result.recognizedText}</blockquote>
        </section>

        <section className="bloque">
          <h2 className="subtitulo">Consejos para practicar</h2>
          <div className="consejos">
            <p>{result.feedback.message}</p>
            {result.feedback.tips.length > 0 && (
              <ul>
                {result.feedback.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            )}
          </div>
        </section>

        <div className="acciones acciones--dos acciones--final">
          <button type="button" className="btn btn--secundario" onClick={onTryAgain}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Leer de nuevo
          </button>
          <button type="button" className="btn btn--primario" onClick={onNewText}>
            Nueva lectura
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="acciones acciones--centro">
          <button type="button" className="btn btn--texto" onClick={descargar}>Descargar informe (JSON)</button>
        </div>
        <p className="ayuda ayuda--centrada">
          El informe contiene el texto, la transcripción, la evaluación palabra por palabra y todas las métricas. No incluye audio.
        </p>
      </div>

      <WordDetailModal word={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
