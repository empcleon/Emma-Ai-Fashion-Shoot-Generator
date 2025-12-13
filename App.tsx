
import React, { useState, useCallback, useEffect } from 'react';
import type { GenerationType, UploadedFile, GeneratedImage, ClosetItem, ModelMeasurements, AccessorySuggestion, ImageInput } from './types';
import { GenerationTypeEnum, ClosetCategoryEnum, ClosetCategory } from './types';
import { generateImage, processImage, categorizeImage, getStyleAnalysis, getAccessorySuggestions } from './services/geminiService';
import { MANNEQUIN_3D_MODEL_URL } from './services/assetService';
import { generarFotoConSilueta } from './utils/siluetaEscalada';
import ImageDropzone from './components/ImageDropzone';
import GeneratedImageCard from './components/GeneratedImageCard';
import ImageEditorModal from './components/ImageEditorModal';
import VirtualCloset from './components/VirtualCloset';
import VintedAssistantModal from './components/VintedAssistantModal';
import AccessorySuggestionModal from './components/AccessorySuggestionModal';
import PromptEditor from './components/PromptEditor';
import ThreeDViewer from './components/ThreeDViewer';
import { resizeDataUrl, resizeAndEncodeImage } from './utils/fileUtils';
import { CloseIcon } from './components/icons/CloseIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { fullBodyPrompts } from './lib/prompts';
import { validatePrompt } from './lib/promptValidator';
import { vintedMasterFront, vintedMasterBack, vintedSpecialized } from './lib/vintedPrompts';
import { ASSISTANT_SYSTEM_INSTRUCTION } from './lib/assistantSystemInstruction';


