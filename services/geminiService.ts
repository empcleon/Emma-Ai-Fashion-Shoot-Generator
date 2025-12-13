
import { GoogleGenAI, Modality, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
// Fix: Import ImageInput from the centralized types file.
import type { ModelMeasurements, MedidasPrenda, AnalisisMedidas, AnalisisVisual, ImageInput } from '../types';
import { GarmentConditionEnum } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageGenerationModel = 'gemini-2.5-flash-image';
const textGenerationModel = 'gemini-2.5-flash';


// --- Start of queue logic ---
type QueuedRequest<T> = {
    apiCall: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};

const requestQueue: QueuedRequest<any>[] = [];
let isProcessingQueue = false;
// A delay between API calls to stay within the free tier limits.
const API_CALL_DELAY = 15000; 

const processQueue = async () => {
    if (requestQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }

    isProcessingQueue = true;
    const { apiCall, resolve, reject } = requestQueue.shift()!;
    
    try {
        const result = await apiCall();
        resolve(result);
    } catch (error) {
        reject(error);
        
        // Check for quota errors to stop the queue
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
            console.warn('API quota exhausted. Clearing pending generation requests.');
            
            // Reject all remaining requests in the queue
            while(requestQueue.length > 0) {
                const queuedItem = requestQueue.shift();
                queuedItem?.reject(new Error('Request cancelled: API quota limit reached.'));
            }
            
            isProcessingQueue = false;
            return; // Stop processing
        }
    }
    
    // Continue with the next item after the delay, unless the queue was cleared
    if (isProcessingQueue) {
        setTimeout(processQueue, API_CALL_DELAY);
    }
};

const addToQueue = <T>(apiCall: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        requestQueue.push({ apiCall, resolve, reject });
        if (!isProcessingQueue) {
            processQueue();
        }
    });
};
// --- End of queue logic ---

const callGeminiApiForImage = (prompt: string, images: ImageInput[]): Promise<string> => {
     return addToQueue(async () => {
        try {
            const imageParts = images.map(image => ({
                inlineData: {
                    data: image.base64,
                    mimeType: image.mimeType,
                },
            }));

            const textPart = { text: prompt };
            
            const response = await ai.models.generateContent({
                    model: imageGenerationModel,
                    contents: {
                        parts: [...imageParts, textPart],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                        safetySettings: [
                            {
                                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                                threshold: HarmBlockThreshold.BLOCK_NONE,
                            },
                            {
                                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                                threshold: HarmBlockThreshold.BLOCK_NONE,
                            },
                            {
                                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                                threshold: HarmBlockThreshold.BLOCK_NONE,
                            },
                            {
                                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                                threshold: HarmBlockThreshold.BLOCK_NONE,
                            },
                        ],
                    },
                });
            
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
                    } else if (finishReason === 'IMAGE_RECITATION') {
                        errorMessage = "Image generation failed because the result was too similar to a known image. Please try using a different input image or modify your prompt to be more unique.";
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
            throw error;
        }
    });
};

const callGeminiApiForText = (prompt: string, images: ImageInput[], systemInstruction?: string): Promise<string> => {
    return addToQueue(async () => {
        try {
            const imageParts = images.map(image => ({
                inlineData: {
                    data: image.base64,
                    mimeType: image.mimeType,
                },
            }));

            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                    model: textGenerationModel,
                    contents: {
                        parts: [...imageParts, textPart],
                    },
                    config: {
                        systemInstruction: systemInstruction,
                    }
                });
            
            return response.text.trim();

        } catch (error) {
            console.error('Error calling Gemini API for text:', error);
            throw error;
        }
    });
};

export const categorizeImage = async (image: ImageInput): Promise<string> => {
    const categories = "Top, Bottom, Dress, Outerwear, Shoes, Accessory";
    const prompt = `Analyze the main clothing item or accessory in this image. Classify it into ONE of the following categories: ${categories}. Respond with ONLY the single category name (e.g., "Top", "Dress", "Accessory").`;
    return callGeminiApiForText(prompt, [image]);
};

export const getStyleAnalysis = async (prompt: string, images: ImageInput[], systemInstruction?: string): Promise<string> => {
    return callGeminiApiForText(prompt, images, systemInstruction);
};

