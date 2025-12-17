
const DB_NAME = 'EmmaFashionDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export interface StoredFile {
    buffer: ArrayBuffer;
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
    const buffer = await file.arrayBuffer();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const data: StoredFile = {
            buffer: buffer,
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

            try {
                // Handle new robust format (StoredFile with ArrayBuffer)
                if (result.buffer && result.name) {
                    const file = new File([result.buffer], result.name, { type: result.mimeType });
                    resolve(file);
                } 
                // Legacy support (Blob/File directly stored)
                else if (result instanceof Blob || result instanceof File) {
                    const file = new File([result], "default-model.png", { type: result.type || 'image/png' });
                    resolve(file);
                }
                // Legacy support (blob property)
                else if (result.blob) {
                     const file = new File([result.blob], result.name || "default-model.png", { type: result.mimeType || 'image/png' });
                     resolve(file);
                }
                else {
                    resolve(null);
                }
            } catch (e) {
                console.error("Error reconstructing file from DB:", e);
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
