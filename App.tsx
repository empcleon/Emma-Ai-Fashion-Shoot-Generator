
import React, { useState, useCallback } from 'react';
import type { GenerationType, UploadedFile, GeneratedImage } from './types';
import { GenerationTypeEnum } from './types';
import { generateImage } from './services/geminiService';
import ImageDropzone from './components/ImageDropzone';
import GeneratedImageCard from './components/GeneratedImageCard';
import ImageEditorModal from './components/ImageEditorModal';

const initialGeneratedImages: GeneratedImage[] = [
    { 
        id: GenerationTypeEnum.FULL_BODY, 
        title: 'Full Body Shot', 
        prompt: "Create a photorealistic, full-body fashion photograph of the model from the reference photo wearing the provided outfit. The final image should be clean, professional, and suitable for an e-commerce website.",
        src: null, 
        status: 'pending' 
    },
    { 
        id: GenerationTypeEnum.DETAIL, 
        title: 'Garment Detail',
        prompt: 'Generate a high-resolution, macro-style photograph focusing on the texture, fabric, and stitching details of this garment. The lighting should be professional, highlighting the quality of the material.',
        src: null, 
        status: 'pending' 
    },
    { 
        id: GenerationTypeEnum.URBAN, 
        title: 'Urban Editorial', 
        prompt: "Create a dynamic, high-fashion editorial photograph of the model from the reference photo wearing the provided outfit. The setting is a vibrant, modern urban environment like New York City, Tokyo, or London, with a moody, atmospheric style, interesting lighting, and compelling composition.",
        src: null, 
        status: 'pending' 
    },
    { 
        id: GenerationTypeEnum.RURAL, 
        title: 'Rural Editorial', 
        prompt: "Create a serene and beautiful, high-fashion editorial photograph of the model from the reference photo wearing the provided outfit. The setting is a picturesque rural landscape, such as a field of wildflowers, a misty forest, or a coastline at golden hour. The mood should be ethereal and romantic.",
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

const promptTemplates = {
    'default': { name: 'Default', modifier: '' },
    'cinematic': { name: 'Cinematic', modifier: ' in a cinematic style with dramatic lighting, high contrast, and film grain.' },
    'vintage': { name: 'Vintage', modifier: ' as a vintage photograph with sepia tones, a nostalgic feel, and slight film grain, as if shot on 8mm film.' },
    'studio': { name: 'Studio Lighting', modifier: ' with professional studio lighting against a clean, minimalist background, emphasizing sharp focus and high-fashion aesthetics.' },
    'minimalist': { name: 'Minimalist', modifier: ' in a minimalist style with clean lines, a neutral color palette, and simple, uncluttered composition.' },
    'bohemian': { name: 'Bohemian', modifier: ' in a bohemian style with earthy tones, natural textures, flowing fabrics, and a relaxed, free-spirited atmosphere.' },
    'gothic': { name: 'Gothic', modifier: ' in a gothic style with dark, moody tones, dramatic shadows, and an atmosphere of mystery and romanticism, possibly in a historic or ornate setting.' },
};

const App: React.FC = () => {
    const [modelImage, setModelImage] = useState<UploadedFile | null>(null);
    const [outfitImage, setOutfitImage] = useState<UploadedFile | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(initialGeneratedImages);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('3:4');
    const [activeStyle, setActiveStyle] = useState<string>('default');
    const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);

    const handleStyleChange = (styleId: string) => {
        setActiveStyle(styleId);
        const newModifier = promptTemplates[styleId as keyof typeof promptTemplates]?.modifier ?? '';

        setGeneratedImages(prev =>
            prev.map(img => {
                let newPrompt = img.prompt;
                
                // Remove all known style modifiers from the current prompt.
                // This preserves any manual edits while allowing styles to be swapped.
                Object.values(promptTemplates).forEach(template => {
                    if (template.modifier) { // Avoid replacing with empty string
                        newPrompt = newPrompt.replace(template.modifier, '');
                    }
                });

                // Add the new modifier.
                return { ...img, prompt: newPrompt + newModifier };
            })
        );
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

    const handleGenerate = useCallback(async () => {
        if (!modelImage || !outfitImage) {
            setError('Please upload both a model and an outfit image.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(prev => prev.map(img => ({ ...img, status: 'loading', src: null })));
        
        const aspectRatioInstruction = ` The final photograph must have a ${aspectRatio} aspect ratio.`;

        const generationTasks: Promise<void>[] = generatedImages.map(async (imageInfo) => {
            try {
                let images: UploadedFile[] = [];
                const prompt = imageInfo.prompt + aspectRatioInstruction;

                switch (imageInfo.id) {
                    case GenerationTypeEnum.FULL_BODY:
                    case GenerationTypeEnum.URBAN:
                    case GenerationTypeEnum.RURAL:
                        images = [modelImage, outfitImage];
                        break;
                    case GenerationTypeEnum.DETAIL:
                        images = [outfitImage];
                        break;
                }
                
                const resultSrc = await generateImage(prompt, images);
                setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: resultSrc, status: 'done' } : img));
            } catch (err) {
                console.error(`Failed to generate image for ${imageInfo.title}:`, err);
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(`Failed to generate image for ${imageInfo.title}: ${errorMessage}`);
                setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error' } : img));
            }
        });

        await Promise.allSettled(generationTasks);
        setIsLoading(false);

    }, [modelImage, outfitImage, aspectRatio, generatedImages]);
    
    const handleRegenerate = useCallback(async (id: GenerationType) => {
        if (!modelImage || !outfitImage) {
            setError('Source images are missing. Please upload them again.');
            return;
        }

        const imageInfo = generatedImages.find(img => img.id === id);
        if (!imageInfo) return;

        setGeneratedImages(prev => prev.map(img => 
            img.id === id ? { ...img, status: 'loading' } : img
        ));
        setError(null);

        try {
            const aspectRatioInstruction = ` The final photograph must have a ${aspectRatio} aspect ratio.`;
            const prompt = imageInfo.prompt + aspectRatioInstruction;
            
            let images: UploadedFile[] = [];
            switch (imageInfo.id) {
                case GenerationTypeEnum.FULL_BODY:
                case GenerationTypeEnum.URBAN:
                case GenerationTypeEnum.RURAL:
                    images = [modelImage, outfitImage];
                    break;
                case GenerationTypeEnum.DETAIL:
                    images = [outfitImage];
                    break;
            }

            const resultSrc = await generateImage(prompt, images);
            setGeneratedImages(prev => prev.map(img => 
                img.id === id ? { ...img, src: resultSrc, status: 'done' } : img
            ));
        } catch (err) {
            console.error(`Failed to regenerate image for ${imageInfo.title}:`, err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to regenerate image for ${imageInfo.title}: ${errorMessage}`);
            setGeneratedImages(prev => prev.map(img => 
                img.id === id ? { ...img, status: 'error' } : img
            ));
        }
    }, [modelImage, outfitImage, generatedImages, aspectRatio]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-white" style={{fontFamily: "'Playfair Display', serif"}}>
                        AI Fashion Shoot Generator
                    </h1>
                    <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
                        Upload a model and an outfit. Our AI will generate a complete editorial photoshoot in moments.
                    </p>
                </header>

                <main>
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-zinc-700 shadow-2xl shadow-zinc-950/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <ImageDropzone 
                                id="model"
                                title="Model Image" 
                                onFileChange={setModelImage} 
                            />
                            <ImageDropzone 
                                id="outfit"
                                title="Outfit Image" 
                                onFileChange={setOutfitImage} 
                            />
                        </div>
                        
                        <div className="mt-8">
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
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Customize Prompts (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {generatedImages.map((image) => (
                                    <div key={image.id}>
                                        <label htmlFor={`prompt-${image.id}`} className="block text-sm font-medium text-zinc-300 mb-2">{image.title}</label>
                                        <textarea
                                            id={`prompt-${image.id}`}
                                            rows={4}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm"
                                            value={image.prompt}
                                            onChange={(e) => handlePromptChange(image.id, e.target.value)}
                                            aria-label={`Custom prompt for ${image.title}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={handleGenerate}
                                disabled={!modelImage || !outfitImage || isLoading}
                                className="px-10 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
                            >
                                {isLoading ? 'Generating...' : 'Generate Photoshoot'}
                            </button>
                        </div>
                        {error && <p className="text-center text-red-400 mt-4">{error}</p>}
                    </div>

                    <div className="mt-12">
                        <h2 className="text-3xl font-bold text-center mb-8 text-zinc-200">Your Generated Photoshoot</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            {generatedImages.map((image) => (
                                <GeneratedImageCard 
                                    key={image.id} 
                                    {...image} 
                                    onEdit={() => setEditingImage(image)}
                                    onRegenerate={() => handleRegenerate(image.id)}
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
        </div>
    );
};

export default App;
