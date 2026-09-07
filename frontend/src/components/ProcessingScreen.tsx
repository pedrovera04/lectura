/** Pantalla de procesamiento amigable mientras se evalúa la lectura. */
export function ProcessingScreen() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-pop-in">
      <div className="mb-8 text-8xl animate-float" aria-hidden>
        🔎
      </div>
      <h2 className="mb-4 text-4xl font-extrabold text-brand-700">Estamos revisando tu lectura...</h2>
      <p className="mb-8 max-w-md text-xl font-semibold text-brand-900/70">
        Escuchamos con mucha atención cómo leíste. ¡Un momentito!
      </p>
      <div className="flex gap-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-4 w-4 animate-bounce rounded-full bg-brand-500"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="sr-only" role="status">
        Procesando la evaluación de la lectura.
      </span>
    </div>
  );
}
