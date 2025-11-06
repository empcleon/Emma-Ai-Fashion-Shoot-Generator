
import React, { useState, useCallback } from 'react';
import type { UploadedFile } from '../types';
import { fileToBase64, resizeAndEncodeImage } from '../utils/fileUtils';
import { PhotoIcon } from './icons/PhotoIcon';
import { CloseIcon } from './icons/CloseIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ImageDropzoneProps {
    id: string;
    title: string;
    onFileChange: (file: UploadedFile | null) => void;
    currentFile: UploadedFile | null;
    onRemoveSlot?: () => void;
    showRemoveSlotButton?: boolean;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ id, title, onFileChange, currentFile, onRemoveSlot, showRemoveSlotButton }) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleFile = useCallback(async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const { preview, base64, mimeType } = await resizeAndEncodeImage(file);
                onFileChange({ file, preview, base64, mimeType });
            } catch (error) {
                console.error("Error processing image, falling back to original:", error);
                try {
                    const previewUrl = URL.createObjectURL(file);
                    const base64 = await fileToBase64(file);
                    onFileChange({ file, preview: previewUrl, base64, mimeType: file.type });
                } catch (fallbackError) {
                    console.error("Error in fallback file processing:", fallbackError);
                    onFileChange(null);
                }
            }
        } else {
            onFileChange(null);
        }
    }, [onFileChange]);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        handleFile(file || null);
    };

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onFileChange(null);
    };

    const handleRemoveSlotClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onRemoveSlot?.();
    };


    const isAccessory = title.toLowerCase().includes('accessory');
    const titleClass = isAccessory ? "text-md font-medium mb-2 text-zinc-300" : "text-lg font-semibold mb-4 text-zinc-200 text-center";

    return (
        <div>
            <div className={`flex items-center justify-between ${isAccessory ? 'mb-2' : 'mb-4'}`}>
                <h2 className={titleClass}>{title}</h2>
                {showRemoveSlotButton && (
                    <button
                        onClick={handleRemoveSlotClick}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-full transition-colors"
                        aria-label="Remove accessory slot"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="aspect-w-3 aspect-h-4">
                <label
                    htmlFor={id}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative group w-full h-full rounded-xl border-2 border-dashed transition-colors duration-300 cursor-pointer flex items-center justify-center ${isDragging ? 'border-indigo-500 bg-zinc-700' : 'border-zinc-600 hover:border-zinc-500'}`}
                >
                    {currentFile ? (
                        <>
                            <img src={currentFile.preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-xl">
                                <span className="text-white font-semibold">Change</span>
                            </div>
                            <button
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white backdrop-blur-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-all duration-200 z-10"
                                aria-label="Remove image"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center text-zinc-400 p-4 text-center"
                        >
                            <PhotoIcon className="w-12 h-12 mb-3" />
                            <span className="font-semibold">Drag & drop or click</span>
                            <span className="text-sm text-zinc-500 mt-1">PNG, JPG, WEBP</span>
                        </div>
                    )}
                    <input
                        type="file"
                        id={id}
                        name={id}
                        className="hidden"
                        onChange={handleInputChange}
                        accept="image/png, image/jpeg, image/webp"
                    />
                </label>
            </div>
        </div>
    );
};

export default ImageDropzone;
