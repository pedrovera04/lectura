import { useEffect, useRef } from 'react';
import { PALETA_MARCA } from '../lib/scores';

/** Barras que se mueven con la voz: confirman que el micrófono está captando. */
export function VolumeMeter({ analyser }: { analyser: AnalyserNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const datos = new Uint8Array(analyser.frequencyBinCount);
    const barras = 24;
    const { width: ancho, height: alto } = canvas;
    const hueco = 8;
    const anchoBarra = (ancho - hueco * (barras - 1)) / barras;
    let raf = 0;

    const cuadro = () => {
      analyser.getByteFrequencyData(datos);
      ctx.clearRect(0, 0, ancho, alto);
      for (let i = 0; i < barras; i++) {
        // Espejo desde el centro: las barras del medio son las más activas.
        const distancia = Math.abs(i - (barras - 1) / 2) / (barras / 2);
        const nivel = datos[Math.floor(distancia * datos.length * 0.6)] / 255;
        const h = Math.max(anchoBarra, nivel * alto);
        const x = i * (anchoBarra + hueco);
        ctx.fillStyle = PALETA_MARCA[i % PALETA_MARCA.length];
        ctx.beginPath();
        ctx.roundRect(x, (alto - h) / 2, anchoBarra, h, anchoBarra / 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(cuadro);
    };
    cuadro();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return <canvas ref={canvasRef} className="medidor" width={640} height={96} aria-hidden="true" />;
}
