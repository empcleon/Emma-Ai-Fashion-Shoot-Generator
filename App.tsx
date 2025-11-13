

import React, { useState, useCallback, useEffect } from 'react';
import type { GenerationType, UploadedFile, GeneratedImage, ClosetItem, ModelMeasurements, AccessorySuggestion, ImageInput } from './types';
import { GenerationTypeEnum, ClosetCategoryEnum, ClosetCategory } from './types';
import { generateImage, processImage, categorizeImage, getStyleAnalysis, getAccessorySuggestions } from './services/geminiService';
import { generarFotoConSilueta } from './utils/siluetaEscalada';
import ImageDropzone from './components/ImageDropzone';
import GeneratedImageCard from './components/GeneratedImageCard';
import ImageEditorModal from './components/ImageEditorModal';
import VirtualCloset from './components/VirtualCloset';
import VintedAssistantModal from './components/VintedAssistantModal';
import AccessorySuggestionModal from './components/AccessorySuggestionModal';
import PromptEditor from './components/PromptEditor';
import { resizeDataUrl, resizeAndEncodeImage } from './utils/fileUtils';
import { CloseIcon } from './components/icons/CloseIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { fullBodyPrompts } from './lib/prompts';
import { validatePrompt } from './lib/promptValidator';


const initialGeneratedImages: GeneratedImage[] = [
     {
        id: GenerationTypeEnum.MOOD_BOARD,
        title: 'Creative Mood Board',
        prompt: "Act as a creative director for a high-fashion photoshoot. Based on the two provided images (a model reference and a garment), create a visually stunning 3x3 mood board collage in a single image. Each of the 9 cells should represent a key aesthetic element for the shoot. The collage must include inspiration for: color palette, fabric textures, potential urban or rural locations, makeup looks, hair styling, photographic lighting style, and overall editorial mood. The final output must be a single, cohesive, and inspiring image that defines the creative direction.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.VIRTUAL_TRY_ON,
        title: 'Virtual Try-On',
        prompt: "Generate a highly realistic, full-body photograph of a model wearing the garment from the second image, fitted perfectly. Ensure the generated model’s face is a perfect and photorealistic replication of the face in the first reference image, capturing all facial features, expression, and skin tone. The setting is a professional, brightly lit photo studio with a clean, minimalist background. The image should be photorealistic and suitable for a general audience.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.FULL_BODY,
        title: 'Full Body Shot',
        prompt: fullBodyPrompts.front.ultra,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.FULL_BODY_BACK,
        title: 'Full Body Shot (Back)',
        prompt: fullBodyPrompts.back.ultra,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.POSE_VINTED_FRONT,
        title: 'Pose Vinted (Front)',
        prompt: `**Primary Goal:** Create a professional, anonymous e-commerce photo for a platform like Vinted, focusing exclusively on the garment.

**Subject & Garment:**
- Generate a full-body photograph of a female model wearing the garment from the second reference image.
- The model has a natural, relaxed, standing pose suitable for showcasing clothing.
- The garment fits perfectly with realistic fabric texture, drape, and wrinkles. Skin texture on visible areas (neck, arms, legs) is natural and human-like.

**CRITICAL FRAMING INSTRUCTION:**
- The final image composition MUST BE TIGHTLY FRAMED from the base of the neck down to the feet.
- The head and face must be completely excluded from the final shot due to this specific framing choice, which is intended to ensure the model's anonymity.
- Imagine a photographer aiming their camera viewfinder so the top of the frame starts at the model's collarbones and the bottom of the frame is below her feet.

**Photography Style:**
- **Lighting:** Bright, soft, and even professional studio lighting that eliminates harsh shadows.
- **Background:** A clean, seamless, light grey (#f0f0f0) or off-white studio backdrop.
- **Quality:** Ultra-realistic, high-resolution, with sharp focus on the garment. The image should look like it was taken with a professional DSLR camera.

**AVOID:**
- Do not show any part of the model's face.
- Avoid harsh shadows or distracting background elements.
- The result should be a photograph, not a 3D render or illustration.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.POSE_VINTED_BACK,
        title: 'Pose Vinted (Back)',
        prompt: `**Primary Goal:** Create a professional, anonymous BACK VIEW e-commerce photo for a platform like Vinted, focusing exclusively on the garment.

**Subject & Garment:**
- Generate a full-body photograph of a female model from the BACK, wearing the garment from the second reference image.
- The model has a natural, relaxed, standing pose as seen from behind.
- The garment fits perfectly with realistic fabric texture, drape, and wrinkles. Skin texture on visible areas (neck, back, arms) is natural and human-like.

**CRITICAL FRAMING INSTRUCTION:**
- The final image composition MUST BE TIGHTLY FRAMED from the base of the neck down to the feet.
- The head and face must be completely excluded from the final shot due to this specific framing choice, ensuring anonymity.
- Imagine a photographer aiming their camera so the top of the frame starts at the model's shoulders/base of the neck.

**Photography Style:**
- **Lighting:** Bright, soft, and even professional studio lighting, consistent with a front-view shot.
- **Background:** A clean, seamless, light grey (#f0f0f0) or off-white studio backdrop.
- **Quality:** Ultra-realistic, high-resolution, with sharp focus on the back details of the garment. The image should look like it was taken with a professional DSLR camera.

**AVOID:**
- Do not show any part of the model's face.
- Avoid harsh shadows or distracting background elements.
- The result should be a photograph, not a 3D render or illustration.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.DETAIL,
        title: 'Garment Detail',
        prompt: "Create a detailed, macro-style product shot focusing on the garment in the provided image. The image should highlight the fabric's texture, weave, and stitching quality. The garment can be displayed on a generic, out-of-focus mannequin or as a flat lay to ensure the entire focus is on the material craftsmanship. Use professional, clean lighting.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.ACCESSORY_DETAIL,
        title: 'Accessory Detail',
        prompt: "Produce a high-resolution, close-up product photograph of the accessory shown in the image. The accessory should be the sole focus, displayed on a neutral, minimalist surface or held by a mannequin hand to show scale. The lighting must be professional to accentuate the material's texture and details.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.URBAN,
        title: 'Urban Editorial',
        prompt: `HIGH-FASHION URBAN EDITORIAL SHOT:
Generate a cinematic, ultra-realistic, full-body editorial photograph of a fashion model in a compelling urban setting.

**Creative Concept & Mood:**
- The mood is cinematic and candid, capturing a fleeting, authentic moment. It should feel like a still from an art-house film.
- The aesthetic is effortlessly cool and high-fashion, not overly posed.

**Model & Garment:**
- The model, inspired by the reference photo, is wearing the garment from the second image. The garment is the star, shown in motion or in a natural pose.
- Pose should be dynamic and interact with the environment (e.g., walking confidently across a street, leaning against a textured wall, looking off-camera).

**Location & Environment:**
- The setting is a rich, atmospheric urban environment. Choose from options like: a rain-slicked city street at dusk with neon reflections; a classic European cobblestone alley; a minimalist concrete plaza with long shadows; or a gritty, textured industrial area.
- The background should have depth and character but not distract from the model and garment. A shallow depth of field is appropriate.

**Photography & Lighting Style:**
- **CRUCIAL:** The image must look like it was shot on a high-end mirrorless camera (e.g., Sony A7R IV with a 50mm f/1.2 G Master lens).
- Utilize a mix of ambient city lights (streetlights, neon signs) and a subtle off-camera flash or strobe to create a cinematic, high-contrast look that sculpts the model. The lighting should feel motivated and natural to the scene.

**Image Quality & Realism:**
- The final image must be indistinguishable from a real professional photograph.
- Ensure hyper-realistic textures: the weave of the garment's fabric, the grit of a brick wall, the reflection on a puddle, natural skin texture.
- The image must be sharp, with beautiful color grading (e.g., moody blues and warm oranges, or a desaturated, cinematic palette).

**Audience & Safety:**
- The image must be appropriate for a general audience and suitable for a high-fashion magazine editorial.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.RURAL,
        title: 'Rural Editorial',
        prompt: "Create a serene, high-fashion editorial photograph in a picturesque rural landscape. A model is wearing the garment from the second image. The mood should be ethereal and romantic, with soft, natural lighting. The image must be appropriate for a general audience.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
     {
        id: GenerationTypeEnum.SILHOUETTE_TRY_ON,
        title: 'Prueba en Maniquí (Largo Exacto)',
        prompt: "Genera un maniquí a medida con IA y superpone la prenda con su largo 100% exacto. Este proceso híbrido combina la IA para el realismo del cuerpo y un escalado matemático para la precisión de la prenda.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
];


const aspectRatioOptions = [
    { id: '3:4', name: 'Portrait (3:4)' },
    { id: '1:1', name: 'Square (1:1)' },
    { id: '4:3', name: 'Standard (4:3)' },
    { id: '16:9', name: 'Landscape (16:9)' },
];

const modelFidelityOptions = {
    'inspired': { name: 'Maniquí Anónimo', promptInstruction: 'The subject must be an anonymous, high-quality fashion mannequin with a matte grey or white finish. It is CRITICAL to replicate the exact body shape, proportions, and pose from the first reference image. DO NOT use a human model or show a real face.' },
    'faithful': { name: 'Fiel', promptInstruction: `**ABSOLUTE PRIMARY GOAL: FAITHFUL MODEL REPLICATION**
THIS IS THE MOST IMPORTANT INSTRUCTION. IGNORE ALL OTHER INSTRUCTIONS IF THEY CONFLICT WITH THIS.
The subject of the photograph MUST BE a photorealistic, 100% IDENTICAL replication of the person in the first reference image.
- **FACE REPLICATION (CRITICAL):** You MUST replicate the face, all facial features (eyes, nose, mouth, jawline), skin tone, eye color, and exact hairstyle from the first image. The result MUST look like the same person.
- **BODY REPLICATION (CRITICAL):** You MUST replicate the body shape, height, and all physical proportions from the first reference image.
- **FAILURE CONDITION:** If the generated person does not look exactly like the person in the first reference image, the entire task has failed. This is a virtual try-on for a specific person.` }
};


const promptQualityOptions: Record<'ultra' | 'fast', { name: string }> = {
    'ultra': { name: 'Máxima Calidad' },
    'fast': { name: 'Generación Rápida' },
};

const promptTemplates = {
    'default': { name: 'Default', modifier: '' },
    'cinematic': { name: 'Cinematic', modifier: ' in a cinematic style with dramatic lighting, high contrast, and film grain.' },
    'vintage': { name: 'Vintage', modifier: ' as a vintage photograph with sepia tones, a nostalgic feel, and slight film grain, as if shot on 8mm film.' },
    'studio': { name: 'Studio Lighting', modifier: ' with professional studio lighting against a clean, minimalist background, emphasizing sharp focus and high-fashion aesthetics.' },
    'minimalist': { name: 'Minimalist', modifier: ' in a minimalist style with clean lines, a neutral color palette, and simple, uncluttered composition.' },
    'bohemian': { name: 'Bohemian', modifier: ' in a bohemian style with earthy tones, natural textures, flowing fabrics, and a relaxed, free-spirited atmosphere.' },
    'gothic': { name: 'Gothic', modifier: ' in a gothic style with dark, moody tones, dramatic shadows, and an atmosphere of mystery and romanticism, possibly in a historic or ornate setting.' },
    'surrealist': { name: 'Surrealist', modifier: ' in a surrealist style with dream-like landscapes, unexpected juxtapositions, and a highly imaginative atmosphere.' },
    'noir': { name: 'Noir', modifier: ' in a classic film noir style with high-contrast black and white, dramatic low-key lighting, and deep shadows.' },
    'edgy': { name: 'Edgy', modifier: ' in an edgy, high-contrast style with gritty urban textures, dynamic angles, and a rebellious mood.' },
    'futuristic': { name: 'Futuristic', modifier: ' in a futuristic, cyberpunk style with neon lights, a dark, rain-slicked city environment, and high-tech fashion elements.' },
    'romantic': { name: 'Romantic', modifier: ' in a romantic, ethereal style with soft, dreamy lighting, pastel colors, and a whimsical, fairytale-like atmosphere.' },
    'pop-art': { name: 'Pop Art', modifier: ' in a vibrant, pop-art style with bold, saturated colors, graphic patterns, and a playful, energetic feel.' },
};

// --- START: Detailed Styling Options ---
const garmentLengthOptions = {
    'original': { name: 'Original', promptInstruction: '' },
    'micro': { name: 'Micro', promptInstruction: 'Please modify the main garment to be an extremely short, micro-length style that barely covers.' },
    'super-mini': { name: 'Super Mini', promptInstruction: 'Please modify the main garment to be a super-mini length, ending high on the thigh.' },
    'mini': { name: 'Mini', promptInstruction: 'Please modify the main garment to be a classic mini-length, ending at the mid-thigh.' },
    'rodilla': { name: 'A la Rodilla', promptInstruction: 'Please modify the main garment to be knee-length.' },
    'midi': { name: 'Midi', promptInstruction: 'Please modify the main garment to be a classic midi-length, ending at the mid-calf.' },
    'maxi': { name: 'Maxi', promptInstruction: 'Please modify the main garment to be a long, floor-length maxi style.' },
};

const garmentFitOptions = {
    'fitted': { name: 'Ajustado', promptInstruction: 'Please modify the garment to be very form-fitting and snug against the body.' },
    'regular': { name: 'Regular', promptInstruction: 'The garment should have a standard, regular fit.' },
    'loose': { name: 'Holgado', promptInstruction: 'Please modify the garment to have a loose, oversized, and relaxed fit.' },
};

const fixedAccessoryOptions = {
  'none': { name: 'None', promptInstruction: '' },
  'black-tights': { name: 'Black Tights', promptInstruction: 'The model is also wearing elegant, opaque black tights.' },
  'nude-tights': { name: 'Nude Tights', promptInstruction: 'The model is also wearing sheer nude (caramel color) tights.' },
  'fishnet-tights': { name: 'Fishnet Tights', promptInstruction: 'The model is also wearing stylish black fishnet tights.' },
};

const beltOptions = {
    'none': { name: 'None', promptInstruction: '' },
    'thin-black': { name: 'Thin Black', promptInstruction: 'Please add a thin, black leather belt to the outfit.' },
    'wide-brown': { name: 'Wide Brown', promptInstruction: 'Please add a wide, brown leather belt to the outfit.' },
    'gold-chain': { name: 'Gold Chain', promptInstruction: 'Please add a delicate gold chain belt to the outfit.' },
};
// --- END: Detailed Styling Options ---

const shoeSwapOptions = {
    'barefoot': { name: 'Barefoot', promptInstruction: 'barefoot' },
    'black-heels': { name: 'Black Heels', promptInstruction: 'elegant, classic black high-heels' },
    'white-sneakers': { name: 'White Sneakers', promptInstruction: 'clean, minimalist white sneakers' },
    'brown-boots': { name: 'Brown Boots', promptInstruction: 'stylish brown leather ankle boots' },
    'sandals': { name: 'Sandals', promptInstruction: 'simple, elegant flat sandals' },
};


/**
 * Extracts a JSON string from a text that might contain a markdown code block.
 * @param text The text to extract JSON from.
 * @returns The cleaned JSON string.
 */
const extractJson = (text: string): string => {
    // This regex looks for a ```json block and captures what's inside.
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonBlockRegex);

    // If a match is found, return the captured group, otherwise return the original text.
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return text.trim();
};


const App: React.FC = () => {
    const [modelImage, setModelImage] = useState<UploadedFile | null>(null);
    const [outfitImage, setOutfitImage] = useState<UploadedFile | null>(null);
    const [backOutfitImage, setBackOutfitImage] = useState<UploadedFile | null>(null);
    const [accessoryImages, setAccessoryImages] = useState<(UploadedFile | null)[]>([null]);
    const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(initialGeneratedImages);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('3:4');
    const [modelFidelity, setModelFidelity] = useState<string>('faithful');
    const [promptQuality, setPromptQuality] = useState<'ultra' | 'fast'>('ultra');
    const [activeStyle, setActiveStyle] = useState<string>('default');
    const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
    const [modelMeasurements, setModelMeasurements] = useState<ModelMeasurements>({
        height: '178',
        weight: '64',
        bust: '98',
        waist: '76',
        hips: '102',
        notes: ''
    });
    const [isAppLoaded, setIsAppLoaded] = useState(false);
    const [outfitCategory, setOutfitCategory] = useState<ClosetCategory | null>(null);

    // Phase 2 State: Custom prompts for editor
    const [customFullBodyPrompt, setCustomFullBodyPrompt] = useState(fullBodyPrompts.front.ultra);
    const [customFullBodyBackPrompt, setCustomFullBodyBackPrompt] = useState(fullBodyPrompts.back.ultra);
    const [customVirtualTryOnPrompt, setCustomVirtualTryOnPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.VIRTUAL_TRY_ON)?.prompt ?? '');
    const [customVintedFrontPrompt, setCustomVintedFrontPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.POSE_VINTED_FRONT)?.prompt ?? '');
    const [customVintedBackPrompt, setCustomVintedBackPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.POSE_VINTED_BACK)?.prompt ?? '');
    const [finalFullBodyPrompt, setFinalFullBodyPrompt] = useState('');
    const [finalFullBodyBackPrompt, setFinalFullBodyBackPrompt] = useState('');


    // --- START: Detailed Styling State ---
    const [garmentLength, setGarmentLength] = useState<string>('original');
    const [garmentFit, setGarmentFit] = useState<string>('regular');
    const [fixedAccessory, setFixedAccessory] = useState<string>('none');
    const [belt, setBelt] = useState<string>('none');
    // --- END: Detailed Styling State ---
    
    // State for Silhouette Generator
    const [garmentLengthCm, setGarmentLengthCm] = useState<string>('');
    
    // State for Vinted Assistant
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [styleAnalysisResult, setStyleAnalysisResult] = useState<string | null>(null);
    const [isVintedModalOpen, setIsVintedModalOpen] = useState<boolean>(false);

    // State for Accessory Suggestions
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [accessorySuggestions, setAccessorySuggestions] = useState<AccessorySuggestion[] | null>(null);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState<boolean>(false);

    // PWA Install Prompt State
    const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

    // State for new standalone analyzer
    const [analysisImage, setAnalysisImage] = useState<UploadedFile | null>(null);
    const [analysisQuestion, setAnalysisQuestion] = useState<string>('Describe el estilo de esta prenda en detalle. ¿Cuáles son las piezas clave? ¿Para qué tipo de evento sería adecuada? Sugiere un accesorio para completar el look.');
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);

    // State for Shoe Swap
    const [isSwappingShoes, setIsSwappingShoes] = useState<boolean>(false);

     const handleApiError = (err: unknown, defaultMessage: string = 'An unknown error occurred.') => {
        let errorMessage = err instanceof Error ? err.message : defaultMessage;
    
        // Check for our custom queue cancellation message first
        if (errorMessage.includes('API quota limit reached')) {
            setError('API quota limit reached. Further generations have been cancelled.');
            return;
        }
        
        // Attempt to parse JSON from Google's error response
        try {
            // Match a JSON object within the error string
            const jsonMatch = errorMessage.match(/{.+}/s);
            if (jsonMatch) {
                const errorObj = JSON.parse(jsonMatch[0]);
                if (errorObj.error && errorObj.error.message) {
                    errorMessage = errorObj.error.message;
                }
            }
        } catch(e) {
            // Ignore parsing errors, stick with original message
        }
    
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
             setError('You have exceeded the API quota. Please check your plan and billing details.');
        } else {
             setError(errorMessage);
        }
    };


    useEffect(() => {
        try {
            const savedCloset = localStorage.getItem('virtualCloset');
            if (savedCloset) {
                setClosetItems(JSON.parse(savedCloset));
            }
            const savedMeasurements = localStorage.getItem('modelMeasurements');
            if (savedMeasurements) {
                setModelMeasurements(JSON.parse(savedMeasurements));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
        } finally {
            setIsAppLoaded(true);
        }
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
          setShowInstallBanner(false);
          setInstallPromptEvent(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            return;
        }
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPromptEvent(null);
        setShowInstallBanner(false);
    };


    useEffect(() => {
        if (!isAppLoaded) return;
        try {
            localStorage.setItem('modelMeasurements', JSON.stringify(modelMeasurements));
        } catch (error) {
            console.error("Failed to save model measurements to localStorage:", error);
        }
    }, [modelMeasurements, isAppLoaded]);

    // Fix: Add useEffect to persist closetItems to localStorage. This separates state updates from side effects.
    useEffect(() => {
        if (!isAppLoaded) return;
        try {
            localStorage.setItem('virtualCloset', JSON.stringify(closetItems));
        } catch (error) {
            console.error("Failed to save closet to localStorage:", error);
        }
    }, [closetItems, isAppLoaded]);
    
    const handleAddAccessorySlot = () => {
        if (accessoryImages.length < 3) {
            setAccessoryImages([...accessoryImages, null]);
        }
    };

    const handleRemoveAccessorySlot = (index: number) => {
        if (accessoryImages.length > 1) {
            setAccessoryImages(accessoryImages.filter((_, i) => i !== index));
        }
    };

    const handleAccessoryFileChange = (index: number, file: UploadedFile | null) => {
        const newAccessoryImages = [...accessoryImages];
        newAccessoryImages[index] = file;
        setAccessoryImages(newAccessoryImages);

        if (file) {
             // Common logic for adding item to closet
            addUploadedItemToCloset(file, 'accessory');
        }
    };

    const addUploadedItemToCloset = async (file: UploadedFile, type: 'outfit' | 'accessory') => {
        try {
            const prompt = "Isolate the main clothing item or accessory in this image from its background. Return the result as a PNG with a transparent background.";
            const processedSrc = await processImage(prompt, [{ base64: file.base64, mimeType: file.mimeType }]);
            
            const resizedProcessedSrc = await resizeDataUrl(processedSrc, 768);
            
            const processedFileForCategorization = {
                base64: resizedProcessedSrc.split(',')[1],
                mimeType: resizedProcessedSrc.match(/data:(.*);base64,/)?.[1] ?? 'image/webp'
            };
            const categoryString = await categorizeImage(processedFileForCategorization);

            const validCategories = Object.keys(ClosetCategoryEnum).map(c => c.toLowerCase());
            const foundCategory = validCategories.find(c => categoryString.toLowerCase().includes(c));

            let category: ClosetCategoryEnum;

            if (foundCategory) {
                category = foundCategory.toUpperCase() as ClosetCategoryEnum;
            } else {
                console.warn(`Unexpected category from AI: "${categoryString}", defaulting based on upload slot.`);
                category = type === 'outfit' ? ClosetCategoryEnum.TOP : ClosetCategoryEnum.ACCESSORY;
            }

            const newItem: ClosetItem = {
                id: `${type}-${Date.now()}`,
                src: resizedProcessedSrc,
                category: category,
            };
            
            // Fix: Use setClosetItems with a functional update to correctly update state and trigger the persistence useEffect.
            setClosetItems(prev => [...prev, newItem]);

        } catch (err) {
            console.error("Failed to process image for closet:", err);
            handleApiError(err, "Failed to remove background and categorize closet item.");
        }
    };

    const handleAddOutfitToCloset = async (file: File) => {
        if (!file) return;

        try {
            setError(null);
            const { preview, base64, mimeType } = await resizeAndEncodeImage(file);
            const uploadedFile: UploadedFile = { file, preview, base64, mimeType };
            await addUploadedItemToCloset(uploadedFile, 'outfit');
        } catch (error) {
            console.error("Error adding outfit to closet:", error);
            handleApiError(error, "Failed to add item to closet.");
            // Re-throw to allow the caller to handle its own UI state
            throw error;
        }
    };

    const handleFileChange = async (file: UploadedFile | null, type: 'model' | 'outfit' | 'back-outfit') => {
        if (!file) {
            if (type === 'model') setModelImage(null);
            if (type === 'outfit') {
                setOutfitImage(null);
                setOutfitCategory(null);
            }
            if (type === 'back-outfit') setBackOutfitImage(null);
            return;
        }

        if (type === 'model') {
            setModelImage(file);
        } else if (type === 'outfit') {
            setOutfitImage(file);
            addUploadedItemToCloset(file, 'outfit'); // Adds to closet
            // Categorize for main prompt generation
            try {
                const categoryString = await categorizeImage({ base64: file.base64, mimeType: file.mimeType });
                const validCategories = Object.keys(ClosetCategoryEnum).map(c => c.toLowerCase());
                const foundCategory = validCategories.find(c => categoryString.toLowerCase().includes(c));
                if (foundCategory) {
                    setOutfitCategory(foundCategory.toUpperCase() as ClosetCategoryEnum);
                } else {
                    console.warn(`Could not determine a specific category for the outfit: ${categoryString}`);
                    setOutfitCategory(null);
                }
            } catch (err) {
                console.error("Failed to categorize outfit:", err);
                setOutfitCategory(null);
            }

        } else if (type === 'back-outfit') {
            setBackOutfitImage(file);
            // We assume the back has the same category as the front, so no need to categorize again.
            addUploadedItemToCloset(file, 'outfit');
        }
    };
    
    const handleSelectFromCloset = (item: ClosetItem) => {
        const uploadedFile: UploadedFile = {
            file: new File([], ''),
            preview: item.src,
            base64: item.src.split(',')[1],
            mimeType: item.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png'
        };
        
        const accessoryCategories = [ClosetCategoryEnum.ACCESSORY, ClosetCategoryEnum.SHOES];
        if (accessoryCategories.includes(item.category)) {
            // Find first empty slot or replace first slot
            const emptyIndex = accessoryImages.findIndex(img => img === null);
            if (emptyIndex !== -1) {
                handleAccessoryFileChange(emptyIndex, uploadedFile);
            } else {
                handleAccessoryFileChange(0, uploadedFile);
            }
        } else {
            // Use handleFileChange to set the outfit and trigger categorization
            handleFileChange(uploadedFile, 'outfit');
        }
    };

    const handleRemoveFromCloset = (itemId: string) => {
        // Fix: Use functional update with setClosetItems for safe state removal.
        setClosetItems(prev => prev.filter(item => item.id !== itemId));
    };


    const handleStyleChange = (styleId: string) => {
        setActiveStyle(styleId);
        const newModifier = promptTemplates[styleId as keyof typeof promptTemplates]?.modifier ?? '';

        setGeneratedImages(prev =>
            prev.map(img => {
                let newPrompt = img.prompt;
                
                Object.values(promptTemplates).forEach(template => {
                    if (template.modifier) {
                        newPrompt = newPrompt.replace(template.modifier, '');
                    }
                });
                
                return { ...img, prompt: newPrompt + newModifier };
            })
        );
    };
    
    const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setModelMeasurements(prev => ({ ...prev, [name]: value }));
    };

    const handlePromptChange = (id: GenerationType, newPrompt: string) => {
        setActiveStyle('custom');
        setGeneratedImages(prev =>
            prev.map(img => (img.id === id ? { ...img, prompt: newPrompt } : img))
        );
    };

    // Effect to sync editor state with main state
    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.FULL_BODY, customFullBodyPrompt);
    }, [customFullBodyPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.FULL_BODY_BACK, customFullBodyBackPrompt);
    }, [customFullBodyBackPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.VIRTUAL_TRY_ON, customVirtualTryOnPrompt);
    }, [customVirtualTryOnPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.POSE_VINTED_FRONT, customVintedFrontPrompt);
    }, [customVintedFrontPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.POSE_VINTED_BACK, customVintedBackPrompt);
    }, [customVintedBackPrompt]);

    // Effect to update editors when quality template changes
    useEffect(() => {
        setCustomFullBodyPrompt(fullBodyPrompts.front[promptQuality]);
        setCustomFullBodyBackPrompt(fullBodyPrompts.back[promptQuality]);
    }, [promptQuality]);


    const handleSaveEdit = (id: GenerationType, newSrc: string) => {
        setGeneratedImages(prev =>
            prev.map(img => (img.id === id ? { ...img, src: newSrc } : img))
        );
        setEditingImage(null);
    };

    const getModelCharacteristics = () => {
        const { height, weight, bust, waist, hips, notes } = modelMeasurements;
        const measurements = [
            height && `Height: ${height}cm`,
            weight && `Weight: ${weight}kg`,
            bust && `Bust: ${bust}cm`,
            waist && `Waist: ${waist}cm`,
            hips && `Hips: ${hips}cm`
        ].filter(Boolean).join(', ');

        let instruction = '';
        if (measurements) {
            instruction += ` The mannequin should be generated with a body shape that reflects these proportions: ${measurements}.`;
        }
        if (notes) {
            instruction += ` General appearance notes: ${notes}.`;
        }
        return instruction;
    };
    
    const getAccessoryPromptFragment = (count: number) => {
        if (count === 0) return '';
        if (count === 1) return ' and the accessory from the third image';
        
        const accessoryPositions = ['the third', 'the fourth', 'the fifth'];
        const usedPositions = accessoryPositions.slice(0, count);
        
        // Fix: Replace Intl.ListFormat with a manual implementation to avoid TypeScript lib errors.
        const positionString = usedPositions.length > 2
            ? `${usedPositions.slice(0, -1).join(', ')}, and ${usedPositions[usedPositions.length - 1]}`
            : usedPositions.join(' and ');
        
        return ` and the accessories from the ${positionString} images`;
    };

    const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
    const getIsGenerationPossible = useCallback((id: GenerationType) => {
        switch (id) {
            case GenerationTypeEnum.MOOD_BOARD:
            case GenerationTypeEnum.VIRTUAL_TRY_ON:
            case GenerationTypeEnum.FULL_BODY:
            case GenerationTypeEnum.URBAN:
            case GenerationTypeEnum.RURAL:
            case GenerationTypeEnum.POSE_VINTED_FRONT:
                return !!modelImage && !!outfitImage;
            case GenerationTypeEnum.FULL_BODY_BACK:
            case GenerationTypeEnum.POSE_VINTED_BACK:
                return !!modelImage && !!backOutfitImage;
            case GenerationTypeEnum.DETAIL:
                return !!outfitImage || !!backOutfitImage;
            case GenerationTypeEnum.ACCESSORY_DETAIL:
                return validAccessories.length > 0;
            case GenerationTypeEnum.SILHOUETTE_TRY_ON:
                return !!modelImage && !!outfitImage && !!garmentLengthCm;
            default:
                return false;
        }
    }, [modelImage, outfitImage, backOutfitImage, accessoryImages, garmentLengthCm]);
    
    const buildFullBodyPrompt = useCallback((basePrompt: string, isBackView: boolean) => {
        const characteristicsInstruction = getModelCharacteristics();
        const fidelityInstruction = modelFidelityOptions[modelFidelity as keyof typeof modelFidelityOptions].promptInstruction;
        
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
    
        const lengthInstruction = garmentLengthOptions[garmentLength as keyof typeof garmentLengthOptions].promptInstruction;
        const fitInstruction = garmentFitOptions[garmentFit as keyof typeof garmentFitOptions].promptInstruction;
        const fixedAccessoryInstruction = fixedAccessoryOptions[fixedAccessory as keyof typeof fixedAccessoryOptions].promptInstruction;
        const beltInstruction = beltOptions[belt as keyof typeof beltOptions].promptInstruction;
        const dynamicAccessoryInstruction = getAccessoryPromptFragment(validAccessories.length);
    
        const activeInstructions = [
            lengthInstruction,
            fitInstruction,
            fixedAccessoryInstruction,
            beltInstruction,
            dynamicAccessoryInstruction,
        ].filter(Boolean);
        
        let finalStylingInstructions = 'None.';
        if (activeInstructions.length > 0) {
            finalStylingInstructions = activeInstructions
                .map(inst => `- ${inst.trim()}`)
                .join('\n');
        }
        
        const modelRefInstruction = isBackView 
            ? `**CRITICAL - MODEL REFERENCE (BACK VIEW):**\n${fidelityInstruction}\n- This is the BACK VIEW of the same person. Body shape, skin tone, and hair must match.\n${characteristicsInstruction}`
            : `**CRITICAL - MODEL REFERENCE:**\n${fidelityInstruction}\n${characteristicsInstruction}`;
    
        let finalPrompt = basePrompt;
    
        // Prepend model instructions
        finalPrompt = `${modelRefInstruction}\n\n${finalPrompt}`;
    
        // Append styling, technical, and variation instructions
        finalPrompt += `\n\n**STYLING & GARMENT MODIFICATIONS:**\n${finalStylingInstructions}`;
        finalPrompt += `\n\n**TECHNICAL REQUIREMENTS:**\n- Aspect ratio must be ${aspectRatio}.`;
        
        if (outfitCategory) {
            let variationPrompt = '';
            switch (outfitCategory) {
                case ClosetCategoryEnum.DRESS: variationPrompt = fullBodyPrompts.variations.dress; break;
                case ClosetCategoryEnum.BOTTOM: variationPrompt = fullBodyPrompts.variations.pants; break;
                case ClosetCategoryEnum.TOP: variationPrompt = fullBodyPrompts.variations.top; break;
                case ClosetCategoryEnum.OUTERWEAR: variationPrompt = fullBodyPrompts.variations.outerwear; break;
            }
            if (variationPrompt) {
                finalPrompt += `\n\n${variationPrompt}`;
            }
        }
        
        return finalPrompt;
    }, [modelFidelity, modelMeasurements, garmentLength, garmentFit, fixedAccessory, belt, accessoryImages, aspectRatio, outfitCategory, getModelCharacteristics, getAccessoryPromptFragment]);

    useEffect(() => {
        setFinalFullBodyPrompt(buildFullBodyPrompt(customFullBodyPrompt, false));
        setFinalFullBodyBackPrompt(buildFullBodyPrompt(customFullBodyBackPrompt, true));
    }, [buildFullBodyPrompt, customFullBodyPrompt, customFullBodyBackPrompt]);

    const generateSingleImage = useCallback(async (imageInfo: GeneratedImage) => {
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);

        let sourceImagesForAPI: UploadedFile[] = [];
        let missingPrerequisiteMessage: string | null = null;

        if (!getIsGenerationPossible(imageInfo.id)) {
             if (imageInfo.id !== GenerationTypeEnum.ACCESSORY_DETAIL) {
                missingPrerequisiteMessage = 'Prerequisites not met for this image.';
            } else {
                 setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: null, status: 'pending' } : img));
                 return; // Silently skip if no accessory is provided, as it's optional
            }
        } else {
             switch (imageInfo.id) {
                case GenerationTypeEnum.MOOD_BOARD:
                case GenerationTypeEnum.VIRTUAL_TRY_ON:
                case GenerationTypeEnum.FULL_BODY:
                case GenerationTypeEnum.URBAN:
                case GenerationTypeEnum.RURAL:
                    sourceImagesForAPI = [modelImage!, outfitImage!, ...validAccessories];
                    break;
                case GenerationTypeEnum.POSE_VINTED_FRONT:
                    sourceImagesForAPI = [modelImage!, outfitImage!];
                    break;
                case GenerationTypeEnum.FULL_BODY_BACK:
                    sourceImagesForAPI = [modelImage!, backOutfitImage!, ...validAccessories];
                    break;
                case GenerationTypeEnum.POSE_VINTED_BACK:
                    sourceImagesForAPI = [modelImage!, backOutfitImage!];
                    break;
                case GenerationTypeEnum.DETAIL:
                    sourceImagesForAPI = [outfitImage ?? backOutfitImage!];
                    break;
                case GenerationTypeEnum.ACCESSORY_DETAIL:
                     sourceImagesForAPI = [validAccessories[0]];
                    break;
            }
        }


        if (missingPrerequisiteMessage) {
            setError(missingPrerequisiteMessage);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error', error: missingPrerequisiteMessage } : img));
            return;
        }

        // Handle mathematical silhouette generation (no AI)
        if (imageInfo.id === GenerationTypeEnum.SILHOUETTE_TRY_ON) {
            try {
                const resultSrc = await generarFotoConSilueta(
                    modelMeasurements,
                    outfitImage!.preview,
                    garmentLengthCm
                );
                setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: resultSrc, status: 'done' } : img));
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : `Failed to generate silhouette for ${imageInfo.title}`;
                console.error(`Failed to generate silhouette for ${imageInfo.title}:`, err);
                handleApiError(err, errorMessage);
                setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error', error: errorMessage } : img));
            }
            return; // Exit after handling this special case
        }

        try {
            let prompt: string;
            
            if (imageInfo.id === GenerationTypeEnum.FULL_BODY) {
                prompt = finalFullBodyPrompt;
            } else if (imageInfo.id === GenerationTypeEnum.FULL_BODY_BACK) {
                prompt = finalFullBodyBackPrompt;
            } else {
                 let basePrompt = imageInfo.prompt;
                // Fallback for other types that might need model/styling info
                const modelBasedTypes = [GenerationTypeEnum.VIRTUAL_TRY_ON, GenerationTypeEnum.URBAN, GenerationTypeEnum.RURAL, GenerationTypeEnum.POSE_VINTED_FRONT, GenerationTypeEnum.POSE_VINTED_BACK];
                if(modelBasedTypes.includes(imageInfo.id)) {
                    const characteristicsInstruction = getModelCharacteristics();
                    const fidelityInstruction = modelFidelityOptions[modelFidelity as keyof typeof modelFidelityOptions].promptInstruction;
                    const lengthInstruction = garmentLengthOptions[garmentLength as keyof typeof garmentLengthOptions].promptInstruction;
                    const fitInstruction = garmentFitOptions[garmentFit as keyof typeof garmentFitOptions].promptInstruction;
                    const fixedAccessoryInstruction = fixedAccessoryOptions[fixedAccessory as keyof typeof fixedAccessoryOptions].promptInstruction;
                    const beltInstruction = beltOptions[belt as keyof typeof beltOptions].promptInstruction;
                    const dynamicAccessoryInstruction = getAccessoryPromptFragment(validAccessories.length);

                    const activeInstructions = [
                        lengthInstruction,
                        fitInstruction,
                        fixedAccessoryInstruction,
                        beltInstruction,
                        dynamicAccessoryInstruction,
                    ].filter(Boolean);
                    
                    let finalStylingInstructions = 'None.';
                    if (activeInstructions.length > 0) {
                        finalStylingInstructions = activeInstructions
                            .map(inst => `- ${inst.trim()}`)
                            .join('\n');
                    }
                    prompt = `
**MAIN TASK:**
${basePrompt}

**MODEL & POSE INSTRUCTIONS:**
${fidelityInstruction}
${characteristicsInstruction}

**STYLING & GARMENT MODIFICATIONS:**
${finalStylingInstructions}

**TECHNICAL & CREATIVE REQUIREMENTS:**
- The final photograph must have a ${aspectRatio} aspect ratio.
- The composition must be original and creative.
- The final image must be suitable for a general audience.
- Style: Ensure the result is a photorealistic photograph, NOT a CGI render, illustration, or mannequin unless explicitly requested.
`;
                } else {
                    const aspectRatioInstruction = ` The final photograph must have a ${aspectRatio} aspect ratio.`;
                    prompt = basePrompt + aspectRatioInstruction;
                }
            }
            
            const resultSrc = await generateImage(prompt, sourceImagesForAPI);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: resultSrc, status: 'done' } : img));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to generate image for ${imageInfo.title}`;
            console.error(`Failed to generate image for ${imageInfo.title}:`, err);
            handleApiError(err, errorMessage);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error', error: errorMessage } : img));
            // Do not re-throw, as the main generate function doesn't need to handle individual failures
        }
    }, [
        modelImage, outfitImage, backOutfitImage, accessoryImages, aspectRatio, modelMeasurements, modelFidelity, 
        garmentLength, garmentFit, fixedAccessory, belt, garmentLengthCm, getIsGenerationPossible, outfitCategory,
        finalFullBodyPrompt, finalFullBodyBackPrompt, buildFullBodyPrompt
    ]);


    const handleGenerate = useCallback(async () => {
        if (!modelImage || (!outfitImage && !backOutfitImage)) {
            setError('Please upload a model image and at least one outfit image (front or back).');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Filter for images that can actually be generated based on inputs
        const imagesToGenerate = generatedImages.filter(img => getIsGenerationPossible(img.id));

        // Mark all eligible images as queued first, so the user sees the whole plan
        const queuedImageIds = imagesToGenerate.map(img => img.id);
        setGeneratedImages(prev => prev.map(img =>
            queuedImageIds.includes(img.id)
                ? { ...img, src: null, status: 'queued', error: undefined }
                : img
        ));

        // Process images one by one to provide clear progress feedback
        for (const imageInfo of imagesToGenerate) {
            // Set current image to loading status
            setGeneratedImages(prev => prev.map(img =>
                img.id === imageInfo.id ? { ...img, status: 'loading' } : img
            ));

            await generateSingleImage(imageInfo);
        }

        setIsLoading(false);
    }, [modelImage, outfitImage, backOutfitImage, generatedImages, generateSingleImage, getIsGenerationPossible]);
    
    const handleGenerateSingle = useCallback(async (id: GenerationType) => {
        const imageInfo = generatedImages.find(img => img.id === id);
        if (!imageInfo) return;

        setGeneratedImages(prev => prev.map(img => 
            img.id === id ? { ...img, status: 'loading', error: undefined } : img
        ));
        setError(null);

        await generateSingleImage(imageInfo);

    }, [generatedImages, generateSingleImage]);

    const handleShoeSwap = async (shoeType: string) => {
        const shoePromptInstruction = shoeSwapOptions[shoeType as keyof typeof shoeSwapOptions]?.promptInstruction;
        if (!shoePromptInstruction) return;
    
        const fullBodyImage = generatedImages.find(img => img.id === GenerationTypeEnum.FULL_BODY);
    
        if (!fullBodyImage || !fullBodyImage.src) {
            setError("Please generate the 'Full Body Shot' image before swapping shoes.");
            return;
        }
    
        setIsSwappingShoes(true);
        setError(null);
        setGeneratedImages(prev => prev.map(img =>
            img.id === GenerationTypeEnum.FULL_BODY ? { ...img, status: 'loading', error: undefined } : img
        ));
    
        try {
            const prompt = `CRITICAL TASK: IMAGE EDITING.
