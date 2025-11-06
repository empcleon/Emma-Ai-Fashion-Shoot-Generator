// components/ClasificadorLargoVisual/index.tsx

import React, { useState, useEffect } from 'react';
import { clasificarLargoVestido, clasificarLargoFalda } from '../../utils/clasificadorLargos';
import { CATEGORIAS_LARGO } from '../../types/largos';
import type { ResultadoClasificacion } from '../../types/largos';

interface Props {
  largoCm: number;
  tipo: 'vestido' | 'falda';
  onChange?: (categoria: string) => void;
}

export const ClasificadorLargoVisual: React.FC<Props> = ({ largoCm, tipo, onChange }) => {
  const [resultado, setResultado] = useState<ResultadoClasificacion | null>(null);

  useEffect(() => {
    if (!largoCm || largoCm <= 0) {
      setResultado(null);
      return;
    }

    const clasificacion = tipo === 'vestido'
      ? clasificarLargoVestido(largoCm)
      : clasificarLargoFalda(largoCm);

    setResultado(clasificacion);
    onChange?.(clasificacion.categoria);
  }, [largoCm, tipo, onChange]);

  if (!resultado) return null;

  // Calcular posición en la silueta
  const calcularPosicion = (): number => {
    if (tipo === 'vestido') {
      // Escala de 0-178cm → 0-100%
      return Math.min((largoCm / 178) * 100, 100);
    } else {
      // Desde cintura (22% de altura) hasta suelo (100%)
      // 0-105cm desde cintura → 22%-100%
      return Math.min(22 + ((largoCm / 105) * 78), 100);
    }
  };

  const posicion = calcularPosicion();

  return (
    <div className="clasificador-largo-visual">
      <div className={`resultado ${resultado.precision}`}>
        <div className="categoria-badge">
          <span className="emoji">{resultado.info.emoji}</span>
          <span className="nombre">{resultado.info.nombre}</span>
          {resultado.precision === 'exacto' && (
            <span className="badge-exacto">✓ Precisión Exacta</span>
          )}
        </div>

        <div className="detalles">
          <p className="punto-anatomico">
            <strong>Llega a:</strong> {resultado.puntoAnatomico}
          </p>
          <p className="descripcion">{resultado.info.descripcion}</p>
        </div>

        <div className="medida-visual">
          <div className="escala">
            <div className="cuerpo">
              {/* Marcador de inicio (hombro o cintura) */}
              {tipo === 'vestido' ? (
                <div className="marcador hombro" style={{ top: '0%' }}>
                  <span className="punto"></span>
                  <span className="etiqueta-punto">Hombro (inicio)</span>
                </div>
              ) : (
                <div className="marcador cintura" style={{ top: '22%' }}>
                  <span className="punto"></span>
                  <span className="etiqueta-punto">Cintura (inicio)</span>
                </div>
              )}

              {/* Marcador de la prenda */}
              <div
                className="marcador largo-prenda"
                style={{ top: `${posicion}%` }}
              >
                <span className="linea-medida"></span>
                <span className="etiqueta-prenda">
                  {largoCm}cm - {resultado.info.nombre}
                </span>
              </div>

              {/* Marcadores de referencia */}
              <div className="marcador rodilla" style={{ top: '56%' }}>
                <span className="punto-ref"></span>
                <span className="etiqueta-ref">Rodilla</span>
              </div>

              <div className="marcador tobillo" style={{ top: '87%' }}>
                <span className="punto-ref"></span>
                <span className="etiqueta-ref">Tobillo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="keywords">
          <strong>🏷️ Keywords para Vinted:</strong>
          <div className="tags">
            {resultado.info.keywords.map(kw => (
              <span key={kw} className="tag">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de referencia rápida */}
      <details className="referencia-rapida">
        <summary>📋 Ver todas las categorías de largo</summary>
        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Rango {tipo === 'vestido' ? '(desde hombro)' : '(desde cintura)'}</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(CATEGORIAS_LARGO).map(([key, info]) => {
                const rango = tipo === 'vestido' ? info.rangoVestido : info.rangoFalda;
                const isActual = resultado.categoria === key;
                return (
                  <tr key={key} className={isActual ? 'actual' : ''}>
                    <td>
                      <span className="cell-emoji">{info.emoji}</span>
                      <strong>{info.nombre}</strong>
                      {isActual && <span className="badge-actual">← Actual</span>}
                    </td>
                    <td className="rango">
                      {rango[0]}-{rango[1] === 999 ? '∞' : rango[1]} cm
                    </td>
                    <td className="descripcion-tabla">{info.descripcion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
