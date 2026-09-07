import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import type { Feedback, WordResult } from '../types/assessment.types.js';
import type { RawAssessment } from './azurePronunciation.service.js';

/**
 * Genera el feedback educativo para el niño.
 *
 * - Si hay ANTHROPIC_API_KEY, Claude redacta el mensaje a partir de las
 *   métricas de Azure. Claude NO evalúa el audio ni inventa métricas:
 *   solo transforma números en un mensaje amable.
 * - Si no hay clave (o Claude falla), usamos un feedback generado con
 *   reglas simples para que la app siga funcionando de extremo a extremo.
 */

const client = env.anthropic.enabled ? new Anthropic({ apiKey: env.anthropic.apiKey }) : null;

export async function buildFeedback(result: RawAssessment): Promise<Feedback> {
  if (client) {
    try {
      return await feedbackFromClaude(result);
    } catch (err) {
      // Si Claude falla, no rompemos la experiencia: caemos al feedback local.
      console.warn('[feedback] Claude no disponible, se usa feedback por reglas:', err);
    }
  }
  return feedbackFromRules(result);
}

/** Palabras mal pronunciadas más relevantes (para sugerir práctica). */
function mispronouncedWords(words: WordResult[], limit = 3): string[] {
  return words
    .filter((w) => w.errorType === 'Mispronunciation')
    .sort((a, b) => (a.accuracyScore ?? 100) - (b.accuracyScore ?? 100))
    .slice(0, limit)
    .map((w) => w.text);
}

// ── Feedback con Claude ────────────────────────────────────────────────
async function feedbackFromClaude(result: RawAssessment): Promise<Feedback> {
  const summary = {
    accuracy: result.accuracyScore,
    fluency: result.fluencyScore,
    completeness: result.completenessScore,
    prosody: result.prosodyScore,
    pronunciation: result.pronunciationScore,
    wordsPerMinute: result.wordsPerMinute,
    durationSeconds: result.duration,
    mispronouncedWords: mispronouncedWords(result.words),
    omittedWords: result.words.filter((w) => w.errorType === 'Omission').map((w) => w.text),
    addedWords: result.words.filter((w) => w.errorType === 'Insertion').map((w) => w.text),
  };

  const system = [
    'Eres un profesor de lenguaje cálido y motivador que da retroalimentación a un niño de 8 años sobre su lectura en voz alta.',
    'Reglas estrictas:',
    '- Usa SOLO los datos entregados. No inventes ni cambies métricas ni palabras.',
    '- Sé positivo y nunca humillante. Empieza SIEMPRE destacando algo que hizo bien.',
    '- Entrega como máximo 2 o 3 recomendaciones concretas y sencillas.',
    '- Lenguaje simple, frases cortas, apropiado para 8 años. Español de Chile neutro.',
    'Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni ```: ',
    '{ "headline": string breve (ej. "¡Muy bien!"), "message": string (2-4 frases), "tips": string[] (2-3 items) }',
  ].join('\n');

  const message = await client!.messages.create({
    model: env.anthropic.model,
    max_tokens: 400,
    system,
    messages: [
      {
        role: 'user',
        content: `Estos son los resultados objetivos de la lectura (de Azure):\n${JSON.stringify(
          summary,
          null,
          2,
        )}\n\nGenera el feedback en el formato JSON indicado.`,
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  const parsed = JSON.parse(text) as { headline?: string; message?: string; tips?: string[] };

  return {
    headline: parsed.headline?.trim() || '¡Buen trabajo!',
    message: parsed.message?.trim() || 'Terminaste tu lectura. ¡Sigue practicando!',
    tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3).filter(Boolean) : [],
    source: 'ai',
  };
}

// ── Feedback por reglas (respaldo local, sin depender de Claude) ────────
function feedbackFromRules(result: RawAssessment): Feedback {
  const { accuracyScore, fluencyScore, completenessScore, wordsPerMinute } = result;
  const overall = result.pronunciationScore;

  let headline = '¡Buen trabajo!';
  if (overall >= 90) headline = '¡Excelente lectura!';
  else if (overall >= 75) headline = '¡Muy bien!';
  else if (overall >= 60) headline = '¡Vas por buen camino!';
  else headline = '¡Sigue practicando!';

  // Primero, un logro.
  const wins: string[] = [];
  if (completenessScore >= 90) wins.push('leíste casi todo el texto');
  if (fluencyScore >= 85) wins.push('mantuviste un buen ritmo');
  if (accuracyScore >= 85) wins.push('pronunciaste muy bien las palabras');
  const winText =
    wins.length > 0
      ? `Lo hiciste genial: ${joinEs(wins)}.`
      : 'Diste un paso importante al leer en voz alta.';

  // Luego, 2–3 recomendaciones.
  const tips: string[] = [];
  const badWords = mispronouncedWords(result.words, 2);
  if (badWords.length > 0) {
    tips.push(`Practica en voz alta ${badWords.length === 1 ? 'la palabra' : 'las palabras'} "${badWords.join('", "')}".`);
  }
  if (fluencyScore < 75) {
    tips.push('Intenta leer un poquito más despacio y detente al ver una coma.');
  }
  if (completenessScore < 90) {
    tips.push('Fíjate en no saltarte palabras: sigue el texto con el dedo si te ayuda.');
  }
  if (wordsPerMinute > 160) {
    tips.push('Vas muy rápido: respira y lee con calma para entender mejor.');
  }
  if (tips.length === 0) {
    tips.push('¡Sigue leyendo un cuento cada día para mejorar aún más!');
  }

  return {
    headline,
    message: `${winText} ¡Cada vez lees mejor!`,
    tips: tips.slice(0, 3),
    source: 'rules',
  };
}

function joinEs(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}