const initialGeneratedImages: GeneratedImage[] = [
    {
        id: GenerationTypeEnum.PRODUCT_ENHANCER,
        title: 'High-Fidelity Product Enhancer',
        prompt: `PROFESSIONAL PRODUCT PHOTO ENHANCEMENT:

Task: Improve the quality of the provided garment image to look like a high-end e-commerce product shot.

STRICT RULES (DO NOT MODIFY THE GARMENT):
- DO NOT change the shape, cut, or design of the garment.
- DO NOT change the color, pattern, or print.
- DO NOT change the logos or text on the garment.
- PRESERVE all original details, stitching, and imperfections that define the item.

ENHANCEMENTS TO APPLY:
- Lighting: Apply soft, even studio lighting to remove harsh shadows and improve visibility.
- Clarity: Sharpen the texture and fabric details (upscale quality).
- Color Correction: Neutralize any color casts (like yellow indoor lighting) to show the true colors of the item.
- Background: Isolate the item on a clean, pure white or very light grey background if the original background is messy.

OUTPUT:
A crisp, high-resolution, photorealistic image of the EXACT same garment, just photographed better.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.VIRTUAL_TRY_ON,
        title: 'Virtual Try-On',
        prompt: `ULTRA-REALISTIC E-COMMERCE FULL-BODY PHOTOGRAPH

Use TWO image inputs:
- First image: reference of the real woman / model (this is the client).
- Second image: reference of the garment to be worn.

IDENTITY LOCK (PRIORITY – DO NOT CHANGE THE MODEL):
- The model MUST BE the exact same person from Input Image 1.
- Preserve her exact face, facial features, skin tone, hair color, hairline and overall appearance.
- Preserve her body type: height around 1.78m, tall, curvy, same proportions as in the first image.
- Do NOT invent a new model. Do NOT change age, ethnicity, body weight, or body proportions.
- If the AI is unsure, always stay as close as possible to the first image in face and body.

GARMENT FROM SECOND IMAGE:
- The model is wearing ONLY the garment shown in the SECOND input image.
- Keep the original design, color, length and style of the garment from the second image.
- Fit the garment naturally to the body from the first image, with realistic fabric behavior.
- Show natural draping and organic wrinkles at movement points (waist, elbows, hips).
- Fabric texture must be clearly visible with accurate material properties.
- The garment is the main focus of the image.

SKIN & REALISM:
- Skin should look like real human skin with natural texture and visible pores.
- Show subtle color variations, natural undertones and a believable complexion matching the first image.
- Include gentle highlights on forehead, nose and cheekbones, and small imperfections that make the skin feel authentic.
- The image must clearly look like a professional studio photograph, NOT a 3D render, cartoon or plastic mannequin.

POSE & COMPOSITION:
- Full body shot from head to toe, model centered in frame.
- Natural, elegant standing pose suitable for showcasing the garment’s silhouette.
- Slight weight shift for an authentic human posture.
- Arms positioned naturally to display the fit and style of the garment (do not hide important garment details).
- Calm, confident, approachable expression, looking towards the camera.

STUDIO BACKGROUND & ENVIRONMENT:
- Seamless, minimalist studio background.
- Solid light grey backdrop (#f0f0f0).
- Clean, professional e-commerce aesthetic with no distracting elements.

LIGHTING:
- Soft, diffused, professional studio lighting.
- Even illumination that avoids harsh shadows on face and body.
- Natural light falloff creating subtle depth around the model.
- Lighting should highlight the garment’s texture, seams and construction details.
- Overall color temperature around 5500K (neutral daylight).

IMAGE QUALITY:
- High resolution, sharp and clean.
- Realistic hair rendering with visible individual strands, matching hairstyle and color from the first image.
- Authentic fabric texture with a believable weave/knit.
- Neutral, true-to-life color grading suitable for a product catalog.
- Avoid over-smoothing, heavy airbrushing or unnatural digital artifacts.

NEGATIVE INSTRUCTIONS (WHAT TO AVOID):
- Do NOT change the model’s face shape, eyes, nose, mouth, or hairstyle compared to the first image.
- Do NOT change the model’s body proportions (keep her height and curves).
- Do NOT make the model look like a different person, 3D avatar, doll or cartoon.
- Do NOT alter the garment design from the second image (no fantasy changes to color, length, neckline, etc.).

SAFETY & CONTEXT:
- The scene is safe and neutral; the subject appears healthy and comfortable.
- The image is appropriate for a general audience and clearly focused on showing the garment for online shopping.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.FULL_BODY,
        title: 'Full Body Shot',
        prompt: fullBodyPrompts.front.ultra,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.FULL_BODY_BACK,
        title: 'Full Body Shot (Back)',
        prompt: fullBodyPrompts.back.ultra,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.POSE_VINTED_FRONT,
        title: 'Pose Vinted (Front)',
        prompt: vintedMasterFront,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.POSE_VINTED_BACK,
        title: 'Pose Vinted (Back)',
        prompt: vintedMasterBack,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.PLAYGROUND,
        title: 'Prompt Playground (Test Lab)',
        prompt: `Use this space to test new ideas.
[UPLOAD IMAGE 1 (YOU)]
[UPLOAD IMAGE 2 (DRESS)]

TASK: Experimental generation.

INSTRUCTIONS:
- Write your custom prompt here.
- The system will inject model identity and basic garment fitting instructions automatically if you use the 'modelBasedTypes' logic, otherwise describe everything manually.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.VINTED_HOME,
        title: 'Vinted Home (Anti-Ban)',
        prompt: `AUTHENTIC DAILY OUTFIT PHOTO (USER GENERATED STYLE):
Create a realistic fashion photograph of a person wearing the garment from the second image. It must look like a high-quality "Outfit of the Day" photo taken with a smartphone.

Context:
- Style: Casual lifestyle, authentic social media content.
- Pose: Standing naturally in a tidy living area.
- Vibe: Casual, authentic, approachable.

Garment:
- The person wears the garment from the second image.
- Fabric looks natural, with normal gravity and wrinkles. NOT perfectly ironed or stiff.

Location & Lighting:
- Setting: A tidy, bright living room or hallway with blurred details like a plant or door frame in the background.
- Background: A real home environment, NOT a studio.
- Lighting: Soft natural window light coming from one side.
- Shadows: Realistic cast shadows on the floor/wall.

Quality & Texture:
- Image aesthetics: High-end smartphone camera (iPhone/Pixel style).
- Skin: Natural texture.
- AVOID: Studio backdrops, pure white background #FFFFFF, professional retouching, or "catalog" poses.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.VINTED_MIRROR,
        title: 'Vinted: Mirror Selfie (Face Hidden)',
        prompt: `AMATEUR HOME FASHION PHOTO (MIRROR SELFIE STYLE):
Create a realistic, "at-home" fashion photograph of a person wearing the garment from the second image. It must look like a photo taken with a smartphone for a second-hand app like Vinted.

Context:
- Style: User-generated content, authentic resale listing.
- Pose: Standing naturally in front of a full-length mirror taking a selfie.
- **CRITICAL - FACE HIDDEN:** The model is holding the smartphone directly in front of her face to take the picture, covering the face (or the majority of it) to maintain anonymity. This is a classic "faceless seller" aesthetic.
- Vibe: Casual, "outfit of the day", authentic.

Garment:
- The person wears the garment from the second image.
- Fabric looks natural, with normal gravity and wrinkles. NOT perfectly ironed or stiff.

Location & Lighting (CRITICAL FOR ANTI-BAN):
- Setting: A tidy home interior (bedroom, hallway, or living room) with visible domestic details like baseboards, door frames, or wooden flooring.
- Background: NOT a studio. It must show depth of a real room.
- Lighting: Natural window light coming from one side.
- Shadows: MUST have cast shadows on the wall or floor. No floating models. No perfect softbox lighting.

Quality & Texture:
- Image aesthetics: High-end smartphone camera (iPhone/Pixel style). Sharp but natural contrast.
- Skin: Natural texture.
- AVOID: Studio backdrops, pure white background #FFFFFF, professional retouching, or "catalog" poses.

Safety:
- The setting is a standard living area or hallway. Safe and appropriate for general audiences.
- The subject is anonymous (face obscured by phone).`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.VINTED_MANNEQUIN,
        title: 'Vinted: Maniquí Costura (Anti-Ban)',
        prompt: `AMATEUR VINTED LISTING - SEWING MANNEQUIN SETUP

Create a realistic, "at-home" listing photo of the provided garment displayed on a sewing mannequin.

MANNEQUIN SPECIFICATIONS (EMMA™ STYLE):
- Type: Classic sewing torso (tailor's dummy), armless.
- Material: Beige or Ecru raw fabric/canvas with visible vertical seams.
- Base: Simple light wood or thin metal stand (Ikea style).
- Height: Realistic human height, not miniature.
- Condition: Looks used/real, not a pristine store display.

GARMENT PRESENTATION:
- The sewing mannequin is wearing the garment from the input image.
- Fit: Natural drape, gravity affects the fabric, wrinkles at the waist/hem. The garment should look "pinned" or naturally resting, NOT stiff or floating.
- Texture: Real fabric texture with mobile photo quality.

ENVIRONMENT (CRITICAL FOR ANTI-BAN):
- Setting: A corner of a real room against a white wall that is slightly imperfect (not pure #FFFFFF).
- Props: A minimal everyday object on the floor edge (e.g., a small cardboard box, a plant pot, or folded clothes) to establish scale and reality.
- Floor: Simple wooden parquet or terrazzo.
- Lighting: Natural daylight coming from a side window. Casts soft, imperfect shadows on the wall. NO perfect studio lighting.

PHOTOGRAPHY AESTHETICS:
- Camera: High-end smartphone camera quality.
- Imperfections: Slight lens distortion, soft digital noise, slight blur on the edges.
- Focus: Good focus on the dress, but not razor-sharp HDR.
- Color: Natural, slightly desaturated or warm. NO vivid filters or "premium" editing.
- Vibe: Authentic second-hand listing from a stylish seller.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.DETAIL,
        title: 'Garment Detail',
        prompt: "Create a detailed, macro-style product shot focusing on the garment in the provided image. The image should highlight the fabric's texture, weave, and stitching quality. The garment can be displayed on a generic, out-of-focus mannequin or as a flat lay to ensure the entire focus is on the material craftsmanship. Use professional, clean lighting.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.ACCESSORY_DETAIL,
        title: 'Accessory Detail',
        prompt: "Produce a high-resolution, close-up product photograph of the accessory shown in the image. The accessory should be the sole focus, displayed on a neutral, minimalist surface or held by a mannequin hand to show scale. The lighting must be professional to accentuate the material's texture and details.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.URBAN,
        title: 'City Lifestyle',
        prompt: `[UPLOAD IMAGE 1 (YOU)]
[UPLOAD IMAGE 2 (DRESS)]

TASK: High-Fidelity Virtual Try-On in an urban street-style editorial.

This is a PHOTO EDIT of Image 1, not a new character.

IDENTITY LOCK (VERY IMPORTANT):
- The woman must be the same person as in Image 1.
- Keep the exact face: same eyes, nose, lips, jawline, and skin tone.
- Keep the same body shape and proportions: tall (around 1.78m), curvy, not slimmed down.
- Do NOT generate a different model or change her ethnicity, age, or facial structure.

GARMENT TRANSFER:
- Replace the outfit in Image 1 with the dress from Image 2.
- Preserve the exact fabric, color, and style of the garment in Image 2.
- Fit the dress naturally to her real body with realistic fabric tension and folds.

URBAN EDITORIAL SCENE:
- Full-body shot in a city environment.
- She is standing on a sidewalk or near a pedestrian crosswalk, with blurred buildings and street elements in the background.
- Street-style / fashion editorial vibe.
- Natural, confident pose, weight slightly shifted to one leg.
- Expression: calm, self-assured, similar mood to Image 1.

LIGHTING & STYLE:
- Keep the facial lighting consistent with Image 1 so the face looks real.
- Add soft urban daylight (slightly overcast or diffused sunlight).
- Photorealistic image, high resolution, visible hair strands and fabric texture.
- No over-beautification or plastic skin.

OUTPUT GOAL:
It should look like the real person from Image 1 is doing a street-style fashion shoot in the city, wearing the dress from Image 2.
Identity must be preserved.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.RURAL,
        title: 'Weekend Getaway',
        prompt: `[UPLOAD IMAGE 1 (YOU)]
[UPLOAD IMAGE 2 (DRESS)]

TASK: High-Fidelity Virtual Try-On in an outdoor editorial scene.

You are NOT creating a new person. You are EDITING the existing person in Image 1.

CRITICAL IDENTITY CONSTRAINTS (MUST OBEY):
1. FACE LOCK:
   - Preserve the EXACT same face as in Image 1.
   - Same eyes, nose, lips, jawline, skin tone, and facial proportions.
   - Do NOT beautify, slim, or change the facial structure.
   - Do NOT generate a generic fashion model face.

2. BODY LOCK:
   - Keep the exact body shape, height and proportions of the woman in Image 1.
   - She is tall (around 1.78m) and curvy. Do NOT thin her down or change her body type.
   - The body volume, curves, and limb proportions must match Image 1.

GARMENT TRANSFER:
- Replace the original outfit in Image 1 with the dress from Image 2.
- Keep the exact color, material, and design of the dress from Image 2.
- Adapt the fit to her real body: natural stretching, realistic draping, slight wrinkles where the body bends.

EDITORIAL PARK SCENE:
- Keep the same person and approximate pose from Image 1.
- Place her in a soft, editorial park setting:
  - Green grass, soft-focus trees in the background.
  - Late afternoon light, warm and flattering (golden hour feeling).
- Full-body shot, head-to-toe, suitable for a fashion editorial.
- Natural, confident expression, looking either at the camera or slightly off-camera.

LIGHTING & STYLE:
- Respect the lighting direction and shadows from Image 1 as much as possible to keep the face realistic.
- Add gentle outdoor lighting consistent with a park at golden hour.
- Photorealistic photography style, not 3D, not illustration.
- Visible skin texture (pores, small imperfections), no plastic or over-smoothed skin.

OUTPUT GOAL:
It must look like the SAME WOMAN from Image 1 is standing in a park, wearing the dress from Image 2.
Do NOT change her identity. Only change the clothes and the background.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.ROOFTOP_EDITORIAL,
        title: 'Rooftop Sunset',
        prompt: `[UPLOAD IMAGE 1 (YOU)]
[UPLOAD IMAGE 2 (DRESS)]

TASK: High-Fidelity Virtual Try-On on a rooftop at sunset.

Use the person from Image 1 and only change her outfit and environment.

IDENTITY:
- Preserve the exact face and body from Image 1.
- Do not alter her facial structure, age, or body proportions.
- She remains tall and curvy, as in the reference.

GARMENT:
- Replace her outfit with the dress from Image 2.
- Accurate fabric, color and texture from Image 2.
- Realistic fit and drape over her body.

ROOFTOP EDITORIAL SCENE:
- Full-body shot on a rooftop with a soft sunset sky.
- Hints of a city skyline in the blurred background.
- Warm, golden hour lighting wrapping around her.
- Natural pose, one leg slightly bent, relaxed arms.
- Fashion editorial mood, but still realistic.

IMAGE STYLE:
- Photorealistic, high resolution.
- No cartoon, no 3D render.
- Realistic skin, hair, and fabric textures.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.CAFE_EDITORIAL,
        title: 'Café Terrace',
        prompt: `[UPLOAD IMAGE 1 (YOU)]
[UPLOAD IMAGE 2 (DRESS)]

TASK: Edit Image 1 so the subject is wearing the dress from Image 2, in a café terrace editorial.

IDENTITY:
- Same woman as Image 1.
- Same face, same body, no slimming, no facial redesign.

GARMENT:
- Apply the dress from Image 2 to her body.
- Keep exact color, cut, and material.

CAFÉ EDITORIAL SCENE:
- She is standing or leaning lightly against a café terrace table or railing.
- Background: blurred tables, chairs, maybe plants or a street.
- Soft daytime light, gentle shadows.
- Full or 3/4 body shot, clearly showing the garment.
- Relaxed, chic expression, suitable for a lifestyle fashion magazine.

STYLE:
- Photorealistic edit, not a new generated person.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.NIGHT_CITY_EDITORIAL,
        title: 'Night City Neon',
        prompt: `[UPLOAD IMAGE 1 (YOU)]
[UPLOAD IMAGE 2 (DRESS)]

TASK: Virtual Try-On in a night city editorial with neon lights.

IDENTITY:
- Same person as in Image 1, face and body unchanged.
- Do not beautify into a generic model.

GARMENT:
- Dress from Image 2 applied to her body.
- Accurate material, shine and color.

SCENE:
- Full-body shot on a city street at night.
- Neon lights and storefronts softly blurred in the background.
- Subtle reflections of neon colors on the fabric.
- Confident, powerful pose (bad bitch energy), but still natural.

STYLE:
- Photorealistic night photography.
- Visible fabric texture and skin detail.`,
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.MANGA_PAGE,
        title: 'Manga Page (B&W)',
        prompt: "Create a visually striking black and white Japanese manga page. The layout should feature 2-3 dynamic panels reading right-to-left. \n\n**CONTENT:**\n- Panel 1 (Main): A dynamic full-body action pose of a fictional manga character wearing the outfit from the second reference image.\n- Panel 2 (Detail): A dramatic close-up of the character's face showing determination or emotion.\n\n**STYLE:**\n- Authentic manga aesthetic: High-contrast black ink, screentones (ben-day dots) for shading, and speed lines.\n- The character should have stylized manga features (large expressive eyes, spiky/flowy hair) but the garment details must be recognizable. Ensure the character looks like a stylized illustration, not a real photo. Do not generate a photorealistic person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.COMIC_COVER,
        title: 'Comic Book Cover',
        prompt: "Generate a dynamic American comic book cover art.\n\n**SUBJECT:**\nAn illustration of a fictional superhero character wearing the provided garment, portrayed in an action pose.\n\n**STYLE:**\n- Modern Western comic style: Bold black outlines, vibrant saturated colors, heavy dramatic shadows.\n- Vertical cover layout with space at the top for a title.\n- Background: Abstract cityscape or dramatic action scene color field. Ensure the result is an illustration, not a photo. Do not generate a photorealistic person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.VINTAGE_COMIC,
        title: 'Vintage Comic (1950s)',
        prompt: "Create a vintage 1950s comic book panel art. \n\n**SUBJECT:**\nAn illustration of a fictional character wearing the provided garment.\n\n**STYLE:**\n- Retro aesthetic: Prominent Ben-Day dots (halftone), aged paper texture, offset printing look.\n- Colors: Muted, retro palette (cyan, magenta, yellow).\n- The character must be a stylized illustration, not a real person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.NOIR_COMIC,
        title: 'Noir Graphic Novel',
        prompt: "Create a dark, gritty Noir graphic novel panel.\n\n**SUBJECT:**\nAn illustration of a fictional character wearing the provided garment.\n\n**STYLE:**\n- High contrast Black & White.\n- Heavy, dramatic shadows (chiaroscuro) and stark lighting.\n- Sin City aesthetic.\n- The character must be a stylized illustration, not a real person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.BD_COMIC,
        title: 'Ligne Claire (BD)',
        prompt: "Create a Franco-Belgian 'Ligne Claire' (Clear Line) illustration.\n\n**SUBJECT:**\nAn illustration of a fictional character wearing the provided garment.\n\n**STYLE:**\n- Clean, uniform black outlines.\n- Flat, vibrant colors without gradients.\n- Detailed background.\n- Tintin/Moebius aesthetic.\n- The character must be a stylized illustration, not a real person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.ANIME_CHARACTER,
        title: 'Anime Character',
        prompt: "Create a vibrant Anime character illustration.\n\n**SUBJECT:**\nAn illustration of a fictional anime character wearing the provided garment.\n\n**STYLE:**\n- High-quality modern anime style.\n- Cel-shading, lush lighting, vibrant colors.\n- Stylized facial features.\n- The character must be a stylized illustration, not a real person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.POP_ART,
        title: 'Pop Art Illustration',
        prompt: "Create a Pop Art illustration.\n\n**SUBJECT:**\nAn artistic representation of a fictional character wearing the provided garment.\n\n**STYLE:**\n- Warhol/Lichtenstein aesthetic.\n- Bold black outlines.\n- Bright, saturated primary colors.\n- Dramatic dot patterns.\n- The character must be a stylized illustration, not a real person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
    {
        id: GenerationTypeEnum.FASHION_SKETCH,
        title: 'Fashion Sketch',
        prompt: "Generate a hand-drawn fashion illustration sketch of the model wearing the garment. Use loose charcoal lines and watercolor splashes. Emphasize the silhouette and movement of the fabric. The image must be a drawing, not a photo. The subject must be depicted as a stylized illustration, not a real person.",
        src: null,
        status: 'pending',
        chatHistory: []
    },
];


const aspectRatioOptions = [
    { id: '3:4', name: 'Portrait (3:4)' },
    { id: '1:1', name: 'Square (1:1)' },
    { id: '4:3', name: 'Standard (4:3)' },
    { id: '16:9', name: 'Landscape (16:9)' },
];

const modelFidelityOptions = {
    'inspired': { name: 'Maniquí Anónimo', promptInstruction: 'The subject must be an anonymous, high-quality fashion mannequin with a matte grey or white finish. It is CRITICAL to replicate the exact body shape, proportions, and pose from the first reference image. DO NOT use a human model or show a real face.' },
    'faithful': { name: 'Fiel (Comercial)', promptInstruction: `**MODEL REFERENCE:**
The goal is to create a consistent look for a fashion catalog.
- The model should share the same general physical characteristics (skin tone, hair color/style, body build, age range) as the person in the first reference image.
- **IMPORTANT:** Do not attempt to create a deepfake or exact facial clone. Generate a high-quality, photorealistic fashion model who looks very similar in "vibe" and features, suitable for a commercial usage.
- Ensure the result is a fictional person, not a real individual.` }
};


const promptQualityOptions: Record<'ultra' | 'fast', { name: string }> = {
    'ultra': { name: 'Máxima Calidad' },
    'fast': { name: 'Generación Rápida' },
};

const promptTemplates = {
    'default': { name: 'Default', modifier: '' },
    'vinted-style': { name: 'Vinted Style', modifier: '. Create a photorealistic fashion e-commerce photograph for a marketplace like Vinted. The subject is wearing the garment from the second input image. The person is standing in a natural, relaxed pose, facing the camera straight-on, with arms resting comfortably by their sides. The image is cropped from the upper chest/collarbone to the feet with a vertical orientation, similar to a mobile product photo. Use a seamless, light grey studio backdrop (#F5F5F5) with clean, even, soft studio lighting. The image should look like a real studio photograph, not a 3D render or illustration. Skin should look like real human skin with natural texture and visible pores.' },
    'manga': { name: 'Manga (B&W)', modifier: ' in a high-quality black and white Japanese manga style illustration. Use dramatic ink lines, intricate screentones (ben-day dots), and dynamic composition. The subject must be depicted as a stylized fictional character. Do not generate a photorealistic person.' },
    'anime': { name: 'Anime (Color)', modifier: ' in a vibrant, high-fidelity anime art style illustration. Use lush lighting, detailed backgrounds, and cel-shading. The subject must be depicted as a stylized anime character. Do not generate a photorealistic person.' },
    'comic': { name: 'Western Comic', modifier: ' in a modern Western comic book style illustration. Use bold black outlines, vibrant saturated colors, and dramatic heavy shadows. The subject must be depicted as a fictional comic book character. Do not generate a photorealistic person.' },
    'vintage-comic': { name: 'Vintage Comic', modifier: ' in a vintage 1950s comic book style illustration. Use prominent Ben-Day dots (halftone), aged paper texture, and a retro color palette. The subject must look like a fictional character from a classic comic. Do not generate a photorealistic person.' },
    'noir-comic': { name: 'Noir Graphic Novel', modifier: ' in a gritty Noir graphic novel style. Use high-contrast black and white with heavy, dramatic shadows (chiaroscuro) and white outlines. The subject must look like a stylized fictional character from a crime comic. Do not generate a photorealistic person.' },
    'bd': { name: 'Ligne Claire (BD)', modifier: ' in a Franco-Belgian "Ligne Claire" (clear line) style illustration. Use clean, uniform black outlines, flat non-gradient colors, and precise details. The subject must look like a fictional character from a European comic book. Do not generate a photorealistic person.' },
    'sketch': { name: 'Fashion Sketch', modifier: ' as a hand-drawn fashion illustration sketch. Use loose charcoal lines and watercolor splashes. Emphasize the silhouette and movement of the fabric. The image must be a drawing, not a photo.' },
    'pop-art': { name: 'Pop Art', modifier: ' in a vibrant, pop-art style with bold, saturated colors, graphic patterns, and a playful, energetic feel. The image must be an artistic illustration.' },
    'cinematic': { name: 'Cinematic', modifier: ' in a cinematic style with dramatic lighting, high contrast, and film grain.' },
    'vintage': { name: 'Vintage', modifier: ' as a vintage photograph with sepia tones, a nostalgic feel, and slight film grain, as if shot on 8mm film.' },
    'studio': { name: 'Studio Lighting', modifier: ' with professional studio lighting against a clean, minimalist background, emphasizing sharp focus and high-fashion aesthetics.' },
    'minimalist': { name: 'Minimalist', modifier: ' in a minimalist style with clean lines, a neutral color palette, and simple, uncluttered composition.' },
    'bohemian': { name: 'Bohemian', modifier: ' in a bohemian style with earthy tones, natural textures, flowing fabrics, and a relaxed, free-spirited atmosphere.' },
    'gothic': { name: 'Gothic', modifier: ' in a gothic style with dark, moody tones, dramatic shadows, and an atmosphere of mystery and romanticism, possibly in a historic or ornate setting.' },
    'surrealist': { name: 'Surrealist', modifier: ' in a surrealist style with dream-like landscapes, unexpected juxtapositions, and a highly imaginative atmosphere.' },
    'noir': { name: 'Noir', modifier: ' in a classic film noir style with high-contrast black and white, dramatic low-key lighting, and deep shadows.' },
    'edgy': { name: 'Edgy', modifier: ' in an edgy, high-contrast style with gritty urban textures, dynamic angles, and a rebellious mood.' },
    'futuristic': { name: 'Futuristic', modifier: ' in a futuristic, cyberpunk style with neon lights, a dark, rain-slicked city environment, and high-tech fashion elements.' },
    'romantic': { name: 'Romantic', modifier: ' in a romantic, ethereal style with soft, dreamy lighting, pastel colors, and a whimsical, fairytale-like atmosphere.' },
};

// --- START: Detailed Styling Options ---
const garmentLengthOptions = {
    'original': { name: 'Original', promptInstruction: '' },
    'micro': { name: 'Micro', promptInstruction: 'Please modify the main garment to be an extremely short, micro-length style that barely covers.' },
    'super-mini': { name: 'Super Mini', promptInstruction: 'Please modify the main garment to be a super-mini length, ending high on the thigh.' },
    'mini': { name: 'Mini', promptInstruction: 'Please modify the main garment to be a classic mini-length, ending at the mid-thigh.' },
    'rodilla': { name: 'A la Rodilla', promptInstruction: 'Please modify the main garment to be knee-length.' },
    'midi': { name: 'Midi', promptInstruction: 'Please modify the main garment to be a classic midi-length, ending at the mid-calf.' },
    'maxi': { name: 'Maxi', promptInstruction: 'Please modify the main garment to be a long, floor-length maxi style.' },
};

const garmentFitOptions = {
    'fitted': { name: 'Ajustado', promptInstruction: 'Please modify the garment to be very form-fitting and snug against the body.' },
    'regular': { name: 'Regular', promptInstruction: 'The garment should have a standard, regular fit.' },
    'loose': { name: 'Holgado', promptInstruction: 'Please modify the garment to have a loose, oversized, and relaxed fit.' },
};

const fixedAccessoryOptions = {
  'none': { name: 'None', promptInstruction: '' },
  'black-tights': { name: 'Black Tights', promptInstruction: 'The model is also wearing elegant, opaque black tights.' },
  'nude-tights': { name: 'Nude Tights', promptInstruction: 'The model is also wearing sheer nude (caramel color) tights.' },
  'fishnet-tights': { name: 'Fishnet Tights', promptInstruction: 'The model is also wearing stylish black fishnet tights.' },
};

const beltOptions = {
    'none': { name: 'None', promptInstruction: '' },
    'thin-black': { name: 'Thin Black', promptInstruction: 'Please add a thin, black leather belt to the outfit.' },
    'wide-brown': { name: 'Wide Brown', promptInstruction: 'Please add a wide, brown leather belt to the outfit.' },
    'gold-chain': { name: 'Gold Chain', promptInstruction: 'Please add a delicate gold chain belt to the outfit.' },
};
// --- END: Detailed Styling Options ---

const shoeSwapOptions = {
    'barefoot': { name: 'Barefoot', promptInstruction: 'barefoot' },
    'black-heels': { name: 'Black Heels', promptInstruction: 'elegant, classic black high-heels' },
    'white-sneakers': { name: 'White Sneakers', promptInstruction: 'clean, minimalist white sneakers' },
    'brown-boots': { name: 'Brown Boots', promptInstruction: 'stylish brown leather ankle boots' },
    'sandals': { name: 'Sandals', promptInstruction: 'simple, elegant flat sandals' },
};

const vintedTemplates = {
    'generic': { name: 'Genérico' },
    'dress': { name: 'Vestido' },
    'top': { name: 'Top/Blusa' },
    'pants': { name: 'Pantalón' },
    'jacket': { name: 'Chaqueta' },
};


/**
 * Extracts a JSON string from a text that might contain a markdown code block.
 * @param text The text to extract JSON from.
 * @returns The cleaned JSON string.
 */
const extractJson = (text: string): string => {
    // This regex looks for a ```json block and captures what's inside.
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonBlockRegex);

    // If a match is found, return the captured group, otherwise return the original text.
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return text.trim();
};


const App: React.FC = () => {
    const [modelImage, setModelImage] = useState<UploadedFile | null>(null);
    const [outfitImage, setOutfitImage] = useState<UploadedFile | null>(null);
    const [backOutfitImage, setBackOutfitImage] = useState<UploadedFile | null>(null);
    const [accessoryImages, setAccessoryImages] = useState<(UploadedFile | null)[]>([null]);
    const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(initialGeneratedImages);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('3:4');
    const [modelFidelity, setModelFidelity] = useState<string>('faithful');
    const [promptQuality, setPromptQuality] = useState<'ultra' | 'fast'>('ultra');
    const [activeStyle, setActiveStyle] = useState<string>('default');
    const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
    const [modelMeasurements, setModelMeasurements] = useState<ModelMeasurements>({
        height: '178',
        weight: '64',
        bust: '98',
        waist: '76',
        hips: '102',
        notes: ''
    });
    const [isAppLoaded, setIsAppLoaded] = useState(false);
    const [outfitCategory, setOutfitCategory] = useState<ClosetCategory | null>(null);

    // Phase 1 State: Personalized Mannequin
    const [personalMannequins, setPersonalMannequins] = useState<{ front: UploadedFile | null; back: UploadedFile | null }>({ front: null, back: null });
    const [isGeneratingMannequin, setIsGeneratingMannequin] = useState<boolean>(false);


    // Phase 2 State: 3D Viewer
    const [processedGarmentFor3D, setProcessedGarmentFor3D] = useState<string | null>(null);
    const [isProcessingFor3D, setIsProcessingFor3D] = useState<boolean>(false);

    // Phase 2 State: Custom prompts for editor
    const [customFullBodyPrompt, setCustomFullBodyPrompt] = useState(fullBodyPrompts.front.ultra);
    const [customFullBodyBackPrompt, setCustomFullBodyBackPrompt] = useState(fullBodyPrompts.back.ultra);
    const [customVirtualTryOnPrompt, setCustomVirtualTryOnPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.VIRTUAL_TRY_ON)?.prompt ?? '');
    const [customVintedFrontPrompt, setCustomVintedFrontPrompt] = useState(vintedMasterFront);
    const [customVintedBackPrompt, setCustomVintedBackPrompt] = useState(vintedMasterBack);
    
    const [customUrbanPrompt, setCustomUrbanPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.URBAN)?.prompt ?? '');
    const [customRuralPrompt, setCustomRuralPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.RURAL)?.prompt ?? '');
    
    // New Editorial Prompts State
    const [customRooftopPrompt, setCustomRooftopPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.ROOFTOP_EDITORIAL)?.prompt ?? '');
    const [customCafePrompt, setCustomCafePrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.CAFE_EDITORIAL)?.prompt ?? '');
    const [customNightPrompt, setCustomNightPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.NIGHT_CITY_EDITORIAL)?.prompt ?? '');

    // Vinted & Playground Prompts State
    const [customVintedHomePrompt, setCustomVintedHomePrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.VINTED_HOME)?.prompt ?? '');
    const [customVintedMirrorPrompt, setCustomVintedMirrorPrompt] = useState(initialGeneratedImages.find(img => img.id === GenerationTypeEnum.VINTED_MIRROR)?.prompt ?? '');
    const [customPlaygroundPrompt, setCustomPlaygroundPrompt] = useState('');

    const [finalFullBodyPrompt, setFinalFullBodyPrompt] = useState('');
    const [finalFullBodyBackPrompt, setFinalFullBodyBackPrompt] = useState('');
    const [activeVintedTemplate, setActiveVintedTemplate] = useState('generic');


    // --- START: Detailed Styling State ---
    const [garmentLength, setGarmentLength] = useState<string>('original');
    const [garmentFit, setGarmentFit] = useState<string>('regular');
    const [fixedAccessory, setFixedAccessory] = useState<string>('none');
    const [belt, setBelt] = useState<string>('none');
    // --- END: Detailed Styling State ---
    
    // State for Silhouette Generator
    const [garmentLengthCm, setGarmentLengthCm] = useState<string>('');
    
    // State for Vinted Assistant
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [styleAnalysisResult, setStyleAnalysisResult] = useState<string | null>(null);
    const [isVintedModalOpen, setIsVintedModalOpen] = useState<boolean>(false);

    // State for Accessory Suggestions
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [accessorySuggestions, setAccessorySuggestions] = useState<AccessorySuggestion[] | null>(null);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState<boolean>(false);

    // PWA Install Prompt State
    const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

    // State for new standalone analyzer
    const [analysisImage, setAnalysisImage] = useState<UploadedFile | null>(null);
    const [analysisQuestion, setAnalysisQuestion] = useState<string>('Describe el estilo de esta prenda en detalle. ¿Cuáles son las piezas clave? ¿Para qué tipo de evento sería adecuada? Sugiere un accesorio para completar el look.');
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);

    // State for Shoe Swap
    const [isSwappingShoes, setIsSwappingShoes] = useState<boolean>(false);

     const handleApiError = (err: unknown, defaultMessage: string = 'An unknown error occurred.') => {
        let errorMessage = err instanceof Error ? err.message : defaultMessage;
    
        // Check for our custom queue cancellation message first
        if (errorMessage.includes('API quota limit reached')) {
            setError('API quota limit reached. Further generations have been cancelled.');
            return;
        }
        
        // Attempt to parse JSON from Google's error response
        try {
            // Match a JSON object within the error string
            const jsonMatch = errorMessage.match(/{.+}/s);
            if (jsonMatch) {
                const errorObj = JSON.parse(jsonMatch[0]);
                if (errorObj.error && errorObj.error.message) {
                    errorMessage = errorObj.error.message;
                }
            }
        } catch(e) {
            // Ignore parsing errors, stick with original message
        }
    
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
             setError('You have exceeded the API quota. Please check your plan and billing details.');
        } else {
             setError(errorMessage);
        }
    };


    useEffect(() => {
        try {
            const savedCloset = localStorage.getItem('virtualCloset');
            if (savedCloset) {
                setClosetItems(JSON.parse(savedCloset));
            }
            const savedMeasurements = localStorage.getItem('modelMeasurements');
            if (savedMeasurements) {
                setModelMeasurements(JSON.parse(savedMeasurements));
            }
            const savedMannequins = localStorage.getItem('personalMannequins');
            if (savedMannequins) {
                setPersonalMannequins(JSON.parse(savedMannequins));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
        } finally {
            setIsAppLoaded(true);
        }
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
          setShowInstallBanner(false);
          setInstallPromptEvent(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            return;
        }
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPromptEvent(null);
        setShowInstallBanner(false);
    };


    useEffect(() => {
        if (!isAppLoaded) return;
        try {
            localStorage.setItem('modelMeasurements', JSON.stringify(modelMeasurements));
        } catch (error) {
            console.error("Failed to save model measurements to localStorage:", error);
        }
    }, [modelMeasurements, isAppLoaded]);

    // Fix: Add useEffect to persist closetItems to localStorage. This separates state updates from side effects.
    useEffect(() => {
        if (!isAppLoaded) return;
        try {
            localStorage.setItem('virtualCloset', JSON.stringify(closetItems));
        } catch (error) {
            console.error("Failed to save closet to localStorage:", error);
        }
    }, [closetItems, isAppLoaded]);

    useEffect(() => {
        if (!isAppLoaded) return;
        try {
            if (personalMannequins.front || personalMannequins.back) {
                localStorage.setItem('personalMannequins', JSON.stringify(personalMannequins));
            } else {
                localStorage.removeItem('personalMannequins');
            }
        } catch (error) {
            console.error("Failed to save personal mannequins to localStorage:", error);
        }
    }, [personalMannequins, isAppLoaded]);
    
    const handleAddAccessorySlot = () => {
        if (accessoryImages.length < 3) {
            setAccessoryImages([...accessoryImages, null]);
        }
    };

    const handleRemoveAccessorySlot = (index: number) => {
        if (accessoryImages.length > 1) {
            setAccessoryImages(accessoryImages.filter((_, i) => i !== index));
        }
    };

    const handleAccessoryFileChange = (index: number, file: UploadedFile | null) => {
        const newAccessoryImages = [...accessoryImages];
        newAccessoryImages[index] = file;
        setAccessoryImages(newAccessoryImages);

        if (file) {
             // Common logic for adding item to closet
            addUploadedItemToCloset(file, 'accessory');
        }
    };

    const addUploadedItemToCloset = async (file: UploadedFile, type: 'outfit' | 'accessory') => {
        try {
            const prompt = "Isolate the main clothing item or accessory in this image from its background. Return the result as a PNG with a transparent background.";
            const processedSrc = await processImage(prompt, [{ base64: file.base64, mimeType: file.mimeType }]);
            
            const resizedProcessedSrc = await resizeDataUrl(processedSrc, 768);
            
            const processedFileForCategorization = {
                base64: resizedProcessedSrc.split(',')[1],
                mimeType: resizedProcessedSrc.match(/data:(.*);base64,/)?.[1] ?? 'image/webp'
            };
            const categoryString = await categorizeImage(processedFileForCategorization);

            const validCategories = Object.keys(ClosetCategoryEnum).map(c => c.toLowerCase());
            const foundCategory = validCategories.find(c => categoryString.toLowerCase().includes(c));

            let category: ClosetCategoryEnum;

            if (foundCategory) {
                category = foundCategory.toUpperCase() as ClosetCategoryEnum;
            } else {
                console.warn(`Unexpected category from AI: "${categoryString}", defaulting based on upload slot.`);
                category = type === 'outfit' ? ClosetCategoryEnum.TOP : ClosetCategoryEnum.ACCESSORY;
            }

            const newItem: ClosetItem = {
                id: `${type}-${Date.now()}`,
                src: resizedProcessedSrc,
                category: category,
            };
            
            // Fix: Use setClosetItems with a functional update to correctly update state and trigger the persistence useEffect.
            setClosetItems(prev => [...prev, newItem]);

        } catch (err) {
            console.error("Failed to process image for closet:", err);
            handleApiError(err, "Failed to remove background and categorize closet item.");
        }
    };

    const handleAddOutfitToCloset = async (file: File) => {
        if (!file) return;

        try {
            setError(null);
            const { preview, base64, mimeType } = await resizeAndEncodeImage(file);
            const uploadedFile: UploadedFile = { file, preview, base64, mimeType };
            await addUploadedItemToCloset(uploadedFile, 'outfit');
        } catch (error) {
            console.error("Error adding outfit to closet:", error);
            handleApiError(error, "Failed to add item to closet.");
            // Re-throw to allow the caller to handle its own UI state
            throw error;
        }
    };

    const handleFileChange = async (file: UploadedFile | null, type: 'model' | 'outfit' | 'back-outfit') => {
        if (!file) {
            if (type === 'model') setModelImage(null);
            if (type === 'outfit') {
                setOutfitImage(null);
                setOutfitCategory(null);
            }
            if (type === 'back-outfit') setBackOutfitImage(null);
            return;
        }

        if (type === 'model') {
            setModelImage(file);
        } else if (type === 'outfit') {
            setOutfitImage(file);
            addUploadedItemToCloset(file, 'outfit'); // Adds to closet
            // Categorize for main prompt generation
            try {
                const categoryString = await categorizeImage({ base64: file.base64, mimeType: file.mimeType });
                const validCategories = Object.keys(ClosetCategoryEnum).map(c => c.toLowerCase());
                const foundCategory = validCategories.find(c => categoryString.toLowerCase().includes(c));
                if (foundCategory) {
                    setOutfitCategory(foundCategory.toUpperCase() as ClosetCategoryEnum);
                } else {
                    console.warn(`Could not determine a specific category for the outfit: ${categoryString}`);
                    setOutfitCategory(null);
                }
            } catch (err) {
                console.error("Failed to categorize outfit:", err);
                setOutfitCategory(null);
            }

        } else if (type === 'back-outfit') {
            setBackOutfitImage(file);
            // We assume the back has the same category as the front, so no need to categorize again.
            addUploadedItemToCloset(file, 'outfit');
        }
    };
    
    const handleSelectFromCloset = (item: ClosetItem) => {
        const uploadedFile: UploadedFile = {
            file: new File([], ''),
            preview: item.src,
            base64: item.src.split(',')[1],
            mimeType: item.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png'
        };
        
        const accessoryCategories = [ClosetCategoryEnum.ACCESSORY, ClosetCategoryEnum.SHOES];
        if (accessoryCategories.includes(item.category)) {
            // Find first empty slot or replace first slot
            const emptyIndex = accessoryImages.findIndex(img => img === null);
            if (emptyIndex !== -1) {
                handleAccessoryFileChange(emptyIndex, uploadedFile);
            } else {
                handleAccessoryFileChange(0, uploadedFile);
            }
        } else {
            // Use handleFileChange to set the outfit and trigger categorization
            handleFileChange(uploadedFile, 'outfit');
        }
    };

    const handleRemoveFromCloset = (itemId: string) => {
        // Fix: Use functional update with setClosetItems for safe state removal.
        setClosetItems(prev => prev.filter(item => item.id !== itemId));
    };


    const handleStyleChange = (styleId: string) => {
        setActiveStyle(styleId);
        const newModifier = promptTemplates[styleId as keyof typeof promptTemplates]?.modifier ?? '';

        setGeneratedImages(prev =>
            prev.map(img => {
                let newPrompt = img.prompt;
                
                Object.values(promptTemplates).forEach(template => {
                    if (template.modifier) {
                        newPrompt = newPrompt.replace(template.modifier, '');
                    }
                });
                
                return { ...img, prompt: newPrompt + newModifier };
            })
        );
    };
    
    const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setModelMeasurements(prev => ({ ...prev, [name]: value }));
    };

    const handlePromptChange = (id: GenerationType, newPrompt: string) => {
        setActiveStyle('custom');
        setGeneratedImages(prev =>
            prev.map(img => (img.id === id ? { ...img, prompt: newPrompt } : img))
        );
    };

    // Effect to sync editor state with main state
    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.FULL_BODY, customFullBodyPrompt);
    }, [customFullBodyPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.FULL_BODY_BACK, customFullBodyBackPrompt);
    }, [customFullBodyBackPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.VIRTUAL_TRY_ON, customVirtualTryOnPrompt);
    }, [customVirtualTryOnPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.POSE_VINTED_FRONT, customVintedFrontPrompt);
    }, [customVintedFrontPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.POSE_VINTED_BACK, customVintedBackPrompt);
    }, [customVintedBackPrompt]);
    
    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.URBAN, customUrbanPrompt);
    }, [customUrbanPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.RURAL, customRuralPrompt);
    }, [customRuralPrompt]);

    // New Editorial Prompts Effects
    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.ROOFTOP_EDITORIAL, customRooftopPrompt);
    }, [customRooftopPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.CAFE_EDITORIAL, customCafePrompt);
    }, [customCafePrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.NIGHT_CITY_EDITORIAL, customNightPrompt);
    }, [customNightPrompt]);

    // Vinted & Playground Prompts Effects
    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.VINTED_HOME, customVintedHomePrompt);
    }, [customVintedHomePrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.VINTED_MIRROR, customVintedMirrorPrompt);
    }, [customVintedMirrorPrompt]);

    useEffect(() => {
        handlePromptChange(GenerationTypeEnum.PLAYGROUND, customPlaygroundPrompt);
    }, [customPlaygroundPrompt]);

    // Effect to update editors when quality template changes
    useEffect(() => {
        setCustomFullBodyPrompt(fullBodyPrompts.front[promptQuality]);
        setCustomFullBodyBackPrompt(fullBodyPrompts.back[promptQuality]);
    }, [promptQuality]);

    const handleVintedTemplateSelect = (templateKey: string) => {
        setActiveVintedTemplate(templateKey);
        if (templateKey === 'generic') {
            setCustomVintedFrontPrompt(vintedMasterFront);
        } else {
            // FIX: The value in vintedSpecialized is the prompt string itself, not an object with a 'front' property.
            setCustomVintedFrontPrompt(vintedSpecialized[templateKey as keyof typeof vintedSpecialized]);
        }
        // Always use the master back prompt as there are no specialized back prompts
        setCustomVintedBackPrompt(vintedMasterBack);
        setActiveStyle('custom');
    };


    const handleSaveEdit = (id: GenerationType, newSrc: string) => {
        setGeneratedImages(prev =>
            prev.map(img => (img.id === id ? { ...img, src: newSrc } : img))
        );
        setEditingImage(null);
    };

    const getModelCharacteristics = () => {
        const { height, weight, bust, waist, hips, notes } = modelMeasurements;
        const measurements = [
            height && `Height: ${height}cm`,
            weight && `Weight: ${weight}kg`,
            bust && `Bust: ${bust}cm`,
            waist && `Waist: ${waist}cm`,
            hips && `Hips: ${hips}cm`
        ].filter(Boolean).join(', ');

        let instruction = '';
        if (measurements) {
            instruction += ` The mannequin should be generated with a body shape that reflects these proportions: ${measurements}.`;
        }
        if (notes) {
            instruction += ` General appearance notes: ${notes}.`;
        }
        return instruction;
    };
    
    const getAccessoryPromptFragment = (count: number) => {
        if (count === 0) return '';
        if (count === 1) return ' and the accessory from the third image';
        
        const accessoryPositions = ['the third', 'the fourth', 'the fifth'];
        const usedPositions = accessoryPositions.slice(0, count);
        
        // Fix: Replace Intl.ListFormat with a manual implementation to avoid TypeScript lib errors.
        const positionString = usedPositions.length > 2
            ? `${usedPositions.slice(0, -1).join(', ')}, and ${usedPositions[usedPositions.length - 1]}`
            : usedPositions.join(' and ');
        
        return ` and the accessories from the ${positionString} images`;
    };

    const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
    const getIsGenerationPossible = useCallback((id: GenerationType) => {
        switch (id) {
            case GenerationTypeEnum.VIRTUAL_TRY_ON:
            case GenerationTypeEnum.FULL_BODY:
            case GenerationTypeEnum.URBAN:
            case GenerationTypeEnum.RURAL:
            case GenerationTypeEnum.ROOFTOP_EDITORIAL:
            case GenerationTypeEnum.CAFE_EDITORIAL:
            case GenerationTypeEnum.NIGHT_CITY_EDITORIAL:
            case GenerationTypeEnum.VINTED_MIRROR:
            case GenerationTypeEnum.VINTED_HOME:
            case GenerationTypeEnum.PLAYGROUND:
            case GenerationTypeEnum.MANGA_PAGE:
            case GenerationTypeEnum.COMIC_COVER:
            case GenerationTypeEnum.VINTAGE_COMIC:
            case GenerationTypeEnum.NOIR_COMIC:
            case GenerationTypeEnum.BD_COMIC:
            case GenerationTypeEnum.ANIME_CHARACTER:
            case GenerationTypeEnum.POP_ART:
            case GenerationTypeEnum.FASHION_SKETCH:
                return !!modelImage && !!outfitImage;
            case GenerationTypeEnum.POSE_VINTED_FRONT:
                 if (modelFidelity === 'inspired') {
                    return !!personalMannequins.front && !!outfitImage;
                }
                return !!modelImage && !!outfitImage;
            case GenerationTypeEnum.FULL_BODY_BACK:
                return !!modelImage && !!backOutfitImage;
            case GenerationTypeEnum.POSE_VINTED_BACK:
                if (modelFidelity === 'inspired') {
                    return !!personalMannequins.back && !!backOutfitImage;
                }
                return !!modelImage && !!backOutfitImage;
            case GenerationTypeEnum.VINTED_MANNEQUIN:
            case GenerationTypeEnum.DETAIL:
            case GenerationTypeEnum.PRODUCT_ENHANCER:
                return !!outfitImage || !!backOutfitImage;
            case GenerationTypeEnum.ACCESSORY_DETAIL:
                return validAccessories.length > 0;
            default:
                return false;
        }
    }, [modelImage, outfitImage, backOutfitImage, accessoryImages, personalMannequins, modelFidelity]);
    
    const buildFullBodyPrompt = useCallback((basePrompt: string, isBackView: boolean) => {
        const characteristicsInstruction = getModelCharacteristics();
        const fidelityInstruction = modelFidelityOptions[modelFidelity as keyof typeof modelFidelityOptions].promptInstruction;
        
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
    
        const lengthInstruction = garmentLengthOptions[garmentLength as keyof typeof garmentLengthOptions].promptInstruction;
        const fitInstruction = garmentFitOptions[garmentFit as keyof typeof garmentFitOptions].promptInstruction;
        const fixedAccessoryInstruction = fixedAccessoryOptions[fixedAccessory as keyof typeof fixedAccessoryOptions].promptInstruction;
        const beltInstruction = beltOptions[belt as keyof typeof beltOptions].promptInstruction;
        const dynamicAccessoryInstruction = getAccessoryPromptFragment(validAccessories.length);
    
        const activeInstructions = [
            lengthInstruction,
            fitInstruction,
            fixedAccessoryInstruction,
            beltInstruction,
            dynamicAccessoryInstruction,
        ].filter(Boolean);
        
        let finalStylingInstructions = 'None.';
        if (activeInstructions.length > 0) {
            finalStylingInstructions = activeInstructions
                .map(inst => `- ${inst.trim()}`)
                .join('\n');
        }
        
        const modelRefInstruction = isBackView 
            ? `**CRITICAL - MODEL REFERENCE (BACK VIEW):**\n${fidelityInstruction}\n- This is the BACK VIEW of the same person. Body shape, skin tone, and hair must match.\n${characteristicsInstruction}`
            : `**CRITICAL - MODEL REFERENCE:**\n${fidelityInstruction}\n${characteristicsInstruction}`;
    
        let finalPrompt = basePrompt;
    
        // Prepend model instructions
        finalPrompt = `${modelRefInstruction}\n\n${finalPrompt}`;
    
        // Append styling, technical, and variation instructions
        finalPrompt += `\n\n**STYLING & GARMENT MODIFICATIONS:**\n${finalStylingInstructions}`;
        finalPrompt += `\n\n**TECHNICAL REQUIREMENTS:**\n- Aspect ratio must be ${aspectRatio}.`;
        
        if (outfitCategory) {
            let variationPrompt = '';
            switch (outfitCategory) {
                case ClosetCategoryEnum.DRESS: variationPrompt = fullBodyPrompts.variations.dress; break;
                case ClosetCategoryEnum.BOTTOM: variationPrompt = fullBodyPrompts.variations.pants; break;
                case ClosetCategoryEnum.TOP: variationPrompt = fullBodyPrompts.variations.top; break;
                case ClosetCategoryEnum.OUTERWEAR: variationPrompt = fullBodyPrompts.variations.outerwear; break;
            }
            if (variationPrompt) {
                finalPrompt += `\n\n${variationPrompt}`;
            }
        }
        
        return finalPrompt;
    }, [modelFidelity, modelMeasurements, garmentLength, garmentFit, fixedAccessory, belt, accessoryImages, aspectRatio, outfitCategory, getModelCharacteristics, getAccessoryPromptFragment]);

    useEffect(() => {
        setFinalFullBodyPrompt(buildFullBodyPrompt(customFullBodyPrompt, false));
        setFinalFullBodyBackPrompt(buildFullBodyPrompt(customFullBodyBackPrompt, true));
    }, [buildFullBodyPrompt, customFullBodyPrompt, customFullBodyBackPrompt]);

    const handleGenerateMannequin = async () => {
        setIsGeneratingMannequin(true);
        setError(null);
        try {
            const characteristics = getModelCharacteristics();
            const aspectRatioInstruction = `The aspect ratio must be ${aspectRatio}.`;

            const basePrompt = `TECHNICAL MANNEQUIN GENERATION FOR VIRTUAL TRY-ON:
Generate a high-quality, photorealistic, anonymous fashion mannequin. This mannequin will be used as a base for a virtual try-on, so anatomical and proportional accuracy are critical.

**CRUCIAL:** Absolutely no rotation, tilting, or leaning of the head, shoulders, or hips. The figure must be perfectly vertical and centered.
- **Appearance:** The mannequin must be headless (cropped smoothly at the neck). It should have a smooth, matte grey finish, avoiding any reflections or highlights that could interfere with the overlay.

**Anatomy & Proportions:**
- The mannequin's form and silhouette MUST be based on these exact proportions: ${characteristics}.
- The goal is a realistic but clearly artificial figure suitable for a precise virtual try-on.

**Environment & Lighting:**
- **CRUCIAL:** The lighting must be perfectly flat, even, shadowless studio lighting, as if from a ring flash or a completely diffuse light source. There should be NO directional shadows on the body or on the background.
- The background must be a seamless, clean, minimalist, solid light grey color (#f0f0f0).

**Output Format:**
- The final image must be a full-body shot, ensuring the feet are visible at the bottom of the frame. Any cropping will disrupt the scaling calculations.
- ${aspectRatioInstruction}
`;

            const frontPrompt = `
**Pose:** The mannequin must be in a STRICTLY neutral, symmetrical, forward-facing museum pose. The arms should be straight down at the sides, not touching the body. The feet should be together.
${basePrompt}
`;
            
            const backPrompt = `
**Pose:** The mannequin must be in a STRICTLY neutral, symmetrical, BACK-facing museum pose (facing directly away from the camera). The arms should be straight down at the sides, not touching the body. The feet should be together.
**CRITICAL - NO HEAD:** The mannequin must be headless, cropped at the neck, matching the front view. DO NOT include the back of the head.
${basePrompt}
`;
            
            const [frontSrc, backSrc] = await Promise.all([
                generateImage(frontPrompt, []), // No input images needed
                generateImage(backPrompt, [])
            ]);

            const createFileObject = (src: string, name: string): UploadedFile => {
                const mimeType = src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
                const base64 = src.split(',')[1];
                return {
                    file: new File([], name, { type: mimeType }),
                    preview: src,
                    base64: base64,
                    mimeType: mimeType
                };
            };
            
            setPersonalMannequins({
                front: createFileObject(frontSrc, 'personal-mannequin-front.png'),
                back: createFileObject(backSrc, 'personal-mannequin-back.png')
            });

        } catch (err) {
            handleApiError(err, 'Failed to generate personal mannequin views.');
        } finally {
            setIsGeneratingMannequin(false);
        }
    };

    const handleProcessFor3D = async () => {
        if (!outfitImage) {
            setError('Por favor, sube una prenda para el visor 3D.');
            return;
        }
        setIsProcessingFor3D(true);
        setError(null);
        setProcessedGarmentFor3D(null);
        try {
            const prompt = "Isolate the main garment in this image from its background. Return the result as a high-quality PNG with a transparent background.";
            const imageInput = { base64: outfitImage.base64, mimeType: outfitImage.mimeType };
            const processedSrc = await processImage(prompt, [imageInput]);
            setProcessedGarmentFor3D(processedSrc);
        } catch (err) {
            handleApiError(err, 'Failed to process garment for 3D viewer.');
        } finally {
            setIsProcessingFor3D(false);
        }
    };


    const generateSingleImage = useCallback(async (imageInfo: GeneratedImage) => {
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);

        let sourceImagesForAPI: UploadedFile[] = [];
        let missingPrerequisiteMessage: string | null = null;

        if (!getIsGenerationPossible(imageInfo.id)) {
             if (imageInfo.id !== GenerationTypeEnum.ACCESSORY_DETAIL) {
                missingPrerequisiteMessage = 'Prerequisites not met for this image.';
            } else {
                 setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: null, status: 'pending' } : img));
                 return; // Silently skip if no accessory is provided, as it's optional
            }
        } else {
             switch (imageInfo.id) {
                case GenerationTypeEnum.VIRTUAL_TRY_ON:
                case GenerationTypeEnum.FULL_BODY:
                case GenerationTypeEnum.URBAN:
                case GenerationTypeEnum.RURAL:
                case GenerationTypeEnum.ROOFTOP_EDITORIAL:
                case GenerationTypeEnum.CAFE_EDITORIAL:
                case GenerationTypeEnum.NIGHT_CITY_EDITORIAL:
                case GenerationTypeEnum.VINTED_MIRROR:
                case GenerationTypeEnum.VINTED_HOME:
                case GenerationTypeEnum.PLAYGROUND:
                case GenerationTypeEnum.MANGA_PAGE:
                case GenerationTypeEnum.COMIC_COVER:
                case GenerationTypeEnum.VINTAGE_COMIC:
                case GenerationTypeEnum.NOIR_COMIC:
                case GenerationTypeEnum.BD_COMIC:
                case GenerationTypeEnum.ANIME_CHARACTER:
                case GenerationTypeEnum.POP_ART:
                case GenerationTypeEnum.FASHION_SKETCH:
                    sourceImagesForAPI = [modelImage!, outfitImage!, ...validAccessories];
                    break;
                case GenerationTypeEnum.POSE_VINTED_FRONT:
                    if (modelFidelity === 'inspired' && personalMannequins.front) {
                        sourceImagesForAPI = [personalMannequins.front, outfitImage!];
                    } else {
                        sourceImagesForAPI = [modelImage!, outfitImage!];
                    }
                    break;
                case GenerationTypeEnum.FULL_BODY_BACK:
                    sourceImagesForAPI = [modelImage!, backOutfitImage!, ...validAccessories];
                    break;
                case GenerationTypeEnum.POSE_VINTED_BACK:
                     if (modelFidelity === 'inspired' && personalMannequins.back) {
                        sourceImagesForAPI = [personalMannequins.back, backOutfitImage!];
                    } else {
                        sourceImagesForAPI = [modelImage!, backOutfitImage!];
                    }
                    break;
                case GenerationTypeEnum.VINTED_MANNEQUIN:
                case GenerationTypeEnum.DETAIL:
                case GenerationTypeEnum.PRODUCT_ENHANCER:
                    sourceImagesForAPI = [outfitImage ?? backOutfitImage!];
                    break;
                case GenerationTypeEnum.ACCESSORY_DETAIL:
                     sourceImagesForAPI = [validAccessories[0]];
                    break;
            }
        }


        if (missingPrerequisiteMessage) {
            setError(missingPrerequisiteMessage);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error', error: missingPrerequisiteMessage } : img));
            return;
        }

        try {
            let prompt: string;
            
            if (imageInfo.id === GenerationTypeEnum.FULL_BODY) {
                prompt = finalFullBodyPrompt;
            } else if (imageInfo.id === GenerationTypeEnum.FULL_BODY_BACK) {
                prompt = finalFullBodyBackPrompt;
            } else {
                 let basePrompt = imageInfo.prompt;
                // Fallback for other types that might need model/styling info
                const modelBasedTypes = [
                    GenerationTypeEnum.VIRTUAL_TRY_ON, 
                    GenerationTypeEnum.URBAN, 
                    GenerationTypeEnum.RURAL,
                    GenerationTypeEnum.ROOFTOP_EDITORIAL,
                    GenerationTypeEnum.CAFE_EDITORIAL,
                    GenerationTypeEnum.NIGHT_CITY_EDITORIAL,
                    GenerationTypeEnum.POSE_VINTED_FRONT, 
                    GenerationTypeEnum.POSE_VINTED_BACK,
                    GenerationTypeEnum.VINTED_MIRROR,
                    GenerationTypeEnum.VINTED_HOME,
                    GenerationTypeEnum.PLAYGROUND
                ];
                if(modelBasedTypes.includes(imageInfo.id)) {
                    const characteristicsInstruction = getModelCharacteristics();
                    const fidelityInstruction = modelFidelityOptions[modelFidelity as keyof typeof modelFidelityOptions].promptInstruction;
                    const lengthInstruction = garmentLengthOptions[garmentLength as keyof typeof garmentLengthOptions].promptInstruction;
                    const fitInstruction = garmentFitOptions[garmentFit as keyof typeof garmentFitOptions].promptInstruction;
                    const fixedAccessoryInstruction = fixedAccessoryOptions[fixedAccessory as keyof typeof fixedAccessoryOptions].promptInstruction;
                    const beltInstruction = beltOptions[belt as keyof typeof beltOptions].promptInstruction;
                    const dynamicAccessoryInstruction = getAccessoryPromptFragment(validAccessories.length);

                    const activeInstructions = [
                        lengthInstruction,
                        fitInstruction,
                        fixedAccessoryInstruction,
                        beltInstruction,
                        dynamicAccessoryInstruction,
                    ].filter(Boolean);
                    
                    let finalStylingInstructions = 'None.';
                    if (activeInstructions.length > 0) {
                        finalStylingInstructions = activeInstructions
                            .map(inst => `- ${inst.trim()}`)
                            .join('\n');
                    }

                    prompt = `
**MAIN TASK:**
${basePrompt}

**MODEL & POSE INSTRUCTIONS:**
${fidelityInstruction}
${characteristicsInstruction}

**STYLING & GARMENT MODIFICATIONS:**
${finalStylingInstructions}

**TECHNICAL & CREATIVE REQUIREMENTS:**
- The final photograph must have a ${aspectRatio} aspect ratio.
- The composition must be original and creative.
- The final image must be suitable for a general audience.
- Style: Ensure the result is a photorealistic photograph, NOT a CGI render, illustration, or mannequin unless explicitly requested.
`;
                } else {
                    const aspectRatioInstruction = ` The final photograph must have a ${aspectRatio} aspect ratio.`;
                    prompt = basePrompt + aspectRatioInstruction;
                }
            }
            
            const resultSrc = await generateImage(prompt, sourceImagesForAPI);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, src: resultSrc, status: 'done' } : img));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to generate image for ${imageInfo.title}`;
            console.error(`Failed to generate image for ${imageInfo.title}:`, err);
            handleApiError(err, errorMessage);
            setGeneratedImages(prev => prev.map(img => img.id === imageInfo.id ? { ...img, status: 'error', error: errorMessage } : img));
            // Do not re-throw, as the main generate function doesn't need to handle individual failures
        }
    }, [
        modelImage, outfitImage, backOutfitImage, accessoryImages, aspectRatio, modelMeasurements, modelFidelity, 
        garmentLength, garmentFit, fixedAccessory, belt, garmentLengthCm, getIsGenerationPossible, outfitCategory,
        finalFullBodyPrompt, finalFullBodyBackPrompt, buildFullBodyPrompt, personalMannequins
    ]);


    const handleGenerate = useCallback(async () => {
        if (!modelImage || (!outfitImage && !backOutfitImage)) {
            setError('Please upload a model image and at least one outfit image (front or back).');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Filter for images that can actually be generated based on inputs
        const imagesToGenerate = generatedImages.filter(img => getIsGenerationPossible(img.id));

        // Mark all eligible images as queued first, so the user sees the whole plan
        const queuedImageIds = imagesToGenerate.map(img => img.id);
        setGeneratedImages(prev => prev.map(img =>
            queuedImageIds.includes(img.id)
                ? { ...img, src: null, status: 'queued', error: undefined }
                : img
        ));

        // Process images one by one to provide clear progress feedback
        for (const imageInfo of imagesToGenerate) {
            // Set current image to loading status
            setGeneratedImages(prev => prev.map(img =>
                img.id === imageInfo.id ? { ...img, status: 'loading' } : img
            ));

            await generateSingleImage(imageInfo);
        }

        setIsLoading(false);
    }, [modelImage, outfitImage, backOutfitImage, generatedImages, generateSingleImage, getIsGenerationPossible]);
    
    const handleGenerateSingle = useCallback(async (id: GenerationType) => {
        const imageInfo = generatedImages.find(img => img.id === id);
        if (!imageInfo) return;

        setGeneratedImages(prev => prev.map(img => 
            img.id === id ? { ...img, status: 'loading', error: undefined } : img
        ));
        setError(null);

        await generateSingleImage(imageInfo);

    }, [generatedImages, generateSingleImage]);

    const handleShoeSwap = async (shoeType: string) => {
        const shoePromptInstruction = shoeSwapOptions[shoeType as keyof typeof shoeSwapOptions]?.promptInstruction;
        if (!shoePromptInstruction) return;
    
        const fullBodyImage = generatedImages.find(img => img.id === GenerationTypeEnum.FULL_BODY);
    
        if (!fullBodyImage || !fullBodyImage.src) {
            setError("Please generate the 'Full Body Shot' image before swapping shoes.");
            return;
        }
    
        setIsSwappingShoes(true);
        setError(null);
        setGeneratedImages(prev => prev.map(img =>
            img.id === GenerationTypeEnum.FULL_BODY ? { ...img, status: 'loading', error: undefined } : img
        ));
    
        try {
            const prompt = `CRITICAL TASK: IMAGE EDITING.
