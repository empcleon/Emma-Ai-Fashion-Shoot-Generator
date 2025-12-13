

import React, { useState, useCallback, useEffect } from 'react';
// Fix: Import ImageInput from the centralized types file.
import type { UploadedFile, ModelMeasurements, MedidasPrenda, AnalisisMedidas, SugerenciaPrecio, AnalisisVisual, ImageInput } from '../types';
import { GarmentConditionEnum } from '../types';
import { 
    getVisualAnalysisForVinted,
    generateAnonymizedImage, 
    generateInfographic,
    generateMeasurementProof,
    processImage
} from '../services/geminiService';
import { analizarMedidasPrenda } from '../utils/garmentUtils';
import { calcularPrecioSugerido } from '../lib/pricingFactors';
import { generarDescripcionOptimizada, generarTituloOptimizado, generarHashtags } from '../lib/vintedTemplates';
import { cropImage } from '../utils/fileUtils';
import { parseCm } from '../utils/parsingUtils';
import { existeCalibración } from '../utils/clasificadorLargos';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import ImageDropzone from './ImageDropzone'; // Import the component
import { CalibradorMedidas } from './CalibradorMedidas';
import { ClasificadorLargoVisual } from './ClasificadorLargoVisual';


interface VintedAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
    styleAnalysisResult: string | null;
    modelImage: UploadedFile | null;
    outfitImage: UploadedFile | null;
    modelMeasurements: ModelMeasurements;
}

interface ListingText {
    title: string;
    description: string;
    hashtags: string;
}

const initialMedidas: MedidasPrenda = {
    largo: '',
    anchoPecho: '',
    anchoCintura: '',
    anchoCadera: '',
    anchoHombros: '',
    esElastico: false,
    marca: '',
    tallaEtiqueta: '',
    precioCompra: '',
    estado: GarmentConditionEnum.MUY_BUEN_ESTADO,
};

const BRANDS = ['Zara', 'H&M', 'Mango', 'Shein', 'Stradivarius', 'Pull&Bear', 'Massimo Dutti', 'COS', 'Sin marca'];
const garmentConditionMap: Record<GarmentConditionEnum, string> = {
    [GarmentConditionEnum.NUEVO_CON_ETIQUETA]: 'Nuevo con etiqueta',
    [GarmentConditionEnum.COMO_NUEVO]: 'Como nuevo',
    [GarmentConditionEnum.MUY_BUEN_ESTADO]: 'Muy buen estado',
    [GarmentConditionEnum.BUEN_ESTADO]: 'Buen estado',
    [GarmentConditionEnum.ACEPTABLE]: 'Aceptable',
};

const editorialBackgroundOptions = {
    'urban': { name: 'Urbano', promptInstruction: 'a modern urban street with interesting architecture and soft, late afternoon lighting' },
    'nature': { name: 'Naturaleza', promptInstruction: 'a serene natural landscape, like a beautiful field with wildflowers or a tranquil forest path' },
    'bohemian': { name: 'Interior Bohemio', promptInstruction: 'a stylish and cozy bohemian-style interior with plants, textures, and warm, natural light' },
    'minimalist': { name: 'Interior Minimalista', promptInstruction: 'a minimalist, chic interior with clean lines, neutral colors, and a single piece of statement furniture' }
};

type ProcessingState = { [key: string]: boolean };

interface SellerAssistantTabProps {
    modelMeasurements: ModelMeasurements;
    step: number;
    setStep: React.Dispatch<React.SetStateAction<number>>;
}

