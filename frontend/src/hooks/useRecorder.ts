import { useCallback, useEffect, useRef, useState } from 'react';
import { MicrophoneError, WavRecorder, type Recording } from '../services/recorder';

type RecorderStatus = 'idle' | 'recording';

interface UseRecorderResult {
  status: RecorderStatus;
  seconds: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<Recording | null>;
  reset: () => void;
}

/**
 * Encapsula la lógica de grabación y el contador de tiempo,
 * dejando a los componentes solo la parte visual.
 */
export function useRecorder(): UseRecorderResult {
  const recorderRef = useRef<WavRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(async () => {
    setError(null);
    setSeconds(0);
    const recorder = new WavRecorder();
    try {
      await recorder.start();
    } catch (err) {
      setError(err instanceof MicrophoneError ? err.message : 'No pudimos acceder al micrófono.');
      return;
    }
    recorderRef.current = recorder;
    setStatus('recording');
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stop = useCallback(async (): Promise<Recording | null> => {
    clearTimer();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setStatus('idle');
    if (!recorder) return null;
    try {
      return await recorder.stop();
    } catch (err) {
      setError(err instanceof MicrophoneError ? err.message : 'No pudimos guardar la grabación.');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setSeconds(0);
    setStatus('idle');
    setError(null);
    recorderRef.current?.cancel();
    recorderRef.current = null;
  }, []);

  // Limpieza si el componente se desmonta a media grabación.
  useEffect(() => {
    return () => {
      clearTimer();
      recorderRef.current?.cancel();
    };
  }, []);

  return { status, seconds, error, start, stop, reset };
}