export const getAccessorySuggestions = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return callGeminiApiForText(prompt, images);
};

export const generateImage = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return callGeminiApiForImage(prompt, images);
};

export const processImage = async (prompt: string, images: ImageInput[]): Promise<string> => {
    return callGeminiApiForImage(prompt, images);
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
Analiza esta prenda de ropa y extrae sus detalles visuales para un anuncio de venta.

TIPO_PRENDA (elige la más precisa):
Vestido, Top, Blusa, Camiseta, Pantalón, Jeans, Falda, Chaqueta, Abrigo, Jersey, Sudadera, Short, Mono, Blazer, Accesorio

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
algodon, seda, poliester, lino, punto, denim, terciopelo, lana, encaje, otro

COLOR PREDOMINANTE:
Nombre del color principal en español (ej: "Rojo carmesí", "Azul marino", "Beige")

KEYWORDS:
Lista de 5 palabras clave descriptivas (ej: "cuello en V", "manga abullonada", "tiro alto", "oversize", "ajustado")

Devuelve un JSON válido:
{
"tipoPrenda": "...",
"estilo": "...",
"confianza": 0-1,
"estampado": "...",
"tejido": "...",
"colorPredominante": "...",
"keywords": ["keyword1", "keyword2", ...]
}
`;

    const jsonResponse = await callGeminiApiForText(prompt, [image]);
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
        if (!parsed.tipoPrenda) {
            parsed.tipoPrenda = 'Prenda';
        }
        return parsed;
    } catch (error) {
        console.error("Failed to parse JSON for visual analysis:", cleanedJson);
        throw new Error("The AI returned an invalid format for the visual analysis.");
    }
};


export const generateAnonymizedImage = async (image: ImageInput): Promise<string> => {
    const prompt = "Please take this image of a person and apply a strong, artistic blur effect only to their face, making it completely unrecognizable. The clothing and the rest of the body must remain in sharp focus. If no face is visible, blur the top 25% of the image to ensure anonymity. The output should be a photorealistic image.";
    return callGeminiApiForImage(prompt, [image]);
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
    
    return callGeminiApiForImage(prompt, [flatLayImage]);
};

export const generateMeasurementProof = async (flatLayImage: ImageInput, medidas: MedidasPrenda): Promise<string> => {
    // Construct measurement labels
    const measurementsList = [];
    if (medidas.largo) measurementsList.push(`Length: ${medidas.largo}cm`);
    if (medidas.anchoPecho) measurementsList.push(`Chest: ${medidas.anchoPecho}cm`);
    if (medidas.anchoCintura) measurementsList.push(`Waist: ${medidas.anchoCintura}cm`);
    
    const measurementsString = measurementsList.join(', ');

    const prompt = `TECHNICAL FASHION VISUALIZATION - DIGITAL TAPE MEASURE:

Task: Create a 'Visual Proof' image for a Vinted listing. Take the input image of the garment and OVERLAY graphic measurement lines (dimension arrows) to show exactly where the measurements were taken.

STRICT INSTRUCTIONS:
1. PRESERVE THE ORIGINAL IMAGE: Do not change the garment, color, or shape.
2. OVERLAY GRAPHICS: Draw distinct, high-contrast, technical double-headed arrows (like an architect's blueprint or technical drawing) directly over the garment.
   - Draw a VERTICAL arrow for Length (${medidas.largo}cm) from top to bottom.
   - Draw HORIZONTAL arrows for Chest (${medidas.anchoPecho}cm) and Waist (${medidas.anchoCintura}cm) at the appropriate heights.
3. LABELS: Place the measurement text (e.g., "${medidas.anchoPecho} cm") clearly next to each arrow. Use a clean, bold, sans-serif font that is easy to read.
4. STYLE: The aesthetic should look like a professional "Digital Tape Measure" or Augmented Reality (AR) overlay. Use bright colors for the lines (like Cyan or Magenta) so they stand out against the fabric.

Output: A photorealistic image of the garment with the technical overlay.`;

    return callGeminiApiForImage(prompt, [flatLayImage]);
};