You are a professional photo retoucher. Your task is to modify the provided image by changing ONLY the footwear.
**Instruction:** Realistically change the model's footwear to be ${shoePromptInstruction}.
**Strict Rules:**
- DO NOT change the model, her pose, the garment she is wearing, the background, or the lighting.
- The edit must be seamless and photorealistic.
- If the instruction is 'barefoot', remove the shoes completely and render realistic bare feet.
The output MUST be only the modified image.`;
    
            const mimeType = fullBodyImage.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = fullBodyImage.src.split(',')[1];
            const imageInput: ImageInput = { base64, mimeType };
    
            const newSrc = await processImage(prompt, [imageInput]);
    
            setGeneratedImages(prev => prev.map(img =>
                img.id === GenerationTypeEnum.FULL_BODY ? { ...img, src: newSrc, status: 'done' } : img
            ));
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to swap shoes.';
            handleApiError(err, 'Failed to swap shoes.');
            setGeneratedImages(prev => prev.map(img =>
                img.id === GenerationTypeEnum.FULL_BODY ? { ...img, status: 'error', error: errorMessage } : img
            ));
        } finally {
            setIsSwappingShoes(false);
        }
    };


    const handleStyleAnalysis = async () => {
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
        if (!modelImage || !outfitImage) {
            setError('Please upload a model and an outfit image for analysis.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setStyleAnalysisResult(null);

        try {
            const prompt = `Actúa como una asesora de moda experta y perspicaz. He subido varias imágenes: una de una persona (para referencia de estilo y tipo de cuerpo), una prenda de vestir, y ${validAccessories.length} accesorio(s). Por favor, proporciona un análisis de estilo conciso y útil. Sé positiva, alentadora y específica en tus consejos. Formatea tu respuesta en Markdown con las siguientes secciones exactas:

