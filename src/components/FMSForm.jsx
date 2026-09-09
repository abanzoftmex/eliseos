import React from 'react';
import PropTypes from 'prop-types';
import FMSScoreInput from './FMSScoreInput';

/**
 * FMSForm - Componente reutilizable para el formulario FMS (Functional Movement Screen)
 * 
 * Este componente encapsula toda la lógica de visualización del formulario FMS,
 * permitiendo su uso en diferentes contextos de la aplicación.
 * 
 * @component
 * @example
 * // Ejemplo de uso:
 * <FMSForm
 *   formData={formData}
 *   handleInputChange={handleInputChange}
 *   handleNestedChange={handleNestedChange}
 *   handleFMSSubtestChange={handleFMSSubtestChange}
 * />
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.formData - Datos del formulario que contiene todos los campos FMS
 * @param {string} props.formData.fmsSuperiorDominante - Extremidad superior dominante ('derecha'/'izquierda')
 * @param {string} props.formData.fmsInferiorDominante - Extremidad inferior dominante ('derecha'/'izquierda')
 * @param {Object} props.formData.fmsDeepSquat - Datos del test Deep Squat
 * @param {Object} props.formData.fmsHurdleStep - Datos del test Hurdle Step
 * @param {Object} props.formData.fmsInlineLunge - Datos del test In-line Lunge
 * @param {Object} props.formData.fmsShoulderMobility - Datos del test Shoulder Mobility
 * @param {Object} props.formData.fmsActiveStraightLegRaise - Datos del test Active Straight-Leg Raise
 * @param {Object} props.formData.fmsTrunkStabilityPushup - Datos del test Trunk Stability Push-up
 * @param {Object} props.formData.fmsRotaryStability - Datos del test Rotary Stability
 * @param {number} props.formData.fmsTotalPuntuacion - Puntuación total del FMS
 * @param {Function} props.handleInputChange - Función para actualizar campos simples: (fieldName, value) => void
 * @param {Function} props.handleNestedChange - Función para actualizar objetos anidados: (parent, field, value) => void
 * @param {Function} props.handleFMSSubtestChange - Función para actualizar subtests: (test, subtest, field, value) => void
 * 
 * @returns {JSX.Element} Formulario FMS completo
 */
