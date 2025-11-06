import React, { useState, useCallback, useEffect } from 'react';
import type { GenerationType, UploadedFile, GeneratedImage, ClosetItem, ModelMeasurements, AccessorySuggestion } from './types';
import { GenerationTypeEnum, ClosetCategoryEnum } from './types';
import { generateImage, processImage, categorizeImage, getStyleAnalysis, getAccessorySuggestions } from './services/geminiService';
import ImageDropzone from './components/ImageDropzone';
import GeneratedImageCard from './components/GeneratedImageCard';
import ImageEditorModal from './components/ImageEditorModal';
import VirtualCloset from './components/VirtualCloset';
import VintedAssistantModal from './components/VintedAssistantModal';
import AccessorySuggestionModal from './components/AccessorySuggestionModal';
import { resizeDataUrl, resizeAndEncodeImage } from './utils/fileUtils';
import { CloseIcon } from './components/icons/CloseIcon';

const initialGeneratedImages: GeneratedImage[] = [
     {
        id: GenerationTypeEnum.MOOD_BOARD,
        title: 'Creative Mood Board',
        prompt: "Act as a creative director for a high-fashion photoshoot. Based on the two provided images (a model reference and a garment), create a visually stunning 3x3 mood board collage in a single image. Each of the 9 cells should represent a key aesthetic element for the shoot. The collage must include inspiration for: color palette, fabric textures, potential urban or rural locations, makeup looks, hair styling, photographic lighting style, and overall editorial mood. The final output must be a single, cohesive, and inspiring image that defines the creative direction.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.VIRTUAL_TRY_ON,
        title: 'Virtual Try-On',
        prompt: "Generate a highly realistic, full-body photograph of an AI-generated fashion model. The model should be inspired by the person in the first reference image, capturing their style and an approximate age of 45. The model is wearing the garment from the second image, fitted perfectly. The setting is a professional, brightly lit photo studio with a clean, minimalist background. The image should be photorealistic.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.FULL_BODY,
        title: 'Full Body Shot',
        prompt: "Generate a highly realistic, full-body e-commerce photograph. Create an AI-generated fashion model inspired by the person in the first reference image, matching their pose and an approximate age of 45. The model is wearing the garment from the second image. The background must be a clean, minimalist studio with professional, even lighting. The image must be appropriate for a general audience.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.FULL_BODY_BACK,
        title: 'Full Body Shot (Back)',
        prompt: "Generate a highly realistic, full-body e-commerce photograph showing the model from the back. Create an AI-generated fashion model inspired by the person in the first reference image, matching their pose and an approximate age of 45. The model is wearing the garment from the second image, showing its back view. The background must be a clean, minimalist studio with professional, even lighting. The image must be appropriate for a general audience.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.DETAIL,
        title: 'Garment Detail',
        prompt: "Create a detailed, macro-style product shot focusing on the garment in the provided image. The image should highlight the fabric's texture, weave, and stitching quality. The garment can be displayed on a generic, out-of-focus mannequin or as a flat lay to ensure the entire focus is on the material craftsmanship. Use professional, clean lighting.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.ACCESSORY_DETAIL,
        title: 'Accessory Detail',
        prompt: "Produce a high-resolution, close-up product photograph of the accessory shown in the image. The accessory should be the sole focus, displayed on a neutral, minimalist surface or held by a mannequin hand to show scale. The lighting must be professional to accentuate the material's texture and details.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.URBAN,
        title: 'Urban Editorial',
        prompt: "Generate a dynamic, high-fashion editorial photograph in a modern urban environment. Create an AI-generated fashion model inspired by the mood, pose, and style of the person in the first reference image, with an apparent age of approximately 45. She is wearing the garment from the second image. The mood should be moody and atmospheric, with dramatic lighting and a sense of movement.",
        src: null,
        status: 'pending'
    },
    {
        id: GenerationTypeEnum.RURAL,
        title: 'Rural Editorial',
        prompt: "Create a serene, high-fashion editorial photograph in a picturesque rural landscape. Create an AI-generated fashion model inspired by the mood, pose, and style of the person in the first reference image, with an apparent age of approximately 45. She is wearing the garment from the second image. The mood should be ethereal and romantic, with soft, natural lighting.",
        src: null,
        status: 'pending'
    },
];


const aspectRatioOptions = [
    { id: '3:4', name: 'Portrait (3:4)' },
    { id: '1:1', name: 'Square (1:1)' },
    { id: '4:3', name: 'Standard (4:3)' },
    { id: '16:9', name: 'Landscape (16:9)' },
];

