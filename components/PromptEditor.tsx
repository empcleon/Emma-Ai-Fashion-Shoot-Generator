
import React from 'react';

interface ValidationResult {
    valid: boolean;
    warnings: string[];
    suggestions: string[];
}

interface PromptEditorProps {
    value: string;
    onChange: (newValue: string) => void;
    onReset?: () => void;
    validation: ValidationResult;
    label: string;
    id: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ value, onChange, onReset, validation, label, id }) => {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    
    return (
        <div className="prompt-editor space-y-2">
            <div className="flex justify-between items-end">
                <label htmlFor={id} className="block text-sm font-medium text-zinc-300">{label}</label>
                {onReset && (
                    <button 
                        onClick={onReset}
                        className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors underline decoration-dotted"
                        title="Restaurar el prompt original por defecto"
                    >
                        Restaurar Original
                    </button>
                )}
            </div>
            <textarea
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={8}
                className={`form-input w-full text-xs leading-relaxed transition-all duration-200 ${!validation.valid ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/50' : 'border-zinc-700'}`}
                aria-label={label}
                aria-invalid={!validation.valid}
                aria-describedby={!validation.valid ? `${id}-warnings` : undefined}
            />
            
            <div className="flex justify-end text-xs text-zinc-500 gap-4">
                <span>Caracteres: {value.length}</span>
                <span>Palabras: {wordCount}</span>
            </div>

            {validation.warnings.length > 0 && (
                <div id={`${id}-warnings`} className="warnings space-y-1.5" role="alert">
                    {validation.warnings.map((w, i) => (
                        <div key={i} className="warning text-amber-400 text-xs flex items-start gap-2 p-2 bg-amber-900/30 rounded-md">
                            <span className="flex-shrink-0 mt-0.5">⚠️</span>
                            <span>{w}</span>
                        </div>
                    ))}
                </div>
            )}

            {validation.suggestions.length > 0 && (
                <div className="suggestions space-y-1.5">
                    {validation.suggestions.map((s, i) => (
                        <div key={i} className="suggestion text-sky-300 text-xs flex items-start gap-2 p-2 bg-sky-900/30 rounded-md">
                            <span className="flex-shrink-0 mt-0.5">💡</span>
                            <span>{s}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromptEditor;
