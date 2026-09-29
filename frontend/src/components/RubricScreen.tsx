import { useEffect, useRef, useState } from 'react';
import {
  METRICAS,
  RUBRICA_POR_DEFECTO,
  validarRubrica,
  type Metrica,
  type NivelRubrica,
  type Rubric,
} from '../lib/rubric';
import { NIVELES, img } from '../lib/scores';

interface Props {
  rubric: Rubric;
  onSave: (rubric: Rubric) => void;
  onReset: () => void;
  onBack: () => void;
}

const clone = (r: Rubric): Rubric => ({ ...r, niveles: r.niveles.map((n) => ({ ...n })) });
const igual = (a: Rubric, b: Rubric) => JSON.stringify(a) === JSON.stringify(b);

export function RubricScreen({ rubric, onSave, onReset, onBack }: Props) {
  const [draft, setDraft] = useState<Rubric>(() => clone(rubric));
  const [saved, setSaved] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);

  const errores = validarRubrica(draft);
  const cambios = !igual(draft, rubric);
  const esDefecto = igual(draft, RUBRICA_POR_DEFECTO);

  const setNivel = (i: number, campo: keyof NivelRubrica, valor: string) => {
    setSaved(false);
    setDraft((d) => {
      const niveles = d.niveles.map((n, j) =>
        j !== i
          ? n
          : campo === 'minimo' || campo === 'ppmMin'
            ? { ...n, [campo]: valor === '' ? NaN : Number(valor) }
            : { ...n, [campo]: valor },
      );
      return { ...d, niveles };
    });
  };

  const guardar = () => {
    if (errores.length) return;
    onSave(clone(draft));
    setSaved(true);
  };

  const restablecer = () => {
    onReset();
    setDraft(clone(RUBRICA_POR_DEFECTO));
    setSaved(false);
  };

  const ultimo = draft.niveles.length - 1;

  return (
    <section className="pantalla" aria-labelledby="titulo-rubrica">
      <button type="button" className="btn btn--texto" onClick={onBack}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver
      </button>

      <div className="hero">
        <img src="/img/vivi.png" alt="" className="rubrica__personaje" width={360} height={360} />
        <h1 id="titulo-rubrica" tabIndex={-1} ref={titleRef}>Rúbrica de evaluación</h1>
        <p className="hero__intro">
          Define cuándo un estudiante alcanza cada nivel de calidad lectora. Los cambios se guardan
          en este navegador y se aplican a las próximas evaluaciones.
        </p>
      </div>

      <h2 className="subtitulo">1. ¿Qué puntaje decide el nivel?</h2>
      <div className="campo campo--estrecho">
        <label htmlFor="rubrica-metrica">Puntaje de Azure</label>
        <select
          id="rubrica-metrica"
          value={draft.metrica}
          onChange={(e) => {
            setSaved(false);
            setDraft((d) => ({ ...d, metrica: e.target.value as Metrica }));
          }}
        >
          {METRICAS.map((m) => (
            <option key={m.id} value={m.id}>{m.etiqueta}</option>
          ))}
        </select>
        <p className="ayuda">{METRICAS.find((m) => m.id === draft.metrica)?.ayuda}</p>
      </div>

      <h2 className="subtitulo">2. Requisitos de cada nivel</h2>
      <p className="ayuda">
        Un estudiante alcanza el mejor nivel cuyo puntaje <strong>y</strong> velocidad mínimos cumple
        a la vez. Los niveles van de mejor a peor.
      </p>

      <div className="rubrica__niveles">
        {draft.niveles.map((n, i) => {
          const esUltimo = i === ultimo;
          return (
            <article key={NIVELES[i].id} className="rubrica__nivel">
              <header className="rubrica__cabecera">
                <img src={img(NIVELES[i].personaje)} alt="" width={64} height={64} />
                <span className="rubrica__estrellas" aria-label={`${NIVELES.length - i} estrellas`}>
                  {'★'.repeat(NIVELES.length - i)}
                </span>
              </header>

              <div className="campo">
                <label htmlFor={`nombre-${i}`}>Nombre del nivel</label>
                <input
                  id={`nombre-${i}`}
                  type="text"
                  maxLength={30}
                  value={n.etiqueta}
                  onChange={(e) => setNivel(i, 'etiqueta', e.target.value)}
                />
              </div>

              <div className="campo">
                <label htmlFor={`desc-${i}`}>Descripción</label>
                <textarea
                  id={`desc-${i}`}
                  rows={2}
                  maxLength={140}
                  value={n.descripcion}
                  onChange={(e) => setNivel(i, 'descripcion', e.target.value)}
                />
              </div>

              <div className="rubrica__numeros">
                <div className="campo">
                  <label htmlFor={`min-${i}`}>Puntaje mínimo (%)</label>
                  <input
                    id={`min-${i}`}
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={Number.isNaN(n.minimo) ? '' : n.minimo}
                    disabled={esUltimo}
                    onChange={(e) => setNivel(i, 'minimo', e.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor={`ppm-${i}`}>Velocidad mínima (pal/min)</label>
                  <input
                    id={`ppm-${i}`}
                    type="number"
                    min={0}
                    max={300}
                    inputMode="numeric"
                    value={Number.isNaN(n.ppmMin) ? '' : n.ppmMin}
                    disabled={esUltimo}
                    onChange={(e) => setNivel(i, 'ppmMin', e.target.value)}
                  />
                </div>
              </div>
              {esUltimo && <p className="ayuda">Es el nivel base: lo alcanza cualquier lectura que no llegue a los anteriores.</p>}
            </article>
          );
        })}
      </div>

      {errores.length > 0 && (
        <div className="error" role="alert">
          <ul className="rubrica__errores">
            {errores.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}
      {saved && !cambios && (
        <p className="rubrica__ok" role="status">Rúbrica guardada. Se usará en la próxima evaluación.</p>
      )}

      <div className="acciones acciones--dos">
        <button type="button" className="btn btn--secundario" onClick={restablecer} disabled={esDefecto && !cambios && igual(rubric, RUBRICA_POR_DEFECTO)}>
          Restablecer valores
        </button>
        <button type="button" className="btn btn--primario" onClick={guardar} disabled={errores.length > 0 || !cambios}>
          Guardar rúbrica
        </button>
      </div>
    </section>
  );
}
