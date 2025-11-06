// components/CalibradorMedidas/index.tsx

import React, { useState } from 'react';
import { PuntosAnatomicos, MEDIDAS_MODELO_178CM } from '../../constants/medidasAnatomicas';
import { guardarMedidasCalibradas } from '../../utils/clasificadorLargos';
import { IlustracionHombro, IlustracionCintura } from './IlustracionCuerpo';

interface Props {
  onCalibracionCompleta?: () => void;
}

export const CalibradorMedidas: React.FC<Props> = ({ onCalibracionCompleta }) => {
  const [altura, setAltura] = useState(178);
  const [medidas, setMedidas] = useState<PuntosAnatomicos>(MEDIDAS_MODELO_178CM);
  const [paso, setPaso] = useState<'hombro' | 'cintura'>('hombro');
  const [guardado, setGuardado] = useState(false);

  const medidasHombro = [
    { key: 'barbilla', label: 'Hombro → Barbilla', ayuda: 'Desde el punto más alto del hombro hasta la barbilla', aprox: '~15cm' },
    { key: 'pecho', label: 'Hombro → Pecho', ayuda: 'Hasta el punto más prominente del pecho', aprox: '~25cm' },
    { key: 'cintura', label: 'Hombro → Cintura', ayuda: 'Hasta donde doblas el tronco (parte más estrecha)', aprox: '~40cm' },
    { key: 'cadera', label: 'Hombro → Cadera', ayuda: 'Hasta el punto más ancho de las caderas', aprox: '~55cm' },
    { key: 'entrepierna', label: 'Hombro → Entrepierna', ayuda: 'Hasta donde comienza la pierna', aprox: '~75cm' },
    { key: 'medioMuslo', label: 'Hombro → Medio Muslo', ayuda: 'Punto medio entre entrepierna y rodilla', aprox: '~88cm' },
    { key: 'rodilla', label: 'Hombro → Rodilla', ayuda: 'Hasta el centro de la rótula', aprox: '~100cm' },
    { key: 'mediaPantorrilla', label: 'Hombro → Media Pantorrilla', ayuda: 'Punto medio entre rodilla y tobillo', aprox: '~115cm' },
    { key: 'tobillo', label: 'Hombro → Tobillo', ayuda: 'Hasta el hueso prominente del tobillo', aprox: '~155cm' },
  ];

  const medidasCintura = [
    { key: 'cadera', label: 'Cintura → Cadera', ayuda: 'Desde cintura hasta punto más ancho', aprox: '~15cm' },
    { key: 'entrepierna', label: 'Cintura → Entrepierna', ayuda: 'Donde comienza la pierna', aprox: '~35cm' },
    { key: 'microFalda', label: 'Cintura → Micro', ayuda: 'Falda muy muy corta - apenas cubre', aprox: '~38cm' },
    { key: 'miniSuper', label: 'Cintura → Super Mini', ayuda: 'Por encima de medio muslo', aprox: '~45cm' },
    { key: 'mini', label: 'Cintura → Mini', ayuda: 'Medio muslo - largo mini clásico', aprox: '~52cm' },
    { key: 'rodilla', label: 'Cintura → Rodilla', ayuda: 'Justo en rodilla', aprox: '~60cm' },
    { key: 'midiRodilla', label: 'Cintura → Midi Rodilla', ayuda: 'Tapa rodilla', aprox: '~65cm' },
    { key: 'mediaPantorrilla', label: 'Cintura → Media Pantorrilla', ayuda: 'Midi clásico', aprox: '~75cm' },
    { key: 'midiPantorrilla', label: 'Cintura → Midi Largo', ayuda: 'Midi largo', aprox: '~80cm' },
    { key: 'tobillo', label: 'Cintura → Tobillo', ayuda: 'Hasta tobillo', aprox: '~100cm' },
    { key: 'maxi', label: 'Cintura → Suelo/Maxi', ayuda: 'Roza el suelo', aprox: '~105cm' },
  ];

  const handleMedida = (seccion: 'desdeHombro' | 'desdeCintura', key: string, valor: string) => {
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum)) return;

    setMedidas(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [key]: valorNum,
      },
    }));
  };

  const exportarConfig = () => {
    // Añadir altura al objeto desdeHombro
    const medidasConAltura = {
      ...medidas,
      desdeHombro: {
        ...medidas.desdeHombro,
        suelo: altura,
      },
    };

    guardarMedidasCalibradas(medidasConAltura);
    setGuardado(true);

    // Descargar también como JSON
    const config = {
      altura,
      ...medidasConAltura,
      fecha: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calibracion-medidas.json';
    a.click();

    setTimeout(() => {
      onCalibracionCompleta?.();
    }, 2000);
  };

  return (
    <div className="calibrador-medidas">
      <div className="calibrador-header">
        <h2>📏 Calibrador de Medidas Anatómicas</h2>
        <p className="instrucciones">
          <strong>⚡ Hazlo UNA VEZ para máxima precisión en todas tus prendas</strong>
        </p>
        <div className="instrucciones-detalladas">
          <p>✓ Ponte de pie, descalza, contra una pared</p>
          <p>✓ Usa una cinta métrica flexible</p>
          <p>✓ Mide con la prenda que normalmente usas (ropa interior o ajustada)</p>
          <p>✓ Anota cada medida con precisión (±0.5cm)</p>
        </div>
      </div>

      <div className="input-altura">
        <label>
          <span className="label-texto">Tu altura total:</span>
          <input
            type="number"
            value={altura}
            onChange={e => setAltura(parseInt(e.target.value) || 178)}
            step="1"
            min="140"
            max="200"
          />
          <span className="unidad">cm</span>
        </label>
      </div>

      <div className="tabs">
        <button
          className={paso === 'hombro' ? 'activo' : ''}
          onClick={() => setPaso('hombro')}
        >
          📐 Desde Hombro (Vestidos)
        </button>
        <button
          className={paso === 'cintura' ? 'activo' : ''}
          onClick={() => setPaso('cintura')}
        >
          📐 Desde Cintura (Faldas)
        </button>
      </div>

      {paso === 'hombro' && (
        <div className="medidas-seccion">
          <div className="ilustracion-container">
            <IlustracionHombro />
          </div>

          <div className="medidas-lista">
            <h3>Medidas desde el Hombro</h3>
            {medidasHombro.map(medida => (
              <div key={medida.key} className="medida-item">
                <label>
                  <div className="medida-header">
                    <span className="nombre">{medida.label}</span>
                    <span className="aprox">{medida.aprox}</span>
                  </div>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.5"
                      placeholder={medida.aprox.replace('~', '').replace('cm', '')}
                      value={medidas.desdeHombro[medida.key as keyof typeof medidas.desdeHombro] || ''}
                      onChange={e => handleMedida('desdeHombro', medida.key, e.target.value)}
                    />
                    <span className="unidad">cm</span>
                  </div>
                </label>
                <small className="ayuda">{medida.ayuda}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {paso === 'cintura' && (
        <div className="medidas-seccion">
          <div className="ilustracion-container">
            <IlustracionCintura />
          </div>

          <div className="medidas-lista">
            <h3>Medidas desde la Cintura</h3>
            {medidasCintura.map(medida => (
              <div key={medida.key} className="medida-item">
                <label>
                  <div className="medida-header">
                    <span className="nombre">{medida.label}</span>
                    <span className="aprox">{medida.aprox}</span>
                  </div>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.5"
                      placeholder={medida.aprox.replace('~', '').replace('cm', '')}
                      value={medidas.desdeCintura[medida.key as keyof typeof medidas.desdeCintura] || ''}
                      onChange={e => handleMedida('desdeCintura', medida.key, e.target.value)}
                    />
                    <span className="unidad">cm</span>
                  </div>
                </label>
                <small className="ayuda">{medida.ayuda}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="calibrador-footer">
        <button className="btn-guardar" onClick={exportarConfig}>
          💾 Guardar Calibración
        </button>

        {guardado && (
          <div className="mensaje-exito">
            ✅ ¡Calibración guardada! El sistema ahora usará TUS medidas exactas.
            <br />
            📥 También se descargó un archivo JSON de respaldo.
          </div>
        )}
      </div>
    </div>
  );
};
