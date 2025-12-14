
const DB_NAME = 'EmmaFashionDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export interface StoredFile {
    blob: Blob;
    name: string;
    mimeType: string;
}

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const saveDefaultModel = async (file: File): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Store as a structured object to preserve metadata
        const data: StoredFile = {
            blob: file, // File inherits from Blob
            name: file.name,
            mimeType: file.type
        };

        const request = store.put(data, 'defaultModel');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getDefaultModel = async (): Promise<File | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('defaultModel');
        
        request.onsuccess = () => {
            const result = request.result;
            if (!result) {
                resolve(null);
                return;
            }

            // Handle legacy format (raw Blob/File) or new format (StoredFile object)
            if (result instanceof Blob || result instanceof File) {
                // Legacy support
                const file = new File([result], "default-model.png", { type: result.type || 'image/png' });
                resolve(file);
            } else if (result.blob && result.name) {
                // New robust format
                const file = new File([result.blob], result.name, { type: result.mimeType });
                resolve(file);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const clearDefaultModel = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete('defaultModel');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
