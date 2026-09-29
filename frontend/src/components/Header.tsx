export type Paso = 'inicio' | 'lectura' | 'resultados';

const PASOS: { id: Paso; texto: string }[] = [
  { id: 'inicio', texto: 'Texto' },
  { id: 'lectura', texto: 'Lectura' },
  { id: 'resultados', texto: 'Resultados' },
];

export function Header({ paso }: { paso: Paso }) {
  const actual = PASOS.findIndex((p) => p.id === paso);
  return (
    <header className="cabecera">
      <ol className="pasos" aria-label="Progreso">
        {PASOS.map((p, i) => (
          <li
            key={p.id}
            className={`pasos__item${i < actual ? ' hecho' : ''}`}
            aria-current={i === actual ? 'step' : undefined}
          >
            <span className="pasos__num" aria-hidden="true">{i + 1}</span>
            <span className="pasos__txt">{p.texto}</span>
          </li>
        ))}
      </ol>
      <div className="marca">
        <img className="marca__logo" src="/img/logo-alfadeca.png" alt="Alfadeca TV" width={900} height={275} />
        <p className="marca__producto">Lectura en voz alta</p>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="pie">
      <div className="pie__franja" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="contenedor pie__inner">
        <img className="pie__logo" src="/img/logo-alfadeca.png" alt="Alfadeca TV" width={900} height={275} />
        <p>Evaluación de lectura con Azure Speech. Hecho con cariño para aprender a leer.</p>
      </div>
    </footer>
  );
}