You are a professional photo retoucher. Your task is to modify the provided image by changing ONLY the footwear.
**Instruction:** Realistically change the model's footwear to be ${shoePromptInstruction}.
**Strict Rules:**
- DO NOT change the model, her pose, the garment she is wearing, the background, or the lighting.
- The edit must be seamless and photorealistic.
- If the instruction is 'barefoot', remove the shoes completely and render realistic bare feet.
The output MUST be only the modified image.`;
    
            const mimeType = fullBodyImage.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = fullBodyImage.src.split(',')[1];
            const imageInput: ImageInput = { base64, mimeType };
    
            const newSrc = await processImage(prompt, [imageInput]);
    
            setGeneratedImages(prev => prev.map(img =>
                img.id === GenerationTypeEnum.FULL_BODY ? { ...img, src: newSrc, status: 'done' } : img
            ));
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to swap shoes.';
            handleApiError(err, 'Failed to swap shoes.');
            setGeneratedImages(prev => prev.map(img =>
                img.id === GenerationTypeEnum.FULL_BODY ? { ...img, status: 'error', error: errorMessage } : img
            ));
        } finally {
            setIsSwappingShoes(false);
        }
    };


    const handleStyleAnalysis = async () => {
        const validAccessories = accessoryImages.filter((img): img is UploadedFile => !!img);
        if (!modelImage || !outfitImage) {
            setError('Please upload a model and an outfit image for analysis.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setStyleAnalysisResult(null);

        try {
            const prompt = `Actúa como una asesora de moda experta y perspicaz. He subido varias imágenes: una de una persona (para referencia de estilo y tipo de cuerpo), una prenda de vestir, y ${validAccessories.length} accesorio(s). Por favor, proporciona un análisis de estilo conciso y útil. Sé positiva, alentadora y específica en tus consejos. Formatea tu respuesta en Markdown con las siguientes secciones exactas:

