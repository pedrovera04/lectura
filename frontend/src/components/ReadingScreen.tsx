import { useEffect, useMemo, useRef, useState } from 'react';
import type { Passage } from '../lib/passages';
import { useRecorder } from '../hooks/useRecorder';
import type { Recording } from '../services/recorder';
import { formatTime, img, num, type Personaje } from '../lib/scores';

interface Props {
  passage: Passage;
  onBack: () => void;
  onEvaluate: (recording: Recording) => void;
}

export function ReadingScreen({ passage, onBack, onEvaluate }: Props) {
  const { status, seconds, error, start, stop, reset } = useRecorder();
  const [recording, setRecording] = useState<Recording | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const grabando = status === 'recording';

  const audioUrl = useMemo(() => (recording ? URL.createObjectURL(recording.blob) : null), [recording]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  useEffect(() => {
    document.body.classList.toggle('grabando', grabando);
    return () => document.body.classList.remove('grabando');
  }, [grabando]);

  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);

  const handleToggle = async () => {
    if (grabando) {
      const rec = await stop();
      if (rec) setRecording(rec);
    } else {
      setRecording(null);
      await start();
    }
  };

  const handleRepeat = () => {
    setRecording(null);
    reset();
  };

  const handleBack = () => {
    reset();
    onBack();
  };

  const compa: Personaje = grabando ? 'greta' : recording ? 'carlos' : 'lalo';
  const burbuja = grabando
    ? '¡Te estoy escuchando! Lee con calma.'
    : recording
      ? `¡Listo! Grabaste ${num(recording.durationSeconds)} segundos.`
      : 'Cuando estés listo, toca el botón rojo.';
  const tiempo = recording && !grabando ? recording.durationSeconds : seconds;

  return (
    <section className="pantalla" aria-labelledby="titulo-lectura">
      <button type="button" className="btn btn--texto" onClick={handleBack}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Cambiar texto
      </button>
      <h1 id="titulo-lectura" className="visualmente-oculto" tabIndex={-1} ref={titleRef}>
        Lectura en voz alta
      </h1>

      <div className="cuaderno">
        <div className="cuaderno__anillos" aria-hidden="true" />
        <p className="cuaderno__etiqueta">Lee este texto en voz alta</p>
        <div className="texto-lectura" tabIndex={0} role="article" aria-label="Texto para leer">
          {passage.text}
        </div>
      </div>

      <div className="grabadora">
        <div className="compa">
          <img src={img(compa)} alt="" className="compa__img" width={360} height={360} />
          <p className="burbuja" aria-live="polite">{burbuja}</p>
        </div>

        <p className="cronometro" role="timer" aria-live="off">{formatTime(tiempo)}</p>

        <button type="button" className="btn-rec" aria-pressed={grabando} onClick={handleToggle}>
          <span className="btn-rec__onda" aria-hidden="true" />
          <span className="btn-rec__onda btn-rec__onda--2" aria-hidden="true" />
          <svg className="btn-rec__icono btn-rec__icono--mic" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
            <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <svg className="btn-rec__icono btn-rec__icono--stop" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
          </svg>
          <span className="btn-rec__texto">{grabando ? 'Detener' : recording ? 'Grabar de nuevo' : 'Grabar'}</span>
        </button>

        {error && <p className="error" role="alert">{error}</p>}

        {recording && !grabando && audioUrl && (
          <div className="revision">
            <p className="revision__titulo">Escucha la grabación antes de evaluar</p>
            <audio controls preload="metadata" src={audioUrl} />
            <div className="acciones acciones--dos">
              <button type="button" className="btn btn--secundario" onClick={handleRepeat}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Repetir
              </button>
              <button type="button" className="btn btn--primario" onClick={() => onEvaluate(recording)} autoFocus>
                Evaluar lectura
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="aviso-privacidad">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
        <span>
          <strong>Privacidad:</strong> el audio se envía una sola vez a Azure Speech para evaluar la
          lectura. No se guarda en este dispositivo ni en el servidor.
        </span>
      </p>
    </section>
  );
}
