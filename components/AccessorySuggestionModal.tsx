import React from 'react';
import type { AccessorySuggestion } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface AccessorySuggestionModalProps {
    isOpen: boolean;
    isLoading: boolean;
    suggestions: AccessorySuggestion[] | null;
    onClose: () => void;
    onSelectAccessory: (imageSrc: string) => void;
}

const AccessorySuggestionModal: React.FC<AccessorySuggestionModalProps> = ({ isOpen, isLoading, suggestions, onClose, onSelectAccessory }) => {
    if (!isOpen) return null;

    const orderedSuggestions = suggestions
        ? [...suggestions].sort((a, b) => {
            const order = { shoes: 1, handbag: 2, jewelry: 3 };
            return (order[a.type] || 99) - (order[b.type] || 99);
        })
        : [];

    const typeToTitle: Record<AccessorySuggestion['type'], string> = {
        shoes: 'Zapatos Sugeridos',
        handbag: 'Bolso Sugerido',
        jewelry: 'Joyería Sugerida',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            aria-labelledby="accessory-suggestion-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl m-4 border border-zinc-700 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-zinc-700 flex-shrink-0">
                    <h2 id="accessory-suggestion-title" className="text-lg font-semibold text-white">Sugerencias de Complementos AI</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        aria-label="Cerrar sugerencias"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {isLoading && !suggestions ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                            <SpinnerIcon className="w-12 h-12 text-indigo-400" />
                            <p className="mt-4 text-zinc-300">La estilista AI está buscando los complementos perfectos...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {orderedSuggestions.map(item => (
                                <div key={item.type} className="bg-zinc-900 p-4 rounded-lg flex flex-col">
                                    <h3 className="font-semibold text-zinc-200 mb-3 text-center">{typeToTitle[item.type]}</h3>
                                    <div className="aspect-w-1 aspect-h-1 bg-zinc-800 rounded-md overflow-hidden mb-3">
                                        <img src={item.imageSrc} alt={item.type} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed flex-grow">{item.description}</p>
                                    <button
                                        onClick={() => onSelectAccessory(item.imageSrc)}
                                        className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-indigo-500 transition-all duration-200"
                                    >
                                        Usar este accesorio
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-4 border-t border-zinc-700 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessorySuggestionModal;