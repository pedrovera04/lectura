import { useEffect, useRef } from 'react';

function useFocus() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return ref;
}

export function Loading() {
  const ref = useFocus();
  return (
    <section className="pantalla" aria-labelledby="titulo-resultados">
      <h1 id="titulo-resultados" className="visualmente-oculto" tabIndex={-1} ref={ref}>Resultados</h1>
      <div className="cargando">
        <img src="/img/greta.png" alt="" className="cargando__personaje" width={360} height={360} />
        <p className="cargando__texto" role="status">Escuchando la grabación…</p>
        <div className="cargando__puntos" aria-hidden="true"><span /><span /><span /></div>
        <div className="skeleton skeleton--metricas" />
        <div className="skeleton skeleton--texto" />
      </div>
    </section>
  );
}

interface ErrorProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorView({ message, onRetry, onBack }: ErrorProps) {
  const ref = useFocus();
  return (
    <section className="pantalla" aria-labelledby="titulo-resultados">
      <h1 id="titulo-resultados" className="visualmente-oculto" tabIndex={-1} ref={ref}>Resultados</h1>
      <div className="cargando">
        <img src="/img/lalo.png" alt="" className="cargando__personaje" width={360} height={360} />
      </div>
      <div className="error" role="alert">{message}</div>
      <div className="acciones acciones--dos">
        <button type="button" className="btn btn--secundario" onClick={onBack}>Cambiar texto</button>
        <button type="button" className="btn btn--primario" onClick={onRetry}>Volver a intentar</button>
      </div>
    </section>
  );
}
