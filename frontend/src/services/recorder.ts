/**
 * Grabador de audio basado en la Web Audio API.
 *
 * Decisión técnica:
 * En lugar de usar MediaRecorder (que produce WebM/Opus y obligaría a
 * transcodificar en el servidor con ffmpeg), capturamos las muestras PCM y
 * generamos un WAV mono 16 kHz / 16 bits directamente en el navegador.
 * Es exactamente el formato que Azure Pronunciation Assessment prefiere,
 * y así el backend no necesita ffmpeg (despliegue mucho más simple).
 *
 * Nota: usamos ScriptProcessorNode. Está marcado como obsoleto pero sigue
 * funcionando en todos los navegadores actuales y es la vía más simple y
 * fiable para obtener PCM. La ruta de mejora sería un AudioWorklet.
 */

const TARGET_SAMPLE_RATE = 16000;

export interface Recording {
  blob: Blob;
  durationSeconds: number;
}

export class MicrophoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MicrophoneError';
  }
}

export class WavRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private inputSampleRate = 44100;
  private startTime = 0;

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new MicrophoneError('Tu navegador no permite grabar audio.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        throw new MicrophoneError(
          'Necesitamos permiso para usar el micrófono. Actívalo y vuelve a intentarlo.',
        );
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        throw new MicrophoneError('No encontramos un micrófono conectado.');
      }
      throw new MicrophoneError('No pudimos acceder al micrófono.');
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioCtx();
    this.inputSampleRate = this.audioContext.sampleRate;

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.chunks = [];

    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      // Copiamos, porque el buffer se reutiliza.
      this.chunks.push(new Float32Array(input));
    };

    this.source.connect(this.processor);
    // Necesario en algunos navegadores para que el processor procese.
    this.processor.connect(this.audioContext.destination);
    this.startTime = this.audioContext.currentTime;
  }

  /** Detiene la grabación y devuelve el WAV resultante. */
  async stop(): Promise<Recording> {
    if (!this.audioContext) {
      throw new MicrophoneError('La grabación no estaba activa.');
    }
    const durationSeconds = this.audioContext.currentTime - this.startTime;

    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    await this.audioContext.close();

    const merged = mergeChunks(this.chunks);
    const downsampled = downsample(merged, this.inputSampleRate, TARGET_SAMPLE_RATE);
    const blob = encodeWav(downsampled, TARGET_SAMPLE_RATE);

    this.reset();
    return { blob, durationSeconds };
  }

  /** Cancela y libera recursos sin producir audio. */
  async cancel(): Promise<void> {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    this.reset();
  }

  private reset() {
    this.stream = null;
    this.audioContext = null;
    this.source = null;
    this.processor = null;
    this.chunks = [];
  }
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

/** Remuestreo lineal simple hacia la frecuencia objetivo. */
function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate === fromRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const frac = position - index;
    const a = buffer[index] ?? 0;
    const b = buffer[index + 1] ?? a;
    result[i] = a + (b - a) * frac; // interpolación lineal
  }
  return result;
}

/** Codifica muestras Float32 [-1,1] a un WAV PCM 16 bits mono. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del sub-chunk fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // canales (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true); // bits por muestra
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
