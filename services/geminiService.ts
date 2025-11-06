


import { GoogleGenAI, Modality, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { ModelMeasurements, MedidasPrenda, AnalisisMedidas, AnalisisVisual } from '../types';
import { GarmentConditionEnum } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageGenerationModel = 'gemini-2.5-flash-image';
const textGenerationModel = 'gemini-2.5-flash';


export interface ImageInput {
    base64: string;
    mimeType: string;
}

// --- Start of unified queuing logic ---
type QueuedRequest<T> = {
    apiCall: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};

const apiRequestQueue: QueuedRequest<any>[] = [];
let isProcessingApi = false;
// To prevent all 429 errors, we serialize all API calls and use the most restrictive
// rate limit (5 RPM for the image model). This is 12 seconds per request.
// We use 12.5 seconds to be safe.
const API_RATE_LIMIT_DELAY = 12500; 

const processApiQueue = async () => {
    if (isProcessingApi || apiRequestQueue.length === 0) {
        return;
    }
    isProcessingApi = true;
    const { apiCall, resolve, reject } = apiRequestQueue.shift()!;
    try {
        const result = await apiCall();
        resolve(result);
    } catch (error) {
        reject(error);
    } finally {
        setTimeout(() => {
            isProcessingApi = false;
            processApiQueue();
        }, API_RATE_LIMIT_DELAY);
    }
};

const addToApiQueue = <T>(apiCall: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        apiRequestQueue.push({ apiCall, resolve, reject });
        if (!isProcessingApi) {
            processApiQueue();
        }
    });
};
// --- End of unified queuing logic ---


// --- Start of new retry logic ---
const callGeminiWithRetry = async <T extends GenerateContentResponse>(
    apiCall: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 5000 // Start with a 5-second delay for the first retry
): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error) {
            const isRateLimitError = error instanceof Error && 
                (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));

            if (isRateLimitError && attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt); // 5s, 10s
                console.warn(
                    `API rate limit exceeded. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`
                );
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            } else {
                // Non-retriable error or max retries reached
                console.error(`API call failed after ${attempt + 1} attempts.`, error);
                throw error;
            }
        }
    }
    // This should not be reachable due to the throw in the loop, but it satisfies TypeScript
    throw new Error(`Exceeded maximum API retries after ${maxRetries} attempts.`);
};
// --- End of new retry logic ---


