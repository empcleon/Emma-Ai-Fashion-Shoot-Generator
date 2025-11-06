
import React, { useCallback } from 'react';
import type { GeneratedImage } from '../types';
import { GenerationTypeEnum } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { RedoIcon } from './icons/RedoIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface GeneratedImageCardProps extends GeneratedImage {
    onEdit: () => void;
    onRegenerate: () => void;
    onGenerate: () => void;
    onSuggestAccessories: () => void;
    isGenerationPossible: boolean;
}

const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ id, title, src, status, onEdit, onRegenerate, onGenerate, onSuggestAccessories, isGenerationPossible }) => {

    const handleDownload = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!src) return;

        const link = document.createElement('a');
        link.href = src;
        const filename = `${title.replace(/\s+/g, '_').toLowerCase()}.png`;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [src, title]);

    const handleAction = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };


    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <SpinnerIcon className="w-10 h-10 text-indigo-400" />
                        <p className="mt-2 text-sm text-zinc-400">Generando...</p>
                    </div>
                );
            case 'done':
                return (
                     <button 
                        onClick={onEdit} 
                        className="w-full h-full block cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-indigo-500 rounded-xl"
                        aria-label={`Edit ${title}`}
                    >
                        <img
                            src={src ?? ''}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                        />
                    </button>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-red-400">Error al generar</p>
                        <button 
                            onClick={(e) => handleAction(e, onGenerate)} 
                            disabled={!isGenerationPossible}
                            className="mt-2 px-3 py-1 text-xs bg-zinc-600 hover:bg-zinc-500 text-white rounded-md transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed"
                        >
                            Reintentar
                        </button>
                    </div>
                );
            case 'pending':
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        </svg>
                        <p className="mt-2 text-sm text-zinc-500">Esperando generación</p>
                        <button 
                            onClick={(e) => handleAction(e, onGenerate)} 
                            disabled={!isGenerationPossible}
                            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-md transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                           Generar
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="aspect-w-3 aspect-h-4 group">
            <div className="w-full h-full bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 shadow-lg">
                <div className="relative w-full h-full">
                    {renderContent()}
                    {status === 'done' && src && (
                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                             {id === GenerationTypeEnum.FULL_BODY && (
                                <button
                                    onClick={(e) => handleAction(e, onSuggestAccessories)}
                                    className="p-2 bg-black/60 rounded-full text-white backdrop-blur-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-all duration-200"
                                    aria-label="Suggest Accessories"
                                    title="Sugerir Complementos"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handleDownload}
                                className="p-2 bg-black/60 rounded-full text-white backdrop-blur-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-all duration-200"
                                aria-label={`Download ${title}`}
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                             <button
                                onClick={(e) => handleAction(e, onRegenerate)}
                                disabled={!isGenerationPossible}
                                className="p-2 bg-black/60 rounded-full text-white backdrop-blur-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Regenerate ${title}`}
                            >
                                <RedoIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <h3 className="mt-3 text-md font-medium text-zinc-200 text-center">{title}</h3>
        </div>
    );
};

export default GeneratedImageCard;