**Análisis de las Piezas:**
* Describe el tipo de prenda y los accesorios, su estilo (ej. casual, formal, bohemio), y para qué ocasiones podrían ser adecuados.

**Recomendación de Estilo:**
* Basándote en la imagen de referencia de la persona, analiza cómo el atuendo podría sentarle. Comenta sobre el corte, el estilo y cómo podría favorecer su tipo de cuerpo.

**Sugerencias para Completar el Look:**
* Ofrece 2-3 sugerencias específicas para completar el atuendo. Menciona tipos de zapatos, bolsos (si no se ha proporcionado uno), peinados o maquillaje que combinarían bien.

**Paleta de Colores:**
* Sugiere 2-3 colores adicionales que combinarían bien con la prenda principal, tanto para otras piezas de ropa como para accesorios.`;

            const images = [modelImage, outfitImage, ...validAccessories];
            // Updated to use the new system instruction
            const result = await getStyleAnalysis(prompt, images, ASSISTANT_SYSTEM_INSTRUCTION);
            setStyleAnalysisResult(result);
            // setIsVintedModalOpen(true); This is already open, analysis is triggered from within

        } catch (err) {
            console.error("Failed to get style analysis:", err);
            handleApiError(err, "Failed to get style analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSuggestAccessories = async () => {
        const fullBodyImage = generatedImages.find(img => img.id === GenerationTypeEnum.FULL_BODY);
        if (!fullBodyImage?.src) {
            setError('Please generate the main "Full Body Shot" image first.');
            return;
        }

        setIsSuggesting(true);
        setIsSuggestionModalOpen(true);
        setAccessorySuggestions(null); // Clear previous suggestions
        setError(null);

        try {
            const prompt = `Act as a high-fashion stylist. Based on the provided image of a model wearing an outfit, suggest three complementary accessories: one pair of shoes, one handbag, and one piece of jewelry. For each accessory, provide a brief, descriptive prompt for an AI image generator to create a photorealistic product shot of the item on a clean, white background. Return the response as a valid JSON object with the exact following structure: {"shoes": {"description": "...", "prompt": "..."}, "handbag": {"description": "...", "prompt": "..."}, "jewelry": {"description": "...", "prompt": "..."}}`;
            
            const mimeType = fullBodyImage.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = fullBodyImage.src.split(',')[1];
            const imageInput = { base64, mimeType };

            const jsonResponse = await getAccessorySuggestions(prompt, [imageInput]);
            const cleanedJsonResponse = extractJson(jsonResponse);

            let suggestions;
            try {
                suggestions = JSON.parse(cleanedJsonResponse);
            } catch (parseError) {
                console.error("Failed to parse cleaned JSON:", cleanedJsonResponse);
                console.error("Original model response:", jsonResponse);
                throw new Error("The AI returned an invalid format for accessories that could not be repaired.");
            }

            const accessoryPromises = Object.entries(suggestions).map(async ([key, value]) => {
                const { description, prompt: imagePrompt } = value as { description: string; prompt: string };
                const imageSrc = await generateImage(imagePrompt, []);
                return {
                    type: key as 'shoes' | 'handbag' | 'jewelry',
                    description,
                    imageSrc,
                };
            });

            const results = await Promise.all(accessoryPromises);
            setAccessorySuggestions(results);

        } catch (err) {
            console.error("Failed to get accessory suggestions:", err);
            handleApiError(err, "Failed to suggest accessories.");
            // Close the modal on error
            setIsSuggestionModalOpen(false);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSelectSuggestedAccessory = (imageSrc: string) => {
        const mimeType = imageSrc.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
        const base64 = imageSrc.split(',')[1];
        
        const suggestedFile: UploadedFile = {
            file: new File([], 'suggested-accessory.png', { type: mimeType }),
            preview: imageSrc,
            base64: base64,
            mimeType: mimeType
        };
        
        const emptyIndex = accessoryImages.findIndex(img => img === null);
        if (emptyIndex !== -1) {
            handleAccessoryFileChange(emptyIndex, suggestedFile);
        } else {
            handleAccessoryFileChange(0, suggestedFile); // Replace first one if all are full
        }

        setIsSuggestionModalOpen(false); // Close modal after selection
    };
    
    const handleAnalyzePhoto = async () => {
        if (!analysisImage || !analysisQuestion) {
            setError("Please upload an image and provide a question for analysis.");
            return;
        }
        setIsAnalyzingPhoto(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const imageInput = { base64: analysisImage.base64, mimeType: analysisImage.mimeType };
            // Re-using getStyleAnalysis as it's a generic text/image prompt handler
            // Also passed the system instruction here
            const result = await getStyleAnalysis(analysisQuestion, [imageInput], ASSISTANT_SYSTEM_INSTRUCTION);
            setAnalysisResult(result);
        } catch (err) {
            console.error("Failed to analyze photo:", err);
            handleApiError(err, "Failed to analyze photo.");
        } finally {
            setIsAnalyzingPhoto(false);
        }
    };
    
    const handleSendMessage = async (id: GenerationType, message: string) => {
        const imageToUpdate = generatedImages.find(img => img.id === id);
        if (!imageToUpdate || !imageToUpdate.src) {
            setError("Cannot modify an image that hasn't been generated yet.");
            return;
        }
        
        // 1. Add user message to history and set loading state
        setGeneratedImages(prev => prev.map(img => {
            if (img.id === id) {
                const newHistory = [...(img.chatHistory || []), { author: 'user' as const, text: message }];
                return { ...img, status: 'loading', chatHistory: newHistory, error: undefined };
            }
            return img;
        }));
        
        try {
            // 2. Construct the prompt
            const refinementPrompt = `You are a helpful photo editing assistant. The user wants to modify the provided image.
