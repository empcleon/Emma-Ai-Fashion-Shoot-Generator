import type { MedidasPrenda, ModelMeasurements, AnalisisMedidas, FitCategoria, TallaValidacion } from '../types';
import { validarTallaEtiqueta } from '../lib/brandSizeCharts';
import { parseCm } from './parsingUtils';
import { clasificarLargoVestido } from './clasificadorLargos';

const DEFAULT_ALTURA = 178; // User's height as default
const MEDIDAS_REFERENCIA = { // User's measurements
    pecho: 98,
    cintura: 76,
    cadera: 102,
};

/**
 * Analyzes all measurements of a garment to provide a comprehensive analysis.
 * @param medidasPrenda The measurements of the garment.
 * @param modelMeasurements The reference measurements of the model/user.
 * @returns A full analysis including size, fit, and recommendations.
 */
export function analizarMedidasPrenda(medidasPrenda: MedidasPrenda, modelMeasurements: ModelMeasurements): AnalisisMedidas {
    const pechoRef = parseCm(modelMeasurements.bust) ?? MEDIDAS_REFERENCIA.pecho;
    const cinturaRef = parseCm(modelMeasurements.waist) ?? MEDIDAS_REFERENCIA.cintura;
    const caderaRef = parseCm(modelMeasurements.hips) ?? MEDIDAS_REFERENCIA.cadera;

    const largoCm = parseCm(medidasPrenda.largo);
    const pechoCm = parseCm(medidasPrenda.anchoPecho);
    const cinturaCm = parseCm(medidasPrenda.anchoCintura);
    const caderaCm = parseCm(medidasPrenda.anchoCadera);
    
    // 1. Categoría de Largo (using the new, precise system)
    const categoriaLargo = largoCm ? clasificarLargoVestido(largoCm) : null;

    // 2. Talla Estimada (basada en el contorno de pecho)
    let tallaEstimada = 'S/M';
    if (pechoCm) {
        const contornoPecho = pechoCm * 2;
        if (contornoPecho < 84) tallaEstimada = 'XS';
        else if (contornoPecho < 88) tallaEstimada = 'XS/S';
        else if (contornoPecho < 92) tallaEstimada = 'S';
        else if (contornoPecho < 96) tallaEstimada = 'S/M';
        else if (contornoPecho < 102) tallaEstimada = 'M';
        else if (contornoPecho < 106) tallaEstimada = 'M/L';
        else if (contornoPecho < 112) tallaEstimada = 'L';
        else tallaEstimada = 'XL';
    }

    // 3. Análisis de Ajuste (Fit)
    const getFit = (garmentContour: number | null, refContour: number): FitCategoria => {
        if (!garmentContour) return 'Regular';
        const diff = garmentContour - refContour;
        const allowance = medidasPrenda.esElastico ? 4 : 2;
        if (diff < allowance) return 'Ajustado';
        if (diff > 8) return 'Holgado';
        return 'Regular';
    };

    const fitPecho = getFit(pechoCm ? pechoCm * 2 : null, pechoRef);
    const fitCintura = getFit(cinturaCm ? cinturaCm * 2 : null, cinturaRef);
    const fitCadera = getFit(caderaCm ? caderaCm * 2 : null, caderaRef);
    
    // Determine general fit
    const fitScores = { 'Ajustado': 1, 'Regular': 2, 'Holgado': 3 };
    const avgFitScore = (fitScores[fitPecho] + fitScores[fitCintura] + fitScores[fitCadera]) / 3;
    let fitGeneral: FitCategoria = 'Regular';
    if (avgFitScore < 1.8) fitGeneral = 'Ajustado';
    if (avgFitScore > 2.2) fitGeneral = 'Holgado';
    
    // 4. Recomendaciones
    const recomendaciones: string[] = [];
    if (pechoCm) {
        if (fitPecho === 'Ajustado') {
            recomendaciones.push(`⚠️ El pecho puede quedar ajustado. Ideal para contorno ${pechoCm * 2 - 4}-${pechoCm * 2}cm.`);
        } else {
            recomendaciones.push(`✅ Ideal para contorno de pecho ${pechoCm * 2 - 8}-${pechoCm * 2}cm.`);
        }
    }
    if (caderaCm && fitCadera === 'Holgado') {
        recomendaciones.push(`✅ Corte holgado en la cadera, muy cómodo.`);
    }
    if (categoriaLargo && categoriaLargo.categoria === 'maxi') {
         const alturaRef = parseCm(modelMeasurements.height) ?? DEFAULT_ALTURA;
        recomendaciones.push(`👗 Largo maxi: puede necesitar ajuste en altura < ${alturaRef - 10}cm.`);
    }
    if (recomendaciones.length === 0) {
        recomendaciones.push('✅ Prenda versátil y de corte estándar.');
    }

    // 5. Validación de Talla por Marca
    const validacionTalla = validarTallaEtiqueta(
        medidasPrenda.marca,
        medidasPrenda.tallaEtiqueta,
        { pecho: pechoCm, cintura: cinturaCm, cadera: caderaCm }
    );

    return {
        categoriaLargo,
        tallaEstimada,
        fitAnalisis: {
            pecho: fitPecho,
            cintura: fitCintura,
            cadera: fitCadera,
            general: fitGeneral,
        },
        recomendaciones,
        validacionTalla,
    };
}