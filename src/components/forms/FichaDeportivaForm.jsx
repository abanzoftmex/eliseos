import React from 'react';
import FMSForm from '@/components/FMSForm';

/**
 * FichaDeportivaForm - Componente reutilizable para la ficha deportiva completa.
 *
 * Props:
 *   formData           - Objeto con todos los campos del formulario
 *   readOnly           - boolean (default false). Cuando true, todos los inputs son de sólo lectura.
 *   onInputChange      - (field, value) => void
 *   onNestedChange     - (parent, field, value) => void
 *   onHistoriaChange   - (field, key, value) => void
 *   onNeuroTestChange  - (testKey, category, side, value) => void
 *   onFMSSubtestChange - (test, subtest, field, value) => void
 *   onArrayChange      - (arrayName, index, field, value) => void  [for hrrFases rpe]
 */
export default function FichaDeportivaForm({
  formData = {},
  readOnly = false,
  onInputChange,
  onNestedChange,
  onHistoriaChange,
  onNeuroTestChange,
  onFMSSubtestChange,
  onArrayChange,
}) {
  // Helper: no-op safe handlers that respect readOnly
  const handleInputChange = (field, value) => {
    if (!readOnly && onInputChange) onInputChange(field, value);
  };
  const handleNestedChange = (parent, field, value) => {
    if (!readOnly && onNestedChange) onNestedChange(parent, field, value);
  };
  const handleHistoriaChange = (field, key, value) => {
    if (!readOnly && onHistoriaChange) onHistoriaChange(field, key, value);
  };
  const handleNeuroTestChange = (testKey, category, side, value) => {
    if (!readOnly && onNeuroTestChange) onNeuroTestChange(testKey, category, side, value);
  };
  const handleFMSSubtestChange = (test, subtest, field, value) => {
    if (!readOnly && onFMSSubtestChange) onFMSSubtestChange(test, subtest, field, value);
  };
  const handleArrayChange = (arrayName, index, field, value) => {
    if (!readOnly && onArrayChange) onArrayChange(arrayName, index, field, value);
  };

  // Helper para calcular IMC
  const calculateIMC = (altura, peso) => {
    if (altura && peso && altura > 0 && peso > 0) {
      const alturaEnMetros = altura / 100;
      const imc = peso / (alturaEnMetros * alturaEnMetros);
      return imc.toFixed(2);
    }
    return '';
  };

  const handleAlturaOrPesoChange = (field, value) => {
    if (readOnly) return;
    // We update the field, and also recalculate imc
    if (onInputChange) {
      onInputChange(field, value);
      const altura = field === 'altura' ? value : (formData.altura || '');
      const peso = field === 'peso' ? value : (formData.peso || '');
      const imc = calculateIMC(altura, peso);
      onInputChange('imc', imc);
    }
  };

  // Helper: color de zona intensidad
  const getZonaColor = (zona) => {
    const zonaUpper = zona?.toUpperCase() || '';
    if (zonaUpper.includes('GRIS')) return 'bg-gray-300';
    if (zonaUpper.includes('AZUL')) return 'bg-blue-500';
    if (zonaUpper.includes('VERDE')) return 'bg-green-500';
    if (zonaUpper.includes('NARANJA')) return 'bg-orange-500';
    if (zonaUpper.includes('ROJA')) return 'bg-red-500';
    return 'bg-gray-100';
  };

  // Helper: renderizar fila de Historia Clínica
  const renderHistoriaClinicaRow = (field, label) => (
    <tr key={field} className="hover:bg-gray-50 transition-colors">
      <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">
        {label}
      </td>
      <td className="border border-gray-300 px-4 py-3 text-center">
        <input
          type="radio"
          name={field}
          checked={formData[field]?.respuesta === 'si'}
          onChange={() => handleHistoriaChange(field, 'respuesta', 'si')}
          disabled={readOnly}
          className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
        />
      </td>
      <td className="border border-gray-300 px-4 py-3 text-center">
        <input
          type="radio"
          name={field}
          checked={formData[field]?.respuesta === 'no'}
          onChange={() => handleHistoriaChange(field, 'respuesta', 'no')}
          disabled={readOnly}
          className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
        />
      </td>
      <td className="border border-gray-300 px-4 py-3">
        <textarea
          value={formData[field]?.comentarios || ''}
          onChange={(e) => handleHistoriaChange(field, 'comentarios', e.target.value)}
          readOnly={readOnly}
          placeholder="Comentarios adicionales..."
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-y"
        />
      </td>
    </tr>
  );

  // FMS adapter props (FMSForm uses handleInputChange/handleNestedChange/handleFMSSubtestChange directly)
  const fmsHandleInputChange = readOnly ? () => {} : (field, value) => onInputChange && onInputChange(field, value);
  const fmsHandleNestedChange = readOnly ? () => {} : (parent, field, value) => onNestedChange && onNestedChange(parent, field, value);
  const fmsHandleFMSSubtestChange = readOnly ? () => {} : (test, subtest, field, value) => onFMSSubtestChange && onFMSSubtestChange(test, subtest, field, value);

  return (
    <div className="space-y-10">
      {/* ===== NÚMERO DE EXPEDIENTE ===== */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            No. expediente
          </label>
          <input
            type="text"
            value={formData.numeroExpediente || ''}
            onChange={(e) => handleInputChange('numeroExpediente', e.target.value)}
            readOnly={readOnly}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="Ej: 25095"
          />
        </div>
      </div>

      {/* ===== SECCIÓN 1: HISTORIA CLÍNICA ===== */}
      <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-emerald-700 font-bold">1</span>
          </div>
          Historia Clínica
        </h2>

        {/* Tabla de Historia Clínica */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Pregunta
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-700 w-20">
                  Sí
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-700 w-20">
                  No
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Comentarios
                </th>
              </tr>
            </thead>
            <tbody>
              {renderHistoriaClinicaRow('enfermedadCronica', 'ENFERMEDAD CRÓNICA')}
              {renderHistoriaClinicaRow('alteracionSistema', 'ALTERACIÓN DE ALGÚN SISTEMA/ÓRGANO')}
              {renderHistoriaClinicaRow('tratamientoMedico', 'TRATAMIENTO MÉDICO')}
              {renderHistoriaClinicaRow('patologiaColumna', 'PATOLOGÍA DE COLUMNA')}
              {renderHistoriaClinicaRow('patologiaHombro', 'PATOLOGÍA DE HOMBRO')}
              {renderHistoriaClinicaRow('patologiaCodo', 'PATOLOGÍA DE CODO')}
              {renderHistoriaClinicaRow('patologiaMuneca', 'PATOLOGÍA DE MUÑECA')}
              {renderHistoriaClinicaRow('patologiaCadera', 'PATOLOGÍA DE CADERA')}
              {renderHistoriaClinicaRow('patologiaRodilla', 'PATOLOGÍA DE RODILLA')}
              {renderHistoriaClinicaRow('patologiaTobillo', 'PATOLOGÍA DE TOBILLO')}
              {renderHistoriaClinicaRow('patologiaPie', 'PATOLOGÍA DE PIE')}
              {renderHistoriaClinicaRow('dolorMolestiaActual', 'DOLOR/MOLESTIA ACTUAL')}
              {renderHistoriaClinicaRow('lesionGrave', 'LESIÓN GRAVE')}
              {renderHistoriaClinicaRow('lesionesFrecuentes', 'LESIONES FRECUENTES')}
              {renderHistoriaClinicaRow('sufreMareos', '¿SUFRE MAREOS?')}
              {renderHistoriaClinicaRow('haSufridoDesmayos', '¿HA SUFRIDO DESMAYOS?')}
              {renderHistoriaClinicaRow('sufreConvulsiones', '¿SUFRE CONVULSIONES?')}
              {renderHistoriaClinicaRow('doloresCabezaFrecuentes', '¿DOLORES DE CABEZA FRECUENTES?')}
              {renderHistoriaClinicaRow('sufreHemorragiasNasales', '¿SUFRE HEMORRAGIAS NASALES?')}
              {renderHistoriaClinicaRow('dolorArticulaciones', '¿TIENE DOLOR EN ARTICULACIONES?')}
              {renderHistoriaClinicaRow('practicaDeporte', 'PRÁCTICA ALGÚN DEPORTE/ACTIVIDAD FÍSICA')}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OBJETIVO PERSONAL</label>
            <textarea
              value={formData.objetivoPersonal || ''}
              onChange={(e) => handleInputChange('objetivoPersonal', e.target.value)}
              readOnly={readOnly}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              placeholder="Describa el objetivo personal del atleta..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ALIMENTACIÓN (calidad/cantidad)</label>
              <textarea
                value={formData.alimentacion || ''}
                onChange={(e) => handleInputChange('alimentacion', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HIDRATACIÓN (cantidad/sustancias)</label>
              <textarea
                value={formData.hidratacion || ''}
                onChange={(e) => handleInputChange('hidratacion', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PÉRDIDA DE PESO</label>
              <textarea
                value={formData.perdidaPeso || ''}
                onChange={(e) => handleInputChange('perdidaPeso', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TOXICOMANÍAS (tabaco/alcohol/drogas)</label>
              <textarea
                value={formData.toxicomanias || ''}
                onChange={(e) => handleInputChange('toxicomanias', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HÁBITOS DE SUEÑO (horas/complicaciones)</label>
              <textarea
                value={formData.habitosSueno || ''}
                onChange={(e) => handleInputChange('habitosSueno', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SÍNTOMAS EMOCIONALES (anteriores/activos)</label>
              <textarea
                value={formData.sintomasEmocionales || ''}
                onChange={(e) => handleInputChange('sintomasEmocionales', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GASTOS MÉDICOS MAYORES</label>
              <textarea
                value={typeof formData.gastoMedicoMayores === 'string' ? formData.gastoMedicoMayores : ''}
                onChange={(e) => handleInputChange('gastoMedicoMayores', e.target.value)}
                readOnly={readOnly}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECCIÓN 3: SIGNOS VITALES Y MEDIDAS ANTROPOMÉTRICAS ===== */}
      <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-red-700 font-bold">3</span>
          </div>
          Signos Vitales y Medidas Antropométricas
        </h2>

        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">Signos Vitales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">FRECUENCIA CARDÍACA EN REPOSO (bpm)</label>
              <input
                type="number"
                value={formData.frecuenciaCardiacaReposo || ''}
                onChange={(e) => handleInputChange('frecuenciaCardiacaReposo', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">FRECUENCIA CARDÍACA (bpm)</label>
              <input
                type="number"
                value={formData.frecuenciaCardiaca || ''}
                onChange={(e) => handleInputChange('frecuenciaCardiaca', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TENSIÓN ARTERIAL (mmHg)</label>
              <input
                type="text"
                value={formData.tensionArterial || ''}
                onChange={(e) => handleInputChange('tensionArterial', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="120/80"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SATURACIÓN DE OXÍGENO (%)</label>
              <input
                type="number"
                value={formData.saturacionOxigeno || ''}
                onChange={(e) => handleInputChange('saturacionOxigeno', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">Medidas Antropométricas</h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">OBJETIVO:</label>
            <textarea
              value={formData.objetivoAntropometrico || ''}
              onChange={(e) => handleInputChange('objetivoAntropometrico', e.target.value)}
              readOnly={readOnly}
              rows="2"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ALTURA (cm)</label>
              <input
                type="number"
                value={formData.altura || ''}
                onChange={(e) => handleAlturaOrPesoChange('altura', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PESO (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.peso || ''}
                onChange={(e) => handleAlturaOrPesoChange('peso', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IMC/BMI (calculado automáticamente)</label>
              <input
                type="number"
                step="0.1"
                value={formData.imc || ''}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed outline-none transition-all mb-2"
                placeholder="Se calcula automáticamente"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-3 text-left font-medium text-gray-700 border border-gray-200">Clasificación</th>
                      <th className="py-2 px-3 text-center font-medium text-gray-700 border border-gray-200">IMC (kg/m²)</th>
                      <th className="py-2 px-3 text-left font-medium text-gray-700 border border-gray-200">Riesgo de comorbilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50 hover:bg-blue-100">
                      <td className="py-1.5 px-3 border border-gray-200">Bajo peso</td>
                      <td className="py-1.5 px-3 text-center border border-gray-200">&lt; 18.5</td>
                      <td className="py-1.5 px-3 border border-gray-200">Bajo</td>
                    </tr>
                    <tr className="bg-green-50 hover:bg-green-100">
                      <td className="py-1.5 px-3 border border-gray-200">Peso normal</td>
                      <td className="py-1.5 px-3 text-center border border-gray-200">18.5 - 24.9</td>
                      <td className="py-1.5 px-3 border border-gray-200">Promedio</td>
                    </tr>
                    <tr className="bg-yellow-50 hover:bg-yellow-100">
                      <td className="py-1.5 px-3 border border-gray-200">Sobrepeso</td>
                      <td className="py-1.5 px-3 text-center border border-gray-200">25.0 - 29.9</td>
                      <td className="py-1.5 px-3 border border-gray-200">Aumentado</td>
                    </tr>
                    <tr className="bg-orange-50 hover:bg-orange-100">
                      <td className="py-1.5 px-3 border border-gray-200">Obesidad grado I</td>
                      <td className="py-1.5 px-3 text-center border border-gray-200">30.0 - 34.9</td>
                      <td className="py-1.5 px-3 border border-gray-200">Moderado</td>
                    </tr>
                    <tr className="bg-red-50 hover:bg-red-100">
                      <td className="py-1.5 px-3 border border-gray-200">Obesidad grado II</td>
                      <td className="py-1.5 px-3 text-center border border-gray-200">35.0 - 39.9</td>
                      <td className="py-1.5 px-3 border border-gray-200">Severo</td>
                    </tr>
                    <tr className="bg-red-100 hover:bg-red-200">
                      <td className="py-1.5 px-3 border border-gray-200">Obesidad grado III</td>
                      <td className="py-1.5 px-3 text-center border border-gray-200">≥ 40.0</td>
                      <td className="py-1.5 px-3 border border-gray-200">Muy severo</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-1 text-xs text-gray-500 italic">
                  * Según clasificación de la OMS (Organización Mundial de la Salud)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">% DE GRASA CORPORAL</label>
              <input
                type="number"
                step="0.1"
                value={formData.grasaCorporal || ''}
                onChange={(e) => handleInputChange('grasaCorporal', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">% MÚSCULO ESQUELÉTICO</label>
              <input
                type="number"
                step="0.1"
                value={formData.musculoEsqueletico || ''}
                onChange={(e) => handleInputChange('musculoEsqueletico', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">METABOLISMO BASAL (kcal)</label>
              <input
                type="number"
                value={formData.metabolismoBasal || ''}
                onChange={(e) => handleInputChange('metabolismoBasal', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">EDAD CORPORAL</label>
              <input
                type="number"
                value={formData.edadCorporal || ''}
                onChange={(e) => handleInputChange('edadCorporal', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIVEL DE GRASA VISCERAL</label>
              <input
                type="number"
                step="0.1"
                value={formData.grasaVisceral || ''}
                onChange={(e) => handleInputChange('grasaVisceral', e.target.value)}
                readOnly={readOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comentario:</label>
            <textarea
              value={formData.comentarioAntropometrico || ''}
              onChange={(e) => handleInputChange('comentarioAntropometrico', e.target.value)}
              readOnly={readOnly}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y"
              placeholder="Observaciones sobre las medidas antropométricas..."
            />
          </div>
        </div>
      </div>

      {/* ===== SECCIÓN 4: EXAMINACIÓN NEUROFUNCIONAL ===== */}
      <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-purple-700 font-bold">4</span>
          </div>
          Examinación Neurofuncional
        </h2>

        {/* Tabla Neurofuncional */}
        <div className="overflow-x-auto  overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 bg-gray-100">Test</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 bg-gray-100">Descripción</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100" colSpan="2">NORMAL</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100" colSpan="2">PINZAMIENTO</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100" colSpan="2">ACTIVACIÓN</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100" colSpan="2">ACORTAMIENTO</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100" colSpan="2">DEBILIDAD</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100">Comentarios Derecho</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800 bg-gray-100">Comentarios Izquierdo</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 bg-gray-50"></th>
                <th className="border border-gray-300 px-3 py-2 bg-gray-50"></th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">DER</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">IZQ</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">DER</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">IZQ</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">DER</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">IZQ</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">DER</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">IZQ</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">DER</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">IZQ</th>
                <th className="border border-gray-300 px-3 py-2 bg-gray-50"></th>
                <th className="border border-gray-300 px-3 py-2 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody>
              {/* DECÚBITO PRONO */}
              <tr className="bg-purple-50">
                <td colSpan="14" className="border border-gray-300 px-3 py-2 font-bold text-purple-800">DECÚBITO PRONO</td>
              </tr>

              {['activacionGluteoMayorIsquios', 'testRotadoresInternosCadera', 'testRotadoresExternosCadera',
                'testParaGluteoMayor', 'testSerratosAnteriores', 'testCoreFrontalEstatico',
                'testCoreFrontalDinamico', 'testCoreLateral'].map((testKey) => {
                  const testLabels = {
                    'activacionGluteoMayorIsquios': 'ACTIVACIÓN DE GLÚTEO MAYOR-ISQUIOS (cadena cinética abierta)',
                    'testRotadoresInternosCadera': 'TEST ROTADORES INTERNOS DE CADERA',
                    'testRotadoresExternosCadera': 'TEST ROTADORES EXTERNOS DE CADERA',
                    'testParaGluteoMayor': 'TEST PARA GLÚTEO MAYOR',
                    'testSerratosAnteriores': 'TEST SERRATOS ANTERIORES',
                    'testCoreFrontalEstatico': 'TEST PARA CORE FRONTAL ESTÁTICO',
                    'testCoreFrontalDinamico': 'TEST PARA CORE FRONTAL DINÁMICO',
                    'testCoreLateral': 'TEST PARA CORE LATERAL'
                  };

                  return (
                    <React.Fragment key={testKey}>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 text-xs font-medium">{testLabels[testKey]}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea
                            value={formData[testKey]?.descripcion || ''}
                            onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)}
                            readOnly={readOnly}
                            placeholder="Descripción..."
                            rows="2"
                            className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.normal?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'derecho', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.normal?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.pinzamiento?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.pinzamiento?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.activacion?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.activacion?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.acortamiento?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.acortamiento?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.debilidad?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.debilidad?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)}
                            disabled={readOnly}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea
                            value={formData[testKey]?.comentariosDerecho || ''}
                            onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)}
                            readOnly={readOnly}
                            placeholder="Comentarios derecho..."
                            rows="2"
                            className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea
                            value={formData[testKey]?.comentariosIzquierdo || ''}
                            onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)}
                            readOnly={readOnly}
                            placeholder="Comentarios izquierdo..."
                            rows="2"
                            className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

              {/* DECÚBITO SUPINO */}
              <tr className="bg-blue-50">
                <td colSpan="14" className="border border-gray-300 px-3 py-2 font-bold text-blue-800">DECÚBITO SUPINO</td>
              </tr>

              {['pinzamientoFemoroacetabular', 'testDeFaber', 'activacionAbdominalesPsoas', 'activacionGluteoMayorPuente',
                'testRotadoresColumnaLumbar', 'testIsquiosurales', 'testThomasPsoas',
                'testThomasTensor', 'testFlexoresDorsalesTobillo', 'testFlexoresPlantaresTobillo',
                'testParaAductoresSupino', 'testParaAductoresAisladoNeurofuncional'].map((testKey) => {
                  const testLabels = {
                    'pinzamientoFemoroacetabular': 'PINZAMIENTO FEMOROACETABULAR',
                    'testDeFaber': 'TEST DE FABER',
                    'activacionAbdominalesPsoas': 'ACTIVACIÓN ABDOMINALES-PSOAS ILIACO',
                    'activacionGluteoMayorPuente': 'ACTIVACIÓN DE GLÚTEO MAYOR-ISQUIOS (puente)',
                    'testRotadoresColumnaLumbar': 'TEST PARA ROTADORES DE COLUMNA LUMBAR',
                    'testIsquiosurales': 'TEST ISQUIOSURALES',
                    'testThomasPsoas': 'TEST DE THOMAS (psoas iliaco)',
                    'testThomasTensor': 'TEST DE THOMAS (tensor de la fascia lata)',
                    'testFlexoresDorsalesTobillo': 'TEST FLEXORES DORSALES TOBILLO',
                    'testFlexoresPlantaresTobillo': 'TEST FLEXORES PLANTARES TOBILLO',
                    'testParaAductoresSupino': 'TEST PARA ADUCTORES',
                    'testParaAductoresAisladoNeurofuncional': 'TEST PARA ADUCTORES AISLADO A NEUROFUNCIONAL'
                  };

                  return (
                    <React.Fragment key={testKey}>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 text-xs font-medium">{testLabels[testKey]}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea
                            value={formData[testKey]?.descripcion || ''}
                            onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)}
                            readOnly={readOnly}
                            placeholder="Descripción..."
                            rows="2"
                            className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.normal?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.normal?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.pinzamiento?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.pinzamiento?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.activacion?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.activacion?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.acortamiento?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.acortamiento?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.debilidad?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input type="checkbox" checked={formData[testKey]?.debilidad?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea value={formData[testKey]?.comentariosDerecho || ''} onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)} readOnly={readOnly} placeholder="Comentarios derecho..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea value={formData[testKey]?.comentariosIzquierdo || ''} onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)} readOnly={readOnly} placeholder="Comentarios izquierdo..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

              {/* SEDESTACIÓN */}
              <tr className="bg-green-50">
                <td colSpan="14" className="border border-gray-300 px-3 py-2 font-bold text-green-800">SEDESTACIÓN</td>
              </tr>

              {['testActivacionEscapular', 'testRotadoresTronco', 'testParaAductoresSedestacion'].map((testKey) => {
                const testLabels = {
                  'testActivacionEscapular': 'TEST DE ACTIVACIÓN ESCAPULAR',
                  'testRotadoresTronco': 'TEST DE ROTADORES DE TRONCO',
                  'testParaAductoresSedestacion': 'TEST PARA ADUCTORES'
                };

                return (
                  <React.Fragment key={testKey}>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-xs font-medium">{testLabels[testKey]}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        <textarea value={formData[testKey]?.descripcion || ''} onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)} readOnly={readOnly} placeholder="Descripción..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" />
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.normal?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.normal?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.pinzamiento?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.pinzamiento?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.activacion?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.activacion?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.acortamiento?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.acortamiento?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.debilidad?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.debilidad?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><textarea value={formData[testKey]?.comentariosDerecho || ''} onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)} readOnly={readOnly} placeholder="Comentarios derecho..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" /></td>
                      <td className="border border-gray-300 px-2 py-1"><textarea value={formData[testKey]?.comentariosIzquierdo || ''} onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)} readOnly={readOnly} placeholder="Comentarios izquierdo..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" /></td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* BIPEDESTACIÓN */}
              <tr className="bg-yellow-50">
                <td colSpan="14" className="border border-gray-300 px-3 py-2 font-bold text-yellow-800">BIPEDESTACIÓN</td>
              </tr>

              {['testDorsalAncho', 'testGluteoMedio', 'testSoleo', 'testParaTibialPosterior'].map((testKey) => {
                const testLabels = {
                  'testDorsalAncho': 'TEST DORSAL ANCHO',
                  'testGluteoMedio': 'TEST GLÚTEO MEDIO',
                  'testSoleo': 'TEST SÓLEO',
                  'testParaTibialPosterior': 'TEST PARA TIBIAL POSTERIOR'
                };

                return (
                  <React.Fragment key={testKey}>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-xs font-medium">{testLabels[testKey]}</td>
                      <td className="border border-gray-300 px-2 py-1"><textarea value={formData[testKey]?.descripcion || ''} onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)} readOnly={readOnly} placeholder="Descripción..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.normal?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.normal?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.pinzamiento?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.pinzamiento?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.activacion?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.activacion?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.acortamiento?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.acortamiento?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.debilidad?.derecho || false} onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1 text-center"><input type="checkbox" checked={formData[testKey]?.debilidad?.izquierdo || false} onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)} disabled={readOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><textarea value={formData[testKey]?.comentariosDerecho || ''} onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)} readOnly={readOnly} placeholder="Comentarios derecho..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" /></td>
                      <td className="border border-gray-300 px-2 py-1"><textarea value={formData[testKey]?.comentariosIzquierdo || ''} onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)} readOnly={readOnly} placeholder="Comentarios izquierdo..." rows="2" className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y" /></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SECCIÓN 5: FMS (FUNCTIONAL MOVEMENT SCREEN) ===== */}
      <FMSForm
        formData={formData}
        handleInputChange={fmsHandleInputChange}
        handleNestedChange={fmsHandleNestedChange}
        handleFMSSubtestChange={fmsHandleFMSSubtestChange}
      />

      {/* ===== SECCIÓN 6: HRR (HEART RATE RECOVERY) ===== */}
      <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200">
        <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg mb-0">
          <h2 className="text-2xl font-bold uppercase">HRR (HEART RATE RECOVERY)</h2>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 mt-6 mb-8">
          <p className="text-sm text-gray-700">Objetivo: <span className="italic text-gray-600">{formData.hrrObjetivo || 'evaluar niveles de energía y recuperación aeróbica'}</span></p>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800 uppercase">FASE</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800 uppercase">MINUTOS</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800 uppercase">ZONA DE INTENSIDAD</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800 uppercase">FRECUENCIA CARDIACA</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800 uppercase">RPE</th>
              </tr>
            </thead>
            <tbody>
              {(formData.hrrFases || []).map((fase, index) => {
                const isEjercicio = fase.fase === 'EJERCICIO';
                const ejercicioIndices = (formData.hrrFases || [])
                  .map((f, i) => f.fase === 'EJERCICIO' ? i : null)
                  .filter(i => i !== null);
                const isFirstEjercicio = ejercicioIndices[0] === index;
                const ejercicioRowSpan = ejercicioIndices.length;

                return (
                  <tr key={index}>
                    {/* Calentamiento - primera fila */}
                    {index === 0 && (
                      <>
                        <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">{fase.fase}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-700">{fase.minutos}</td>
                        <td className={`border border-gray-300 px-2 py-1 text-center text-sm font-semibold text-white ${getZonaColor(fase.zonaIntensidad)}`}>
                          {fase.zonaIntensidad}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-700">{fase.frecuenciaCardiaca}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={fase.rpe || ''}
                            onChange={(e) => handleArrayChange('hrrFases', index, 'rpe', e.target.value)}
                            readOnly={readOnly}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="RPE"
                          />
                        </td>
                      </>
                    )}
                    {/* Primera fila de EJERCICIO con rowspan */}
                    {isFirstEjercicio && (
                      <>
                        <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700" rowSpan={ejercicioRowSpan}>{fase.fase}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-700">{fase.minutos}</td>
                        <td className={`border border-gray-300 px-2 py-1 text-center text-sm font-semibold text-white ${getZonaColor(fase.zonaIntensidad)}`}>
                          {fase.zonaIntensidad}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-700">{fase.frecuenciaCardiaca}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={fase.rpe || ''}
                            onChange={(e) => handleArrayChange('hrrFases', index, 'rpe', e.target.value)}
                            readOnly={readOnly}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="RPE"
                          />
                        </td>
                      </>
                    )}
                    {/* Filas siguientes de EJERCICIO (sin celda de fase) */}
                    {isEjercicio && !isFirstEjercicio && (
                      <>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-700">{fase.minutos}</td>
                        <td className={`border border-gray-300 px-2 py-1 text-center text-sm font-semibold text-white ${getZonaColor(fase.zonaIntensidad)}`}>
                          {fase.zonaIntensidad}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-700">{fase.frecuenciaCardiaca}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={fase.rpe || ''}
                            onChange={(e) => handleArrayChange('hrrFases', index, 'rpe', e.target.value)}
                            readOnly={readOnly}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="RPE"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">Recuperación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">FC INICIAL</label>
            <input
              type="number"
              value={formData.hrrFcInicial || ''}
              onChange={(e) => handleInputChange('hrrFcInicial', e.target.value)}
              readOnly={readOnly}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="bpm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HRR</label>
            <input
              type="number"
              value={formData.hrrHrr || ''}
              onChange={(e) => handleInputChange('hrrHrr', e.target.value)}
              readOnly={readOnly}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CLASIFICACIÓN</label>
            <input
              type="text"
              value={formData.hrrClasificacion || ''}
              onChange={(e) => handleInputChange('hrrClasificacion', e.target.value)}
              readOnly={readOnly}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Ej: Buena, Excelente"
            />
          </div>
        </div>

        {/* Gráfica semicircular de Heart Rate Recovery */}
        <div className="mt-8 flex justify-center">
          <img src="/grafica.png" alt="Heart Rate Recovery Chart" className="max-w-sm w-full h-auto" />
        </div>
      </div>

      {/* ===== SECCIÓN 7: INFORME FISIOTERAPÉUTICO ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5">
          <h2 className="text-xl font-bold text-white">Informe Fisioterapéutico</h2>
        </div>

        <div className="p-8 lg:p-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Informe Fisioterapéutico
              </label>
              <textarea
                value={formData.informeFisioterapeutico || ''}
                onChange={(e) => handleInputChange('informeFisioterapeutico', e.target.value)}
                readOnly={readOnly}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
                placeholder="Escribe el informe fisioterapéutico aquí..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
