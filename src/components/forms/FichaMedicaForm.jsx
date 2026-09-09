import React from 'react';
import FMSForm from '@/components/FMSForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTimes as faX, faFileText } from '@fortawesome/free-solid-svg-icons';

/**
 * FichaMedicaForm - Componente reutilizable para la ficha médica completa.
 *
 * Props:
 *   formData           - Objeto con todos los campos del formulario
 *   readOnly           - boolean (default false)
 *   onInputChange      - (field, value) => void
 *   onNestedChange     - (parent, field, value) => void
 *   onFMSSubtestChange - (test, subtest, field, value) => void
 *   onArrayChange      - (arrayName, index, field, value) => void
 *   onAddArrayRow      - (arrayName, emptyRow) => void
 *   onRemoveArrayRow   - (arrayName, index) => void
 *   onFileUpload       - (index, file) => void  [only needed in edit mode]
 */
export default function FichaMedicaForm({
  formData = {},
  readOnly = false,
  onInputChange,
  onNestedChange,
  onFMSSubtestChange,
  onArrayChange,
  onAddArrayRow,
  onRemoveArrayRow,
  onFileUpload,
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleInputChange = (field, value) => {
    if (!readOnly && onInputChange) onInputChange(field, value);
  };
  const handleNestedChange = (parent, field, value) => {
    if (!readOnly && onNestedChange) onNestedChange(parent, field, value);
  };
  const handleFMSSubtestChange = (test, subtest, field, value) => {
    if (!readOnly && onFMSSubtestChange) onFMSSubtestChange(test, subtest, field, value);
  };
  const handleArrayChange = (arrayName, index, field, value) => {
    if (!readOnly && onArrayChange) onArrayChange(arrayName, index, field, value);
  };
  const addArrayRow = (arrayName, emptyRow) => {
    if (!readOnly && onAddArrayRow) onAddArrayRow(arrayName, emptyRow);
  };
  const removeArrayRow = (arrayName, index) => {
    if (!readOnly && onRemoveArrayRow) onRemoveArrayRow(arrayName, index);
  };
  const handleFileUpload = async (index, file) => {
    if (!readOnly && onFileUpload) {
      setIsLoading(true);
      try { await onFileUpload(index, file); } finally { setIsLoading(false); }
    }
  };

  // Format checkbox objects to readable text (used in readOnly mode)
  const formatCheckboxObject = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const labels = {
      enfermedad: 'Enfermedad', accidente: 'Accidente', urgencia: 'Urgencia', segundaOpinion: 'Segunda opinión',
      congenito: 'Congénito', adquirido: 'Adquirido', agudo: 'Agudo', cronico: 'Crónico',
    };
    const items = Object.entries(obj)
      .filter(([, v]) => v === true)
      .map(([k]) => labels[k] || k);
    return items.join(', ');
  };

  // FMS adapter (FMSForm expects these named handlers directly)
  const fmsHandleInputChange = readOnly ? () => {} : (f, v) => onInputChange && onInputChange(f, v);
  const fmsHandleNestedChange = readOnly ? () => {} : (p, f, v) => onNestedChange && onNestedChange(p, f, v);
  const fmsHandleFMSSubtestChange = readOnly ? () => {} : (t, s, f, v) => onFMSSubtestChange && onFMSSubtestChange(t, s, f, v);

  return (
    <fieldset disabled={readOnly} style={readOnly ? { opacity: 0.85 } : undefined}>
        <div className="space-y-6">
          {/* ===== SECCIÓN 1: ANAMNESIS ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-teal-700 font-bold">1</span>
              </div>
              Anamnesis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de evaluación</label>
                <input
                  type="date"
                  value={formData.fechaEvaluacion}
                  onChange={(e) => handleInputChange('fechaEvaluacion', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. expediente</label>
                <input
                  type="text"
                  value={formData.numeroExpediente}
                  onChange={(e) => handleInputChange('numeroExpediente', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="Ej: EXP-001"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recopilación de Hechos</h3>
              {readOnly ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCheckboxObject(formData.recopilacionHechos)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.recopilacionHechos.enfermedad}
                      onChange={(e) => handleNestedChange('recopilacionHechos', 'enfermedad', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enfermedad</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.recopilacionHechos.accidente}
                      onChange={(e) => handleNestedChange('recopilacionHechos', 'accidente', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Accidente</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.recopilacionHechos.urgencia}
                      onChange={(e) => handleNestedChange('recopilacionHechos', 'urgencia', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Urgencia</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.recopilacionHechos.segundaOpinion}
                      onChange={(e) => handleNestedChange('recopilacionHechos', 'segundaOpinion', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Segunda opinión</span>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Padecimiento</h3>
              {readOnly ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCheckboxObject(formData.tipoPadecimiento)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.tipoPadecimiento.congenito}
                      onChange={(e) => handleNestedChange('tipoPadecimiento', 'congenito', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Congénito</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.tipoPadecimiento.adquirido}
                      onChange={(e) => handleNestedChange('tipoPadecimiento', 'adquirido', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Adquirido</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.tipoPadecimiento.agudo}
                      onChange={(e) => handleNestedChange('tipoPadecimiento', 'agudo', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Agudo</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.tipoPadecimiento.cronico}
                      onChange={(e) => handleNestedChange('tipoPadecimiento', 'cronico', e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Crónico</span>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de padecimiento</label>
                <input
                  type="date"
                  value={formData.fechaPadecimiento}
                  onChange={(e) => handleInputChange('fechaPadecimiento', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de dx. (diagnóstico)</label>
                <input
                  type="date"
                  value={formData.fechaDiagnostico}
                  onChange={(e) => handleInputChange('fechaDiagnostico', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (dolor/limitación/acortamiento/etc.). Acontecimiento signos/síntomas principales
              </label>
              <textarea
                value={formData.descripcionPadecimiento}
                onChange={(e) => handleInputChange('descripcionPadecimiento', e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                placeholder="Describa la localización, tiempo de evolución, características..."
              />
            </div>
          </div>

          {/* ===== SECCIÓN 2: ANTECEDENTES ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-700 font-bold">2</span>
              </div>
              Antecedentes
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antecedentes relacionados (fecha de diagnóstico/evolución/características)
                </label>
                <textarea
                  value={formData.antecedentesRelacionados}
                  onChange={(e) => handleInputChange('antecedentesRelacionados', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico médico / especialista
                </label>
                <textarea
                  value={formData.diagnosticoMedicoEspecialista}
                  onChange={(e) => handleInputChange('diagnosticoMedicoEspecialista', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Antecedentes Heredo-Familiares</h3>

              {/* Lista de enfermedades crónicas */}
              <div className="space-y-4">
                {(formData.enfermedadesCronicas || []).map((enfermedad, index) => (
                  <div key={enfermedad.id || index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Enfermedad crónica {(formData.enfermedadesCronicas || []).length > 1 ? `#${index + 1}` : ''}
                      </h4>
                      {(formData.enfermedadesCronicas || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newEnfermedades = formData.enfermedadesCronicas.filter((e, i) => i !== index);
                            handleInputChange('enfermedadesCronicas', newEnfermedades);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción de la enfermedad crónica familiar
                        </label>
                        <textarea
                          value={enfermedad.descripcion || ''}
                          onChange={(e) => {
                            const newEnfermedades = [...(formData.enfermedadesCronicas || [])];
                            newEnfermedades[index] = { ...newEnfermedades[index], descripcion: e.target.value };
                            handleInputChange('enfermedadesCronicas', newEnfermedades);
                          }}
                          rows={2}
                          placeholder="Describe la enfermedad crónica familiar..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Genética
                          </label>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`genetica-${enfermedad.id || index}`}
                                value="materna"
                                checked={enfermedad.genetica === 'materna'}
                                onChange={(e) => {
                                  const newEnfermedades = [...(formData.enfermedadesCronicas || [])];
                                  newEnfermedades[index] = { ...newEnfermedades[index], genetica: e.target.value };
                                  handleInputChange('enfermedadesCronicas', newEnfermedades);
                                }}
                                className="form-radio text-teal-600 focus:ring-teal-500 h-4 w-4"
                              />
                              <span className="ml-2 text-sm text-gray-700">Materna</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`genetica-${enfermedad.id || index}`}
                                value="paterna"
                                checked={enfermedad.genetica === 'paterna'}
                                onChange={(e) => {
                                  const newEnfermedades = [...(formData.enfermedadesCronicas || [])];
                                  newEnfermedades[index] = { ...newEnfermedades[index], genetica: e.target.value };
                                  handleInputChange('enfermedadesCronicas', newEnfermedades);
                                }}
                                className="form-radio text-teal-600 focus:ring-teal-500 h-4 w-4"
                              />
                              <span className="ml-2 text-sm text-gray-700">Paterna</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                          </label>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`estado-${enfermedad.id || index}`}
                                value="vivo"
                                checked={enfermedad.estado === 'vivo'}
                                onChange={(e) => {
                                  const newEnfermedades = [...(formData.enfermedadesCronicas || [])];
                                  newEnfermedades[index] = { ...newEnfermedades[index], estado: e.target.value };
                                  handleInputChange('enfermedadesCronicas', newEnfermedades);
                                }}
                                className="form-radio text-green-600 focus:ring-green-500 h-4 w-4"
                              />
                              <span className="ml-2 text-sm text-gray-700">Vivo</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`estado-${enfermedad.id || index}`}
                                value="finado"
                                checked={enfermedad.estado === 'finado'}
                                onChange={(e) => {
                                  const newEnfermedades = [...(formData.enfermedadesCronicas || [])];
                                  newEnfermedades[index] = { ...newEnfermedades[index], estado: e.target.value };
                                  handleInputChange('enfermedadesCronicas', newEnfermedades);
                                }}
                                className="form-radio text-gray-600 focus:ring-gray-500 h-4 w-4"
                              />
                              <span className="ml-2 text-sm text-gray-700">Finado</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {enfermedad.genetica && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detalles adicionales del parentesco {enfermedad.genetica === 'materna' ? 'materno' : 'paterno'}
                          </label>
                          <textarea
                            value={enfermedad.detalles || ''}
                            onChange={(e) => {
                              const newEnfermedades = [...(formData.enfermedadesCronicas || [])];
                              newEnfermedades[index] = { ...newEnfermedades[index], detalles: e.target.value };
                              handleInputChange('enfermedadesCronicas', newEnfermedades);
                            }}
                            rows={2}
                            placeholder={`Detalles adicionales del parentesco ${enfermedad.genetica === 'materna' ? 'materno' : 'paterno'}...`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Botón para agregar más enfermedades */}
                <button
                  type="button"
                  onClick={() => {
                    const currentEnfermedades = formData.enfermedadesCronicas || [];
                    const newId = currentEnfermedades.length > 0 ? Math.max(...currentEnfermedades.map(e => e.id || 0)) + 1 : 1;
                    const newEnfermedad = {
                      id: newId,
                      descripcion: '',
                      genetica: '',
                      estado: ''
                    };
                    handleInputChange('enfermedadesCronicas', [...currentEnfermedades, newEnfermedad]);
                  }}
                  className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  + Agregar fila
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Antecedentes Patológicos - Infancia/Adolescencia</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Enfermedad</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha/Evolución</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Tratamiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.antecedentesPatologicosInfancia.map((row, index) => (
                      <tr key={index}>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={row.enfermedad}
                            onChange={(e) => handleArrayChange('antecedentesPatologicosInfancia', index, 'enfermedad', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={row.fechaEvolucion}
                            onChange={(e) => handleArrayChange('antecedentesPatologicosInfancia', index, 'fechaEvolucion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={row.tratamiento}
                            onChange={(e) => handleArrayChange('antecedentesPatologicosInfancia', index, 'tratamiento', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => addArrayRow('antecedentesPatologicosInfancia', { enfermedad: '', fechaEvolucion: '', tratamiento: '' })}
                  className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  + Agregar fila
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Antecedentes Patológicos - Actuales</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Enfermedad</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha/Evolución</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Tratamiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.antecedentesPatologicosActuales.map((row, index) => (
                      <tr key={index}>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={row.enfermedad}
                            onChange={(e) => handleArrayChange('antecedentesPatologicosActuales', index, 'enfermedad', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={row.fechaEvolucion}
                            onChange={(e) => handleArrayChange('antecedentesPatologicosActuales', index, 'fechaEvolucion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={row.tratamiento}
                            onChange={(e) => handleArrayChange('antecedentesPatologicosActuales', index, 'tratamiento', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => addArrayRow('antecedentesPatologicosActuales', { enfermedad: '', fechaEvolucion: '', tratamiento: '' })}
                  className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  + Agregar fila
                </button>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
              <textarea
                value={formData.alergias}
                onChange={(e) => handleInputChange('alergias', e.target.value)}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                placeholder="Describa alergias conocidas"
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Antecedentes No Patológicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alimentación (cantidad/calidad)</label>
                  <textarea
                    value={formData.alimentacionCantidadCalidad}
                    onChange={(e) => handleInputChange('alimentacionCantidadCalidad', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan nutricional</label>
                  <textarea
                    value={formData.planNutricional}
                    onChange={(e) => handleInputChange('planNutricional', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hidratación (cantidad/otras sustancias)</label>
                  <textarea
                    value={formData.hidratacionCantidad}
                    onChange={(e) => handleInputChange('hidratacionCantidad', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Toxicomanías (alcohol/tabaco/drogas)</label>
                  <textarea
                    value={formData.toxicomanias}
                    onChange={(e) => handleInputChange('toxicomanias', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hábitos de sueño (horas/complicaciones)</label>
                  <textarea
                    value={formData.habitosSuenoHoras}
                    onChange={(e) => handleInputChange('habitosSuenoHoras', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actividad física/hobbies (frecuencia/duración)</label>
                  <textarea
                    value={formData.actividadFisicaFrecuencia}
                    onChange={(e) => handleInputChange('actividadFisicaFrecuencia', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas emocionales (fecha/control)</label>
                  <textarea
                    value={formData.sintomasEmocionales}
                    onChange={(e) => handleInputChange('sintomasEmocionales', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Antecedentes Gineco-Obstétricos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Natural</label>
                  <input
                    type="text"
                    value={formData.antecedentesGinecoObstetricos.gestacion}
                    onChange={(e) => handleNestedChange('antecedentesGinecoObstetricos', 'gestacion', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cesárea</label>
                  <input
                    type="text"
                    value={formData.antecedentesGinecoObstetricos.cesarea}
                    onChange={(e) => handleNestedChange('antecedentesGinecoObstetricos', 'cesarea', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Abortos</label>
                  <input
                    type="text"
                    value={formData.antecedentesGinecoObstetricos.abortos}
                    onChange={(e) => handleNestedChange('antecedentesGinecoObstetricos', 'abortos', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
                  <input
                    type="text"
                    value={formData.antecedentesGinecoObstetricos.periodo}
                    onChange={(e) => handleNestedChange('antecedentesGinecoObstetricos', 'periodo', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo</label>
                  <input
                    type="text"
                    value={formData.antecedentesGinecoObstetricos.ciclo}
                    onChange={(e) => handleNestedChange('antecedentesGinecoObstetricos', 'ciclo', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tratamiento hormonal (tipo/fecha)</label>
                  <input
                    type="text"
                    value={formData.antecedentesGinecoObstetricos.tratamientoHormonal}
                    onChange={(e) => handleNestedChange('antecedentesGinecoObstetricos', 'tratamientoHormonal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECCIÓN 3: TRAUMATISMO / ACCIDENTE, CIRUGÍA Y ESTUDIOS ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-700 font-bold">3</span>
              </div>
              Traumatismo / Accidente, Cirugía y Estudios
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Traumatismo / Accidente</h3>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Tipo (descripción)</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Fecha/Evolución</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Tratamiento/Complicaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.traumatismos.map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.tipo}
                              onChange={(e) => handleArrayChange('traumatismos', index, 'tipo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.fechaEvolucion}
                              onChange={(e) => handleArrayChange('traumatismos', index, 'fechaEvolucion', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.tratamientoComplicaciones}
                              onChange={(e) => handleArrayChange('traumatismos', index, 'tratamientoComplicaciones', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => addArrayRow('traumatismos', { tipo: '', fechaEvolucion: '', tratamientoComplicaciones: '' })}
                    className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    + Agregar fila
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cirugía</h3>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Tratamiento propuesto</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Fecha hospitalización</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Fecha alta</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Días atención</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Tx: a Futuro</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Fármacos</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Complicaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.cirugias.map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.tratamientoPropuesto}
                              onChange={(e) => handleArrayChange('cirugias', index, 'tratamientoPropuesto', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="date"
                              value={row.fechaHospitalizacion}
                              onChange={(e) => handleArrayChange('cirugias', index, 'fechaHospitalizacion', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="date"
                              value={row.fechaAlta}
                              onChange={(e) => handleArrayChange('cirugias', index, 'fechaAlta', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="number"
                              value={row.diasAtencion}
                              onChange={(e) => handleArrayChange('cirugias', index, 'diasAtencion', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.txFuturo}
                              onChange={(e) => handleArrayChange('cirugias', index, 'txFuturo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                              placeholder="Tratamiento a futuro..."
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.farmacos}
                              onChange={(e) => handleArrayChange('cirugias', index, 'farmacos', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.complicaciones}
                              onChange={(e) => handleArrayChange('cirugias', index, 'complicaciones', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => addArrayRow('cirugias', { tratamientoPropuesto: '', fechaHospitalizacion: '', fechaAlta: '', diasAtencion: '', txFuturo: '', farmacos: '', complicaciones: '' })}
                    className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    + Agregar fila
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Estudios de Gabinete</h3>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Estudio</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Fecha</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Descripción de hallazgos</th>
                        <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Archivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.estudiosGabinete.map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="text"
                              value={row.estudio}
                              onChange={(e) => handleArrayChange('estudiosGabinete', index, 'estudio', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                              placeholder="Ej: Radiografía, Resonancia..."
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="date"
                              value={row.fecha}
                              onChange={(e) => handleArrayChange('estudiosGabinete', index, 'fecha', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <textarea
                              value={row.descripcionHallazgos}
                              onChange={(e) => handleArrayChange('estudiosGabinete', index, 'descripcionHallazgos', e.target.value)}
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                            />
                          </td>
                          <td className="border border-gray-200 p-2">
                            <div className="flex flex-col items-center gap-2">
                              {row.archivo ? (
                                <div className="flex flex-col items-center gap-2 w-full">
                                  <a
                                    href={row.archivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-600 hover:text-teal-800 text-sm flex items-center gap-1 underline"
                                  >
                                    <FontAwesomeIcon icon={faFileText} className="w-4 h-4" />
                                    Ver archivo
                                  </a>
                                  <button
                                    onClick={() => handleArrayChange('estudiosGabinete', index, 'archivo', null)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        handleFileUpload(index, file);
                                      }
                                    }}
                                    className="hidden"
                                    disabled={isLoading || readOnly}
                                  />
                                  <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm">
                                    <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                                    Subir archivo
                                  </div>
                                </label>
                              )}
                              {formData.estudiosGabinete.length > 1 && (
                                <button
                                  onClick={() => removeArrayRow('estudiosGabinete', index)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Eliminar fila"
                                >
                                  <FontAwesomeIcon icon={faX} className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => addArrayRow('estudiosGabinete', { estudio: '', fecha: '', descripcionHallazgos: '', archivo: null })}
                    className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    + Agregar fila
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECCIÓN 4: DOLOR Y EXPLORACIÓN FÍSICA ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-red-700 font-bold">4</span>
              </div>
              Dolor y Exploración Física
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Escala de Dolor</h3>

                {/* Lista de escalas de dolor */}
                <div className="space-y-6">
                  {(formData.escalasDolor || []).map((escalaDolor, index) => (
                    <div key={escalaDolor.id || index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Segmento {(formData.escalasDolor || []).length > 1 ? `#${index + 1}` : ''}
                        </h4>
                        {(formData.escalasDolor || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newEscalas = formData.escalasDolor.filter((e, i) => i !== index);
                              handleInputChange('escalasDolor', newEscalas);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Segmento</label>
                        <input
                          type="text"
                          value={escalaDolor.segmento || ''}
                          onChange={(e) => {
                            const newEscalas = [...(formData.escalasDolor || [])];
                            newEscalas[index] = { ...newEscalas[index], segmento: e.target.value };
                            handleInputChange('escalasDolor', newEscalas);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                          placeholder="Especificar segmento corporal..."
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Aspecto</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Derecha</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Izquierda</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['antiguedad', 'localizacion', 'intensidad', 'caracter', 'irradiacion', 'atenuacion', 'agravacion'].map((key) => (
                              <tr key={key}>
                                <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 capitalize">
                                  {key === 'antiguedad' ? 'Antigüedad' :
                                    key === 'localizacion' ? 'Localización' :
                                      key === 'irradiacion' ? 'Irradiación' :
                                        key === 'atenuacion' ? 'Atenuación' :
                                          key === 'agravacion' ? 'Agravación' :
                                            key.charAt(0).toUpperCase() + key.slice(1)}
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <textarea
                                    value={escalaDolor[key]?.derecha || ''}
                                    onChange={(e) => {
                                      const newEscalas = [...(formData.escalasDolor || [])];
                                      newEscalas[index] = {
                                        ...newEscalas[index],
                                        [key]: { ...newEscalas[index][key], derecha: e.target.value }
                                      };
                                      handleInputChange('escalasDolor', newEscalas);
                                    }}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                  />
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <textarea
                                    value={escalaDolor[key]?.izquierda || ''}
                                    onChange={(e) => {
                                      const newEscalas = [...(formData.escalasDolor || [])];
                                      newEscalas[index] = {
                                        ...newEscalas[index],
                                        [key]: { ...newEscalas[index][key], izquierda: e.target.value }
                                      };
                                      handleInputChange('escalasDolor', newEscalas);
                                    }}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Botón para agregar más segmentos de escala de dolor */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentEscalas = formData.escalasDolor || [];
                      const newId = currentEscalas.length > 0 ? Math.max(...currentEscalas.map(e => e.id || 0)) + 1 : 1;
                      const newEscala = {
                        id: newId,
                        segmento: '',
                        antiguedad: { derecha: '', izquierda: '' },
                        localizacion: { derecha: '', izquierda: '' },
                        intensidad: { derecha: '', izquierda: '' },
                        caracter: { derecha: '', izquierda: '' },
                        irradiacion: { derecha: '', izquierda: '' },
                        atenuacion: { derecha: '', izquierda: '' },
                        agravacion: { derecha: '', izquierda: '' }
                      };
                      handleInputChange('escalasDolor', [...currentEscalas, newEscala]);
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    + Agregar fila
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Signos Vitales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia cardíaca (bpm)</label>
                    <input
                      type="number"
                      value={formData.signosVitales.frecuenciaCardiaca}
                      onChange={(e) => handleNestedChange('signosVitales', 'frecuenciaCardiaca', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia respiratoria (rpm)</label>
                    <input
                      type="number"
                      value={formData.signosVitales.frecuenciaRespiratoria}
                      onChange={(e) => handleNestedChange('signosVitales', 'frecuenciaRespiratoria', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tensión arterial (mmHg)</label>
                    <input
                      type="text"
                      value={formData.signosVitales.tensionArterial}
                      onChange={(e) => handleNestedChange('signosVitales', 'tensionArterial', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      placeholder="120/80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SpO2 (%)</label>
                    <input
                      type="number"
                      value={formData.signosVitales.spo2}
                      onChange={(e) => handleNestedChange('signosVitales', 'spo2', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.signosVitales.peso}
                      onChange={(e) => handleNestedChange('signosVitales', 'peso', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estatura (cm)</label>
                    <input
                      type="number"
                      value={formData.signosVitales.estatura}
                      onChange={(e) => handleNestedChange('signosVitales', 'estatura', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Inspección</h3>

                {/* Lista de inspecciones */}
                <div className="space-y-6">
                  {(formData.inspecciones || []).map((inspeccion, index) => (
                    <div key={inspeccion.id || index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Segmento {(formData.inspecciones || []).length > 1 ? `#${index + 1}` : ''}
                        </h4>
                        {(formData.inspecciones || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newInspecciones = formData.inspecciones.filter((i, idx) => idx !== index);
                              handleInputChange('inspecciones', newInspecciones);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Segmento</label>
                        <input
                          type="text"
                          value={inspeccion.segmento || ''}
                          onChange={(e) => {
                            const newInspecciones = [...(formData.inspecciones || [])];
                            newInspecciones[index] = { ...newInspecciones[index], segmento: e.target.value };
                            handleInputChange('inspecciones', newInspecciones);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                          placeholder="Especificar segmento corporal..."
                        />
                      </div>

                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full border-collapse">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Aspecto</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Derecho</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky top-0">Izquierdo</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Piel (estado/textura/coloración/alteraciones)
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={inspeccion.piel?.derecho || ''}
                                  onChange={(e) => {
                                    const newInspecciones = [...(formData.inspecciones || [])];
                                    newInspecciones[index] = {
                                      ...newInspecciones[index],
                                      piel: { ...newInspecciones[index].piel, derecho: e.target.value }
                                    };
                                    handleInputChange('inspecciones', newInspecciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={inspeccion.piel?.izquierdo || ''}
                                  onChange={(e) => {
                                    const newInspecciones = [...(formData.inspecciones || [])];
                                    newInspecciones[index] = {
                                      ...newInspecciones[index],
                                      piel: { ...newInspecciones[index].piel, izquierdo: e.target.value }
                                    };
                                    handleInputChange('inspecciones', newInspecciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Cicatriz (ubicación/longitud/características)
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={inspeccion.cicatriz?.derecho || ''}
                                  onChange={(e) => {
                                    const newInspecciones = [...(formData.inspecciones || [])];
                                    newInspecciones[index] = {
                                      ...newInspecciones[index],
                                      cicatriz: { ...newInspecciones[index].cicatriz, derecho: e.target.value }
                                    };
                                    handleInputChange('inspecciones', newInspecciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={inspeccion.cicatriz?.izquierdo || ''}
                                  onChange={(e) => {
                                    const newInspecciones = [...(formData.inspecciones || [])];
                                    newInspecciones[index] = {
                                      ...newInspecciones[index],
                                      cicatriz: { ...newInspecciones[index].cicatriz, izquierdo: e.target.value }
                                    };
                                    handleInputChange('inspecciones', newInspecciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Estructuras óseas (posicionamiento/simetría)
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={inspeccion.estructurasOseas?.derecho || ''}
                                  onChange={(e) => {
                                    const newInspecciones = [...(formData.inspecciones || [])];
                                    newInspecciones[index] = {
                                      ...newInspecciones[index],
                                      estructurasOseas: { ...newInspecciones[index].estructurasOseas, derecho: e.target.value }
                                    };
                                    handleInputChange('inspecciones', newInspecciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={inspeccion.estructurasOseas?.izquierdo || ''}
                                  onChange={(e) => {
                                    const newInspecciones = [...(formData.inspecciones || [])];
                                    newInspecciones[index] = {
                                      ...newInspecciones[index],
                                      estructurasOseas: { ...newInspecciones[index].estructurasOseas, izquierdo: e.target.value }
                                    };
                                    handleInputChange('inspecciones', newInspecciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Botón para agregar más inspecciones */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentInspecciones = formData.inspecciones || [];
                      const newId = currentInspecciones.length > 0 ? Math.max(...currentInspecciones.map(i => i.id || 0)) + 1 : 1;
                      const newInspeccion = {
                        id: newId,
                        segmento: '',
                        piel: { derecho: '', izquierdo: '' },
                        cicatriz: { derecho: '', izquierdo: '' },
                        estructurasOseas: { derecho: '', izquierdo: '' }
                      };
                      handleInputChange('inspecciones', [...currentInspecciones, newInspeccion]);
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    + Agregar fila
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Palpación</h3>

                {/* Lista de palpaciones */}
                <div className="space-y-6">
                  {(formData.palpaciones || []).map((palpacion, index) => (
                    <div key={palpacion.id || index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Segmento {(formData.palpaciones || []).length > 1 ? `#${index + 1}` : ''}
                        </h4>
                        {(formData.palpaciones || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPalpaciones = formData.palpaciones.filter((p, i) => i !== index);
                              handleInputChange('palpaciones', newPalpaciones);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Segmento</label>
                        <input
                          type="text"
                          value={palpacion.segmento || ''}
                          onChange={(e) => {
                            const newPalpaciones = [...(formData.palpaciones || [])];
                            newPalpaciones[index] = { ...newPalpaciones[index], segmento: e.target.value };
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                          placeholder="Especificar segmento corporal..."
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Aspecto</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Derecho</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Izquierdo</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Piel (estado/temperatura/tumefacción/edema/dolor)
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={palpacion.piel?.derecho || ''}
                                  onChange={(e) => {
                                    const newPalpaciones = [...(formData.palpaciones || [])];
                                    newPalpaciones[index] = {
                                      ...newPalpaciones[index],
                                      piel: { ...newPalpaciones[index].piel, derecho: e.target.value }
                                    };
                                    handleInputChange('palpaciones', newPalpaciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={palpacion.piel?.izquierdo || ''}
                                  onChange={(e) => {
                                    const newPalpaciones = [...(formData.palpaciones || [])];
                                    newPalpaciones[index] = {
                                      ...newPalpaciones[index],
                                      piel: { ...newPalpaciones[index].piel, izquierdo: e.target.value }
                                    };
                                    handleInputChange('palpaciones', newPalpaciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Estructuras óseas (sensaciones finales)
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={palpacion.estructurasOseas?.derecho || ''}
                                  onChange={(e) => {
                                    const newPalpaciones = [...(formData.palpaciones || [])];
                                    newPalpaciones[index] = {
                                      ...newPalpaciones[index],
                                      estructurasOseas: { ...newPalpaciones[index].estructurasOseas, derecho: e.target.value }
                                    };
                                    handleInputChange('palpaciones', newPalpaciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={palpacion.estructurasOseas?.izquierdo || ''}
                                  onChange={(e) => {
                                    const newPalpaciones = [...(formData.palpaciones || [])];
                                    newPalpaciones[index] = {
                                      ...newPalpaciones[index],
                                      estructurasOseas: { ...newPalpaciones[index].estructurasOseas, izquierdo: e.target.value }
                                    };
                                    handleInputChange('palpaciones', newPalpaciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                                Tejido blando (espasmo/tensión/debilidad/discontinuidad)
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={palpacion.tejidoBlando?.derecho || ''}
                                  onChange={(e) => {
                                    const newPalpaciones = [...(formData.palpaciones || [])];
                                    newPalpaciones[index] = {
                                      ...newPalpaciones[index],
                                      tejidoBlando: { ...newPalpaciones[index].tejidoBlando, derecho: e.target.value }
                                    };
                                    handleInputChange('palpaciones', newPalpaciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <textarea
                                  value={palpacion.tejidoBlando?.izquierdo || ''}
                                  onChange={(e) => {
                                    const newPalpaciones = [...(formData.palpaciones || [])];
                                    newPalpaciones[index] = {
                                      ...newPalpaciones[index],
                                      tejidoBlando: { ...newPalpaciones[index].tejidoBlando, izquierdo: e.target.value }
                                    };
                                    handleInputChange('palpaciones', newPalpaciones);
                                  }}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Botón para agregar más segmentos de palpación */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentPalpaciones = formData.palpaciones || [];
                      const newId = currentPalpaciones.length > 0 ? Math.max(...currentPalpaciones.map(p => p.id || 0)) + 1 : 1;
                      const newPalpacion = {
                        id: newId,
                        segmento: '',
                        piel: { derecho: '', izquierdo: '' },
                        estructurasOseas: { derecho: '', izquierdo: '' },
                        tejidoBlando: { derecho: '', izquierdo: '' }
                      };
                      handleInputChange('palpaciones', [...currentPalpaciones, newPalpacion]);
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    + Agregar fila
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ===== SECCIÓN 5: PRUEBAS ESPECÍFICAS ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-yellow-700 font-bold">5</span>
              </div>
              Pruebas Específicas
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de las pruebas específicas realizadas
              </label>
              <textarea
                value={formData.pruebasEspecificas}
                onChange={(e) => handleInputChange('pruebasEspecificas', e.target.value)}
                rows="8"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                placeholder="Describe todas las pruebas específicas realizadas (Estiramiento de pierna, Lessage, Compresión de raíz nerviosa, Fuerza muscular Daniel's, Trendelemburg, Ober, etc.)..."
              />
            </div>
          </div>

          {/* ===== SECCIÓN 6: FMS (FUNCTIONAL MOVEMENT SCREEN) ===== */}
          <FMSForm
            formData={formData}
            handleInputChange={fmsHandleInputChange}
            handleNestedChange={fmsHandleNestedChange}
            handleFMSSubtestChange={fmsHandleFMSSubtestChange}
          />

          {/* ===== SECCIÓN 7: DIAGNÓSTICO Y PLAN DE TRATAMIENTO ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-indigo-700 font-bold">7</span>
              </div>
              Diagnóstico y Plan de Tratamiento
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Consulta (recopilación de hechos y datos adquiridos)
                </label>
                <textarea
                  value={formData.motivoConsulta}
                  onChange={(e) => handleInputChange('motivoConsulta', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  placeholder="Resumen del motivo principal de consulta..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo del Paciente
                </label>
                <textarea
                  value={typeof formData.objetivoPaciente === 'string' ? formData.objetivoPaciente : ''}
                  onChange={(e) => handleInputChange('objetivoPaciente', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  placeholder="Describa los objetivos del paciente (ej: disminución de dolor, mejorar movilidad y estabilidad, reintegración a actividades deportivas, etc.)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico Fisioterapéutico *
                </label>
                <textarea
                  value={formData.diagnosticoFisioterapeutico}
                  onChange={(e) => handleInputChange('diagnosticoFisioterapeutico', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  placeholder="Diagnóstico fisioterapéutico basado en la evaluación..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pronóstico Fisioterapéutico
                </label>
                <textarea
                  value={typeof formData.pronosticoFisioterapeutico === 'string' ? formData.pronosticoFisioterapeutico : ''}
                  onChange={(e) => handleInputChange('pronosticoFisioterapeutico', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  placeholder="Describa el pronóstico fisioterapéutico del paciente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervención Fisioterapéutica
                </label>
                <textarea
                  value={formData.intervencionFisioterapeutica}
                  onChange={(e) => handleInputChange('intervencionFisioterapeutica', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  placeholder="Plan de intervención y técnicas fisioterapéuticas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Control de Sesiones
                </label>
                <textarea
                  value={formData.controlSesiones}
                  onChange={(e) => handleInputChange('controlSesiones', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y"
                  placeholder="Seguimiento y control de las sesiones..."
                />
              </div>
            </div>
          </div>
        </div>
    </fieldset>
  );
}