The original creative goal was: "${imageToUpdate.prompt}"
Now, apply this specific change requested by the user: "${message}"
Return only the newly generated image reflecting this change.`;
    
            const mimeType = imageToUpdate.src.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
            const base64 = imageToUpdate.src.split(',')[1];
            const imageInput = { base64, mimeType };
            
            // 3. Call the API (reusing processImage is fine)
            const newSrc = await processImage(refinementPrompt, [imageInput]);
    
            // 4. Update state with new image and model response
            setGeneratedImages(prev => prev.map(img => {
                if (img.id === id) {
                    const newHistory = [...(img.chatHistory || []), { author: 'model' as const, text: "Here's the updated image." }];
                    return { ...img, src: newSrc, status: 'done', chatHistory: newHistory };
                }
                return img;
            }));
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refine image.';
            handleApiError(err, 'Failed to refine image.');
            // 5. Update state with error message
            setGeneratedImages(prev => prev.map(img => {
                if (img.id === id) {
                    const newHistory = [...(img.chatHistory || []), { author: 'model' as const, text: `Sorry, I couldn't make that change. Error: ${errorMessage}` }];
                    return { ...img, status: 'error', chatHistory: newHistory, error: errorMessage };
                }
                return img;
            }));
        }
    };

    const renderMarkdown = (text: string) => {
        let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Basic sanitization
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        html = html.replace(/<\/ul>\s*<ul>/g, ''); // Join adjacent lists
        return html.split('\n\n').map(p => {
            if (p.startsWith('<ul>') && p.endsWith('</ul>')) return p;
            if (p.trim() === '') return '';
            return `<p>${p.trim()}</p>`
        }).join('');
    };

    const fullBodyPromptValidation = validatePrompt(customFullBodyPrompt);
    const fullBodyBackPromptValidation = validatePrompt(customFullBodyBackPrompt);
    const virtualTryOnPromptValidation = validatePrompt(customVirtualTryOnPrompt);
    const vintedFrontPromptValidation = validatePrompt(customVintedFrontPrompt);
    const vintedBackPromptValidation = validatePrompt(customVintedBackPrompt);
    
    const urbanPromptValidation = validatePrompt(customUrbanPrompt);
    const ruralPromptValidation = validatePrompt(customRuralPrompt);
    const rooftopPromptValidation = validatePrompt(customRooftopPrompt);
    const cafePromptValidation = validatePrompt(customCafePrompt);
    const nightPromptValidation = validatePrompt(customNightPrompt);
    
    const vintedHomePromptValidation = validatePrompt(customVintedHomePrompt);
    const vintedMirrorPromptValidation = validatePrompt(customVintedMirrorPrompt);
    const playgroundPromptValidation = validatePrompt(customPlaygroundPrompt);

    const isFullBodyGenerated = !!generatedImages.find(img => img.id === GenerationTypeEnum.FULL_BODY)?.src;


    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-white" style={{fontFamily: "'Playfair Display', serif"}}>
                        Virtual Styling Composer
                    </h1>
                    <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
                        Build your virtual closet. Compose outfits. Generate editorial photoshoots in moments.
                    </p>
                </header>

                <main>
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-zinc-700 shadow-2xl shadow-zinc-950/50">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                            <div className="lg:col-span-3">
                                <ImageDropzone 
                                    id="model"
                                    title="1. Upload Model (Reference)" 
                                    onFileChange={(file) => handleFileChange(file, 'model')} 
                                    currentFile={modelImage}
                                />
                            </div>
                            <div className="lg:col-span-6">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <ImageDropzone 
                                        id="outfit"
                                        title="2a. Upload Outfit (Front)" 
                                        onFileChange={(file) => handleFileChange(file, 'outfit')}
                                        currentFile={outfitImage}
                                    />
                                    <ImageDropzone 
                                        id="back-outfit"
                                        title="2b. Upload Outfit (Back)" 
                                        onFileChange={(file) => handleFileChange(file, 'back-outfit')}
                                        currentFile={backOutfitImage}
                                    />
                                 </div>
                            </div>
                             <div className="lg:col-span-3">
                                <h2 className="text-lg font-semibold mb-4 text-zinc-200 text-center">3. Accessories (Optional)</h2>
                                <div className="space-y-4">
                                    {accessoryImages.map((file, index) => (
                                         <ImageDropzone 
                                            key={`accessory-${index}`}
                                            id={`accessory-${index}`}
                                            title={`Accessory ${index + 1}`} 
                                            onFileChange={(newFile) => handleAccessoryFileChange(index, newFile)} 
                                            currentFile={file}
                                            onRemoveSlot={() => handleRemoveAccessorySlot(index)}
                                            showRemoveSlotButton={accessoryImages.length > 1}
                                        />
                                    ))}
                                </div>
                                {accessoryImages.length < 3 && (
                                    <button 
                                        onClick={handleAddAccessorySlot}
                                        className="w-full mt-4 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                                    >
                                        + Add Accessory
                                    </button>
                                )}
                            </div>
                        </div>

                         <VirtualCloset 
                            items={closetItems}
                            onSelect={handleSelectFromCloset}
                            onRemove={handleRemoveFromCloset}
                            onAddOutfit={handleAddOutfitToCloset}
                        />

                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-6 text-zinc-200">Analizar Foto de Moda</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
                                <ImageDropzone
                                    id="analysis-image"
                                    title="Subir Foto para Analizar"
                                    onFileChange={setAnalysisImage}
                                    currentFile={analysisImage}
                                />
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="analysis-question" className="block text-sm font-medium text-zinc-300 mb-2">Tu Pregunta</label>
                                        <textarea
                                            id="analysis-question"
                                            rows={4}
                                            className="form-input w-full"
                                            value={analysisQuestion}
                                            onChange={(e) => setAnalysisQuestion(e.target.value)}
                                            placeholder="Ej: Describe el estilo de este atuendo..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleAnalyzePhoto}
                                        disabled={!analysisImage || !analysisQuestion || isAnalyzingPhoto}
                                        className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-lg hover:bg-teal-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {isAnalyzingPhoto ? (
                                            <span className="flex items-center justify-center">
                                                <SpinnerIcon className="w-5 h-5 mr-2" />
                                                Analizando...
                                            </span>
                                        ) : 'Analizar con Gemini'}
                                    </button>
                                    {analysisResult && (
                                        <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 max-h-60 overflow-y-auto">
                                            <h4 className="font-semibold text-zinc-200 mb-2">Resultado del Análisis</h4>
                                            <div
                                                className="text-zinc-300 text-sm prose-styles"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(analysisResult) }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Fidelidad del Modelo</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-4">
                                Elige la fidelidad del modelo. 'Maniquí Anónimo' crea un maniquí para máxima seguridad. 'Fiel' intenta replicar a la persona de referencia, lo cual puede ser bloqueado por filtros de seguridad en algunos casos. Si 'Fiel' falla, prueba con 'Maniquí'.
                            </p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {Object.entries(modelFidelityOptions).map(([id, { name }]) => (
                                    <button
                                        key={id}
                                        onClick={() => setModelFidelity(id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            modelFidelity === id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>


                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Model Details (Optional)</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-4xl mx-auto">
                                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-4">
                                    <div>
                                        <label htmlFor="height" className="block text-sm font-medium text-zinc-300 mb-2">Height (cm)</label>
                                        <input type="number" name="height" id="height" value={modelMeasurements.height} onChange={handleMeasurementChange} placeholder="178" className="form-input" />
                                    </div>
                                     <div>
                                        <label htmlFor="weight" className="block text-sm font-medium text-zinc-300 mb-2">Weight (kg)</label>
                                        <input type="number" name="weight" id="weight" value={modelMeasurements.weight} onChange={handleMeasurementChange} placeholder="64" className="form-input" />
                                    </div>
                                    <div>
                                        <label htmlFor="bust" className="block text-sm font-medium text-zinc-300 mb-2">Bust (cm)</label>
                                        <input type="number" name="bust" id="bust" value={modelMeasurements.bust} onChange={handleMeasurementChange} placeholder="98" className="form-input" />
                                    </div>
                                    <div>
                                        <label htmlFor="waist" className="block text-sm font-medium text-zinc-300 mb-2">Waist (cm)</label>
                                        <input type="number" name="waist" id="waist" value={modelMeasurements.waist} onChange={handleMeasurementChange} placeholder="70" className="form-input" />
                                    </div>
                                    <div>
                                        <label htmlFor="hips" className="block text-sm font-medium text-zinc-300 mb-2">Hips (cm)</label>
                                        <input type="number" name="hips" id="hips" value={modelMeasurements.hips} onChange={handleMeasurementChange} placeholder="102" className="form-input" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                     <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-2">General Notes</label>
                                     <textarea name="notes" id="notes" rows={3} value={modelMeasurements.notes} onChange={handleMeasurementChange} placeholder="e.g., Athletic build, brown wavy hair, green eyes..." className="form-input w-full"></textarea>
                                </div>
                             </div>
                        </div>

                        {/* NEW SECTION: 3D VIEWER */}
                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-2 text-zinc-200">🚀 Fase 2: Probador Virtual 3D Interactivo</h3>
                            <p className="text-center text-sm text-zinc-400 max-w-2xl mx-auto mb-6">
                                Visualiza tu prenda en un maniquí 3D. Rota y haz zoom para ver todos los ángulos. Primero, procesa la prenda para prepararla para el visor 3D.
                            </p>
                            <div className="max-w-4xl mx-auto">
                                <div className="text-center mb-6">
                                    <button
                                        onClick={handleProcessFor3D}
                                        disabled={isProcessingFor3D || isLoading || !outfitImage}
                                        className="w-full max-w-xs px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-lg hover:bg-teal-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {isProcessingFor3D ? (
                                            <span className="flex items-center justify-center">
                                                <SpinnerIcon className="w-5 h-5 mr-2" />
                                                Procesando para 3D...
                                            </span>
                                        ) : 'Procesar Prenda para 3D'}
                                    </button>
                                </div>
                                
                                {isProcessingFor3D && (
                                    <div className="flex flex-col items-center justify-center h-96 bg-zinc-900/50 rounded-lg">
                                        <SpinnerIcon className="w-12 h-12 text-indigo-400" />
                                        <p className="mt-4 text-zinc-300">Preparando el visor 3D...</p>
                                    </div>
                                )}
                                {processedGarmentFor3D && (
                                    <div className="aspect-w-3 aspect-h-4 lg:aspect-w-16 lg:aspect-h-9 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700">
                                        <ThreeDViewer
                                            garmentSrc={processedGarmentFor3D}
                                            mannequinUrl={MANNEQUIN_3D_MODEL_URL}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <p className="text-center text-sm font-medium text-zinc-300 mb-3">Select Aspect Ratio</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {aspectRatioOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setAspectRatio(option.id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            aspectRatio === option.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {option.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <p className="text-center text-sm font-medium text-zinc-300 mb-3">Calidad de Generación</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {Object.entries(promptQualityOptions).map(([id, { name }]) => (
                                    <button
                                        key={id}
                                        onClick={() => setPromptQuality(id as 'ultra' | 'fast')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            promptQuality === id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-center text-sm font-medium text-zinc-300 mb-3">Select Style</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                {Object.entries(promptTemplates).map(([id, { name }]) => (
                                    <button
                                        key={id}
                                        onClick={() => handleStyleChange(id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                            activeStyle === id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                                {activeStyle === 'custom' && (
                                     <span className="px-4 py-2 text-sm font-semibold rounded-md bg-purple-600 text-white cursor-default">
                                        Custom
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-6 text-zinc-200">Detailed Styling & Modifications</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                                {/* Column 1: Garment Modifications */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Largo Prenda</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(garmentLengthOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setGarmentLength(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${garmentLength === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Ajuste Prenda</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(garmentFitOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setGarmentFit(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${garmentFit === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Column 2: Add-ons */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Añadir Medias</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(fixedAccessoryOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setFixedAccessory(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${fixedAccessory === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Añadir Cinturón</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(beltOptions).map(([id, { name }]) => (
                                                <button key={id} onClick={() => setBelt(id)} className={`w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${belt === id ? 'bg-indigo-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-xl font-semibold text-center mb-2 text-zinc-200">👠 Shoe Swap (Post-Generation)</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-6">
                                Genera primero el "Full Body Shot". Después, usa estos botones para cambiar el calzado en la imagen generada.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-lg mx-auto">
                                {Object.entries(shoeSwapOptions).map(([id, { name }]) => (
                                    <button 
                                        key={id} 
                                        onClick={() => handleShoeSwap(id)}
                                        disabled={!isFullBodyGenerated || isLoading || isSwappingShoes}
                                        className="w-full px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>


                        <div className="mt-8 border-t border-zinc-700 pt-8">
                            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-200">Customize Prompts (Advanced)</h3>
                             <p className="text-center text-sm text-zinc-400 max-w-xl mx-auto mb-6">
                                Aquí puedes editar el prompt base para varias de las generaciones clave. El editor te dará sugerencias para mejorar los resultados.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                <PromptEditor
                                    id="full-body-prompt"
                                    label="Full Body Shot (Front) - Base"
                                    value={customFullBodyPrompt}
                                    onChange={setCustomFullBodyPrompt}
                                    validation={fullBodyPromptValidation}
                                />
                                <PromptEditor
                                    id="full-body-back-prompt"
                                    label="Full Body Shot (Back) - Base"
                                    value={customFullBodyBackPrompt}
                                    onChange={setCustomFullBodyBackPrompt}
                                    validation={fullBodyBackPromptValidation}
                                />
                                <PromptEditor
                                    id="virtual-try-on-prompt"
                                    label="Virtual Try-On - Base"
                                    value={customVirtualTryOnPrompt}
                                    onChange={setCustomVirtualTryOnPrompt}
                                    validation={virtualTryOnPromptValidation}
                                />

                                <div className="md:col-span-2 space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                    <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Plantillas de Prompt para Vinted</h4>
                                    <div className="flex justify-center flex-wrap gap-2">
                                        {Object.entries(vintedTemplates).map(([key, { name }]) => (
                                            <button
                                                key={key}
                                                onClick={() => handleVintedTemplateSelect(key)}
                                                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-200 ${
                                                    activeVintedTemplate === key
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                                }`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                        <PromptEditor
                                            id="vinted-front-prompt"
                                            label="Pose Vinted (Front) - Base"
                                            value={customVintedFrontPrompt}
                                            onChange={setCustomVintedFrontPrompt}
                                            validation={vintedFrontPromptValidation}
                                        />
                                        <PromptEditor
                                            id="vinted-back-prompt"
                                            label="Pose Vinted (Back) - Base"
                                            value={customVintedBackPrompt}
                                            onChange={setCustomVintedBackPrompt}
                                            validation={vintedBackPromptValidation}
                                        />
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2 space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                    <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Vinted Specialized (Anti-Ban) & Playground</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                        <PromptEditor
                                            id="vinted-home-prompt"
                                            label="Vinted Home (Anti-Ban) - Base"
                                            value={customVintedHomePrompt}
                                            onChange={setCustomVintedHomePrompt}
                                            validation={vintedHomePromptValidation}
                                        />
                                        <PromptEditor
                                            id="vinted-mirror-prompt"
                                            label="Vinted Mirror Selfie - Base"
                                            value={customVintedMirrorPrompt}
                                            onChange={setCustomVintedMirrorPrompt}
                                            validation={vintedMirrorPromptValidation}
                                        />
                                        <div className="md:col-span-2">
                                            <PromptEditor
                                                id="playground-prompt"
                                                label="🧪 Prompt Playground / Test Lab"
                                                value={customPlaygroundPrompt}
                                                onChange={setCustomPlaygroundPrompt}
                                                validation={playgroundPromptValidation}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2 space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                    <h4 className="text-md font-medium text-zinc-300 mb-3 text-center">Editorial Prompts</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                        <PromptEditor
                                            id="urban-prompt"
                                            label="City Lifestyle - Base"
                                            value={customUrbanPrompt}
                                            onChange={setCustomUrbanPrompt}
                                            validation={urbanPromptValidation}
                                        />
                                        <PromptEditor
                                            id="rural-prompt"
                                            label="Weekend Getaway - Base"
                                            value={customRuralPrompt}
                                            onChange={setCustomRuralPrompt}
                                            validation={ruralPromptValidation}
                                        />
                                        <PromptEditor
                                            id="rooftop-prompt"
                                            label="Rooftop Sunset - Base"
                                            value={customRooftopPrompt}
                                            onChange={setCustomRooftopPrompt}
                                            validation={rooftopPromptValidation}
                                        />
                                        <PromptEditor
                                            id="cafe-prompt"
                                            label="Café Terrace - Base"
                                            value={customCafePrompt}
                                            onChange={setCustomCafePrompt}
                                            validation={cafePromptValidation}
                                        />
                                        <PromptEditor
                                            id="night-prompt"
                                            label="Night City Neon - Base"
                                            value={customNightPrompt}
                                            onChange={setCustomNightPrompt}
                                            validation={nightPromptValidation}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center flex justify-center items-center gap-4">
                            <button
                                onClick={() => setIsVintedModalOpen(true)}
                                disabled={isLoading || isAnalyzing || isSuggesting || isSwappingShoes || isGeneratingMannequin}
                                className="px-10 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out"
                            >
                                Asistente Vinted
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!modelImage || (!outfitImage && !backOutfitImage) || isLoading || isAnalyzing || isSuggesting || isSwappingShoes || isGeneratingMannequin}
                                className="px-10 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
                            >
                                {isLoading ? 'Generating All...' : 'Generate Photoshoot'}
                            </button>
                        </div>
                        {error && <p className="text-center text-red-400 mt-4">{error}</p>}
                    </div>

                    <div className="mt-12">
                        <h2 className="text-3xl font-bold text-center mb-8 text-zinc-200">Your Generated Photoshoot</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {generatedImages.map((image) => (
                                <GeneratedImageCard 
                                    key={image.id} 
                                    {...image} 
                                    onEdit={() => setEditingImage(image)}
                                    onRegenerate={() => handleGenerateSingle(image.id)}
                                    onGenerate={() => handleGenerateSingle(image.id)}
                                    onSuggestAccessories={handleSuggestAccessories}
                                    isGenerationPossible={getIsGenerationPossible(image.id)}
                                    onSendMessage={(message) => handleSendMessage(image.id, message)}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
            {editingImage && (
                <ImageEditorModal
                    image={editingImage}
                    onClose={() => setEditingImage(null)}
                    onSave={handleSaveEdit}
                />
            )}
            {isVintedModalOpen && (
                <VintedAssistantModal
                    isOpen={isVintedModalOpen}
                    onClose={() => {
                        setIsVintedModalOpen(false)
                        setStyleAnalysisResult(null);
                    }}
                    onAnalyze={handleStyleAnalysis}
                    isAnalyzing={isAnalyzing}
                    styleAnalysisResult={styleAnalysisResult}
                    modelImage={modelImage}
                    outfitImage={outfitImage}
                    modelMeasurements={modelMeasurements}
                />
            )}
            {isSuggestionModalOpen && (
                 <AccessorySuggestionModal
                    isOpen={isSuggestionModalOpen}
                    isLoading={isSuggesting}
                    suggestions={accessorySuggestions}
                    onClose={() => setIsSuggestionModalOpen(false)}
                    onSelectAccessory={handleSelectSuggestedAccessory}
                />
            )}
            {showInstallBanner && (
                <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
                    <div className="bg-indigo-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <div>
                            <p className="font-semibold">Instalar App</p>
                            <p className="text-sm text-indigo-200">Añadir a pantalla de inicio para acceso rápido.</p>
                        </div>
                        <button
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-md hover:bg-indigo-100 transition-colors flex-shrink-0"
                            aria-label="Install PWA"
                        >
                            Instalar
                        </button>
                        <button
                            onClick={() => setShowInstallBanner(false)}
                            className="p-1.5 rounded-full hover:bg-indigo-700/50 transition-colors"
                            aria-label="Dismiss install prompt"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                .form-input {
                    background-color: rgb(24 24 27 / 1);
                    border: 1px solid rgb(63 63 70 / 1);
                    border-radius: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    color: rgb(212 212 216 / 1);
                    transition: all 0.2s;
                    width: 100%;
                }
                .form-input:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: rgb(99 102 241 / 1);
                    box-shadow: 0 0 0 2px rgb(99 102 241 / 0.5);
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
                .prose-styles strong { color: #e4e4e7; font-weight: 600; }
                .prose-styles p { margin-bottom: 0.5em; line-height: 1.6; }
                .prose-styles ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5em; margin-bottom: 0.5em; }
                .prose-styles li { margin-bottom: 0.25em; }
            `}</style>
        </div>
    );
};

export default App;
