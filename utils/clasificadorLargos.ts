// utils/clasificadorLargos.ts

import { PuntosAnatomicos, MEDIDAS_MODELO_178CM, STORAGE_KEY } from '../constants/medidasAnatomicas';
import { CategoriaLargoVestido, CategoriaLargoFalda, CATEGORIAS_LARGO, ResultadoClasificacion } from '../types/largos';

function obtenerMedidasCalibradas(): PuntosAnatomicos {
  const guardadas = localStorage.getItem(STORAGE_KEY);
  if (guardadas) {
    try {
      const parsed = JSON.parse(guardadas);
      return {
        desdeHombro: parsed.desdeHombro || MEDIDAS_MODELO_178CM.desdeHombro,
        desdeCintura: parsed.desdeCintura || MEDIDAS_MODELO_178CM.desdeCintura,
      };
    } catch {
      return MEDIDAS_MODELO_178CM;
    }
  }
  return MEDIDAS_MODELO_178CM;
}

export function clasificarLargoVestido(largoCm: number): ResultadoClasificacion {
  const medidas = obtenerMedidasCalibradas();
  const puntos = medidas.desdeHombro;

  let categoria: CategoriaLargoVestido;
  let puntoAnatomico: string;
  let precision: 'exacto' | 'aproximado' = 'aproximado';

  if (largoCm < puntos.medioMuslo - 3) {
    categoria = 'micro';
    puntoAnatomico = 'Por encima de medio muslo';
  } else if (largoCm < puntos.medioMuslo + 3) {
    categoria = 'super-mini';
    puntoAnatomico = 'Medio muslo alto';
    if (Math.abs(largoCm - puntos.medioMuslo) < 2) precision = 'exacto';
  } else if (largoCm < puntos.rodilla - 6) {
    categoria = 'mini';
    puntoAnatomico = 'Medio muslo';
  } else if (largoCm < puntos.rodilla - 2) {
    categoria = 'mini-rodilla';
    puntoAnatomico = 'Entre medio muslo y rodilla';
  } else if (largoCm < puntos.rodilla + 2) {
    categoria = 'rodilla';
    puntoAnatomico = 'Rodilla';
    if (Math.abs(largoCm - puntos.rodilla) < 1) precision = 'exacto';
  } else if (largoCm < puntos.rodilla + 8) {
    categoria = 'bajo-rodilla';
    puntoAnatomico = 'Bajo rodilla';
  } else if (largoCm < puntos.mediaPantorrilla + 5) {
    categoria = 'midi';
    puntoAnatomico = 'Media pantorrilla';
    if (Math.abs(largoCm - puntos.mediaPantorrilla) < 2) precision = 'exacto';
  } else if (largoCm < puntos.tobillo - 5) {
    categoria = 'midi-largo';
    puntoAnatomico = 'Entre pantorrilla y tobillo';
  } else if (largoCm < puntos.tobillo + 5) {
    categoria = 'tobillo';
    puntoAnatomico = 'Tobillo';
    if (Math.abs(largoCm - puntos.tobillo) < 2) precision = 'exacto';
  } else {
    categoria = 'maxi';
    puntoAnatomico = 'Suelo o más largo';
  }

  return {
    categoria,
    info: CATEGORIAS_LARGO[categoria],
    puntoAnatomico,
    precision,
    largoCm,
  };
}

export function clasificarLargoFalda(largoCm: number): ResultadoClasificacion {
  const medidas = obtenerMedidasCalibradas();
  const puntos = medidas.desdeCintura;

  let categoria: CategoriaLargoFalda;
  let puntoAnatomico: string;
  let precision: 'exacto' | 'aproximado' = 'aproximado';

  if (largoCm < puntos.microFalda) {
    categoria = 'micro';
    puntoAnatomico = 'Muy muy corta';
  } else if (largoCm < puntos.miniSuper) {
    categoria = 'super-mini';
    puntoAnatomico = 'Super mini';
    if (Math.abs(largoCm - puntos.miniSuper) < 2) precision = 'exacto';
  } else if (largoCm < puntos.mini) {
    categoria = 'mini';
    puntoAnatomico = 'Mini clásico';
    if (Math.abs(largoCm - puntos.mini) < 2) precision = 'exacto';
  } else if (largoCm < puntos.rodilla) {
    categoria = 'rodilla';
    puntoAnatomico = 'Rodilla';
    if (Math.abs(largoCm - puntos.rodilla) < 2) precision = 'exacto';
  } else if (largoCm < puntos.midiRodilla) {
    categoria = 'bajo-rodilla'; // Mapped from midiRodilla
    puntoAnatomico = 'Bajo rodilla';
  } else if (largoCm < puntos.mediaPantorrilla) {
    categoria = 'midi';
    puntoAnatomico = 'Media pantorrilla';
    if (Math.abs(largoCm - puntos.mediaPantorrilla) < 2) precision = 'exacto';
  } else if (largoCm < puntos.midiPantorrilla) {
    categoria = 'midi-largo';
    puntoAnatomico = 'Midi largo';
  } else if (largoCm < puntos.tobillo) {
    categoria = 'tobillo';
    puntoAnatomico = 'Tobillo';
    if (Math.abs(largoCm - puntos.tobillo) < 2) precision = 'exacto';
  } else {
    categoria = 'maxi';
    puntoAnatomico = 'Maxi/Suelo';
  }

  return {
    categoria,
    info: CATEGORIAS_LARGO[categoria as CategoriaLargoVestido],
    puntoAnatomico,
    precision,
    largoCm,
  };
}

export function guardarMedidasCalibradas(medidas: PuntosAnatomicos): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(medidas));
}

export function existeCalibración(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
