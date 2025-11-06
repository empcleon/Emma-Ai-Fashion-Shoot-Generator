// types/largos.ts

export type CategoriaLargoVestido =
  | 'micro'
  | 'super-mini'
  | 'mini'
  | 'mini-rodilla'
  | 'rodilla'
  | 'bajo-rodilla'
  | 'midi'
  | 'midi-largo'
  | 'tobillo'
  | 'maxi';

export type CategoriaLargoFalda = CategoriaLargoVestido;

export interface DescripcionLargo {
  nombre: string;
  descripcion: string;
  emoji: string;
  keywords: string[];
  rangoVestido: [number, number];
  rangoFalda: [number, number];
}

export const CATEGORIAS_LARGO: Record<CategoriaLargoVestido, DescripcionLargo> = {
  'micro': {
    nombre: 'Micro',
    descripcion: 'Muy muy corto, apenas cubre',
    emoji: '🔥',
    keywords: ['micro', 'ultra corto', 'super short'],
    rangoVestido: [0, 85],
    rangoFalda: [0, 38],
  },
  'super-mini': {
    nombre: 'Super Mini',
    descripcion: 'Por encima de medio muslo',
    emoji: '✨',
    keywords: ['super mini', 'muy corto', 'arriba del muslo'],
    rangoVestido: [85, 91],
    rangoFalda: [38, 48],
  },
  'mini': {
    nombre: 'Mini',
    descripcion: 'Medio muslo (clásico mini)',
    emoji: '👗',
    keywords: ['mini', 'corto', 'medio muslo'],
    rangoVestido: [91, 97],
    rangoFalda: [48, 55],
  },
  'mini-rodilla': {
    nombre: 'Mini/Rodilla',
    descripcion: 'Entre medio muslo y rodilla',
    emoji: '👗',
    keywords: ['por encima rodilla', 'casi rodilla'],
    rangoVestido: [97, 103],
    rangoFalda: [55, 63],
  },
  'rodilla': {
    nombre: 'Rodilla',
    descripcion: 'Justo a la altura de la rodilla',
    emoji: '📏',
    keywords: ['rodilla', 'knee length'],
    rangoVestido: [103, 107],
    rangoFalda: [63, 67],
  },
  'bajo-rodilla': {
    nombre: 'Bajo Rodilla',
    descripcion: 'Tapa la rodilla, ligeramente más largo',
    emoji: '📏',
    keywords: ['bajo rodilla', 'por debajo rodilla', 'midi corto'],
    rangoVestido: [107, 113],
    rangoFalda: [67, 73],
  },
  'midi': {
    nombre: 'Midi',
    descripcion: 'Media pantorrilla (midi clásico)',
    emoji: '👗',
    keywords: ['midi', 'media pantorrilla', 'mid calf'],
    rangoVestido: [113, 125],
    rangoFalda: [73, 85],
  },
  'midi-largo': {
    nombre: 'Midi Largo',
    descripcion: 'Entre pantorrilla y tobillo',
    emoji: '👗',
    keywords: ['midi largo', 'casi tobillo'],
    rangoVestido: [125, 150],
    rangoFalda: [85, 98],
  },
  'tobillo': {
    nombre: 'Tobillo',
    descripcion: 'Hasta el tobillo',
    emoji: '👗',
    keywords: ['tobillo', 'ankle', 'largo'],
    rangoVestido: [150, 160],
    rangoFalda: [98, 105],
  },
  'maxi': {
    nombre: 'Maxi',
    descripcion: 'Roza el suelo o más',
    emoji: '👗',
    keywords: ['maxi', 'largo', 'suelo', 'floor length'],
    rangoVestido: [160, 999],
    rangoFalda: [105, 999],
  },
};

export interface ResultadoClasificacion {
  categoria: CategoriaLargoVestido | CategoriaLargoFalda;
  info: typeof CATEGORIAS_LARGO[CategoriaLargoVestido];
  puntoAnatomico: string;
  precision: 'exacto' | 'aproximado';
  largoCm: number;
}