export default function FMSForm({
    formData,
    handleInputChange,
    handleNestedChange,
    handleFMSSubtestChange
}) {
    return (
        <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-700 font-bold">6</span>
                </div>
                FMS (Functional Movement Screen)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Superior dominante
                    </label>
                    <select
                        value={formData.fmsSuperiorDominante}
                        onChange={(e) => handleInputChange('fmsSuperiorDominante', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="derecha">Derecha</option>
                        <option value="izquierda">Izquierda</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inferior dominante
                    </label>
                    <select
                        value={formData.fmsInferiorDominante}
                        onChange={(e) => handleInputChange('fmsInferiorDominante', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="derecha">Derecha</option>
                        <option value="izquierda">Izquierda</option>
                    </select>
                </div>
            </div>

            {/* Tabla FMS */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Test</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Implicaciones Clinicas</th>
                            <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Comentarios Derecho</th>
                            <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Comentarios Izquierdo</th>
                            <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Puntuación Bruta</th>
                            <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Puntuación Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Deep Squat */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-blue-800 bg-blue-50" rowSpan="5">
                                Deep Squat<br />
                                <span className="text-xs font-normal text-gray-600">(Sentadilla profunda)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/deep-squat.png" alt="Deep Squat" className="h-20 w-auto object-contain" />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Dorsiflexión cadena cinética cerrada de tobillos</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsDeepSquat.dorsiflexionTobillos?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'dorsiflexionTobillos', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsDeepSquat.dorsiflexionTobillos?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'dorsiflexionTobillos', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <FMSScoreInput
                                    testData={formData.fmsDeepSquat}
                                    testName="fmsDeepSquat"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsDeepSquat.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsDeepSquat', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Flexión de rodillas y caderas</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsDeepSquat.flexionRodillasCaderas?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'flexionRodillasCaderas', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsDeepSquat.flexionRodillasCaderas?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'flexionRodillasCaderas', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Extensión columna torácica</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsDeepSquat.extensionColumnaToracica?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'extensionColumnaToracica', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Flexión y abducción de hombros</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsDeepSquat.flexionAbduccionHombros?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'flexionAbduccionHombros', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsDeepSquat.flexionAbduccionHombros?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'flexionAbduccionHombros', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Activación musculatura central</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsDeepSquat.activacionMusculaturaCentral?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsDeepSquat', 'activacionMusculaturaCentral', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* Hurdle Step */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-purple-800 bg-purple-50" rowSpan="5">
                                Hurdle Step<br />
                                <span className="text-xs font-normal text-gray-600">(Paso de obstáculo 36 cm)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/hurdle-step.png" alt="Hurdle Step" className="h-20 w-auto object-contain" />
                                </div>
                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Medida</label>
                                    <input
                                        type="text"
                                        value={formData.fmsHurdleStep.medida || ''}
                                        onChange={(e) => handleNestedChange('fmsHurdleStep', 'medida', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        placeholder="Ingrese medida"
                                    />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Móvil: flexión de cadera y rodilla</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.movilFlexionCaderaRodilla?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'movilFlexionCaderaRodilla', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.movilFlexionCaderaRodilla?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'movilFlexionCaderaRodilla', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <FMSScoreInput
                                    testData={formData.fmsHurdleStep}
                                    testName="fmsHurdleStep"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsHurdleStep.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsHurdleStep', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Móvil: dorsiflexión CCA de tobillo</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.movilDorsiflexionTobillo?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'movilDorsiflexionTobillo', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.movilDorsiflexionTobillo?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'movilDorsiflexionTobillo', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Fija: estabilidad pie, rodilla y columna lumbar</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.fijaEstabilidadPieRodillaLumbar?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'fijaEstabilidadPieRodillaLumbar', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.fijaEstabilidadPieRodillaLumbar?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'fijaEstabilidadPieRodillaLumbar', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Fija: máxima extensión de la CCC de cadera</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.fijaExtensionCadera?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'fijaExtensionCadera', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsHurdleStep.fijaExtensionCadera?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'fijaExtensionCadera', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Coordinación y Equilibrio</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsHurdleStep.coordinacionEquilibrio?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsHurdleStep', 'coordinacionEquilibrio', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* In-line Lunge */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-pink-800 bg-pink-50" rowSpan="5">
                                In-line lunge<br />
                                <span className="text-xs font-normal text-gray-600">(Estocada lineal)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/in-line-lunge.png" alt="In-line Lunge" className="h-20 w-auto object-contain" />
                                </div>
                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Medida</label>
                                    <input
                                        type="text"
                                        value={formData.fmsInlineLunge.medida || ''}
                                        onChange={(e) => handleNestedChange('fmsInlineLunge', 'medida', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                                        placeholder="Ingrese medida"
                                    />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Pierna delantera: movilidad de cadera (abd en CCC) y dorsiflexión de tobillo</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.piernaDelanteraMovilidadCadera?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'piernaDelanteraMovilidadCadera', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.piernaDelanteraMovilidadCadera?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'piernaDelanteraMovilidadCadera', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <FMSScoreInput
                                    testData={formData.fmsInlineLunge}
                                    testName="fmsInlineLunge"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsInlineLunge.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsInlineLunge', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Pierna delantera: estabilidad de rodilla y pie</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.piernaDelanteraEstabilidadRodillaPie?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'piernaDelanteraEstabilidadRodillaPie', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.piernaDelanteraEstabilidadRodillaPie?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'piernaDelanteraEstabilidadRodillaPie', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Pierna trasera: movilidad cadera (add CCC)/ extensión metatarsofalángica</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.piernaTraseraMovilidadCadera?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'piernaTraseraMovilidadCadera', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.piernaTraseraMovilidadCadera?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'piernaTraseraMovilidadCadera', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Flexibilidad recto femoral</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.flexibilidadRectoFemoral?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'flexibilidadRectoFemoral', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsInlineLunge.flexibilidadRectoFemoral?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'flexibilidadRectoFemoral', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Equilibrio de tronco</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsInlineLunge.equilibrioTronco?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsInlineLunge', 'equilibrioTronco', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* Shoulder Mobility */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-indigo-800 bg-indigo-50" rowSpan="5">
                                Shoulder mobility<br />
                                <span className="text-xs font-normal text-gray-600">(Movilidad de hombro 18 cm)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/shoulder-mobility.png" alt="Shoulder Mobility" className="h-20 w-auto object-contain" />
                                </div>
                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Medida</label>
                                    <input
                                        type="text"
                                        value={formData.fmsShoulderMobility.medida || ''}
                                        onChange={(e) => handleNestedChange('fmsShoulderMobility', 'medida', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Ingrese medida"
                                    />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Brazo a evaluar: flexión + add + RE</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsShoulderMobility.brazoFlexionAddRE?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'brazoFlexionAddRE', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsShoulderMobility.brazoFlexionAddRE?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'brazoFlexionAddRE', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <FMSScoreInput
                                    testData={formData.fmsShoulderMobility}
                                    testName="fmsShoulderMobility"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="5">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsShoulderMobility.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsShoulderMobility', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Brazo complementario: extensión + abd + RI</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsShoulderMobility.brazoExtensionAbdRI?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'brazoExtensionAbdRI', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsShoulderMobility.brazoExtensionAbdRI?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'brazoExtensionAbdRI', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Estabilidad escapular</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsShoulderMobility.estabilidadEscapular?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'estabilidadEscapular', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsShoulderMobility.estabilidadEscapular?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'estabilidadEscapular', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Extensión torácica</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsShoulderMobility.extensionToracica?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'extensionToracica', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Coordinación</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsShoulderMobility.coordinacion?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsShoulderMobility', 'coordinacion', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* Impingement Clearing Test */}
                        <tr className="bg-yellow-50">
                            <td className="border border-gray-300 px-3 py-2 font-bold" rowSpan="1">
                                Impingement Clearing Test
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/implengement-clearing.png" alt="Impingement Clearing Test" className="h-20 w-auto object-contain" />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Para detectar pinzamiento de hombro</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsImpingementClearingTest?.comentariosDerecho || ''}
                                    onChange={(e) => handleNestedChange('fmsImpingementClearingTest', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsImpingementClearingTest?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleNestedChange('fmsImpingementClearingTest', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <select
                                    value={formData.fmsImpingementClearingTest?.resultado || ''}
                                    onChange={(e) => handleNestedChange('fmsImpingementClearingTest', 'resultado', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="positivo">Positivo</option>
                                    <option value="negativo">Negativo</option>
                                </select>
                            </td>
                        </tr>

                        {/* Active Straight-Leg Raise */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-teal-800 bg-teal-50" rowSpan="4">
                                Active Straight-Leg Raise<br />
                                <span className="text-xs font-normal text-gray-600">(Levantamiento activo con pierna recta)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/active-straight.png" alt="Active Straight-Leg Raise" className="h-20 w-auto object-contain" />
                                </div>
                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Medida</label>
                                    <input
                                        type="text"
                                        value={formData.fmsActiveStraightLegRaise.medida || ''}
                                        onChange={(e) => handleNestedChange('fmsActiveStraightLegRaise', 'medida', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        placeholder="Ingrese medida"
                                    />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Pierna evaluar: flexibilidad de isquios, glúteo, TFL, corva, gastrosoleo</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.piernaEvaluarFlexibilidad?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'piernaEvaluarFlexibilidad', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.piernaEvaluarFlexibilidad?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'piernaEvaluarFlexibilidad', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="4">
                                <FMSScoreInput
                                    testData={formData.fmsActiveStraightLegRaise}
                                    testName="fmsActiveStraightLegRaise"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="4">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsActiveStraightLegRaise.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsActiveStraightLegRaise', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Pierna a evaluar: activación flexores de cadera</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.piernaEvaluarActivacion?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'piernaEvaluarActivacion', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.piernaEvaluarActivacion?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'piernaEvaluarActivacion', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Pierna fija: extensión de rodilla y dorsiflexión de tobillo</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.piernaFijaExtension?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'piernaFijaExtension', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.piernaFijaExtension?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'piernaFijaExtension', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Estabilidad lumbo sacra</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsActiveStraightLegRaise.estabilidadLumboSacra?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsActiveStraightLegRaise', 'estabilidadLumboSacra', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* Trunk Stability Push-up */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-orange-800 bg-orange-50" rowSpan="2">
                                Trunk Stability Push-up<br />
                                <span className="text-xs font-normal text-gray-600">(Estabilidad de tronco)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/trunk-stability.png" alt="Trunk Stability Push-up" className="h-20 w-auto object-contain" />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Estabilidad simétrica de tronco en plano sagital</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <textarea
                                    value={formData.fmsTrunkStabilityPushup.estabilidadSimetricaTronco?.comentarios || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsTrunkStabilityPushup', 'estabilidadSimetricaTronco', 'comentarios', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="2">
                                <FMSScoreInput
                                    testData={formData.fmsTrunkStabilityPushup}
                                    testName="fmsTrunkStabilityPushup"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="2">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsTrunkStabilityPushup.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsTrunkStabilityPushup', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Movimiento simétrico de extremidades superiores</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsTrunkStabilityPushup.movimientoSimetricoExtremidades?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsTrunkStabilityPushup', 'movimientoSimetricoExtremidades', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsTrunkStabilityPushup.movimientoSimetricoExtremidades?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsTrunkStabilityPushup', 'movimientoSimetricoExtremidades', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* Press Up Clearing Test */}
                        <tr className="bg-yellow-50">
                            <td className="border border-gray-300 px-3 py-2 font-bold" rowSpan="1">
                                Press Up Clearing Test
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/press-up.png" alt="Press Up Clearing Test" className="h-20 w-auto object-contain" />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Detectar dolor de espalda baja</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsPressUpClearingTest?.comentariosDerecho || ''}
                                    onChange={(e) => handleNestedChange('fmsPressUpClearingTest', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsPressUpClearingTest?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleNestedChange('fmsPressUpClearingTest', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <select
                                    value={formData.fmsPressUpClearingTest?.resultado || ''}
                                    onChange={(e) => handleNestedChange('fmsPressUpClearingTest', 'resultado', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="positivo">Positivo</option>
                                    <option value="negativo">Negativo</option>
                                </select>
                            </td>
                        </tr>

                        {/* Rotary Stability */}
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-red-800 bg-red-50" rowSpan="2">
                                Rotary Stability<br />
                                <span className="text-xs font-normal text-gray-600">(Estabilidad rotatoria)</span>
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/rotary-stability.png" alt="Rotary Stability" className="h-20 w-auto object-contain" />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Estabilidad asimétrica del tronco en plano sagital y transversal</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsRotaryStability.estabilidadAsimetricaTronco?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsRotaryStability', 'estabilidadAsimetricaTronco', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsRotaryStability.estabilidadAsimetricaTronco?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsRotaryStability', 'estabilidadAsimetricaTronco', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="2">
                                <FMSScoreInput
                                    testData={formData.fmsRotaryStability}
                                    testName="fmsRotaryStability"
                                    handleNestedChange={handleNestedChange}
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" rowSpan="2">
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.fmsRotaryStability.puntuacionFinal}
                                    onChange={(e) => handleNestedChange('fmsRotaryStability', 'puntuacionFinal', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Movilidad asimétrica en extremidades superiores e inferiores</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsRotaryStability.movilidadAsimetricaExtremidades?.comentariosDerecho || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsRotaryStability', 'movilidadAsimetricaExtremidades', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsRotaryStability.movilidadAsimetricaExtremidades?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleFMSSubtestChange('fmsRotaryStability', 'movilidadAsimetricaExtremidades', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>

                        {/* Posterior Rocking Clearing Test */}
                        <tr className="bg-yellow-50">
                            <td className="border border-gray-300 px-3 py-2 font-bold" rowSpan="1">
                                Posterior Rocking Clearing Test
                                <div className="mt-2 flex justify-center">
                                    <img src="/img/posterior-rocking.png" alt="Posterior Rocking Clearing Test" className="h-20 w-auto object-contain" />
                                </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-xs">Detectar dolor en columna lumbar-torácica</td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsPosteriorRockingClearingTest?.comentariosDerecho || ''}
                                    onChange={(e) => handleNestedChange('fmsPosteriorRockingClearingTest', 'comentariosDerecho', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                                <textarea
                                    value={formData.fmsPosteriorRockingClearingTest?.comentariosIzquierdo || ''}
                                    onChange={(e) => handleNestedChange('fmsPosteriorRockingClearingTest', 'comentariosIzquierdo', e.target.value)}
                                    rows="2"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <select
                                    value={formData.fmsPosteriorRockingClearingTest?.resultado || ''}
                                    onChange={(e) => handleNestedChange('fmsPosteriorRockingClearingTest', 'resultado', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="positivo">Positivo</option>
                                    <option value="negativo">Negativo</option>
                                </select>
                            </td>
                        </tr>

                        {/* Total FMS */}
                        <tr className="bg-green-100">
                            <td className="border border-gray-300 px-3 py-2 font-bold text-green-800" colSpan="4">Total (Puntuación FMS)</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan="2">
                                <input
                                    type="number"
                                    min="0"
                                    max="21"
                                    value={formData.fmsTotalPuntuacion}
                                    onChange={(e) => handleInputChange('fmsTotalPuntuacion', parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border-2 border-green-500 rounded-lg text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Validación de PropTypes
FMSForm.propTypes = {
    formData: PropTypes.shape({
        fmsSuperiorDominante: PropTypes.string,
        fmsInferiorDominante: PropTypes.string,
        fmsDeepSquat: PropTypes.object,
        fmsHurdleStep: PropTypes.object,
        fmsInlineLunge: PropTypes.object,
        fmsShoulderMobility: PropTypes.object,
        fmsImpingementClearingTest: PropTypes.object,
        fmsActiveStraightLegRaise: PropTypes.object,
        fmsTrunkStabilityPushup: PropTypes.object,
        fmsPressUpClearingTest: PropTypes.object,
        fmsRotaryStability: PropTypes.object,
        fmsPosteriorRockingClearingTest: PropTypes.object,
        fmsTotalPuntuacion: PropTypes.number,
    }).isRequired,
    handleInputChange: PropTypes.func.isRequired,
    handleNestedChange: PropTypes.func.isRequired,
    handleFMSSubtestChange: PropTypes.func.isRequired,
};
