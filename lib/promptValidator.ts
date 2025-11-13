// lib/promptValidator.ts

interface ValidationResult {
    valid: boolean;
    warnings: string[];
    suggestions: string[];
}

export function validatePrompt(prompt: string): ValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check length
    if (prompt.length < 100) {
        warnings.push('El prompt es muy corto, lo que puede producir resultados inconsistentes o genéricos.');
    }
    if (prompt.length > 4000) {
        warnings.push('El prompt es muy largo y podría ser truncado por la API, perdiendo instrucciones importantes.');
    }

    // Check for critical keywords
    if (!/realistic|photorealistic|photograph/i.test(prompt)) {
        warnings.push('Falta un énfasis claro en el realismo. El resultado podría parecer un dibujo o CGI.');
        suggestions.push('Añade "photorealistic", "ultra-realistic photograph" para mejorar el realismo.');
    }

    if (!/skin texture|pores/i.test(prompt)) {
        warnings.push('No se especifica la textura de la piel, lo que puede resultar en una apariencia de "plástico" o demasiado retocada.');
        suggestions.push('Añade "natural skin texture with visible pores" para una piel más realista.');
    }

    if (!/NOT plastic|NOT CGI|NOT mannequin/i.test(prompt)) {
        warnings.push('Falta "guía negativa" para evitar un aspecto artificial.');
        suggestions.push('Añade "NOT plastic, NOT CGI, NOT mannequin" al final para guiar a la IA.');
    }

    // Check structure
    if (!/first image|second image|garment/i.test(prompt)) {
        warnings.push('El prompt no especifica claramente qué hacer con las imágenes de referencia (modelo y prenda).');
    }

    return {
        valid: warnings.length === 0,
        warnings,
        suggestions,
    };
}
