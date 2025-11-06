// lib/vintedTemplates.ts

import type { MedidasPrenda, AnalisisMedidas, AnalisisVisual } from '../types';

interface PlantillaDescripcion {
  estilo: string;
  hooks: string[];
  destacados: string[];
  publico: string;
  ocasiones: string[];
}

const PLANTILLAS_VESTIDOS: Record<string, PlantillaDescripcion> = {
  'floral-romantico': {
    estilo: 'Floral Romántico',
    hooks: ['✨ ¡Vestido de ensueño!', '🌸 Perfecto para primavera/verano', '💕 Estampado floral precioso'],
    destacados: ['Estampado floral femenino', 'Corte favorecedor', 'Tejido fluido y ligero'],
    publico: 'Ideal para looks románticos y femeninos',
    ocasiones: ['Citas', 'Brunch', 'Bodas de día', 'Paseos'],
  },
  'elegante-noche': {
    estilo: 'Elegante/Noche',
    hooks: ['✨ Elegancia pura', '🌟 Perfecto para eventos especiales', '💎 Sofisticación garantizada'],
    destacados: ['Corte elegante', 'Tejido de calidad', 'Detalles refinados'],
    publico: 'Para mujeres que buscan destacar',
    ocasiones: ['Bodas', 'Cenas', 'Eventos', 'Celebraciones'],
  },
  'casual-verano': {
    estilo: 'Casual Verano',
    hooks: ['☀️ ¡Imprescindible de verano!', '🌴 Comodidad y estilo', '😎 Perfecto para el día a día'],
    destacados: ['Súper cómodo', 'Tejido fresco', 'Fácil de combinar'],
    publico: 'Para el día a día con estilo',
    ocasiones: ['Diario', 'Playa', 'Terrazas', 'Compras'],
  },
  'boho-hippie': {
    estilo: 'Boho/Hippie',
    hooks: ['🌻 Vibra bohemia total', '✌️ Estilo libre y único', '🌈 Para almas libres'],
    destacados: ['Estilo boho chic', 'Detalles únicos', 'Corte relajado'],
    publico: 'Para espíritus libres',
    ocasiones: ['Festivales', 'Conciertos', 'Casual', 'Viajes'],
  },
  'minimalista-urbano': {
    estilo: 'Minimalista/Urbano',
    hooks: ['🖤 Menos es más', '⚡ Estilo atemporal', '✨ Elegancia minimalista'],
    destacados: ['Diseño limpio', 'Corte moderno', 'Versátil'],
    publico: 'Para mujeres modernas',
    ocasiones: ['Trabajo', 'Ciudad', 'Eventos casual', 'Diario'],
  },
  'deportivo': {
    estilo: 'Deportivo',
    hooks: ['🏃‍♀️ Comodidad y rendimiento', '💪 Para un estilo de vida activo', '🏅 Look deportivo y funcional'],
    destacados: ['Tejido técnico transpirable', 'Corte cómodo para el movimiento', 'Diseño moderno y versátil'],
    publico: 'Ideal para el gimnasio, entrenar o un look athleisure',
    ocasiones: ['Deporte', 'Gimnasio', 'Paseos', 'Looks casual de fin de semana'],
  },
  'vintage-retro': {
    estilo: 'Vintage/Retro',
    hooks: ['🕰️ Un viaje en el tiempo', '📼 Estilo retro auténtico', '✨ Joya vintage única'],
    destacados: ['Pieza única con historia', 'Corte clásico de otra época', 'Calidad y diseño atemporal'],
    publico: 'Para amantes de lo vintage y coleccionistas',
    ocasiones: ['Eventos temáticos', 'Looks únicos', 'Uso diario con un toque retro'],
  },
};

