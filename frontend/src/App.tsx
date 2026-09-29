import { useEffect, useState } from 'react';
import { Footer, Header, type Paso } from './components/Header';
import { StartScreen } from './components/StartScreen';
import { ReadingScreen } from './components/ReadingScreen';
import { ErrorView, Loading } from './components/Loading';
import { ResultsScreen } from './components/ResultsScreen';
import { getRandomPassage, PASSAGES, type Passage } from './lib/passages';
import { evaluateReading } from './services/api';
import type { Recording } from './services/recorder';
import type { AssessmentResult } from './types/assessment';

type Screen = 'start' | 'reading' | 'processing' | 'results' | 'error';

const PASO: Record<Screen, Paso> = {
  start: 'inicio',
  reading: 'lectura',
  processing: 'resultados',
  results: 'resultados',
  error: 'resultados',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [passage, setPassage] = useState<Passage>(PASSAGES[0]);
  const [studentCode, setStudentCode] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRecording, setLastRecording] = useState<Recording | null>(null);
  const [readingKey, setReadingKey] = useState(0);

  useEffect(() => {
    document.body.dataset.pantalla = PASO[screen];
    window.scrollTo(0, 0);
  }, [screen]);

  const goReading = () => {
    setResult(null);
    setLastRecording(null);
    setReadingKey((k) => k + 1);
    setScreen('reading');
  };

  const handleStart = (chosen: Passage, code: string) => {
    setPassage(chosen);
    setStudentCode(code);
    goReading();
  };

  const evaluate = async (recording: Recording) => {
    setLastRecording(recording);
    setScreen('processing');
    try {
      setResult(await evaluateReading({ audio: recording.blob, referenceText: passage.text }));
      setScreen('results');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocurrió un problema inesperado.');
      setScreen('error');
    }
  };

  const handleNewText = () => {
    setResult(null);
    setPassage(passage.id === 'propio' ? getRandomPassage() : getRandomPassage(passage.id));
    setReadingKey((k) => k + 1);
    setScreen('reading');
  };

  return (
    <>
      <Header paso={PASO[screen]} />
      <main className="contenedor" id="principal">
        {screen === 'start' && <StartScreen onStart={handleStart} />}
        {screen === 'reading' && (
          <ReadingScreen
            key={readingKey}
            passage={passage}
            onBack={() => setScreen('start')}
            onEvaluate={evaluate}
          />
        )}
        {screen === 'processing' && <Loading />}
        {screen === 'error' && (
          <ErrorView
            message={errorMessage}
            onRetry={() => (lastRecording ? evaluate(lastRecording) : goReading())}
            onBack={() => setScreen('start')}
          />
        )}
        {screen === 'results' && result && (
          <ResultsScreen
            result={result}
            passageId={passage.id}
            studentCode={studentCode}
            onTryAgain={goReading}
            onNewText={handleNewText}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
