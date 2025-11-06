
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GeneratedImage, GenerationType } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { processImage, ImageInput } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { virtualBackgrounds } from '../lib/backgrounds';

interface ImageEditorModalProps {
    image: GeneratedImage;
    onClose: () => void;
    onSave: (id: GenerationType, newSrc: string) => void;
}

type CropRatio = 'original' | '1:1' | '4:3' | '16:9' | '3:4';

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ image, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
    
    const [currentSrc, setCurrentSrc] = useState(image.src ?? '');
    const [rotation, setRotation] = useState(0);
    const [crop, setCrop] = useState<CropRatio>('original');
    const [isSaving, setIsSaving] = useState(false);

    // AI Tools State
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [blurAmount, setBlurAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentSrc) return;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = currentSrc;
        img.onload = () => {
            setImgElement(img);
            // Reset transforms when image source changes
            setRotation(0);
            setCrop('original');
        };
    }, [currentSrc]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !imgElement) return;

        const { naturalWidth: iw, naturalHeight: ih } = imgElement;
        
        const rotated = rotation % 180 !== 0;
        const baseWidth = rotated ? ih : iw;
        const baseHeight = rotated ? iw : ih;

        let cropWidth = baseWidth;
        let cropHeight = baseHeight;

        if (crop !== 'original') {
            const [w, h] = crop.split(':').map(Number);
            const targetRatio = w / h;
            const currentRatio = baseWidth / baseHeight;

            if (currentRatio > targetRatio) {
                cropWidth = baseHeight * targetRatio;
            } else {
                cropHeight = baseWidth / targetRatio;
            }
        }
        
        const MAX_DIM = 600;
        let scale = 1;
        
        if (cropWidth > MAX_DIM || cropHeight > MAX_DIM) {
            scale = Math.min(MAX_DIM / cropWidth, MAX_DIM / cropHeight);
        }
        
        canvas.width = cropWidth * scale;
        canvas.height = cropHeight * scale;
        
        const sourceCropX = (baseWidth - cropWidth) / 2;
        const sourceCropY = (baseHeight - cropHeight) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        
        ctx.drawImage(
            imgElement,
            rotated ? -ih / 2 : -iw / 2,
            rotated ? -iw / 2 : -ih / 2
        );
        ctx.restore();

    }, [imgElement, rotation, crop]);
    
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    const handleAiProcess = async (prompt: string, extraImages: ImageInput[] = []) => {
        if (!currentSrc) return;
        
        setIsProcessing(true);
        setProcessingError(null);

        try {
            const mimeType = currentSrc.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = currentSrc.split(',')[1];
            
            const imageInputs: ImageInput[] = [{ base64, mimeType }, ...extraImages];

            const newSrc = await processImage(prompt, imageInputs);
            
            setCurrentSrc(newSrc);
            return newSrc;
        } catch (error) {
            console.error('Failed to process image:', error);
            setProcessingError(error instanceof Error ? error.message : 'An unknown error occurred during AI processing.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleRefine = () => {
        if (!refinementPrompt) return;
        handleAiProcess(refinementPrompt).then(() => setRefinementPrompt(''));
    };

    const handleBlur = () => {
        if (blurAmount === 0) return;
        const prompt = `Apply a realistic, artistic background blur (bokeh effect) to this image with an intensity of approximately ${blurAmount}%. Keep the main subject and their outfit in sharp focus.`;
        handleAiProcess(prompt);
    };

    const handleBackgroundChange = (bg: { name: string; data: string; mime: string }) => {
        const prompt = "Take the main subject from the first image and realistically place them into the second image, which is the new background. Ensure the lighting, shadows, and perspective on the subject are adjusted to perfectly match the new scene, creating a photorealistic and seamless composition.";
        const bgImage: ImageInput = {
            base64: bg.data,
            mimeType: bg.mime,
        };
        handleAiProcess(prompt, [bgImage]);
    };

    const handleRotate = (degrees: number) => {
        setRotation(prev => (prev + degrees + 360) % 360);
    };

    const handleSave = () => {
        if (!imgElement) return;
        setIsSaving(true);
        onSave(image.id, currentSrc); // Save the current state of the image
        setIsSaving(false);
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            aria-labelledby="image-editor-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-6xl m-4 border border-zinc-700 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-zinc-700 flex-shrink-0">
                    <h2 id="image-editor-title" className="text-lg font-semibold text-white">Edit Image: {image.title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        aria-label="Close editor"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto">
                    <div className="md:col-span-2 flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden p-2 min-h-[400px]">
                        {isProcessing ? (
                             <div className="flex flex-col items-center justify-center h-full">
                                <SpinnerIcon className="w-10 h-10 text-indigo-400" />
                                <p className="mt-2 text-sm text-zinc-400">AI is processing...</p>
                            </div>
                        ) : (
                            <canvas ref={canvasRef} />
                        )}
                    </div>
                    <div className="space-y-4">
                         {processingError && <p className="text-xs text-red-400 p-2 bg-red-900/50 rounded-md">{processingError}</p>}
                        
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Refine with AI</h3>
                            <textarea
                                rows={3}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 text-sm"
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder="e.g., Make the smile more pronounced..."
                                aria-label="Refinement prompt"
                                disabled={isProcessing}
                            />
                            <button onClick={handleRefine} disabled={isProcessing || !refinementPrompt} className="w-full mt-2 btn-secondary">
                                Refine Image
                            </button>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Background Blur (Bokeh)</h3>
                             <input
                                type="range"
                                min="0"
                                max="100"
                                value={blurAmount}
                                onChange={(e) => setBlurAmount(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                disabled={isProcessing}
                            />
                             <button onClick={handleBlur} disabled={isProcessing || blurAmount === 0} className="w-full mt-2 btn-secondary">
                                Apply Blur
                            </button>
                        </div>

                         <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Virtual Backgrounds</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {virtualBackgrounds.map(bg => (
                                    <button 
                                        key={bg.name} 
                                        onClick={() => handleBackgroundChange(bg)}
                                        className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                        disabled={isProcessing}
                                        aria-label={`Change background to ${bg.name}`}
                                    >
                                        <img src={`data:${bg.mime};base64,${bg.data}`} alt={bg.name} className="w-full h-full object-cover"/>
                                    </button>
                                ))}
                            </div>
                        </div>

                         <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Transform</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleRotate(-90)} className="btn-secondary">Rotate Left</button>
                                <button onClick={() => handleRotate(90)} className="btn-secondary">Rotate Right</button>
                                {(['original', '1:1', '4:3', '16:9', '3:4'] as CropRatio[]).map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setCrop(c)} 
                                        className={`btn-secondary ${crop === c ? 'bg-indigo-600 text-white' : ''}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t border-zinc-700 space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving || isProcessing} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
                        {isSaving ? 'Saving...' : 'Save & Close'}
                    </button>
                </div>
            </div>
            <style>{`
                .btn-secondary {
                    padding: 0.5rem 1rem;
                    background-color: #3f3f46; /* zinc-700 */
                    color: #d4d4d8; /* zinc-300 */
                    font-weight: 600;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                    text-align: center;
                }
                .btn-secondary:hover:not(:disabled) {
                    background-color: #52525b; /* zinc-600 */
                }
                 .btn-secondary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ImageEditorModal;
