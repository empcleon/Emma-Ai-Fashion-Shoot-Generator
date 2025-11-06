
import React, { useState, useRef } from 'react';
import type { ClosetItem } from '../types';
import { ClosetCategoryEnum } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface VirtualClosetProps {
    items: ClosetItem[];
    onSelect: (item: ClosetItem) => void;
    onRemove: (itemId: string) => void;
    onAddOutfit: (file: File) => Promise<void>;
}

const categoryDisplayNames: Record<ClosetCategoryEnum, string> = {
    [ClosetCategoryEnum.TOP]: 'Tops',
    [ClosetCategoryEnum.BOTTOM]: 'Bottoms',
    [ClosetCategoryEnum.DRESS]: 'Dresses',
    [ClosetCategoryEnum.OUTERWEAR]: 'Outerwear',
    [ClosetCategoryEnum.ACCESSORY]: 'Accessories',
    [ClosetCategoryEnum.SHOES]: 'Shoes',
};

const VirtualCloset: React.FC<VirtualClosetProps> = ({ items, onSelect, onRemove, onAddOutfit }) => {
    const [activeCategory, setActiveCategory] = useState<'ALL' | ClosetCategoryEnum>('ALL');
    const [isAdding, setIsAdding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsAdding(true);
            try {
                await onAddOutfit(file);
            } catch (e) {
                console.error("Failed to add outfit from closet component");
            } finally {
                setIsAdding(false);
                if (event.target) {
                    event.target.value = '';
                }
            }
        }
    };

    const handleRemove = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        onRemove(itemId);
    };

    const filteredItems = activeCategory === 'ALL' ? items : items.filter(item => item.category === activeCategory);
    const hiddenFileInput = <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />;

    if (items.length === 0) {
        return (
            <div className="mt-8 border-t border-zinc-700 pt-8 text-center">
                {hiddenFileInput}
                <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">
                    Your Virtual Closet
                </h3>
                <p className="text-zinc-500 mb-4">Your closet is empty. Add your first outfit to get started!</p>
                <button 
                    onClick={handleAddClick} 
                    disabled={isAdding}
                    className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-zinc-600 transition-colors"
                >
                    {isAdding ? (
                        <>
                            <SpinnerIcon className="w-5 h-5 mr-2" />
                            Adding...
                        </>
                    ) : (
                        'Add Outfit'
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 border-t border-zinc-700 pt-8">
            {hiddenFileInput}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">
                    Your Virtual Closet
                </h3>
                <button 
                    onClick={handleAddClick}
                    disabled={isAdding}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                     {isAdding ? (
                        <>
                            <SpinnerIcon className="w-4 h-4 mr-2" />
                            Adding...
                        </>
                    ) : (
                        '+ Add Outfit'
                    )}
                </button>
            </div>


            <div className="flex justify-center flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                        activeCategory === 'ALL'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                    }`}
                >
                    All ({items.length})
                </button>
                {Object.values(ClosetCategoryEnum).map((category) => {
                    const count = items.filter(item => item.category === category).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                activeCategory === category
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                            }`}
                        >
                            {categoryDisplayNames[category]} ({count})
                        </button>
                    )
                })}
            </div>

            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="group relative aspect-w-1 aspect-h-1 bg-zinc-700 rounded-lg cursor-pointer overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all duration-200"
                            title={`Select this ${item.category.toLowerCase()}`}
                        >
                            <img
                                src={item.src}
                                alt={item.category}
                                className="w-full h-full object-contain p-1"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                <span className="text-white text-xs font-bold">Select</span>
                            </div>
                            <button
                                onClick={(e) => handleRemove(e, item.id)}
                                className="absolute top-1 right-1 z-10 p-1.5 bg-black/50 rounded-full text-white/70 hover:text-white hover:bg-red-600/80 transition-all opacity-0 group-hover:opacity-100"
                                aria-label={`Remove this ${item.category.toLowerCase()}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-zinc-500">No items in this category.</p>
            )}
        </div>
    );
};

export default VirtualCloset;
