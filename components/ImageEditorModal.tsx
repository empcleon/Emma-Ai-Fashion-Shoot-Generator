import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GeneratedImage, GenerationType } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { generateImage, ImageInput } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';

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
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [refineError, setRefineError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentSrc) return;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = currentSrc;
        img.onload = () => setImgElement(img);
    }, [currentSrc]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !imgElement) return;

        const { naturalWidth: iw, naturalHeight: ih } = imgElement;
        
        const rotated = rotation % 180 !== 0;
        const canvasWidth = rotated ? ih : iw;
        const canvasHeight = rotated ? iw : ih;
        
        const MAX_DIM = 600;
        const scale = Math.min(MAX_DIM / canvasWidth, MAX_DIM / canvasHeight, 1);
        
        canvas.width = canvasWidth * scale;
        canvas.height = canvasHeight * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(scale, scale);
        ctx.drawImage(imgElement, -iw / 2, -ih / 2);
        ctx.restore();

    }, [imgElement, rotation]);
    
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);
    
    const handleRefine = async () => {
        if (!refinementPrompt || !currentSrc) return;
        
        setIsRefining(true);
        setRefineError(null);

        try {
            const mimeType = currentSrc.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = currentSrc.split(',')[1];
            
            const imageInput: ImageInput = { base64, mimeType };

            const newSrc = await generateImage(refinementPrompt, [imageInput]);
            
            setCurrentSrc(newSrc);
            setRefinementPrompt('');
        } catch (error) {
            console.error('Failed to refine image:', error);
            setRefineError(error instanceof Error ? error.message : 'An unknown error occurred during refinement.');
        } finally {
            setIsRefining(false);
        }
    };

    const handleRotate = (degrees: number) => {
        setRotation(prev => (prev + degrees + 360) % 360);
    };

    const handleSave = () => {
        if (!imgElement) return;
        setIsSaving(true);
        
        // Use a new canvas for saving to preserve original quality
        const saveCanvas = document.createElement('canvas');
        const ctx = saveCanvas.getContext('2d');
        if (!ctx) return;
        
        const { naturalWidth: iw, naturalHeight: ih } = imgElement;
        const rotated = rotation % 180 !== 0;
        let cropWidth = rotated ? ih : iw;
        let cropHeight = rotated ? iw : ih;

        if (crop !== 'original') {
            const [w, h] = crop.split(':').map(Number);
            const originalRatio = cropWidth / cropHeight;
            const targetRatio = w / h;
            if (originalRatio > targetRatio) {
                cropWidth = cropHeight * targetRatio;
            } else {
                cropHeight = cropWidth / targetRatio;
            }
        }
        
        saveCanvas.width = cropWidth;
        saveCanvas.height = cropHeight;

        ctx.save();
        ctx.translate(saveCanvas.width / 2, saveCanvas.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(
            imgElement, 
            -iw / 2, -ih / 2
        );
        ctx.restore();

        const dataUrl = saveCanvas.toDataURL('image/png');
        onSave(image.id, dataUrl);
        setIsSaving(false);
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            aria-labelledby="image-editor-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl m-4 border border-zinc-700">
                <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                    <h2 id="image-editor-title" className="text-lg font-semibold text-white">Edit Image: {image.title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        aria-label="Close editor"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                    <div className="md:col-span-2 flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden p-2 min-h-[300px]">
                        <canvas ref={canvasRef} />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Refine with AI</h3>
                            <textarea
                                rows={4}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm"
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder="e.g., Make the smile more pronounced, add subtle eyeliner, and increase the clarity by 15%."
                                aria-label="Refinement prompt"
                                disabled={isRefining}
                            />
                            <button 
                                onClick={handleRefine}
                                disabled={isRefining || !refinementPrompt}
                                className="w-full mt-2 btn-secondary bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isRefining ? <><SpinnerIcon className="w-5 h-5 mr-2"/> Refining...</> : 'Refine Image'}
                            </button>
                            {refineError && <p className="text-xs text-red-400 mt-2">{refineError}</p>}
                        </div>
                         <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Rotate</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleRotate(-90)} className="btn-secondary">Rotate Left</button>
                                <button onClick={() => handleRotate(90)} className="btn-secondary">Rotate Right</button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Crop</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {(['original', '1:1', '4:3', '16:9', '3:4'] as CropRatio[]).map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setCrop(c)} 
                                        className={`btn-secondary ${crop === c ? 'bg-indigo-600 text-white' : ''}`}
                                    >
                                        {c.charAt(0).toUpperCase() + c.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">Applies a centered crop. Save to see result.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t border-zinc-700 space-x-3">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
                        {isSaving ? 'Saving...' : 'Save'}
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
                    transition: background-color 0.2s;
                }
                .btn-secondary:hover {
                    background-color: #52525b; /* zinc-600 */
                }
            `}</style>
        </div>
    );
};

export default ImageEditorModal;