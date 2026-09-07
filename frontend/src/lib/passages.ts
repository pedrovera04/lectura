/**
 * Párrafos de lectura para niños de ~8 años.
 * Vocabulario sencillo, entre 40 y 70 palabras.
 */
export interface Passage {
  id: string;
  title: string;
  emoji: string;
  text: string;
}

export const PASSAGES: Passage[] = [
  {
    id: 'semillas',
    title: 'Las semillas de colores',
    emoji: '🌻',
    text: 'Tomás encontró una pequeña caja de madera debajo de un árbol. Cuando la abrió, descubrió varias semillas de colores. Decidió plantarlas junto a su casa y cada mañana las regaba con cuidado. Después de algunas semanas, comenzaron a crecer unas flores enormes que llenaron el jardín de mariposas.',
  },
  {
    id: 'gato',
    title: 'El gato curioso',
    emoji: '🐱',
    text: 'Un gato gris vivía en una casa muy tranquila. Le encantaba mirar por la ventana y perseguir las hojas que caían. Una tarde, escuchó un ruido extraño en el jardín. Con mucho cuidado, salió a investigar y encontró un pajarito perdido. El gato lo cuidó hasta que pudo volar de nuevo.',
  },
  {
    id: 'mar',
    title: 'Un día en el mar',
    emoji: '🌊',
    text: 'Sofía visitó la playa con su familia durante el verano. Construyó un castillo de arena con torres muy altas y buscó caracoles de todos los tamaños. Cuando el sol se escondía, las olas brillaban como estrellas. Sofía prometió volver pronto para nadar y jugar otra vez en el mar.',
  },
  {
    id: 'bicicleta',
    title: 'La primera bicicleta',
    emoji: '🚲',
    text: 'Diego recibió una bicicleta roja para su cumpleaños. Al principio tenía un poco de miedo, pero su papá lo ayudó a mantener el equilibrio. Después de practicar toda la tarde, logró pedalear solo por el parque. Estaba tan feliz que no dejaba de sonreír mientras el viento movía su pelo.',
  },
];

export function getRandomPassage(excludeId?: string): Passage {
  const options = excludeId ? PASSAGES.filter((p) => p.id !== excludeId) : PASSAGES;
  const pool = options.length > 0 ? options : PASSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}
