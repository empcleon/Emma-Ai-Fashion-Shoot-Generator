export type TipoAjuste = 'muy-ajustado' | 'ajustado' | 'regular' | 'holgado' | 'oversize';

export interface ModeloMedidas {
  contornoPecho: number;
  contornoCintura: number;
  contornoCadera: number;
  anchoHombros?: number;
  alturaTotal?: number;
}

export interface PrendaMedidas {
  // Ancho visible (mitad del contorno) marcado en la foto ya convertido a cm
  anchoEnPecho?: number;
  anchoEnCintura?: number;
  anchoEnCadera?: number;
  anchoHombros?: number;
  largoTotal?: number;
  tipoPrenda?: 'vestido' | 'falda' | 'top' | 'pantalon' | 'chaqueta';
}

export interface ResultadoAjusteZona {
  diferenciaCm: number; // prenda - cuerpo (contorno)
  porcentaje: number;   // relativo al cuerpo
  tipo: TipoAjuste;
}

export interface ResultadoAjuste {
  pecho?: ResultadoAjusteZona;
  cintura?: ResultadoAjusteZona;
  cadera?: ResultadoAjusteZona;
  forma?: string;
  ajusteGeneral?: TipoAjuste;
}

export function detectarAjusteZona(anchoPrendaVisibleCm: number | undefined, contornoModeloCm: number): ResultadoAjusteZona {
  if (!anchoPrendaVisibleCm) {
    return { diferenciaCm: NaN, porcentaje: NaN, tipo: 'regular' };
  }
  const contornoPrenda = anchoPrendaVisibleCm * 2;
  const diferencia = contornoPrenda - contornoModeloCm;
  const porcentaje = (diferencia / contornoModeloCm) * 100;

  let tipo: TipoAjuste;
  if (porcentaje < -5) tipo = 'muy-ajustado';
  else if (porcentaje < 2) tipo = 'ajustado';
  else if (porcentaje < 8) tipo = 'regular';
  else if (porcentaje < 18) tipo = 'holgado';
  else tipo = 'oversize';

  return { diferenciaCm: diferencia, porcentaje, tipo };
}

export function detectarForma(res: ResultadoAjuste): string {
  const d = {
    pecho: res.pecho?.diferenciaCm ?? 0,
    cintura: res.cintura?.diferenciaCm ?? 0,
    cadera: res.cadera?.diferenciaCm ?? 0,
  };
  const difPC = Math.abs(d.pecho - d.cintura);
  const difCC = Math.abs(d.cintura - d.cadera);

  if (difPC < 3 && difCC < 3) return 'corte recto';
  if (d.cintura < d.pecho - 5 && d.cintura < d.cadera - 5) return 'entallado (marca cintura)';
  if (d.cadera > d.cintura + 8) return 'evasé (se abre hacia abajo)';
  if ((res.pecho?.tipo === 'ajustado' || res.pecho?.tipo === 'muy-ajustado') && (res.cadera?.tipo === 'holgado' || res.cadera?.tipo === 'oversize')) {
    return 'ajustado arriba, suelto abajo';
  }
  return 'corte clásico';
}

export function promedioAjuste(tipos: TipoAjuste[]): TipoAjuste {
  const orden: TipoAjuste[] = ['muy-ajustado', 'ajustado', 'regular', 'holgado', 'oversize'];
  const idx = Math.round(
    tipos.map(t => orden.indexOf(t)).reduce((a, b) => a + b, 0) / tipos.length
  );
  return orden[Math.min(Math.max(idx, 0), orden.length - 1)];
}

export function analizarAjusteCompleto(modelo: ModeloMedidas, prenda: PrendaMedidas): ResultadoAjuste {
  const pecho = modelo.contornoPecho ? detectarAjusteZona(prenda.anchoEnPecho, modelo.contornoPecho) : undefined;
  const cintura = modelo.contornoCintura ? detectarAjusteZona(prenda.anchoEnCintura, modelo.contornoCintura) : undefined;
  const cadera = modelo.contornoCadera ? detectarAjusteZona(prenda.anchoEnCadera, modelo.contornoCadera) : undefined;

  const tipos = [pecho?.tipo, cintura?.tipo, cadera?.tipo].filter(Boolean) as TipoAjuste[];
  const forma = detectarForma({ pecho, cintura, cadera });
  const ajusteGeneral = tipos.length ? promedioAjuste(tipos) : undefined;

  return { pecho, cintura, cadera, forma, ajusteGeneral };
}