const callGeminiApiForImage = async (prompt: string, images: ImageInput[]): Promise<string> => {
     try {
        const imageParts = images.map(image => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        }));

        const textPart = { text: prompt };

        const response = await callGeminiWithRetry(() => ai.models.generateContent({
            model: imageGenerationModel,
            contents: {
                parts: [...imageParts, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                ],
            },
        }));
        
        const candidate = response.candidates?.[0];
        
        if (!candidate) {
             const promptFeedback = response.promptFeedback;
             let reason = "Unknown reason";
             if (promptFeedback?.blockReason) {
                 reason = `Prompt was blocked due to: ${promptFeedback.blockReason}`;
             }
             throw new Error(`The request was blocked and no content was generated. ${reason}`);
        }

        const imagePart = candidate.content?.parts?.find(part => part.inlineData);

        if (imagePart?.inlineData) {
            const base64ImageBytes = imagePart.inlineData.data;
            return `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
        } else {
            let errorMessage = "No image was generated by the API.";
            const finishReason = candidate.finishReason;
            
            if (finishReason && finishReason !== 'STOP') {
                if (finishReason === 'SAFETY' || finishReason === 'IMAGE_OTHER') {
                    errorMessage = "The image could not be generated due to safety filters. This can happen with images of people. Please try a different reference image or adjust the prompt.";
                } else {
                    errorMessage += ` The process stopped because: ${finishReason}.`;
                }
            }

            const textPart = candidate.content?.parts?.find(part => part.text);
            if (textPart?.text) {
                errorMessage += ` The model responded with: "${textPart.text.trim()}"`;
            }
            
            console.error("Image generation/processing failed. Full API response:", JSON.stringify(response, null, 2));
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        if (error instanceof Error) {
            // Do not re-wrap our own errors.
            if (error.message.startsWith('API call failed.')) {
                throw error;
            }

            let message = error.message;
            // The error message itself might be a JSON string. Let's try to parse it.
            try {
                const parsedJson = JSON.parse(message);
                if (parsedJson.error && parsedJson.error.message) {
                    message = parsedJson.error.message;
                }
            } catch (e) {
                // It wasn't a JSON string, so we'll just use the message as-is.
            }
            
            throw new Error(`API call failed. Reason: ${message}`);
        }
        throw new Error('API call failed due to an unknown error.');
    }
};

const callGeminiApiForText = async (prompt: string, images: ImageInput[]): Promise<string> => {
    try {
        const imageParts = images.map(image => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        }));

        const textPart = { text: prompt };

        const response = await callGeminiWithRetry(() => ai.models.generateContent({
            model: textGenerationModel,
            contents: {
                parts: [...imageParts, textPart],
            },
        }));
        
        return response.text.trim();

    } catch (error) {
        console.error('Error calling Gemini API for text:', error);
        if (error instanceof Error) {
            let message = error.message;
             // The error message itself might be a JSON string. Let's try to parse it.
            try {
                const parsedJson = JSON.parse(message);
                if (parsedJson.error && parsedJson.error.message) {
                    message = parsedJson.error.message;
                }
            } catch (e) {
                // It wasn't a JSON string, so we'll just use the message as-is.
            }
            throw new Error(`API text call failed. Reason: ${message}`);
        }
        throw new Error('API text call failed due to an unknown error.');
    }
};

export const categorizeImage = async (image: ImageInput): Promise<string> => {
    const categories = "Top, Bottom, Dress, Outerwear, Shoes, Accessory";
    const prompt = `Analyze the main clothing item or accessory in this image. Classify it into ONE of the following categories: ${categories}. Respond with ONLY the single category name (e.g., "Top", "Dress", "Accessory").`;
    return addToApiQueue(() => callGeminiApiForText(prompt, [image]));
};

export const getStyleAnalysis = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return addToApiQueue(() => callGeminiApiForText(prompt, images));
};

export const getAccessorySuggestions = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return addToApiQueue(() => callGeminiApiForText(prompt, images));
};

export const generateImage = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return addToApiQueue(() => callGeminiApiForImage(prompt, images));
};

export const processImage = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return addToApiQueue(() => callGeminiApiForImage(prompt, images));
};


const extractJson = (text: string): string => {
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return text.trim();
};

export const getVisualAnalysisForVinted = async (image: ImageInput): Promise<AnalisisVisual> => {
    const estilosDisponibles = ['floral-romantico', 'elegante-noche', 'casual-verano', 'boho-hippie', 'minimalista-urbano', 'deportivo', 'vintage-retro'];
    const prompt = `
Analiza este vestido y clasifícalo:
ESTILO (elige uno):
floral-romantico: Estampados florales, colores pastel, cortes femeninos
elegante-noche: Negro, satén, escotes, cortes ajustados
casual-verano: Colores vivos, tejidos ligeros, cortes relajados
boho-hippie: Étnico, flecos, bordados, colores tierra
minimalista-urbano: Liso, negro/blanco/neutro, líneas limpias
deportivo: Tejidos técnicos, casual, cómodo
vintage-retro: Estilo años 60-90, cortes clásicos
ESTAMPADO:
floral, liso, rayas, lunares, geometrico, animal-print, abstracto, ninguno
TEJIDO (por apariencia):
algodon, seda, poliester, lino, punto, denim, otro
COLOR PREDOMINANTE:
Nombre del color principal
Devuelve JSON:
{
"estilo": "...",
"confianza": 0-1,
"estampado": "...",
"tejido": "...",
"colorPredominante": "...",
"keywords": ["keyword1", "keyword2", ...]
}
`;

    const jsonResponse = await addToApiQueue(() => callGeminiApiForText(prompt, [image]));
    const cleanedJson = extractJson(jsonResponse);

    try {
        const parsed = JSON.parse(cleanedJson);
        // Basic validation
        if (typeof parsed.estilo !== 'string' || !estilosDisponibles.includes(parsed.estilo)) {
            console.warn(`Invalid or missing style from AI: ${parsed.estilo}. Falling back.`);
            parsed.estilo = 'casual-verano';
        }
        if (typeof parsed.confianza !== 'number' || parsed.confianza < 0 || parsed.confianza > 1) {
            parsed.confianza = 0.5; // Default confidence
        }
        return parsed;
    } catch (error) {
        console.error("Failed to parse JSON for visual analysis:", cleanedJson);
        throw new Error("The AI returned an invalid format for the visual analysis.");
    }
};


export const generateAnonymizedImage = async (image: ImageInput): Promise<string> => {
    const prompt = "Please take this image of a person and apply a strong, artistic blur effect only to their face, making it completely unrecognizable. The clothing and the rest of the body must remain in sharp focus. If no face is visible, blur the top 25% of the image to ensure anonymity. The output should be a photorealistic image.";
    return addToApiQueue(() => callGeminiApiForImage(prompt, [image]));
};

export const generateInfographic = async (flatLayImage: ImageInput, medidas: MedidasPrenda, info: { marca: string, talla: string }): Promise<string> => {
    const measurementsText = [
        `Largo: ${medidas.largo || 'N/A'}cm`,
        `Ancho Pecho: ${medidas.anchoPecho || 'N/A'}cm`,
        `Ancho Cintura: ${medidas.anchoCintura || 'N/A'}cm`,
        `Ancho Cadera: ${medidas.anchoCadera || 'N/A'}cm`,
    ].filter(m => !m.includes('N/A')).join(', ');

    const prompt = `You are a graphic designer for a professional fashion resale platform.
    Task: Create a clean and professional infographic from the provided 'flat lay' image of a garment.
    
    Instructions:
    1.  Use the provided image as the main element, ensuring it is centered.
    2.  Overlay the following measurements onto the image using elegant, thin, dashed lines and clear, readable text. Place the lines and text logically near the corresponding parts of the garment (e.g., a vertical line for length, a horizontal line for chest width).
        - Measurements: ${measurementsText}
    3.  In a corner (e.g., bottom left), create a small, semi-transparent white box with the following information in a clean, sans-serif font:
        - Marca: ${info.marca}
        - Talla: ${info.talla}
    4.  The final output must be a single, high-quality JPEG image with a 1:1 square aspect ratio. The background should be a clean, neutral light grey. Do not add any other text or elements.`;
    
    return addToApiQueue(() => callGeminiApiForImage(prompt, [flatLayImage]));
};