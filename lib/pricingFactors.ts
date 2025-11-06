
import { GarmentConditionEnum } from '../types';
import { parseCm } from '../utils/parsingUtils';
import type { SugerenciaPrecio } from '../types';

interface ConfigPrecios {
  margenMinimo: number;
  factoresMarca: Record<string, number>;
  factoresEstado: Record<GarmentConditionEnum, number>;
}

const CONFIG_DEFAULT: ConfigPrecios = {
  margenMinimo: 150, // 50% margen
  factoresMarca: {
    'Zara': 1.5,
    'Mango': 1.6,
    'H&M': 1.3,
    'Shein': 0.9,
    'Stradivarius': 1.2,
    'Pull&Bear': 1.2,
    'Massimo Dutti': 2.0,
    'COS': 2.2,
    'Sin marca': 1.0,
  },
  factoresEstado: {
    [GarmentConditionEnum.NUEVO_CON_ETIQUETA]: 1.0,
    [GarmentConditionEnum.COMO_NUEVO]: 0.9,
    [GarmentConditionEnum.MUY_BUEN_ESTADO]: 0.75,
    [GarmentConditionEnum.BUEN_ESTADO]: 0.6,
    [GarmentConditionEnum.ACEPTABLE]: 0.4,
  },
};

export function calcularPrecioSugerido(
  precioCompraStr: string,
  marca: string,
  estado: GarmentConditionEnum,
  config: ConfigPrecios = CONFIG_DEFAULT
): SugerenciaPrecio | null {
  
  const precioCompra = parseCm(precioCompraStr);
  if (precioCompra === null || precioCompra <= 0) {
      return null;
  }
  
  const factorMarca = config.factoresMarca[marca] || 1.0;
  const factorEstado = config.factoresEstado[estado] || 0.7;
  const margen = config.margenMinimo / 100;
  
  const precioBase = precioCompra * margen * factorMarca * factorEstado;
  
  return {
    minimo: Math.ceil(precioBase * 0.8),
    sugerido: Math.ceil(precioBase),
    optimista: Math.ceil(precioBase * 1.3),
  };
}