export function generarDescripcionOptimizada(
  analisisVisual: AnalisisVisual,
  medidas: MedidasPrenda,
  analisisMedidas: AnalisisMedidas,
  estado: string,
  precio: number
): string {
  const plantilla = PLANTILLAS_VESTIDOS[analisisVisual.estilo] || PLANTILLAS_VESTIDOS['casual-verano'];
  const hook = plantilla.hooks[Math.floor(Math.random() * plantilla.hooks.length)];

  let desc = `${hook}\n\n`;
  desc += `🏷️ ${medidas.marca} | Talla ${analisisMedidas.tallaEstimada} | ${estado}\n\n`;
  desc += `💫 CARACTERÍSTICAS:\n`;
  plantilla.destacados.forEach(d => { desc += `• ${d}\n`; });
  if (analisisVisual.tejido !== 'otro') {
    desc += `• Tejido principal (aparente): ${analisisVisual.tejido}\n`;
  }
  if (analisisVisual.estampado !== 'liso' && analisisVisual.estampado !== 'ninguno') {
    desc += `• Estampado: ${analisisVisual.estampado}\n`;
  }
  desc += `• Color dominante: ${analisisVisual.colorPredominante}\n`;

  desc += `\n📏 MEDIDAS EXACTAS (en plano):\n`;
  desc += `• Largo total: ${medidas.largo}cm (${analisisMedidas.categoriaLargo?.info.nombre || ''})\n`;
  if (medidas.anchoHombros) desc += `• Hombros: ${medidas.anchoHombros}cm\n`;
  if (medidas.anchoPecho) desc += `• Pecho (sisa a sisa): ${medidas.anchoPecho}cm (contorno ~${parseFloat(medidas.anchoPecho) * 2}cm)\n`;
  if (medidas.anchoCintura) desc += `• Cintura: ${medidas.anchoCintura}cm (contorno ~${parseFloat(medidas.anchoCintura) * 2}cm)\n`;
  if (medidas.anchoCadera) desc += `• Cadera: ${medidas.anchoCadera}cm (contorno ~${parseFloat(medidas.anchoCadera) * 2}cm)\n`;


  desc += `\n👗 AJUSTE Y TALLA:\n`;
  desc += `• Talla estimada por medidas: ${analisisMedidas.tallaEstimada}\n`;
  if (analisisMedidas.validacionTalla?.advertencia) {
    desc += `• ${analisisMedidas.validacionTalla.advertencia}\n`
  }
  desc += `• Ajuste general: ${analisisMedidas.fitAnalisis.general}\n`;
  desc += `• ${plantilla.publico}\n`;

  desc += `\n✨ IDEAL PARA:\n`;
  plantilla.ocasiones.forEach(o => { desc += `• ${o}\n`; });

  if (analisisMedidas.recomendaciones.length > 0) {
    desc += `\n💡 CONSEJOS:\n`;
    analisisMedidas.recomendaciones.forEach(r => { desc += `${r}\n`; });
  }

  desc += `\n🎯 ESTADO: ${estado}\n`;
  desc += `📦 ENVÍO: Rápido y con seguimiento\n`;
  if(precio > 0) desc += `💰 PRECIO: ${precio}€\n\n`;
  desc += `❤️ ¡Dale una segunda vida a esta preciosidad!\n`;

  return desc;
}

export function generarTituloOptimizado(
    analisisVisual: AnalisisVisual,
    medidas: MedidasPrenda,
    analisisMedidas: AnalisisMedidas
): string {
    const tipoPrenda = "Vestido"; // Could be dynamic in the future
    const marca = medidas.marca !== 'Sin marca' ? medidas.marca : '';
    const colorPrincipal = analisisVisual.colorPredominante || '';
    const estampado = (analisisVisual.estampado !== 'liso' && analisisVisual.estampado !== 'ninguno') ? analisisVisual.estampado : '';
    const largo = analisisMedidas.categoriaLargo?.info.nombre || '';
    const talla = `Talla ${analisisMedidas.tallaEstimada}`;

    const parts = [tipoPrenda, largo, marca, estampado, colorPrincipal, talla].filter(Boolean);
    let title = parts.join(' ');
    
    // Trim to a reasonable length for Vinted
    if (title.length > 80) {
        title = title.substring(0, 80).trim() + '...';
    }
    return title;
}

export function generarHashtags(
    analisisVisual: AnalisisVisual,
    medidas: MedidasPrenda,
    analisisMedidas: AnalisisMedidas
): string {
    const clean = (s: string) => s.replace(/[\s/]/g, '').toLowerCase();

    const tags = new Set<string>();
    if (medidas.marca !== 'Sin marca') tags.add(`#${clean(medidas.marca)}`);
    tags.add(`#vestido${clean(analisisMedidas.categoriaLargo?.info.nombre || '')}`);
    tags.add(`#talla${clean(analisisMedidas.tallaEstimada)}`);
    if (analisisVisual.estampado !== 'liso' && analisisVisual.estampado !== 'ninguno') tags.add(`#estampado${clean(analisisVisual.estampado)}`);
    tags.add(`#${clean(analisisVisual.colorPredominante || '')}`);
    
    const plantilla = PLANTILLAS_VESTIDOS[analisisVisual.estilo] || PLANTILLAS_VESTIDOS['casual-verano'];
    tags.add(`#${clean(plantilla.estilo)}`);
    
    if (analisisVisual.keywords && analisisVisual.keywords.length > 0) {
        analisisVisual.keywords.slice(0, 2).forEach(kw => tags.add(`#${clean(kw)}`));
    }

    return Array.from(tags).slice(0, 5).join(' ');
}