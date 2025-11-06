
import { parseCm } from '../utils/parsingUtils';
import type { TallaValidacion } from '../types';

type SizeChart = Record<string, {
    pecho: [number, number];
    cintura: [number, number];
    cadera: [number, number];
}>

const TABLAS_TALLAS_MARCAS: Record<string, SizeChart> = {
  'Zara': {
    'XS': { pecho: [80, 84], cintura: [60, 64], cadera: [86, 90] },
    'S': { pecho: [84, 88], cintura: [64, 68], cadera: [90, 94] },
    'M': { pecho: [88, 92], cintura: [68, 72], cadera: [94, 98] },
    'L': { pecho: [92, 98], cintura: [72, 78], cadera: [98, 104] },
    'XL': { pecho: [98, 104], cintura: [78, 84], cadera: [104, 110] },
  },
  'H&M': {
    'XS': { pecho: [78, 82], cintura: [58, 62], cadera: [84, 88] },
    'S': { pecho: [82, 86], cintura: [62, 66], cadera: [88, 92] },
    'M': { pecho: [86, 92], cintura: [66, 72], cadera: [92, 98] },
    'L': { pecho: [92, 98], cintura: [72, 78], cadera: [98, 104] },
    'XL': { pecho: [98, 106], cintura: [78, 86], cadera: [104, 112] },
  },
  'Mango': {
    'XS': { pecho: [80, 84], cintura: [62, 66], cadera: [88, 92] },
    'S': { pecho: [84, 88], cintura: [66, 70], cadera: [92, 96] },
    'M': { pecho: [88, 92], cintura: [70, 74], cadera: [96, 100] },
    'L': { pecho: [92, 98], cintura: [74, 80], cadera: [100, 106] },
    'XL': { pecho: [98, 104], cintura: [80, 86], cadera: [106, 112] },
  },
  'Shein': {
    'XS': { pecho: [82, 86], cintura: [62, 66], cadera: [88, 92] },
    'S': { pecho: [86, 90], cintura: [66, 70], cadera: [92, 96] },
    'M': { pecho: [90, 94], cintura: [70, 74], cadera: [96, 100] },
    'L': { pecho: [94, 100], cintura: [74, 80], cadera: [100, 106] },
    'XL': { pecho: [100, 106], cintura: [80, 86], cadera: [106, 112] },
  }
};

export function validarTallaEtiqueta(
  marca: string,
  tallaEtiqueta: string,
  medidasReales: { pecho?: number | null; cintura?: number | null; cadera?: number | null }
): TallaValidacion | null {
  
  const tabla = TABLAS_TALLAS_MARCAS[marca];
  const tallaEtiquetaUpper = tallaEtiqueta.toUpperCase();

  if (!tabla || !tallaEtiquetaUpper || !medidasReales.pecho) {
    return null;
  }

  const contornoPecho = medidasReales.pecho * 2;
  
  let tallaReal = tallaEtiquetaUpper;
  for (const [talla, rangos] of Object.entries(tabla)) {
    if (contornoPecho >= rangos.pecho[0] && contornoPecho <= rangos.pecho[1]) {
      tallaReal = talla;
      break;
    }
  }

  const coincide = tallaReal === tallaEtiquetaUpper;
  
  return {
    coincide,
    tallaReal,
    advertencia: coincide 
      ? undefined 
      : `⚠️ La etiqueta dice ${tallaEtiquetaUpper} pero las medidas corresponden a talla ${tallaReal} de ${marca}.`,
  };
}
