// constants/medidasAnatomicas.ts

export interface PuntosAnatomicos {
  desdeHombro: {
    barbilla: number;
    pecho: number;
    cintura: number;
    cadera: number;
    entrepierna: number;
    medioMuslo: number;
    rodilla: number;
    mediaPantorrilla: number;
    tobillo: number;
    suelo: number;
  };
  desdeCintura: {
    cadera: number;
    entrepierna: number;
    microFalda: number;
    miniSuper: number;
    mini: number;
    rodilla: number;
    midiRodilla: number;
    mediaPantorrilla: number;
    midiPantorrilla: number;
    tobillo: number;
    maxi: number;
  };
}

/**
 * Medidas base para modelo de 178cm
 * IMPORTANTE: Calibra estas medidas con tu cuerpo real
 */
export const MEDIDAS_MODELO_178CM: PuntosAnatomicos = {
  desdeHombro: {
    barbilla: 15,
    pecho: 25,
    cintura: 40,
    cadera: 55,
    entrepierna: 75,
    medioMuslo: 88,
    rodilla: 100,
    mediaPantorrilla: 115,
    tobillo: 155,
    suelo: 178,
  },
  desdeCintura: {
    cadera: 15,
    entrepierna: 35,
    microFalda: 38,
    miniSuper: 45,
    mini: 52,
    rodilla: 60,
    midiRodilla: 65,
    mediaPantorrilla: 75,
    midiPantorrilla: 80,
    tobillo: 100,
    maxi: 105,
  },
};

export const STORAGE_KEY = 'medidas_anatomicas_calibradas';
