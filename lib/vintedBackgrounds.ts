// This file contains base64 encoded virtual backgrounds to be used in the Vinted assistant.
// Using base64 strings makes the backgrounds self-contained within the application.

export interface VintedBackground {
    name: string;
    data: string; // base64 encoded image data
    mime: string; // e.g., 'image/jpeg'
}

export const vintedBackgrounds: VintedBackground[] = [
    {
        name: 'Vestidor Luminoso',
        mime: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAABAAAAAMgAQMAAADjpC33AAAABlBMVEW9vb3FxcV3a6AAAAAAAXRSTlMAQObYZgAAAIlJREFUeNrtwTEBAAAAwiD7p/ZZDG/gAAAAAAAAAAAAAAA+Bq4gEAAQ8BoIAADgNWAAgAABAwAIACBgAQAEBAwAIAADBgAQAEAAAwAIAAEBAwAIAAEAAAwAIAAAQMACAAAYAEAAAwAIACBgAQAEAAAwAIACBgAQAEBAwAIAAAQMACAAAYAEBAwAIAADgNWAAgAABAwAIACBgL24An7Ie670AAAAASUVORK5CYII=',
    },
    {
        name: 'Habitación Acogedora',
        mime: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAABAAAAAMgAQMAAADjpC33AAAABlBMVEXS0tLy8vJj73ygAAAAAXRSTlMAQObYZgAAAIlJREFUeNrtwTEBAAAAwiD7p/ZZDG/gAAAAAAAAAAAAAAA+Bq4gEAAQ8BoIAADgNWAAgAABAwAIACBgAQAEBAwAIAADBgAQAEAAAwAIAAEBAwAIAAEAAAwAIAAAQMACAAAYAEAAAwAIACBgAQAEAAAwAIACBgAQAEBAwAIAAAQMACAAAYAEBAwAIAADgNWAAgAABAwAIACBgL24An7Ie670AAAAASUVORK5CYII=',
    },
    {
        name: 'Pared con Textura',
        mime: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAABAAAAAMgAQMAAADjpC33AAAABlBMVEXa2trq6upI+yGtAAAAAXRSTlMAQObYZgAAAIlJREFUeNrtwTEBAAAAwiD7p/ZZDG/gAAAAAAAAAAAAAAA+Bq4gEAAQ8BoIAADgNWAAgAABAwAIACBgAQAEBAwAIAADBgAQAEAAAwAIAAEBAwAIAAEAAAwAIAAAQMACAAAYAEAAAwAIACBgAQAEAAAwAIACBgAQAEBAwAIAAAQMACAAAYAEBAwAIAADgNWAAgAABAwAIACBgL24An7Ie670AAAAASUVORK5CYII=',
    },
];