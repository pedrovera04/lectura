import { useState } from 'react';
import { PASSAGES, countWords, type Passage } from '../lib/passages';
import { PERSONAJES, img } from '../lib/scores';

const COLORES = [
  { c: 'var(--azul)', palido: 'var(--azul-palido)', sobre: '#fff' },
  { c: 'var(--rojo)', palido: 'var(--rojo-palido)', sobre: '#fff' },
  { c: 'var(--amarillo)', palido: 'var(--amarillo-palido)', sobre: 'var(--indigo-oscuro)' },
];

interface Props {
  onStart: (passage: Passage, studentCode: string) => void;
}

export function StartScreen({ onStart }: Props) {
  const [selectedId, setSelectedId] = useState(PASSAGES[0].id);
  const [own, setOwn] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const ownText = own.trim();
    if (ownText) {
      if (countWords(ownText) < 3) return setError('El texto propio debe tener al menos 3 palabras.');
      return onStart({ id: 'propio', title: 'Texto propio', description: '', text: ownText }, code.trim());
    }
    const passage = PASSAGES.find((p) => p.id === selectedId);
    if (!passage) return setError('Elige un texto de la lista o pega uno propio.');
    onStart(passage, code.trim());
  };

  return (
    <section className="pantalla" aria-labelledby="titulo-inicio">
      <div className="hero">
        <div className="hero__personajes" aria-hidden="true">
          {PERSONAJES.map((p) => (
            <img key={p} src={img(p)} alt="" className="hero__personaje" width={360} height={360} />
          ))}
        </div>
        <h1 id="titulo-inicio">¡Vamos a leer!</h1>
        <p className="hero__intro">
          Elige un texto, grábate leyendo en voz alta y descubre al instante cómo pronunciaste.
        </p>
      </div>

      <h2 className="subtitulo" id="titulo-textos">Elige un texto</h2>
      <div className="lista-textos" role="radiogroup" aria-labelledby="titulo-textos">
        {PASSAGES.map((p, i) => {
          const color = COLORES[i % COLORES.length];
          const checked = !own.trim() && selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={checked}
              className="tarjeta-texto"
              style={{ ['--c' as string]: color.c, ['--c-palido' as string]: color.palido }}
              onClick={() => {
                setSelectedId(p.id);
                setOwn('');
                setError('');
              }}
            >
              <span className="tarjeta-texto__avatar">
                <img src={img(PERSONAJES[i % PERSONAJES.length])} alt="" width={84} height={84} />
              </span>
              <span className="tarjeta-texto__cuerpo">
                <span className="tarjeta-texto__titulo">{p.title}</span>
                <span className="tarjeta-texto__desc">{p.description}</span>
                <span className="tarjeta-texto__meta">
                  <span className="chip">{countWords(p.text)} palabras</span>
                </span>
              </span>
              <span className="tarjeta-texto__check" style={{ color: color.sobre }}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>

      <details className="bloque-propio">
        <summary>
          <img src="/img/greta.png" alt="" className="bloque-propio__avatar" width={360} height={360} />
          <span>
            <span className="bloque-propio__titulo">Usar un texto propio</span>
            <span className="bloque-propio__desc">Pega cualquier texto de la clase</span>
          </span>
        </summary>
        <div className="campo">
          <label htmlFor="texto-propio">Texto que leerá el estudiante</label>
          <textarea
            id="texto-propio"
            rows={5}
            placeholder="Escribe o pega el texto…"
            value={own}
            maxLength={2000}
            onChange={(e) => {
              setOwn(e.target.value);
              setError('');
            }}
          />
          <p className="ayuda">Mínimo 3 palabras, máximo 2000 caracteres.</p>
        </div>
      </details>

      <h2 className="subtitulo">¿Quién va a leer?</h2>
      <div className="campo campo--estrecho">
        <label htmlFor="codigo-estudiante">
          Código del estudiante <span className="opcional">(opcional)</span>
        </label>
        <input
          type="text"
          id="codigo-estudiante"
          autoComplete="off"
          placeholder="Ej: 2B-014"
          maxLength={32}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p className="ayuda">Solo un código. No escribas el nombre del estudiante.</p>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="acciones acciones--centro">
        <button type="button" className="btn btn--play" onClick={submit}>
          <span className="btn--play__circulo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
          </span>
          Comenzar a leer
        </button>
      </div>
    </section>
  );
}