**Análisis de las Piezas:**
* Describe el tipo de prenda y los accesorios, su estilo (ej. casual, formal, bohemio), y para qué ocasiones podrían ser adecuados.

**Recomendación de Estilo:**
* Basándote en la imagen de referencia de la persona, analiza cómo el atuendo podría sentarle. Comenta sobre el corte, el estilo y cómo podría favorecer su tipo de cuerpo.

**Sugerencias para Completar el Look:**
* Ofrece 2-3 sugerencias específicas para completar el atuendo. Menciona tipos de zapatos, bolsos (si no se ha proporcionado uno), peinados o maquillaje que combinarían bien.

**Paleta de Colores:**
* Sugiere 2-3 colores adicionales que combinarían bien con la prenda principal, tanto para otras piezas de ropa como para accesorios.`;

            const images = [modelImage, outfitImage, ...validAccessories];
            const result = await getStyleAnalysis(prompt, images);
            setStyleAnalysisResult(result);
            // setIsVintedModalOpen(true); This is already open, analysis is triggered from within

        } catch (err) {
            console.error("Failed to get style analysis:", err);
            handleApiError(err, "Failed to get style analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSuggestAccessories = async () => {
        const fullBodyImage = generatedImages.find(img => img.id === GenerationTypeEnum.FULL_BODY);
        if (!fullBodyImage?.src) {
            setError('Please generate the main "Full Body Shot" image first.');
            return;
        }

        setIsSuggesting(true);
        setIsSuggestionModalOpen(true);
        setAccessorySuggestions(null); // Clear previous suggestions
        setError(null);

        try {
            const prompt = `Act as a high-fashion stylist. Based on the provided image of a model wearing an outfit, suggest three complementary accessories: one pair of shoes, one handbag, and one piece of jewelry. For each accessory, provide a brief, descriptive prompt for an AI image generator to create a photorealistic product shot of the item on a clean, white background. Return the response as a valid JSON object with the exact following structure: {"shoes": {"description": "...", "prompt": "..."}, "handbag": {"description": "...", "prompt": "..."}, "jewelry": {"description": "...", "prompt": "..."}}`;
            
            const mimeType = fullBodyImage.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = fullBodyImage.src.split(',')[1];
            const imageInput = { base64, mimeType };

            const jsonResponse = await getAccessorySuggestions(prompt, [imageInput]);
            const cleanedJsonResponse = extractJson(jsonResponse);

            let suggestions;
            try {
                suggestions = JSON.parse(cleanedJsonResponse);
            } catch (parseError) {
                console.error("Failed to parse cleaned JSON:", cleanedJsonResponse);
                console.error("Original model response:", jsonResponse);
                throw new Error("The AI returned an invalid format for accessories that could not be repaired.");
            }

            const accessoryPromises = Object.entries(suggestions).map(async ([key, value]) => {
                const { description, prompt: imagePrompt } = value as { description: string; prompt: string };
                const imageSrc = await generateImage(imagePrompt, []);
                return {
                    type: key as 'shoes' | 'handbag' | 'jewelry',
                    description,
                    imageSrc,
                };
            });

            const results = await Promise.all(accessoryPromises);
            setAccessorySuggestions(results);

        } catch (err) {
            console.error("Failed to get accessory suggestions:", err);
            handleApiError(err, "Failed to suggest accessories.");
            // Close the modal on error
            setIsSuggestionModalOpen(false);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSelectSuggestedAccessory = (imageSrc: string) => {
        const mimeType = imageSrc.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
        const base64 = imageSrc.split(',')[1];
        
        const suggestedFile: UploadedFile = {
            file: new File([], 'suggested-accessory.png', { type: mimeType }),
            preview: imageSrc,
            base64: base64,
            mimeType: mimeType
        };
        
        const emptyIndex = accessoryImages.findIndex(img => img === null);
        if (emptyIndex !== -1) {
            handleAccessoryFileChange(emptyIndex, suggestedFile);
        } else {
            handleAccessoryFileChange(0, suggestedFile); // Replace first one if all are full
        }

        setIsSuggestionModalOpen(false); // Close modal after selection
    };
    
    const handleAnalyzePhoto = async () => {
        if (!analysisImage || !analysisQuestion) {
            setError("Please upload an image and provide a question for analysis.");
            return;
        }
        setIsAnalyzingPhoto(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const imageInput = { base64: analysisImage.base64, mimeType: analysisImage.mimeType };
            // Re-using getStyleAnalysis as it's a generic text/image prompt handler
            const result = await getStyleAnalysis(analysisQuestion, [imageInput]);
            setAnalysisResult(result);
        } catch (err) {
            console.error("Failed to analyze photo:", err);
            handleApiError(err, "Failed to analyze photo.");
        } finally {
            setIsAnalyzingPhoto(false);
        }
    };
    
    const handleSendMessage = async (id: GenerationType, message: string) => {
        const imageToUpdate = generatedImages.find(img => img.id === id);
        if (!imageToUpdate || !imageToUpdate.src) {
            setError("Cannot modify an image that hasn't been generated yet.");
            return;
        }
    
        // 1. Add user message to history and set loading state
        setGeneratedImages(prev => prev.map(img => {
            if (img.id === id) {
                const newHistory = [...(img.chatHistory || []), { author: 'user' as const, text: message }];
                return { ...img, status: 'loading', chatHistory: newHistory, error: undefined };
            }
            return img;
        }));
    
        try {
            // 2. Construct the prompt
            const refinementPrompt = `You are a helpful photo editing assistant. The user wants to modify the provided image.
