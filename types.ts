
export interface UploadedFile {
    file: File;
    preview: string;
    base64: string;
    mimeType: string;
}

export enum GenerationTypeEnum {
    FULL_BODY = 'FULL_BODY',
    DETAIL = 'DETAIL',
    URBAN = 'URBAN',
    RURAL = 'RURAL',
}

export type GenerationType = GenerationTypeEnum;

export type ImageStatus = 'pending' | 'loading' | 'done' | 'error';

export interface GeneratedImage {
    id: GenerationType;
    title: string;
    prompt: string;
    src: string | null;
    status: ImageStatus;
}
