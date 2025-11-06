

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // The result is a data URL: "data:image/png;base64,iVBORw0KGgo..."
                // We need to strip the prefix to get only the base64 part.
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error('Failed to read file as base64 string.'));
            }
        };
        reader.onerror = error => reject(error);
    });
};

const MAX_IMAGE_DIMENSION = 1024;

export const resizeAndEncodeImage = (file: File): Promise<{ preview: string; base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    if (width > height) {
                        height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
                        width = MAX_IMAGE_DIMENSION;
                    } else {
                        width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
                        height = MAX_IMAGE_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL(file.type, 0.9); // Use original mimeType, 90% quality for JPEGs
                const base64 = dataUrl.split(',')[1];
                resolve({ preview: dataUrl, base64, mimeType: file.type });
            };
            img.onerror = (error) => reject(new Error(`Image load error: ${error}`));
        };
        reader.onerror = (error) => reject(new Error(`File reader error: ${error}`));
    });
};

export const resizeDataUrl = (dataUrl: string, maxDimension: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);

            // Use WebP for better compression, especially with transparency.
            try {
                const webpDataUrl = canvas.toDataURL('image/webp', 0.85); // 85% quality
                resolve(webpDataUrl);
            } catch (e) {
                 console.warn("WebP conversion failed, falling back to PNG.");
                 const pngDataUrl = canvas.toDataURL('image/png');
                 resolve(pngDataUrl);
            }
        };
        img.onerror = (error) => reject(new Error(`Image load error for resizing data URL: ${error}`));
    });
};

export const cropImage = async (imageSrc: string, cropPercentage: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const cropHeightPixels = Math.floor(img.height * (cropPercentage / 100));
            
            canvas.width = img.width;
            canvas.height = img.height - cropHeightPixels;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            // Draw the image, skipping the top `cropHeightPixels`
            ctx.drawImage(img, 0, cropHeightPixels, img.width, canvas.height, 0, 0, canvas.width, canvas.height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = (error) => reject(new Error(`Image load error for cropping: ${error}`));
    });
};