const modelFidelityOptions = {
    'inspired': { name: 'Inspirado', promptInstruction: ' The generated model should be a new, unique individual inspired by the reference photo but not a direct copy.' },
    'faithful': { name: 'Fiel', promptInstruction: 'The generated model should be a photorealistic representation that is a very close likeness of the person in the reference image, accurately replicating their physical attributes including body type, build, hair style, ethnicity, and facial features. Aim for maximum fidelity as this is a virtual try-on.' }
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
    const [modelFidelity, setModelFidelity] = useState<string>('inspired');
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

    // --- START: Detailed Styling State ---
    const [garmentLength, setGarmentLength] = useState<string>('original');
    const [garmentFit, setGarmentFit] = useState<string>('regular');
    const [fixedAccessory, setFixedAccessory] = useState<string>('none');
    const [belt, setBelt] = useState<string>('none');
    // --- END: Detailed Styling State ---
    
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
            setError("Failed to remove background and categorize closet item.");
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
            setError("Failed to add item to closet.");
            // Re-throw to allow the caller to handle its own UI state
            throw error;
        }
    };

    const handleFileChange = (file: UploadedFile | null, type: 'model' | 'outfit' | 'back-outfit') => {
        if (!file) {
            if (type === 'model') setModelImage(null);
            if (type === 'outfit') setOutfitImage(null);
            if (type === 'back-outfit') setBackOutfitImage(null);
            return;
        }

        if (type === 'model') {
            setModelImage(file);
        } else if (type === 'outfit') {
            setOutfitImage(file);
            addUploadedItemToCloset(file, 'outfit');
        } else if (type === 'back-outfit') {
            setBackOutfitImage(file);
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
            setOutfitImage(uploadedFile);
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
            instruction += ` The model should be generated with a body shape that reflects these proportions: ${measurements}.`;
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

    const generateSingleImage = useCallback(async (imageInfo: GeneratedImage) => {
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);

        let sourceImagesForAPI: UploadedFile[] = [];
        let missingPrerequisiteMessage: string | null = null;

        switch (imageInfo.id) {
            case GenerationTypeEnum.MOOD_BOARD:
            case GenerationTypeEnum.VIRTUAL_TRY_ON:
            case GenerationTypeEnum.FULL_BODY:
            case GenerationTypeEnum.URBAN:
            case GenerationTypeEnum.RURAL:
                if (!modelImage || !outfitImage) {
                    missingPrerequisiteMessage = 'Please upload both a model and an outfit image.';
                } else {
                    sourceImagesForAPI = [modelImage, outfitImage, ...validAccessories];
                }
                break;
            case GenerationTypeEnum.FULL_BODY_BACK:
                if (!modelImage || !backOutfitImage) {
                    missingPrerequisiteMessage = 'Please upload a model and a back outfit image.';
                } else {
                    sourceImagesForAPI = [modelImage, backOutfitImage, ...validAccessories];
                }
                break;
            case GenerationTypeEnum.DETAIL:
                if (!outfitImage && !backOutfitImage) {
                    missingPrerequisiteMessage = 'Please upload an outfit image for the detail shot.';
                } else {
                    sourceImagesForAPI = [outfitImage ?? backOutfitImage!];
                }
                break;
            case GenerationTypeEnum.ACCESSORY_DETAIL:
                if (validAccessories.length === 0) {
                    setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: null, status: 'pending' } : img));
                    return; // Exit silently
                } else {
                    sourceImagesForAPI = [validAccessories[0]];
                }
                break;
        }

        if (missingPrerequisiteMessage) {
            setError(missingPrerequisiteMessage);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error' } : img));
            return;
        }

        try {
            const characteristicsInstruction = getModelCharacteristics();
            const aspectRatioInstruction = ` The final photograph must have a ${aspectRatio} aspect ratio.`;
            const fidelityInstruction = modelFidelityOptions[modelFidelity as keyof typeof modelFidelityOptions].promptInstruction;
            
            // --- START: Detailed Styling Instructions ---
            const lengthInstruction = garmentLengthOptions[garmentLength as keyof typeof garmentLengthOptions].promptInstruction;
            const fitInstruction = garmentFitOptions[garmentFit as keyof typeof garmentFitOptions].promptInstruction;
            const fixedAccessoryInstruction = fixedAccessoryOptions[fixedAccessory as keyof typeof fixedAccessoryOptions].promptInstruction;
            const beltInstruction = beltOptions[belt as keyof typeof beltOptions].promptInstruction;
            const dynamicAccessoryInstruction = getAccessoryPromptFragment(validAccessories.length);
            // --- END: Detailed Styling Instructions ---

            const modelBasedTypes = [GenerationTypeEnum.VIRTUAL_TRY_ON, GenerationTypeEnum.FULL_BODY, GenerationTypeEnum.FULL_BODY_BACK, GenerationTypeEnum.URBAN, GenerationTypeEnum.RURAL];
            
            let finalStylingInstructions = '';
            if (modelBasedTypes.includes(imageInfo.id)) {
                // Base instructions applicable to all model views
                const baseInstructions = [
                    lengthInstruction,
                    fitInstruction,
                    fixedAccessoryInstruction,
                    beltInstruction,
                    dynamicAccessoryInstruction,
                ];

                // Instructions that only make sense for a front view
                const frontOnlyInstructions: string[] = [];
                
                let activeInstructions: string[] = [];
                if (imageInfo.id === GenerationTypeEnum.FULL_BODY_BACK) {
                    activeInstructions = baseInstructions.filter(Boolean);
                } else {
                    activeInstructions = [...baseInstructions, ...frontOnlyInstructions].filter(Boolean);
                }

                if (activeInstructions.length > 0) {
                    const formattedInstructions = activeInstructions
                        .map(inst => `- ${inst.trim()}`)
                        .join('\n');
                    finalStylingInstructions = `\n\nPlease apply the following specific modifications to the garment:\n${formattedInstructions}`;
                }
            }
            
            // Construct final prompt, ensuring fidelity instruction is separate from styling list
            const prompt = imageInfo.prompt + fidelityInstruction + finalStylingInstructions + characteristicsInstruction + aspectRatioInstruction;
            
            const resultSrc = await generateImage(prompt, sourceImagesForAPI);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: resultSrc, status: 'done' } : img));
        } catch (err) {
            console.error(`Failed to generate image for ${imageInfo.title}:`, err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate image for ${imageInfo.title}: ${errorMessage}`);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error' } : img));
            // Do not re-throw, as the main generate function doesn't need to handle individual failures
        }
    }, [
        modelImage, outfitImage, backOutfitImage, accessoryImages, aspectRatio, modelMeasurements, modelFidelity, 
        garmentLength, garmentFit, fixedAccessory, belt
    ]);


    const handleGenerate = useCallback(async () => {
        if (!modelImage || (!outfitImage && !backOutfitImage)) {
            setError('Please upload a model image and at least one outfit image (front or back).');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        setGeneratedImages(prev => prev.map(img => ({
            ...img,
            src: null,
            status: 'loading'
        })));
        
        // Generate all images in parallel
        const generationPromises = generatedImages.map(imageInfo => generateSingleImage(imageInfo));
        
        await Promise.allSettled(generationPromises);
        
        setIsLoading(false);
    }, [modelImage, outfitImage, backOutfitImage, generatedImages, generateSingleImage]);
    
    const handleGenerateSingle = useCallback(async (id: GenerationType) => {
        const imageInfo = generatedImages.find(img => img.id === id);
        if (!imageInfo) return;

        setGeneratedImages(prev => prev.map(img => 
            img.id === id ? { ...img, status: 'loading' } : img
        ));
        setError(null);

        await generateSingleImage(imageInfo);

    }, [generatedImages, generateSingleImage]);


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
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to get style analysis: ${errorMessage}`);
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
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to suggest accessories: ${errorMessage}`);
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

    const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
    const getIsGenerationPossible = (id: GenerationType) => {
        switch (id) {
            case GenerationTypeEnum.MOOD_BOARD:
            case GenerationTypeEnum.VIRTUAL_TRY_ON:
            case GenerationTypeEnum.FULL_BODY:
            case GenerationTypeEnum.URBAN:
            case GenerationTypeEnum.RURAL:
                return !!modelImage && !!outfitImage;
            case GenerationTypeEnum.FULL_BODY_BACK:
                return !!modelImage && !!backOutfitImage;
            case GenerationTypeEnum.DETAIL:
                return !!outfitImage || !!backOutfitImage;
            case GenerationTypeEnum.ACCESSORY_DETAIL:
                return validAccessories.length > 0;
            default:
                return false;
        }
    };


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
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Fidelidad del Modelo</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-4">
                                Elige la fidelidad del modelo. 'Inspirado' (recomendado) crea un modelo nuevo y único. 'Fiel' intenta un parecido cercano pero tiene más probabilidades de ser bloqueado por los filtros de seguridad.
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
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Customize Prompts (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {generatedImages.map((image) => (
                                    <div key={image.id}>
                                        <label htmlFor={`prompt-${image.id}`} className="block text-sm font-medium text-zinc-300 mb-2">{image.title}</label>
                                        <textarea
                                            id={`prompt-${image.id}`}
                                            rows={4}
                                            className="form-input w-full"
                                            value={image.prompt}
                                            onChange={(e) => handlePromptChange(image.id, e.target.value)}
                                            aria-label={`Custom prompt for ${image.title}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 text-center flex justify-center items-center gap-4">
                            <button
                                onClick={() => setIsVintedModalOpen(true)}
                                disabled={isLoading || isAnalyzing || isSuggesting}
                                className="px-10 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out"
                            >
                                Asistente Vinted
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!modelImage || (!outfitImage && !backOutfitImage) || isLoading || isAnalyzing || isSuggesting}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
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
            `}</style>
        </div>
    );
};

export default App;