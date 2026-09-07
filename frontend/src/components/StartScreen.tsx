interface StartScreenProps {
  onStart: () => void;
}

/** Pantalla inicial: título, subtítulo y botón para comenzar. */
export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-pop-in">
      <div className="mb-6 text-8xl animate-float" aria-hidden>
        📖
      </div>
      <h1 className="mb-3 text-5xl font-extrabold text-brand-700 sm:text-6xl">¡Hora de leer!</h1>
      <p className="mb-10 max-w-md text-xl font-semibold text-brand-900/80">
        Lee el texto en voz alta y descubre cómo lo hiciste.
      </p>
      <button
        onClick={onStart}
        className="rounded-full bg-brand-500 px-10 py-5 text-2xl font-bold text-white shadow-lg shadow-brand-500/30 transition hover:scale-105 hover:bg-brand-600 active:scale-95"
      >
        Comenzar lectura
      </button>
    </div>
  );
}
