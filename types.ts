

import type { ResultadoClasificacion } from './types/largos';

export interface UploadedFile {
    file: File;
    preview: string;
    base64: string;
    mimeType: string;
}

export enum GenerationTypeEnum {
    MOOD_BOARD = 'MOOD_BOARD',
    VIRTUAL_TRY_ON = 'VIRTUAL_TRY_ON',
    FULL_BODY = 'FULL_BODY',
    FULL_BODY_BACK = 'FULL_BODY_BACK',
    DETAIL = 'DETAIL',
    URBAN = 'URBAN',
    RURAL = 'RURAL',
    ACCESSORY_DETAIL = 'ACCESSORY_DETAIL',
    SILHOUETTE_TRY_ON = 'SILHOUETTE_TRY_ON',
    POSE_VINTED_FRONT = 'POSE_VINTED_FRONT',
    POSE_VINTED_BACK = 'POSE_VINTED_BACK',
    PERSONALIZED_TRY_ON = 'PERSONALIZED_TRY_ON',
}

export type GenerationType = GenerationTypeEnum;

export type ImageStatus = 'pending' | 'queued' | 'loading' | 'done' | 'error';

export interface ChatMessage {
    author: 'user' | 'model';
    text: string;
}

export interface GeneratedImage {
    id: GenerationType;
    title: string;
    prompt: string;
    src: string | null;
    status: ImageStatus;
    chatHistory?: ChatMessage[];
    error?: string;
}

export enum ClosetCategoryEnum {
    TOP = 'TOP',
    BOTTOM = 'BOTTOM',
    DRESS = 'DRESS',
    OUTERWEAR = 'OUTERWEAR',
    ACCESSORY = 'ACCESSORY',
    SHOES = 'SHOES',
}

export type ClosetCategory = ClosetCategoryEnum;

export interface ClosetItem {
    id: string;
    src: string; // base64 data URL of the background-removed image
    category: ClosetCategory;
}

export interface ModelMeasurements {
    height: string;
    weight: string;
    bust: string;
    waist: string;
    hips: string;
    notes: string;
}

export interface AccessorySuggestion {
    type: 'shoes' | 'handbag' | 'jewelry';
    description: string;
    imageSrc: string;
}

// Fix: Add ImageInput interface to be used across the application.
export interface ImageInput {
    base64: string;
    mimeType: string;
}

// --- Vinted Assistant Specific Types ---

export enum GarmentConditionEnum {
    NUEVO_CON_ETIQUETA = 'nuevo-con-etiqueta',
    COMO_NUEVO = 'como-nuevo',
    MUY_BUEN_ESTADO = 'muy-buen-estado',
    BUEN_ESTADO = 'buen-estado',
    ACEPTABLE = 'aceptable',
}

export type FitCategoria = 'Ajustado' | 'Regular' | 'Holgado';

export interface MedidasPrenda {
    largo: string;
    anchoPecho: string;
    anchoCintura: string;
    anchoCadera: string;
    anchoHombros: string; // Added this field
    esElastico: boolean;
    // --- New Business Logic Fields ---
    marca: string;
    tallaEtiqueta: string;
    precioCompra: string;
    estado: GarmentConditionEnum;
}

export interface TallaValidacion {
    coincide: boolean;
    tallaReal: string;
    advertencia?: string;
}

export interface AnalisisMedidas {
    categoriaLargo: ResultadoClasificacion | null;
    tallaEstimada: string;
    fitAnalisis: {
        pecho: FitCategoria;
        cintura: FitCategoria;
        cadera: FitCategoria;
        general: FitCategoria;
    };
    recomendaciones: string[];
    validacionTalla: TallaValidacion | null;
}

export interface SugerenciaPrecio {
    minimo: number;
    sugerido: number;
    optimista: number;
}

export interface AnalisisVisual {
  estilo: 'floral-romantico' | 'elegante-noche' | 'casual-verano' | 'boho-hippie' | 'minimalista-urbano' | 'deportivo' | 'vintage-retro';
  confianza: number;
  keywords: string[];
  colorPredominante: string;
  estampado: 'floral' | 'liso' | 'rayas' | 'lunares' | 'geometrico' | 'animal-print' | 'abstracto' | 'ninguno';
  tejido: 'algodon' | 'seda' | 'poliester' | 'lino' | 'punto' | 'denim' | 'otro';
}