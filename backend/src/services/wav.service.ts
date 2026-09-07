/**
 * Utilidad para leer archivos WAV (PCM) sin dependencias externas.
 *
 * Decisión técnica:
 * El navegador graba el audio y lo entrega ya como WAV PCM mono 16 kHz / 16 bits
 * (ver frontend/src/services/recorder.ts). Así evitamos transcodificar en el
 * servidor con ffmpeg, lo que simplifica muchísimo el despliegue
 * (Railway/Render/Azure) y mantiene el código portable.
 *
 * Aun así, parseamos el encabezado de forma defensiva para leer el formato
 * real y aislar únicamente el bloque de datos PCM, en lugar de asumir un
 * offset fijo de 44 bytes.
 */

export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  /** Solo las muestras PCM, sin encabezado. */
  pcm: Buffer;
  /** Duración en segundos. */
  durationSeconds: number;
}

export class InvalidWavError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWavError';
  }
}

export function parseWav(buffer: Buffer): WavInfo {
  if (buffer.length < 44) {
    throw new InvalidWavError('El archivo de audio es demasiado pequeño para ser un WAV válido.');
  }
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new InvalidWavError('El archivo no es un WAV válido (falta la cabecera RIFF/WAVE).');
  }

  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let audioFormat = 0;
  let pcm: Buffer | null = null;

  // Recorremos los "chunks" a partir del byte 12.
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;

    if (chunkId === 'fmt ') {
      audioFormat = buffer.readUInt16LE(dataStart);
      channels = buffer.readUInt16LE(dataStart + 2);
      sampleRate = buffer.readUInt32LE(dataStart + 4);
      bitsPerSample = buffer.readUInt16LE(dataStart + 14);
    } else if (chunkId === 'data') {
      const end = Math.min(dataStart + chunkSize, buffer.length);
      pcm = buffer.subarray(dataStart, end);
    }

    // Los chunks se alinean a bytes pares.
    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  if (audioFormat !== 1) {
    throw new InvalidWavError('Solo se admite audio WAV PCM sin comprimir.');
  }
  if (!sampleRate || !channels || !bitsPerSample || !pcm) {
    throw new InvalidWavError('No se pudo leer el formato del audio WAV.');
  }

  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = pcm.length / (bytesPerSample * channels);
  const durationSeconds = totalSamples / sampleRate;

  return { sampleRate, channels, bitsPerSample, pcm, durationSeconds };
}