The original creative goal was: "${imageToUpdate.prompt}"
Now, apply this specific change requested by the user: "${message}"
Return only the newly generated image reflecting this change.`;
    
            const mimeType = imageToUpdate.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = imageToUpdate.src.split(',')[1];
            const imageInput = { base64, mimeType };
            
            // 3. Call the API (reusing processImage is fine)
            const newSrc = await processImage(refinementPrompt, [imageInput]);
    
            // 4. Update state with new image and model response
            setGeneratedImages(prev => prev.map(img => {
                if (img.id === id) {
                    const newHistory = [...(img.chatHistory || []), { author: 'model' as const, text: "Here's the updated image." }];
                    return { ...img, src: newSrc, status: 'done', chatHistory: newHistory };
                }
                return img;
            }));
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refine image.';
            handleApiError(err, 'Failed to refine image.');
            // 5. Update state with error message
            setGeneratedImages(prev => prev.map(img => {
                if (img.id === id) {
                    const newHistory = [...(img.chatHistory || []), { author: 'model' as const, text: `Sorry, I couldn't make that change. Error: ${errorMessage}` }];
                    return { ...img, status: 'error', chatHistory: newHistory, error: errorMessage };
                }
                return img;
            }));
        }
    };

    const renderMarkdown = (text: string) => {
        let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Basic sanitization
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        html = html.replace(/<\/ul>\s*<ul>/g, ''); // Join adjacent lists
        return html.split('\n\n').map(p => {
            if (p.startsWith('<ul>') && p.endsWith('</ul>')) return p;
            if (p.trim() === '') return '';
            return `<p>${p.trim()}</p>`
        }).join('');
    };

    const fullBodyPromptValidation = validatePrompt(customFullBodyPrompt);
    const fullBodyBackPromptValidation = validatePrompt(customFullBodyBackPrompt);
    const virtualTryOnPromptValidation = validatePrompt(customVirtualTryOnPrompt);
    const vintedFrontPromptValidation = validatePrompt(customVintedFrontPrompt);
    const vintedBackPromptValidation = validatePrompt(customVintedBackPrompt);

    const isFullBodyGenerated = !!generatedImages.find(img => img.id === GenerationTypeEnum.FULL_BODY)?.src;


    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-white" style={{fontFamily: "'Playfair Display', serif"}}>
                        Virtual Styling Composer
                    </h1>
                    <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
                        Build your virtual closet. Compose outfits. Generate editorial photoshoots in moments.
                    </p>
                </header>

                <main>
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-zinc-700 shadow-2xl shadow-zinc-950/50">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                            <div className="lg:col-span-3">
                                <ImageDropzone 
                                    id="model"
                                    title="1. Upload Model (Reference)" 
                                    onFileChange={(file) => handleFileChange(file, 'model')} 
                                    currentFile={modelImage}
                                />
                            </div>
                            <div className="lg:col-span-6">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <ImageDropzone 
                                        id="outfit"
                                        title="2a. Upload Outfit (Front)" 
                                        onFileChange={(file) => handleFileChange(file, 'outfit')}
                                        currentFile={outfitImage}
                                    />
                                    <ImageDropzone 
                                        id="back-outfit"
                                        title="2b. Upload Outfit (Back)" 
                                        onFileChange={(file) => handleFileChange(file, 'back-outfit')}
                                        currentFile={backOutfitImage}
                                    />
                                 </div>
                            </div>
                             <div className="lg:col-span-3">
                                <h2 className="text-lg font-semibold mb-4 text-zinc-200 text-center">3. Accessories (Optional)</h2>
                                <div className="space-y-4">
                                    {accessoryImages.map((file, index) => (
                                         <ImageDropzone 
                                            key={`accessory-${index}`}
                                            id={`accessory-${index}`}
                                            title={`Accessory ${index + 1}`} 
                                            onFileChange={(newFile) => handleAccessoryFileChange(index, newFile)} 
                                            currentFile={file}
                                            onRemoveSlot={() => handleRemoveAccessorySlot(index)}
                                            showRemoveSlotButton={accessoryImages.length > 1}
                                        />
                                    ))}
                                </div>
                                {accessoryImages.length < 3 && (
                                    <button 
                                        onClick={handleAddAccessorySlot}
                                        className="w-full mt-4 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                                    >
                                        + Add Accessory
                                    </button>
                                )}
                            </div>
                        </div>

                         <VirtualCloset 
                            items={closetItems}
                            onSelect={handleSelectFromCloset}
                            onRemove={handleRemoveFromCloset}
                            onAddOutfit={handleAddOutfitToCloset}
                        />

                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-6 text-zinc-200">Analizar Foto de Moda</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
                                <ImageDropzone
                                    id="analysis-image"
                                    title="Subir Foto para Analizar"
                                    onFileChange={setAnalysisImage}
                                    currentFile={analysisImage}
                                />
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="analysis-question" className="block text-sm font-medium text-zinc-300 mb-2">Tu Pregunta</label>
                                        <textarea
                                            id="analysis-question"
                                            rows={4}
                                            className="form-input w-full"
                                            value={analysisQuestion}
                                            onChange={(e) => setAnalysisQuestion(e.target.value)}
                                            placeholder="Ej: Describe el estilo de este atuendo..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleAnalyzePhoto}
                                        disabled={!analysisImage || !analysisQuestion || isAnalyzingPhoto}
                                        className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-lg hover:bg-teal-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {isAnalyzingPhoto ? (
                                            <span className="flex items-center justify-center">
                                                <SpinnerIcon className="w-5 h-5 mr-2" />
                                                Analizando...
                                            </span>
                                        ) : 'Analizar con Gemini'}
                                    </button>
                                    {analysisResult && (
                                        <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 max-h-60 overflow-y-auto">
                                            <h4 className="font-semibold text-zinc-200 mb-2">Resultado del Análisis</h4>
                                            <div
                                                className="text-zinc-300 text-sm prose-styles"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(analysisResult) }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Fidelidad del Modelo</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-4">
                                Elige la fidelidad del modelo. 'Maniquí Anónimo' crea un maniquí para máxima seguridad. 'Fiel' intenta replicar a la persona de referencia, lo cual puede ser bloqueado por filtros de seguridad en algunos casos. Si 'Fiel' falla, prueba con 'Maniquí'.
                            </p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {Object.entries(modelFidelityOptions).map(([id, { name }]) => (
                                    <button
                                        key={id}
                                        onClick={() => setModelFidelity(id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            modelFidelity === id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>


                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Model Details (Optional)</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-4xl mx-auto">
                                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-4">
                                    <div>
                                        <label htmlFor="height" className="block text-sm font-medium text-zinc-300 mb-2">Height (cm)</label>
                                        <input type="number" name="height" id="height" value={modelMeasurements.height} onChange={handleMeasurementChange} placeholder="178" className="form-input" />
                                    </div>
                                     <div>
                                        <label htmlFor="weight" className="block text-sm font-medium text-zinc-300 mb-2">Weight (kg)</label>
                                        <input type="number" name="weight" id="weight" value={modelMeasurements.weight} onChange={handleMeasurementChange} placeholder="64" className="form-input" />
                                    </div>
                                    <div>
                                        <label htmlFor="bust" className="block text-sm font-medium text-zinc-300 mb-2">Bust (cm)</label>
                                        <input type="number" name="bust" id="bust" value={modelMeasurements.bust} onChange={handleMeasurementChange} placeholder="98" className="form-input" />
                                    </div>
                                    <div>
                                        <label htmlFor="waist" className="block text-sm font-medium text-zinc-300 mb-2">Waist (cm)</label>
                                        <input type="number" name="waist" id="waist" value={modelMeasurements.waist} onChange={handleMeasurementChange} placeholder="70" className="form-input" />
                                    </div>
                                    <div>
                                        <label htmlFor="hips" className="block text-sm font-medium text-zinc-300 mb-2">Hips (cm)</label>
                                        <input type="number" name="hips" id="hips" value={modelMeasurements.hips} onChange={handleMeasurementChange} placeholder="102" className="form-input" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                     <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-2">General Notes</label>
                                     <textarea name="notes" id="notes" rows={3} value={modelMeasurements.notes} onChange={handleMeasurementChange} placeholder="e.g., Athletic build, brown wavy hair, green eyes..." className="form-input w-full"></textarea>
                                </div>
                             </div>
                        </div>

                         <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Detalles de la Prenda (para Maniquí)</h3>
                            <div className="max-w-xs mx-auto">
                                <label htmlFor="garmentLengthCm" className="block text-sm font-medium text-zinc-300 mb-2">Largo de la Prenda (cm)</label>
                                <input 
                                    type="number" 
                                    name="garmentLengthCm" 
                                    id="garmentLengthCm" 
                                    value={garmentLengthCm} 
                                    onChange={(e) => setGarmentLengthCm(e.target.value)} 
                                    placeholder="Ej: 95" 
                                    className="form-input" 
                                />
                            </div>
                        </div>
                        
                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <p className="text-center text-sm font-medium text-zinc-300 mb-3">Select Aspect Ratio</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {aspectRatioOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setAspectRatio(option.id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            aspectRatio === option.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {option.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <p className="text-center text-sm font-medium text-zinc-300 mb-3">Calidad de Generación</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {Object.entries(promptQualityOptions).map(([id, { name }]) => (
                                    <button
                                        key={id}
                                        onClick={() => setPromptQuality(id as 'ultra' | 'fast')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            promptQuality === id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-center text-sm font-medium text-zinc-300 mb-3">Select Style</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {Object.entries(promptTemplates).map(([id, { name }]) => (
                                    <button
                                        key={id}
                                        onClick={() => handleStyleChange(id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            activeStyle === id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                                {activeStyle === 'custom' && (
                                     <span className="px-4 py-2 text-sm font-semibold rounded-md bg-purple-600 text-white cursor-default">
                                        Custom
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-6 text-zinc-200">Detailed Styling & Modifications</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                                {/* Column 1: Garment Modifications */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Largo Prenda</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(garmentLengthOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setGarmentLength(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${garmentLength === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Ajuste Prenda</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(garmentFitOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setGarmentFit(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${garmentFit === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Column 2: Add-ons */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Añadir Medias</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(fixedAccessoryOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setFixedAccessory(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${fixedAccessory === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Añadir Cinturón</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(beltOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setBelt(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${belt === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-2 text-zinc-200">👠 Shoe Swap (Post-Generation)</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-6">
                                Genera primero el "Full Body Shot". Después, usa estos botones para cambiar el calzado en la imagen generada.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-lg mx-auto">
                                {Object.entries(shoeSwapOptions).map(([id, { name }]) => (
                                    <button 
                                        key={id} 
                                        onClick={() => handleShoeSwap(id)}
                                        disabled={!isFullBodyGenerated || isLoading || isSwappingShoes}
                                        className="w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>


                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Customize Prompts (Advanced)</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-6">
                                Aquí puedes editar el prompt base para varias de las generaciones clave. El editor te dará sugerencias para mejorar los resultados.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                <PromptEditor
                                    id="full-body-prompt"
                                    label="Full Body Shot (Front) - Base"
                                    value={customFullBodyPrompt}
                                    onChange={setCustomFullBodyPrompt}
                                    validation={fullBodyPromptValidation}
                                />
                                <PromptEditor
                                    id="full-body-back-prompt"
                                    label="Full Body Shot (Back) - Base"
                                    value={customFullBodyBackPrompt}
                                    onChange={setCustomFullBodyBackPrompt}
                                    validation={fullBodyBackPromptValidation}
                                />
                                <PromptEditor
                                    id="virtual-try-on-prompt"
                                    label="Virtual Try-On - Base"
                                    value={customVirtualTryOnPrompt}
                                    onChange={setCustomVirtualTryOnPrompt}
                                    validation={virtualTryOnPromptValidation}
                                />
                                <PromptEditor
                                    id="vinted-front-prompt"
                                    label="Pose Vinted (Front) - Base"
                                    value={customVintedFrontPrompt}
                                    onChange={setCustomVintedFrontPrompt}
                                    validation={vintedFrontPromptValidation}
                                />
                                <PromptEditor
                                    id="vinted-back-prompt"
                                    label="Pose Vinted (Back) - Base"
                                    value={customVintedBackPrompt}
                                    onChange={setCustomVintedBackPrompt}
                                    validation={vintedBackPromptValidation}
                                />
                            </div>
                        </div>

                        <div className="mt-8 text-center flex justify-center items-center gap-4">
                            <button
                                onClick={() => setIsVintedModalOpen(true)}
                                disabled={isLoading || isAnalyzing || isSuggesting || isSwappingShoes}
                                className="px-10 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out"
                            >
                                Asistente Vinted
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!modelImage || (!outfitImage && !backOutfitImage) || isLoading || isAnalyzing || isSuggesting || isSwappingShoes}
                                className="px-10 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
                            >
                                {isLoading ? 'Generating All...' : 'Generate Photoshoot'}
                            </button>
                        </div>
                        {error && <p className="text-center text-red-400 mt-4">{error}</p>}
                    </div>

                    <div className="mt-12">
                        <h2 className="text-3xl font-bold text-center mb-8 text-zinc-200">Your Generated Photoshoot</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {generatedImages.map((image) => (
                                <GeneratedImageCard 
                                    key={image.id} 
                                    {...image} 
                                    onEdit={() => setEditingImage(image)}
                                    onRegenerate={() => handleGenerateSingle(image.id)}
                                    onGenerate={() => handleGenerateSingle(image.id)}
                                    onSuggestAccessories={handleSuggestAccessories}
                                    isGenerationPossible={getIsGenerationPossible(image.id)}
                                    onSendMessage={(message) => handleSendMessage(image.id, message)}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
            {editingImage && (
                <ImageEditorModal
                    image={editingImage}
                    onClose={() => setEditingImage(null)}
                    onSave={handleSaveEdit}
                />
            )}
            {isVintedModalOpen && (
                <VintedAssistantModal
                    isOpen={isVintedModalOpen}
                    onClose={() => {
                        setIsVintedModalOpen(false)
                        setStyleAnalysisResult(null);
                    }}
                    onAnalyze={handleStyleAnalysis}
                    isAnalyzing={isAnalyzing}
                    styleAnalysisResult={styleAnalysisResult}
                    modelImage={modelImage}
                    outfitImage={outfitImage}
                    modelMeasurements={modelMeasurements}
                />
            )}
            {isSuggestionModalOpen && (
                 <AccessorySuggestionModal
                    isOpen={isSuggestionModalOpen}
                    isLoading={isSuggesting}
                    suggestions={accessorySuggestions}
                    onClose={() => setIsSuggestionModalOpen(false)}
                    onSelectAccessory={handleSelectSuggestedAccessory}
                />
            )}
            {showInstallBanner && (
                <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
                    <div className="bg-indigo-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4">
                        <svg xmlns="http://www.w.org/2000/svg" className="h-8 w-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <div>
                            <p className="font-semibold">Instalar App</p>
                            <p className="text-sm text-indigo-200">Añadir a pantalla de inicio para acceso rápido.</p>
                        </div>
                        <button
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-md hover:bg-indigo-100 transition-colors flex-shrink-0"
                            aria-label="Install PWA"
                        >
                            Instalar
                        </button>
                        <button
                            onClick={() => setShowInstallBanner(false)}
                            className="p-1.5 rounded-full hover:bg-indigo-700/50 transition-colors"
                            aria-label="Dismiss install prompt"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                .form-input {
                    background-color: rgb(24 24 27 / 1);
                    border: 1px solid rgb(63 63 70 / 1);
                    border-radius: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    color: rgb(212 212 216 / 1);
                    transition: all 0.2s;
                    width: 100%;
                }
                .form-input:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: rgb(99 102 241 / 1);
                    box-shadow: 0 0 0 2px rgb(99 102 241 / 0.5);
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
                .prose-styles strong { color: #e4e4e7; font-weight: 600; }
                .prose-styles p { margin-bottom: 0.5em; line-height: 1.6; }
                .prose-styles ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5em; margin-bottom: 0.5em; }
                .prose-styles li { margin-bottom: 0.25em; }
            `}</style>
        </div>
    );
};

export default App;