const SellerAssistantTab: React.FC<SellerAssistantTabProps> = ({ modelMeasurements, step, setStep }) => {
    const [medidasPrenda, setMedidasPrenda] = useState<MedidasPrenda>(initialMedidas);
    const [analisis, setAnalisis] = useState<AnalisisMedidas | null>(null);
    const [analisisVisual, setAnalisisVisual] = useState<AnalisisVisual | null>(null);
    const [precioSugerido, setPrecioSugerido] = useState<SugerenciaPrecio | null>(null);
    const [mostrarCalibrador, setMostrarCalibrador] = useState(false);
    const [calibrado, setCalibrado] = useState(existeCalibración());

    // Image states
    const [mannequinImage, setMannequinImage] = useState<UploadedFile | null>(null);
    const [flatLayImage, setFlatLayImage] = useState<UploadedFile | null>(null);
    const [studioLookImage, setStudioLookImage] = useState<string | null>(null);
    const [editorialLookImage, setEditorialLookImage] = useState<string | null>(null);
    const [editorialBackground, setEditorialBackground] = useState<string>('urban');
    
    const [infographicImage, setInfographicImage] = useState<string | null>(null);
    const [measurementProofImage, setMeasurementProofImage] = useState<string | null>(null);
    const [detailImage, setDetailImage] = useState<UploadedFile | null>(null);
    const [labelImage, setLabelImage] = useState<UploadedFile | null>(null);
    
    // Loading and error states
    const [isProcessing, setIsProcessing] = useState<ProcessingState>({});
    const [error, setError] = useState<string | null>(null);
    const [listingText, setListingText] = useState<ListingText | null>(null);


    useEffect(() => {
        const resultadoAnalisis = analizarMedidasPrenda(medidasPrenda, modelMeasurements);
        setAnalisis(resultadoAnalisis);
        const sugerencia = calcularPrecioSugerido(medidasPrenda.precioCompra, medidasPrenda.marca, medidasPrenda.estado);
        setPrecioSugerido(sugerencia);
    }, [medidasPrenda, modelMeasurements]);
    
    const handleMedidasChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = (target: EventTarget): target is HTMLInputElement => (target as HTMLInputElement).type === 'checkbox';
        setMedidasPrenda(prev => ({ ...prev, [name]: isCheckbox(e.target) ? e.target.checked : value }));
    };

    const setProcessingState = (key: string, value: boolean) => {
        setIsProcessing(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerateStudioLook = async () => {
        if (!mannequinImage || !flatLayImage) return;
        setError(null);
        setProcessingState('studio', true);
        try {
            const prompt = `You are an expert digital fashion stylist. Your task is to perform a high-fidelity virtual try-on.
The first image contains a mannequin wearing a black base jumpsuit. The second image contains a garment in a 'flat lay' view.
Your primary goal is to **completely replace the black jumpsuit** with the garment from the second image. The garment must be perfectly fitted to the mannequin's body, conforming to its curves and creating realistic draping, folds, shadows, and highlights. The final result should look like the person is actually wearing the garment, not like a simple overlay.
Once the virtual try-on is complete, place the person against a clean, professional, minimalist light grey studio background with even lighting. The final image must be a photorealistic, full-body shot that maintains the original pose and body shape of the person.`;
            const imageInputs: ImageInput[] = [
                { base64: mannequinImage.base64, mimeType: mannequinImage.mimeType },
                { base64: flatLayImage.base64, mimeType: flatLayImage.mimeType }
            ];
            const resultSrc = await processImage(prompt, imageInputs);
            setStudioLookImage(resultSrc);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setError(`Error al generar foto de estudio: ${message}`);
        } finally {
            setProcessingState('studio', false);
        }
    };

    const handleGenerateEditorialLook = async () => {
        if (!mannequinImage || !flatLayImage) return;
        setError(null);
        setProcessingState('editorial', true);
        try {
            const backgroundInstruction = editorialBackgroundOptions[editorialBackground as keyof typeof editorialBackgroundOptions].promptInstruction;
            const prompt = `You are an expert fashion photo editor. Your task is to create a realistic editorial photograph.
The first image is a mannequin in a black jumpsuit. The second is a garment.
First, **completely replace the black jumpsuit** with the garment from the second image. It is crucial that the garment is realistically fitted to the mannequin's body, adapting its shape and creating natural folds and shadows to look authentic.
After dressing the mannequin, seamlessly place them into the following scene: '${backgroundInstruction}'. You must adjust the lighting, shadows, and color grading on the person and garment to perfectly match the new background, creating a cohesive and atmospheric high-fashion photograph. Maintain the original pose and body shape.`;
            const imageInputs: ImageInput[] = [
                { base64: mannequinImage.base64, mimeType: mannequinImage.mimeType },
                { base64: flatLayImage.base64, mimeType: flatLayImage.mimeType }
            ];
            const resultSrc = await processImage(prompt, imageInputs);
            setEditorialLookImage(resultSrc);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setError(`Error al generar foto editorial: ${message}`);
        } finally {
            setProcessingState('editorial', false);
        }
    };
    
    const handleGenerateInfographic = async () => {
        if (!flatLayImage || !analisis) return;
        setError(null);
        setProcessingState('infographic', true);
        try {
            const imageInput: ImageInput = { base64: flatLayImage.base64, mimeType: flatLayImage.mimeType };
            const info = { marca: medidasPrenda.marca, talla: analisis.tallaEstimada };
            const resultSrc = await generateInfographic(imageInput, medidasPrenda, info);
            setInfographicImage(resultSrc);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setError(`Error al generar la infografía: ${message}`);
        } finally {
            setProcessingState('infographic', false);
        }
    };

    const handleGenerateMeasurementProof = async () => {
        if (!flatLayImage) return;
        setError(null);
        setProcessingState('measurementProof', true);
        try {
            const imageInput: ImageInput = { base64: flatLayImage.base64, mimeType: flatLayImage.mimeType };
            const resultSrc = await generateMeasurementProof(imageInput, medidasPrenda);
            setMeasurementProofImage(resultSrc);
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
             setError(`Error al generar cinta métrica visual: ${message}`);
        } finally {
             setProcessingState('measurementProof', false);
        }
    };

    const handleAnalyzeAndGenerateListing = async () => {
        if (!flatLayImage || !analisis) {
            setError("Por favor, sube una foto 'flat lay' y completa las medidas.");
            return;
        }
        setError(null);
        setProcessingState('listing', true);
        setListingText(null);
        setAnalisisVisual(null);

        try {
            // Step 1: Get visual analysis
            const imageInput: ImageInput = { base64: flatLayImage.base64, mimeType: flatLayImage.mimeType };
            const visualAnalysis = await getVisualAnalysisForVinted(imageInput);
            setAnalisisVisual(visualAnalysis);
            
            // Step 2: Generate text locally using templates
            const precio = parseCm(medidasPrenda.precioCompra) || 0;
            const estadoDisplay = garmentConditionMap[medidasPrenda.estado] || 'Buen estado';

            const description = generarDescripcionOptimizada(visualAnalysis, medidasPrenda, analisis, estadoDisplay, precio);
            const title = generarTituloOptimizado(visualAnalysis, medidasPrenda, analisis);
            const hashtags = generarHashtags(visualAnalysis, medidasPrenda, analisis);

            setListingText({ title, description, hashtags });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setError(`Error al generar el texto: ${message}`);
        } finally {
            setProcessingState('listing', false);
        }
    };


    const downloadImage = (src: string, filename: string) => {
        const link = document.createElement('a');
        link.href = src;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const renderStep = () => {
        const largoCmValue = parseCm(medidasPrenda.largo) || 0;
        switch (step) {
            case 1: // Medidas y Datos
                return (
                     <div className="space-y-6">
                         {!calibrado && (
                            <div className="alerta-calibracion">
                                <p>⚠️ Para máxima precisión en el análisis de largos, calibra el sistema con tus medidas corporales.</p>
                                <button onClick={() => setMostrarCalibrador(true)}>
                                    ⚙️ Calibrar Ahora (5-10 minutos)
                                </button>
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-zinc-200">Datos de la Prenda</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                {/* Form fields for brand, size, price, condition */}
                                 <div>
                                    <label htmlFor="marca" className="block text-sm font-medium text-zinc-400 mb-1">Marca</label>
                                    <select id="marca" name="marca" value={medidasPrenda.marca} onChange={handleMedidasChange} className="form-input">
                                        <option value="">Seleccionar</option>
                                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="tallaEtiqueta" className="block text-sm font-medium text-zinc-400 mb-1">Talla Etiqueta</label>
                                    <input id="tallaEtiqueta" name="tallaEtiqueta" type="text" value={medidasPrenda.tallaEtiqueta} onChange={handleMedidasChange} className="form-input" placeholder="Ej: S, M, 38"/>
                                </div>
                                <div>
                                    <label htmlFor="precioCompra" className="block text-sm font-medium text-zinc-400 mb-1">Precio Compra (€)</label>
                                    <input id="precioCompra" name="precioCompra" type="text" value={medidasPrenda.precioCompra} onChange={handleMedidasChange} className="form-input" placeholder="Ej: 8"/>
                                </div>
                                <div>
                                     <label htmlFor="estado" className="block text-sm font-medium text-zinc-400 mb-1">Estado</label>
                                     <select id="estado" name="estado" value={medidasPrenda.estado} onChange={handleMedidasChange} className="form-input">
                                         {Object.entries(garmentConditionMap).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                         ))}
                                     </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-zinc-200">Medidas de la Prenda (en plano)</h3>
                             <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                {/* Form fields for measurements */}
                                <div>
                                    <label htmlFor="largo" className="block text-sm font-medium text-zinc-400 mb-1">Largo (cm)</label>
                                    <input id="largo" name="largo" type="text" value={medidasPrenda.largo} onChange={handleMedidasChange} className="form-input" placeholder="Ej: 95"/>
                                </div>
                                <div>
                                    <label htmlFor="anchoHombros" className="block text-sm font-medium text-zinc-400 mb-1">Hombros (cm)</label>
                                    <input id="anchoHombros" name="anchoHombros" type="text" value={medidasPrenda.anchoHombros} onChange={handleMedidasChange} className="form-input" placeholder="Ej: 42"/>
                                </div>
                                <div>
                                    <label htmlFor="anchoPecho" className="block text-sm font-medium text-zinc-400 mb-1">Pecho (cm)</label>
                                    <input id="anchoPecho" name="anchoPecho" type="text" value={medidasPrenda.anchoPecho} onChange={handleMedidasChange} className="form-input" placeholder="Ej: 52"/>
                                </div>
                                <div>
                                    <label htmlFor="anchoCintura" className="block text-sm font-medium text-zinc-400 mb-1">Cintura (cm)</label>
                                    <input id="anchoCintura" name="anchoCintura" type="text" value={medidasPrenda.anchoCintura} onChange={handleMedidasChange} className="form-input" placeholder="Ej: 40"/>
                                </div>
                                <div>
                                    <label htmlFor="anchoCadera" className="block text-sm font-medium text-zinc-400 mb-1">Cadera (cm)</label>
                                    <input id="anchoCadera" name="anchoCadera" type="text" value={medidasPrenda.anchoCadera} onChange={handleMedidasChange} className="form-input" placeholder="Ej: 54"/>
                                </div>
                                <div className="flex items-end pb-1">
                                     <div className="flex items-center">
                                        <input id="esElastico" name="esElastico" type="checkbox" checked={medidasPrenda.esElastico} onChange={handleMedidasChange} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"/>
                                        <label htmlFor="esElastico" className="ml-2 block text-sm text-zinc-400">Elástico</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                         {largoCmValue > 0 && (
                            <ClasificadorLargoVisual
                                largoCm={largoCmValue}
                                tipo="vestido"
                            />
                        )}
                    </div>
                );
            case 2: // Fotos Base
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageDropzone id="mannequin" title="1. Sube tu foto como Maniquí" onFileChange={setMannequinImage} currentFile={mannequinImage} />
                        <ImageDropzone id="flatlay-base" title="2. Sube la Prenda (en plano)" onFileChange={setFlatLayImage} currentFile={flatLayImage} />
                    </div>
                );
            case 3: // Generar Fotos IA
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna Studio Look */}
                        <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <h3 className="text-lg font-semibold text-center text-zinc-200">Foto de Producto (Studio Look)</h3>
                            <p className="text-xs text-center text-zinc-400 mb-4">Crea una imagen limpia y profesional con fondo de estudio, perfecta como foto principal.</p>
                            <button onClick={handleGenerateStudioLook} className="btn-primary w-full" disabled={isProcessing.studio || !mannequinImage || !flatLayImage}>
                                {isProcessing.studio ? <SpinnerIcon className="w-5 h-5 inline mr-2"/> : '✨'}
                                Generar Foto Studio
                            </button>
                            <div className="aspect-w-3 aspect-h-4 bg-zinc-900/80 rounded-lg flex items-center justify-center text-zinc-500 overflow-hidden border border-zinc-700">
                                {isProcessing.studio
                                    ? <div className="flex flex-col items-center justify-center h-full"><SpinnerIcon className="w-8 h-8"/><p className="text-xs mt-2">Vistiendo al maniquí...</p></div> 
                                    : (studioLookImage
                                        ? <img src={studioLookImage} alt="Studio Look Preview" className="object-contain w-full h-full" /> 
                                        : <span className="text-sm">Vista Previa Studio</span>)
                                }
                            </div>
                        </div>

                        {/* Columna Editorial Look */}
                         <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <h3 className="text-lg font-semibold text-center text-zinc-200">Foto Editorial (Look Creativo)</h3>
                             <p className="text-xs text-center text-zinc-400 mb-2">Genera una foto de "lifestyle" que capture la atención. Elige un fondo:</p>
                             <select value={editorialBackground} onChange={(e) => setEditorialBackground(e.target.value)} className="form-input mb-2">
                                 {Object.entries(editorialBackgroundOptions).map(([id, { name }]) => (
                                     <option key={id} value={id}>{name}</option>
                                 ))}
                             </select>
                            <button onClick={handleGenerateEditorialLook} className="btn-primary w-full" disabled={isProcessing.editorial || !mannequinImage || !flatLayImage}>
                                {isProcessing.editorial ? <SpinnerIcon className="w-5 h-5 inline mr-2"/> : '📸'}
                                Generar Foto Editorial
                            </button>
                            <div className="aspect-w-3 aspect-h-4 bg-zinc-900/80 rounded-lg flex items-center justify-center text-zinc-500 overflow-hidden border border-zinc-700">
                                {isProcessing.editorial
                                    ? <div className="flex flex-col items-center justify-center h-full"><SpinnerIcon className="w-8 h-8"/><p className="text-xs mt-2">Creando la escena...</p></div> 
                                    : (editorialLookImage
                                        ? <img src={editorialLookImage} alt="Editorial Look Preview" className="object-contain w-full h-full" /> 
                                        : <span className="text-sm">Vista Previa Editorial</span>)
                                }
                            </div>
                        </div>
                    </div>
                );
            case 4: // Infografía y Descripción
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-400">Asegúrate de haber subido la foto de la prenda en plano en el paso anterior.</p>
                            {flatLayImage ? (
                                 <img src={flatLayImage.preview} alt="Flat lay" className="rounded-lg w-48 mx-auto" />
                            ) : (
                                <div className="text-center text-zinc-500 p-4">Sube la foto en plano en el paso 2.</div>
                            )}

                             {flatLayImage && (
                                <div className="p-4 bg-zinc-900/50 rounded-lg space-y-3">
                                     <button onClick={handleGenerateMeasurementProof} className="btn-primary w-full bg-cyan-600 hover:bg-cyan-500" disabled={isProcessing.measurementProof}>
                                        {isProcessing.measurementProof ? <SpinnerIcon className="w-5 h-5 inline mr-2"/> : '📏'}
                                        Generar Cinta Métrica Visual
                                    </button>
                                    <button onClick={handleGenerateInfographic} className="btn-primary w-full" disabled={isProcessing.infographic || !analisis}>
                                        {isProcessing.infographic ? <SpinnerIcon className="w-5 h-5 inline mr-2"/> : '🎨'}
                                        Generar Infografía Resumen
                                    </button>
                                     <button onClick={handleAnalyzeAndGenerateListing} className="btn-primary w-full" disabled={isProcessing.listing || !analisis}>
                                        {isProcessing.listing ? <SpinnerIcon className="w-5 h-5 inline mr-2"/> : '✨'}
                                        Analizar Estilo y Generar Descripción
                                    </button>
                                </div>
                            )}
                             {analisisVisual && (
                                <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 space-y-2">
                                    <h4 className="font-semibold text-zinc-200">Resultados del Análisis Visual</h4>
                                    <div className="text-sm text-zinc-400">
                                        <p><strong>Estilo Detectado:</strong> {analisisVisual.estilo} (Confianza: {Math.round(analisisVisual.confianza * 100)}%)</p>
                                        <p><strong>Tejido Aparente:</strong> {analisisVisual.tejido}</p>
                                        <p><strong>Keywords AI:</strong> {analisisVisual.keywords.join(', ')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className='space-y-4'>
                            {/* Visual Proof Display */}
                             <div className="bg-zinc-900/50 rounded-lg border border-zinc-700 overflow-hidden">
                                <p className="text-xs text-center text-zinc-400 py-2">Prueba de Medidas (Visual)</p>
                                <div className="aspect-w-1 aspect-h-1 flex items-center justify-center">
                                    {isProcessing.measurementProof ? <SpinnerIcon className="w-8 h-8 text-cyan-500"/> : 
                                    (measurementProofImage ? <img src={measurementProofImage} alt="Measurement Proof" className="object-contain w-full h-full" /> : <span className="text-zinc-600 text-xs">Sin imagen generada</span>)
                                    }
                                </div>
                            </div>

                            {/* Infographic Display */}
                             <div className="bg-zinc-900/50 rounded-lg border border-zinc-700 overflow-hidden">
                                <p className="text-xs text-center text-zinc-400 py-2">Infografía Resumen</p>
                                <div className="aspect-w-1 aspect-h-1 flex items-center justify-center">
                                     {isProcessing.infographic ? <SpinnerIcon className="w-8 h-8"/> : 
                                    (infographicImage ? <img src={infographicImage} alt="Infographic" className="object-contain w-full h-full" /> : <span className="text-zinc-600 text-xs">Sin imagen generada</span>)
                                    }
                                </div>
                            </div>
                        </div>
                        {listingText && (
                             <div className="md:col-span-2 space-y-4 p-4 bg-zinc-900/50 rounded-lg">
                                <div>
                                    <label className="font-semibold block mb-2">Título Sugerido</label>
                                    <div className="relative"><input type="text" readOnly value={listingText.title} className="form-input pr-10" /><button onClick={() => copyToClipboard(listingText.title)} title="Copiar" className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button></div>
                                </div>
                                 <div>
                                    <label className="font-semibold block mb-2">Descripción Mejorada</label>
                                    <div className="relative"><textarea readOnly value={listingText.description} rows={8} className="form-input pr-10" /><button onClick={() => copyToClipboard(listingText.description)} title="Copiar" className="absolute top-2 right-2 px-1 flex items-center text-zinc-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button></div>
                                </div>
                                 <div>
                                    <label className="font-semibold block mb-2">Hashtags Sugeridos</label>
                                    <div className="relative"><input type="text" readOnly value={listingText.hashtags} className="form-input pr-10" /><button onClick={() => copyToClipboard(listingText.hashtags)} title="Copiar" className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 5: // Detalles
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageDropzone id="label" title="Foto Etiqueta (Opcional)" onFileChange={setLabelImage} currentFile={labelImage} />
                        <ImageDropzone id="detail" title="Foto Detalle Tejido (Opcional)" onFileChange={setDetailImage} currentFile={detailImage} />
                    </div>
                );
            case 6: // Exportar
                const finalImages = [
                    { name: '1_Modelo_Studio.jpg', src: studioLookImage },
                    { name: '2_Modelo_Editorial.jpg', src: editorialLookImage },
                    { name: '3_Infografia.jpg', src: infographicImage },
                    { name: '4_Cinta_Metrica_Visual.jpg', src: measurementProofImage },
                    { name: '5_Prenda_Plano.jpg', src: flatLayImage?.preview },
                    { name: '6_Etiqueta.jpg', src: labelImage?.preview },
                    { name: '7_Detalle_Tejido.jpg', src: detailImage?.preview },
                ].filter(img => img.src);

                return (
                    <div className="space-y-6">
                         <div className="p-4 bg-zinc-900/50 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-zinc-200">¡Todo listo para publicar!</h3>
                            <p className="text-zinc-400 mt-2">Descarga las imágenes que necesites para tu anuncio. El texto ya fue generado en el paso anterior.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {finalImages.map(img => (
                                <div key={img.name} className="space-y-2">
                                    <img src={img.src!} alt={img.name} className="rounded-lg aspect-[3/4] object-cover"/>
                                    <button onClick={() => downloadImage(img.src!, img.name)} className="btn-secondary w-full text-xs">Descargar</button>
                                </div>
                            ))}
                             {finalImages.length === 0 && <p className="col-span-full text-center text-zinc-500">No hay imágenes finales para mostrar.</p>}
                        </div>
                    </div>
                );
            default: return null;
        }
    }
    
    const steps = ["Medidas", "Fotos Base", "Generar Fotos", "Infografía", "Detalles", "Exportar"];

    return (
        <div className="p-6 text-zinc-300 space-y-6">
            {mostrarCalibrador && (
                <div className="modal-overlay" onClick={() => setMostrarCalibrador(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <CalibradorMedidas
                            onCalibracionCompleta={() => {
                                setMostrarCalibrador(false);
                                setCalibrado(true);
                            }}
                        />
                        <button onClick={() => setMostrarCalibrador(false)} className="absolute top-4 right-4 p-2 rounded-full bg-zinc-700 hover:bg-zinc-600">
                           <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    {steps.map((s, i) => (
                        <React.Fragment key={s}>
                             <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > i + 1 ? 'bg-indigo-600 border-indigo-600 text-white' : step === i + 1 ? 'border-indigo-500 text-indigo-400' : 'border-zinc-600 text-zinc-400'}`}>{i + 1}</div>
                                <p className={`mt-1 text-xs text-center ${step === i + 1 ? 'text-indigo-400' : 'text-zinc-400'}`}>{s}</p>
                            </div>
                            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mt-[-1rem] mx-2 ${step > i + 1 ? 'bg-indigo-600' : 'bg-zinc-600'}`}/>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {error && <p className="text-center text-red-400 p-2 bg-red-900/50 rounded-md">{error}</p>}
            
            <div className="min-h-[400px]">
                {renderStep()}
            </div>
        </div>
    );
};

const BuyerAssistantTab: React.FC<{onAnalyze: () => void, isAnalyzing: boolean, styleAnalysisResult: string | null}> = ({ onAnalyze, isAnalyzing, styleAnalysisResult }) => {
     const renderMarkdown = (text: string) => {
        let html = text;
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
        html = html.replace(/<li>.*<\/li>/gs, '<ul>$&</ul>');
        html = html.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');
        html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
        return html;
    };

    return (
        <div className="p-6">
            {!styleAnalysisResult && !isAnalyzing && (
                 <div className="text-center">
                    <p className="text-zinc-400 mb-4">
                        Analiza el atuendo que has compuesto en la página principal para recibir consejos de estilo personalizados.
                    </p>
                    <button 
                        onClick={onAnalyze} 
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 transition-colors"
                    >
                       Analizar Atuendo Actual
                    </button>
                </div>
            )}

            {isAnalyzing && (
                 <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <SpinnerIcon className="w-10 h-10 text-indigo-400" />
                    <p className="mt-2 text-sm text-zinc-400">Analizando tu estilo...</p>
                </div>
            )}

            {styleAnalysisResult && (
                 <div className="text-zinc-300 prose-styles">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(styleAnalysisResult) }} />
                </div>
            )}
        </div>
    );
};


const VintedAssistantModal: React.FC<VintedAssistantModalProps> = ({ isOpen, onClose, onAnalyze, isAnalyzing, styleAnalysisResult, modelImage, outfitImage, modelMeasurements }) => {
    const [activeTab, setActiveTab] = useState('seller');
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            aria-labelledby="vinted-assistant-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className="bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-6xl m-4 border border-zinc-700 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-zinc-700 flex-shrink-0">
                    <h2 id="vinted-assistant-title" className="text-lg font-semibold text-white">Asistente Vinted</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        aria-label="Cerrar asistente"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="border-b border-zinc-700 flex-shrink-0">
                    <nav className="flex space-x-2 px-4" aria-label="Tabs">
                        <button
                             onClick={() => setActiveTab('seller')}
                             className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${activeTab === 'seller' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'}`}
                        >
                            Asistente de Vendedor
                        </button>
                         <button
                             onClick={() => setActiveTab('buyer')}
                             className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${activeTab === 'buyer' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'}`}
                        >
                            Asistente de Compra
                        </button>
                    </nav>
                </div>
                
                <div className="overflow-y-auto flex-1">
                   {activeTab === 'buyer' && (
                        <BuyerAssistantTab onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} styleAnalysisResult={styleAnalysisResult} />
                   )}
                   {activeTab === 'seller' && (
                        <SellerAssistantTab modelMeasurements={modelMeasurements} step={step} setStep={setStep} />
                   )}
                </div>
                
                 <div className="flex justify-between items-center p-4 border-t border-zinc-700 flex-shrink-0 bg-zinc-800/50">
                    <button onClick={onClose} className="px-6 py-2 bg-zinc-700 text-zinc-200 font-semibold rounded-lg hover:bg-zinc-600 transition-colors">
                        Cerrar
                    </button>

                     {activeTab === 'seller' && (
                        <div className="flex items-center gap-4">
                            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn-secondary">Atrás</button>
                            <button onClick={() => setStep(s => Math.min(6, s + 1))} disabled={step === 6} className="btn-primary">Siguiente</button>
                        </div>
                    )}
                </div>
            <style>{`
                .prose-styles strong { color: #e4e4e7; font-weight: 600; }
                .prose-styles p { margin-bottom: 1em; line-height: 1.6; }
                .prose-styles ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1em; }
                .prose-styles li { margin-bottom: 0.5em; }
                .form-input {
                    background-color: rgb(39 39 42 / 1);
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
                 .btn-secondary {
                    padding: 0.5rem 1rem;
                    background-color: #3f3f46;
                    color: #d4d4d8;
                    font-weight: 600;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                    text-align: center;
                    border: 1px solid #52525b;
                }
                .btn-secondary:hover:not(:disabled) {
                    background-color: #52525b;
                }
                 .btn-secondary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                 .btn-primary {
                    padding: 0.5rem 1rem;
                    background-color: #4f46e5;
                    color: white;
                    font-weight: 600;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                    text-align: center;
                }
                .btn-primary:hover:not(:disabled) {
                    background-color: #6366f1;
                }
                 .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* STYLES FOR NEW COMPONENTS */

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                    overflow-y: auto;
                }

                .modal-content {
                    background: #1f2937;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 1400px;
                    max-height: 95vh;
                    overflow-y: auto;
                    position: relative;
                    border: 1px solid #4b5563;
                }
                .alerta-calibracion {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    color: #92400e;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    border: 2px solid #f59e0b;
                    text-align: center;
                }
                .alerta-calibracion p {
                  font-weight: 600;
                  margin-bottom: 0.75rem;
                }
                .alerta-calibracion button {
                  background: linear-gradient(135deg, #f59e0b, #d97706);
                  color: white;
                  padding: 0.5rem 1.5rem;
                  border: none;
                  border-radius: 8px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }
                .alerta-calibracion button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                }

                /* CalibradorMedidas/styles.css */
                .calibrador-medidas {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 2rem;
                    background: #111827;
                    border-radius: 20px;
                    color: #d1d5db;
                }

                .calibrador-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .calibrador-header h2 {
                    color: #ffffff;
                    font-size: 2rem;
                    margin-bottom: 1rem;
                }

                .instrucciones {
                    background: #3730a3;
                    padding: 1rem;
                    border-radius: 10px;
                    color: #e0e7ff;
                    margin-bottom: 1rem;
                }

                .instrucciones-detalladas {
                    background: #1f2937;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: left;
                    display: inline-block;
                }

                .instrucciones-detalladas p {
                    margin: 0.5rem 0;
                    color: #9ca3af;
                    font-size: 0.95rem;
                }

                .input-altura {
                    background: #1f2937;
                    padding: 1.5rem;
                    border-radius: 15px;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .input-altura label {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    font-size: 1.1rem;
                }

                .label-texto {
                    font-weight: 600;
                    color: #d1d5db;
                }

                .input-altura input {
                    flex: 0 0 100px;
                    padding: 0.75rem;
                    font-size: 1.25rem;
                    font-weight: bold;
                    text-align: center;
                    border: 2px solid #4f46e5;
                    border-radius: 8px;
                    background-color: #374151;
                    color: #ffffff;
                }

                .input-altura .unidad {
                    color: #9ca3af;
                    font-weight: 600;
                }

                .tabs {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                 .tabs button {
                    padding: 1rem;
                    border: 2px solid #374151;
                    border-radius: 10px;
                    background-color: #1f2937;
                    color: #9ca3af;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .tabs button.activo {
                    background-color: #4f46e5;
                    border-color: #6366f1;
                    color: #ffffff;
                }

                .medidas-seccion {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 2rem;
                    align-items: flex-start;
                }
                .ilustracion-container {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background: #1f2937;
                  border-radius: 15px;
                  padding: 1rem;
                }
                .medidas-lista h3 {
                    font-size: 1.25rem;
                    color: #e5e7eb;
                    margin-bottom: 1rem;
                }
                .medida-item {
                    background: #1f2937;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                }
                .medida-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 0.5rem;
                }
                .medida-header .nombre {
                    font-weight: 600;
                    color: #d1d5db;
                }
                .medida-header .aprox {
                    font-size: 0.8rem;
                    color: #6b7280;
                }
                .input-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .input-group input {
                    width: 100%;
                    padding: 0.5rem;
                    font-size: 1rem;
                    border: 1px solid #4b5563;
                    border-radius: 5px;
                    background-color: #374151;
                    color: #ffffff;
                }
                .input-group .unidad {
                    color: #9ca3af;
                }
                .medida-item .ayuda {
                    display: block;
                    font-size: 0.8rem;
                    color: #6b7280;
                    margin-top: 0.5rem;
                }
                .calibrador-footer {
                    text-align: center;
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid #374151;
                }
                .btn-guardar {
                  background: linear-gradient(135deg, #22c55e, #16a34a);
                  color: white;
                  padding: 0.75rem 1.5rem;
                  border: none;
                  border-radius: 10px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }
                .btn-guardar:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
                }
                 .mensaje-exito {
                    margin-top: 1rem;
                    color: #22c55e;
                    background-color: rgba(34, 197, 94, 0.1);
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-weight: 500;
                }
            `}</style>
            </div>
        </div>
    );
};
export default VintedAssistantModal;