import { clasificarLargoVestido } from './clasificadorLargos';
import { parseCm } from './parsingUtils';
// Fix: `ImageInput` is not exported from `geminiService`. It should be imported from `../types`.
import { processImage } from '../services/geminiService';
import type { ModelMeasurements, ImageInput } from '../types';

// The Y position on the generated mannequin where the garment should start (e.g., shoulders).
// 12% from the top is a good estimate for a headless mannequin.
const GARMENT_START_Y_PERCENT = 0.12;

export async function generarFotoConSilueta(
    modelMeasurements: ModelMeasurements,
    garmentImageSrc: string,
    garmentLengthCmStr: string
): Promise<string> {
    const modelHeightCm = parseCm(modelMeasurements.height);
    const garmentLengthCm = parseCm(garmentLengthCmStr);

    if (!modelHeightCm || !garmentImageSrc || !garmentLengthCm) {
        throw new Error("Datos insuficientes: se requiere altura, imagen de prenda y largo de prenda.");
    }
    
    // --- Step 1: Generate a custom mannequin with AI ---
    const characteristics = [
        `Height: ${modelMeasurements.height}cm`,
        `Weight: ${modelMeasurements.weight}kg`,
        `Bust: ${modelMeasurements.bust}cm`,
        `Waist: ${modelMeasurements.waist}cm`,
        `Hips: ${modelMeasurements.hips}cm`
    ].filter(Boolean).join(', ');

    const prompt = `TECHNICAL MANNEQUIN GENERATION FOR GARMENT OVERLAY:
Generate a high-quality, anonymous fashion mannequin for a technical product display. This mannequin will be used as a base for a programmatic image overlay, so consistency is critical.

**Mannequin Specification:**
- **Pose:** The mannequin must be in a STRICTLY neutral, symmetrical, forward-facing museum pose. The arms should be straight down at the sides, not touching the body. The feet should be together.
- **CRUCIAL:** Absolutely no rotation, tilting, or leaning of the head, shoulders, or hips. The figure must be perfectly vertical and centered.
- **Appearance:** The mannequin must be headless (cropped smoothly at the neck). It should have a smooth, matte grey finish, avoiding any reflections or highlights that could interfere with the overlay.

**Anatomy & Proportions:**
- The mannequin's form and silhouette must be based on these exact proportions: ${characteristics}.
- The goal is a realistic but clearly artificial figure suitable for a precise technical overlay.

**Environment & Lighting:**
- **CRUCIAL:** The lighting must be perfectly flat, even, shadowless studio lighting, as if from a ring flash or a completely diffuse light source. There should be NO directional shadows on the body or on the background.
- The background must be a seamless, clean, minimalist, solid light grey color (#f0f0f0).

**Output Format:**
- The final image must be a full-body shot, ensuring the feet are visible at the bottom of the frame. Any cropping will disrupt the scaling calculations.
`;
    
    const mannequinSrc = await processImage(prompt, []);

    // --- Step 2: Composite the images with mathematical scaling ---
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("No se pudo obtener el contexto del canvas.");

    // Load images
    const [mannequinImg, garmentImg] = await Promise.all([
        loadImage(mannequinSrc),
        loadImage(garmentImageSrc),
    ]);

    // Set canvas to mannequin dimensions
    canvas.width = mannequinImg.width;
    canvas.height = mannequinImg.height;
    
    // Calculate scaling based on the AI-generated mannequin
    const pixelsPerCm = (canvas.height / modelHeightCm);

    // Draw mannequin
    ctx.drawImage(mannequinImg, 0, 0, canvas.width, canvas.height);

    // Scale and draw garment
    const scaledGarmentHeight = garmentLengthCm * pixelsPerCm;
    const garmentAspectRatio = garmentImg.width / garmentImg.height;
    const scaledGarmentWidth = scaledGarmentHeight * garmentAspectRatio;

    const garmentX = (canvas.width - scaledGarmentWidth) / 2;
    const garmentY = canvas.height * GARMENT_START_Y_PERCENT;

    ctx.drawImage(garmentImg, garmentX, garmentY, scaledGarmentWidth, scaledGarmentHeight);
    
    // Draw text overlay
    const classification = clasificarLargoVestido(garmentLengthCm);
    const text1 = `${garmentLengthCm} cm`;
    const text2 = `${classification.info.nombre}`;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const textInfoBoxY = canvas.height - 70;
    const textInfoBoxHeight = 60;
    
    // Create a rounded rectangle for the info box
    const cornerRadius = 10;
    const boxX = 10;
    const boxWidth = 180;
    ctx.beginPath();
    ctx.moveTo(boxX + cornerRadius, textInfoBoxY);
    ctx.lineTo(boxX + boxWidth - cornerRadius, textInfoBoxY);
    ctx.quadraticCurveTo(boxX + boxWidth, textInfoBoxY, boxX + boxWidth, textInfoBoxY + cornerRadius);
    ctx.lineTo(boxX + boxWidth, textInfoBoxY + textInfoBoxHeight - cornerRadius);
    ctx.quadraticCurveTo(boxX + boxWidth, textInfoBoxY + textInfoBoxHeight, boxX + boxWidth - cornerRadius, textInfoBoxY + textInfoBoxHeight);
    ctx.lineTo(boxX + cornerRadius, textInfoBoxY + textInfoBoxHeight);
    ctx.quadraticCurveTo(boxX, textInfoBoxY + textInfoBoxHeight, boxX, textInfoBoxY + textInfoBoxHeight - cornerRadius);
    ctx.lineTo(boxX, textInfoBoxY + cornerRadius);
    ctx.quadraticCurveTo(boxX, textInfoBoxY, boxX + cornerRadius, textInfoBoxY);
    ctx.closePath();
    ctx.fill();


    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(text1, 20, textInfoBoxY + 30);
    
    ctx.font = '18px sans-serif';
    ctx.fillText(text2, 20, textInfoBoxY + 52);

    return canvas.toDataURL('image/jpeg', 0.9);
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
}
