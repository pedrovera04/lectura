import { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { ReadingScreen } from './components/ReadingScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { getRandomPassage, type Passage } from './lib/passages';
import { evaluateReading } from './services/api';
import type { Recording } from './services/recorder';
import type { AssessmentResult } from './types/assessment';

type Screen = 'start' | 'reading' | 'processing' | 'results' | 'error';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [passage, setPassage] = useState<Passage>(() => getRandomPassage());
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleStart = () => {
    setPassage(getRandomPassage());
    setScreen('reading');
  };

  const handleFinish = async (recording: Recording) => {
    setScreen('processing');
    try {
      const assessment = await evaluateReading({
        audio: recording.blob,
        referenceText: passage.text,
      });
      setResult(assessment);
      setScreen('results');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocurrió un problema inesperado.');
      setScreen('error');
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setScreen('reading'); // mismo texto
  };

  const handleNewText = () => {
    setResult(null);
    setPassage(getRandomPassage(passage.id));
    setScreen('reading');
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <main className="mx-auto w-full max-w-4xl">
        {screen === 'start' && <StartScreen onStart={handleStart} />}

        {screen === 'reading' && <ReadingScreen passage={passage} onFinish={handleFinish} />}

        {screen === 'processing' && <ProcessingScreen />}

        {screen === 'results' && result && (
          <ResultsScreen
            result={result}
            onTryAgain={handleTryAgain}
            onNewText={handleNewText}
          />
        )}

        {screen === 'error' && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-pop-in">
            <div className="mb-6 text-7xl" aria-hidden>
              😕
            </div>
            <h2 className="mb-3 text-3xl font-extrabold text-brand-700">Algo salió mal</h2>
            <p className="mb-8 max-w-md text-lg font-semibold text-brand-900/70">{errorMessage}</p>
            <button
              onClick={() => setScreen('reading')}
              className="rounded-full bg-brand-500 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-brand-600 active:scale-95"
            >
              Volver a intentar
            </button>
          </div>
        )}
      </main>

      <footer className="mx-auto mt-10 max-w-4xl text-center text-sm font-semibold text-brand-900/40">
        Evaluación de lectura con Azure Speech · Hecho con cariño para aprender a leer
      </footer>
    </div>
  );
}
