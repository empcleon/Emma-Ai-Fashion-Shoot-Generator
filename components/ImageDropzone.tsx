import React, { useState, useCallback } from 'react';
import type { UploadedFile } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { PhotoIcon } from './icons/PhotoIcon';

interface ImageDropzoneProps {
    id: string;
    title: string;
    onFileChange: (file: UploadedFile | null) => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ id, title, onFileChange }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleFile = useCallback(async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            const base64 = await fileToBase64(file);
            onFileChange({ file, preview: previewUrl, base64, mimeType: file.type });
        } else {
            setPreview(null);
            onFileChange(null);
        }
    }, [onFileChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file || null);
    }, [handleFile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        handleFile(file || null);
    };

    const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    return (
        <div>
            <p className="block text-sm font-medium text-zinc-300 mb-2">{title}</p>
            <label
                htmlFor={id}
                onDrop={handleDrop}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                className={`relative group flex justify-center items-center w-full h-64 rounded-xl border-2 border-dashed border-zinc-600 hover:border-indigo-500 transition-all duration-300 cursor-pointer ${isDragging ? 'border-indigo-500 bg-zinc-700' : 'bg-zinc-800'}`}
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                    <div className="text-center text-zinc-400 p-4 pointer-events-none">
                        <PhotoIcon className="mx-auto h-12 w-12 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                        <p className="mt-2">
                            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-zinc-500">PNG, JPG, WEBP</p>
                    </div>
                )}
                <input
                    id={id}
                    name={id}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleChange}
                />
            </label>
        </div>
    );
};

export default ImageDropzone;