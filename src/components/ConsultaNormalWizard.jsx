import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faSave, faCheck } from '@fortawesome/free-solid-svg-icons';

const ConsultaNormalWizard = ({ isOpen, onClose, selectedClient, currentUser, existingDraft = null }) => {
  // Estado principal del formulario
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Estado del formulario - organizando todos los campos por secciones
  const [formData, setFormData] = useState({
    // 1. Padecimiento Actual
    recopilacionHechos: '',
    tipoPadecimiento: '',
    fechaPadecimiento: '',
    fechaDiagnostico: '',
    descripcionGeneral: '',
    antecedentesRelacionados: '',
    diagnosticoMedicoEspecialista: '',
    
    // 2. Antecedentes Heredo-Familiares
    enfermedadesCronicas: [
      {
        id: 1,
        descripcion: '',
        genetica: '', // 'materna' o 'paterna'
        estado: '' // 'vivo' o 'finado'
      }
    ],
    
    // 3. Antecedentes Patológicos
    // Infancia/adolescencia
    infanciaEnfermedad: '',
    infanciaCualEnfermedad: '',
    infanciaFechaEvolucion: '',
    infanciaTratamiento: '',
    // Actuales
    actualEnfermedad: '',
    actualCualEnfermedad: '',
    actualFechaEvolucion: '',
    actualTratamiento: '',
    // Alergias
    alergias: '',
    
    // 4. Antecedentes No Patológicos
    alimentacion: '',
    planNutricional: '',
    hidratacion: '',
    toxicomanias: '',
    habitosSueno: '',
    actividadFisica: '',
    sintomasEmocionales: '',
    
    // 5. Antecedentes Gineco-Obstétricos
    gestacionNatural: false,
    gestacionCesarea: false,
    gestacionAbortos: false,
    periodoDias: '',
    periodoCiclo: '',
    tratamientoHormonalTipo: '',
    tratamientoHormonalFecha: '',
    
    // 6. Traumatismo/Accidente
    traumatismoTipo: '',
    traumatismoCual: '',
    traumatismoFecha: '',
    traumatismoTratamiento: '',
    
    // 7. Cirugía
    cirugia: '',
    
    // 8. Exploración Física - Signos Vitales
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    tensionArterial: '',
    spo2: '',
    peso: '',
    estatura: '',
    
    // 9. Exploración Física - Inspección
    inspeccionPielDerecha: '',
    inspeccionPielIzquierda: '',
    inspeccionCicatrizDerecha: '',
    inspeccionCicatrizIzquierda: '',
    inspeccionEstructurasOseasDerecha: '',
    inspeccionEstructurasOseasIzquierda: '',
    
    // 10. Exploración Física - Palpación
    palpaciones: [
      {
        id: 1,
        segmento: '',
        piel: { derecho: '', izquierdo: '' },
        estructurasOseas: { derecho: '', izquierdo: '' },
        tejidoBlando: { derecho: '', izquierdo: '' }
      }
    ],
    pruebasEspecificas: '',
    
    // 11. Escala de Dolor
    escalasDolor: [
      {
        id: 1,
        segmento: '',
        antiguedad: { derecha: '', izquierda: '' },
        localizacion: { derecha: '', izquierda: '' },
        intensidad: { derecha: '', izquierda: '' },
        caracter: { derecha: '', izquierda: '' },
        irradiacion: { derecha: '', izquierda: '' },
        atenuacion: { derecha: '', izquierda: '' },
        agravacion: { derecha: '', izquierda: '' }
      }
    ],
    
    // 12. FMS (Functional Movement Screen)
    superiorDominante: '',
    ladoDominante: '',
    inferiorDominante: '',
    
    // Deep Squat
    deepSquatDorsiflexionDerecho: '',
    deepSquatDorsiflexionIzquierdo: '',
    deepSquatFlexionDerecho: '',
    deepSquatFlexionIzquierdo: '',
    deepSquatExtensionToracica: '',
    deepSquatFlexionHombrosDerecho: '',
    deepSquatFlexionHombrosIzquierdo: '',
    deepSquatActivacionCentral: '',
    deepSquatPuntuacionBruta: '',
    deepSquatPuntuacionFinal: '',
    
    // Hurdle Step
    hurdleStepMovilFlexionDerecho: '',
    hurdleStepMovilFlexionIzquierdo: '',
    hurdleStepMovilDorsiflexionDerecho: '',
    hurdleStepMovilDorsiflexionIzquierdo: '',
    hurdleStepFijaEstabilidadDerecho: '',
    hurdleStepFijaEstabilidadIzquierdo: '',
    hurdleStepFijaExtensionDerecho: '',
    hurdleStepFijaExtensionIzquierdo: '',
    hurdleStepCoordinacion: '',
    hurdleStepPuntuacionDerecha: '',
    hurdleStepPuntuacionIzquierda: '',
    
    // In-line Lunge
    inlineLungeDelanteraMovilidadDerecho: '',
    inlineLungeDelanteraMovilidadIzquierdo: '',
    inlineLungeDelanteraEstabilidadDerecho: '',
    inlineLungeDelanteraEstabilidadIzquierdo: '',
    inlineLungeTraseraMovilidadDerecho: '',
    inlineLungeTraseraMovilidadIzquierdo: '',
    inlineLungeFlexibilidadDerecho: '',
    inlineLungeFlexibilidadIzquierdo: '',
    inlineLungeEquilibrio: '',
    inlineLungePuntuacionDerecha: '',
    inlineLungePuntuacionIzquierda: '',
    
    // Active Straight Leg Raise
    aslrFlexibilidadDerecho: '',
    aslrFlexibilidadIzquierdo: '',
    aslrActivacionDerecho: '',
    aslrActivacionIzquierdo: '',
    aslrExtensionFijaDerecho: '',
    aslrExtensionFijaIzquierdo: '',
    aslrEstabilidadLumbosacra: '',
    aslrPuntuacionDerecha: '',
    aslrPuntuacionIzquierda: '',
    
    // Press up Clearing Test
    pressUpDolorDerecho: '',
    pressUpDolorIzquierdo: '',
    pressUpDeteccion: '',
    
    // Rotary Stability
    rotaryEstabilidadDerecho: '',
    rotaryEstabilidadIzquierdo: '',
    rotaryMovilidadDerecho: '',
    rotaryMovilidadIzquierdo: '',
    rotaryPuntuacionDerecha: '',
    rotaryPuntuacionIzquierda: '',
    
    // Posterior Rocking Clearing Test
    posteriorRockingDolorDerecho: '',
    posteriorRockingDolorIzquierdo: '',
    posteriorRockingDeteccion: '',
    
    // Total FMS
    fmsTotal: '',
    
    // 13. Consulta y Diagnóstico
    motivoConsulta: '',
    objetivoPaciente: '',
    diagnosticoFisioterapeuticoGeneral: '',
    diagnosticoFisioterapeuticoEspecifico: '',
    
    // 14. Plan y Seguimiento
    tratamientoPropuesto: '',
    fechaHospitalizacion: '',
    fechaAlta: '',
    diasAtencionMedica: '',
    tratamientoFuturo: '',
    farmacos: '',
    complicaciones: '',
    
    // 15. Estudios de Gabinete
    estudio1Imagen: null,
    estudio1Fecha: '',
    estudio1Descripcion: '',
    estudio2Imagen: null,
    estudio2Fecha: '',
    estudio2Descripcion: '',
    estudio3Imagen: null,
    estudio3Fecha: '',
    estudio3Descripcion: '',
    
    // 16. Intervención y Control
    intervencionFisioterapeutica: '',
    controlSesiones: '',

  });

  // Total de pasos en el wizard
  const totalSteps = 25;

  // Cargar draft existente si existe
  useEffect(() => {
    if (existingDraft) {
      setFormData({ ...formData, ...existingDraft.respuestas });
      setCurrentStep(existingDraft.currentStep || 1);
    }
  }, [existingDraft]);

  // Función para actualizar campos del formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // Función para manejar carga de archivos
  const handleFileUpload = async (field, file) => {
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    
    try {
      const fileName = `consultas-normales/${selectedClient.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      handleInputChange(field, downloadURL);
      setUploadProgress(prev => ({ ...prev, [field]: 100 }));
      
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[field];
          return newProgress;
        });
      }, 2000);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[field];
        return newProgress;
      });
    }
  };

  // Navegación del wizard
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Guardar borrador
  const saveDraft = async () => {
    setIsLoading(true);
    
    try {
      const draftId = existingDraft ? existingDraft.id : `${selectedClient.uid}_${Date.now()}`;
      
      const draftData = {
        uidCliente: selectedClient.uid,
        uidTrabajador: currentUser.uid,
        respuestas: formData,
        currentStep: currentStep,
        status: 'incompleto',
        updatedAt: serverTimestamp()
      };

      if (!existingDraft) {
        draftData.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, 'consultasNormales', draftId), draftData, { merge: true });
      
      alert('Borrador guardado exitosamente ✅');
    } catch (error) {
      console.error('Error guardando borrador:', error);
      alert('Error al guardar borrador');
    } finally {
      setIsLoading(false);
    }
  };

  // Finalizar consulta
  const finishConsultation = async () => {
    setIsLoading(true);
    
    try {
      const consultationId = `${selectedClient.uid}_${Date.now()}`;
      
      const consultationData = {
        clienteId: selectedClient.uid,
        uidCliente: selectedClient.uid,
        uidTrabajador: currentUser.uid,
        respuestas: formData,
        answers: formData, // Agregar también como answers para compatibilidad
        currentStep: totalSteps,
        status: 'completed', // Cambiar a 'completed' para consistencia
        type: 'normal', // Identificar como consulta médica normal
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'consultas', consultationId), consultationData);
      
      // Eliminar borrador si existe
      if (existingDraft) {
        await deleteDoc(doc(db, 'consultasNormales', existingDraft.id));
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        // Resetear formulario
        setFormData({
          // 1. Padecimiento Actual
          recopilacionHechos: '', tipoPadecimiento: '', fechaPadecimiento: '', fechaDiagnostico: '',
          descripcionGeneral: '', antecedentesRelacionados: '', diagnosticoMedicoEspecialista: '',
          
          // 2. Antecedentes Heredo-Familiares
          enfermedadesCronicas: [
            {
              id: 1,
              descripcion: '',
              genetica: '',
              estado: ''
            }
          ],
          
          // 3. Antecedentes Patológicos
          infanciaEnfermedad: '', infanciaCualEnfermedad: '', infanciaFechaEvolucion: '', infanciaTratamiento: '',
          actualEnfermedad: '', actualCualEnfermedad: '', actualFechaEvolucion: '', actualTratamiento: '',
          alergias: '',
          
          // 4. Antecedentes No Patológicos
          alimentacion: '', planNutricional: '', hidratacion: '', toxicomanias: '',
          habitosSueno: '', actividadFisica: '', sintomasEmocionales: '',
          
          // 5. Antecedentes Gineco-Obstétricos
          gestacionNatural: false, gestacionCesarea: false, gestacionAbortos: false,
          periodoDias: '', periodoCiclo: '', tratamientoHormonalTipo: '', tratamientoHormonalFecha: '',
          
          // 6. Traumatismo/Accidente
          traumatismoTipo: '', traumatismoCual: '', traumatismoFecha: '', traumatismoTratamiento: '',
          
          // 7. Cirugía
          cirugia: '',
          
          // 8-11. Exploración Física
          frecuenciaCardiaca: '', frecuenciaRespiratoria: '', tensionArterial: '', spo2: '', peso: '', estatura: '',
          inspeccionPielDerecha: '', inspeccionPielIzquierda: '', inspeccionCicatrizDerecha: '', inspeccionCicatrizIzquierda: '',
          inspeccionEstructurasOseasDerecha: '', inspeccionEstructurasOseasIzquierda: '',
          palpaciones: [
            {
              id: 1,
              segmento: '',
              piel: { derecho: '', izquierdo: '' },
              estructurasOseas: { derecho: '', izquierdo: '' },
              tejidoBlando: { derecho: '', izquierdo: '' }
            }
          ],
          pruebasEspecificas: '',
          
          // 12. Escala de Dolor (bilateral)
          escalasDolor: [
            {
              id: 1,
              segmento: '',
              antiguedad: { derecha: '', izquierda: '' },
              localizacion: { derecha: '', izquierda: '' },
              intensidad: { derecha: '', izquierda: '' },
              caracter: { derecha: '', izquierda: '' },
              irradiacion: { derecha: '', izquierda: '' },
              atenuacion: { derecha: '', izquierda: '' },
              agravacion: { derecha: '', izquierda: '' }
            }
          ],
          
          // 13-19. FMS
          superiorDominante: '', ladoDominante: '', inferiorDominante: '',
          deepSquatDorsiflexionDerecho: '', deepSquatDorsiflexionIzquierdo: '', deepSquatFlexionDerecho: '', deepSquatFlexionIzquierdo: '',
          deepSquatExtensionToracica: '', deepSquatFlexionHombrosDerecho: '', deepSquatFlexionHombrosIzquierdo: '',
          deepSquatActivacionCentral: '', deepSquatPuntuacionBruta: '', deepSquatPuntuacionFinal: '',
          hurdleStepMovilFlexionDerecho: '', hurdleStepMovilFlexionIzquierdo: '', hurdleStepMovilDorsiflexionDerecho: '', hurdleStepMovilDorsiflexionIzquierdo: '',
          hurdleStepFijaEstabilidadDerecho: '', hurdleStepFijaEstabilidadIzquierdo: '', hurdleStepFijaExtensionDerecho: '', hurdleStepFijaExtensionIzquierdo: '',
          hurdleStepCoordinacion: '', hurdleStepPuntuacionDerecha: '', hurdleStepPuntuacionIzquierda: '',
          inlineLungeDelanteraMovilidadDerecho: '', inlineLungeDelanteraMovilidadIzquierdo: '', inlineLungeDelanteraEstabilidadDerecho: '', inlineLungeDelanteraEstabilidadIzquierdo: '',
          inlineLungeTraseraMovilidadDerecho: '', inlineLungeTraseraMovilidadIzquierdo: '', inlineLungeFlexibilidadDerecho: '', inlineLungeFlexibilidadIzquierdo: '',
          inlineLungeEquilibrio: '', inlineLungePuntuacionDerecha: '', inlineLungePuntuacionIzquierda: '',
          aslrFlexibilidadDerecho: '', aslrFlexibilidadIzquierdo: '', aslrActivacionDerecho: '', aslrActivacionIzquierdo: '',
          aslrExtensionFijaDerecho: '', aslrExtensionFijaIzquierdo: '', aslrEstabilidadLumbosacra: '',
          aslrPuntuacionDerecha: '', aslrPuntuacionIzquierda: '',
          pressUpDolorDerecho: '', pressUpDolorIzquierdo: '', pressUpDeteccion: '',
          rotaryEstabilidadDerecho: '', rotaryEstabilidadIzquierdo: '', rotaryMovilidadDerecho: '', rotaryMovilidadIzquierdo: '',
          rotaryPuntuacionDerecha: '', rotaryPuntuacionIzquierda: '',
          posteriorRockingDolorDerecho: '', posteriorRockingDolorIzquierdo: '', posteriorRockingDeteccion: '',
          fmsTotal: '',
          
          // 20. Consulta y Diagnóstico
          motivoConsulta: '', objetivoPaciente: '', diagnosticoFisioterapeuticoGeneral: '', diagnosticoFisioterapeuticoEspecifico: '',
          
          // 21. Plan y Seguimiento + Estudios
          tratamientoPropuesto: '', fechaHospitalizacion: '', fechaAlta: '', diasAtencionMedica: '',
          tratamientoFuturo: '', farmacos: '', complicaciones: '',
          estudio1Imagen: null, estudio1Fecha: '', estudio1Descripcion: '',
          estudio2Imagen: null, estudio2Fecha: '', estudio2Descripcion: '',
          estudio3Imagen: null, estudio3Fecha: '', estudio3Descripcion: '',
          
          // 22. Intervención y Control
          intervencionFisioterapeutica: '', controlSesiones: ''
        });
        setCurrentStep(1);
      }, 2000);
    } catch (error) {
      console.error('Error finalizando consulta:', error);
      alert('Error al finalizar consulta');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar campos por paso
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Padecimiento Actual
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">1. Padecimiento Actual</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recopilación de Hechos *
              </label>
              <select
                value={formData.recopilacionHechos}
                onChange={(e) => handleInputChange('recopilacionHechos', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="primera_vez">Primera vez</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="revision">Revisión</option>
                <option value="urgencia">Urgencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Padecimiento *
              </label>
              <select
                value={formData.tipoPadecimiento}
                onChange={(e) => handleInputChange('tipoPadecimiento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="agudo">Agudo</option>
                <option value="cronico">Crónico</option>
                <option value="subagudo">Subagudo</option>
                <option value="recurrente">Recurrente</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de padecimiento (día)
                </label>
                <input
                  type="date"
                  value={formData.fechaPadecimiento}
                  onChange={(e) => handleInputChange('fechaPadecimiento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de dx. (día)
                </label>
                <input
                  type="date"
                  value={formData.fechaDiagnostico}
                  onChange={(e) => handleInputChange('fechaDiagnostico', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción general - (dolor / limitación / acortamiento / etc.)
              </label>
              <textarea
                value={formData.descripcionGeneral}
                onChange={(e) => handleInputChange('descripcionGeneral', e.target.value)}
                placeholder="Acontecimiento signos / síntomas principales (localización / tiempo de evolución / características)"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antecedentes relacionados
              </label>
              <textarea
                value={formData.antecedentesRelacionados}
                onChange={(e) => handleInputChange('antecedentesRelacionados', e.target.value)}
                placeholder="Fecha de diagnóstico / evolución / características"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico médico / especialista
              </label>
              <textarea
                value={formData.diagnosticoMedicoEspecialista}
                onChange={(e) => handleInputChange('diagnosticoMedicoEspecialista', e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 2: // Antecedentes Heredo-Familiares
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">2. Antecedentes Heredo-Familiares</h3>
            
            {/* Lista de enfermedades crónicas */}
            <div className="space-y-4">
              {formData.enfermedadesCronicas.map((enfermedad, index) => (
                <div key={enfermedad.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Enfermedad crónica {formData.enfermedadesCronicas.length > 1 ? `#${index + 1}` : ''}
                    </h4>
                    {formData.enfermedadesCronicas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newEnfermedades = formData.enfermedadesCronicas.filter(e => e.id !== enfermedad.id);
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción de la enfermedad crónica familiar
                    </label>
                    <textarea
                      value={enfermedad.descripcion}
                      onChange={(e) => {
                        const newEnfermedades = formData.enfermedadesCronicas.map(enf =>
                          enf.id === enfermedad.id ? { ...enf, descripcion: e.target.value } : enf
                        );
                        handleInputChange('enfermedadesCronicas', newEnfermedades);
                      }}
                      rows={2}
                      placeholder="Describe la enfermedad crónica familiar..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                            name={`genetica-${enfermedad.id}`}
                            value="materna"
                            checked={enfermedad.genetica === 'materna'}
                            onChange={(e) => {
                              const newEnfermedades = formData.enfermedadesCronicas.map(enf =>
                                enf.id === enfermedad.id ? { ...enf, genetica: e.target.value } : enf
                              );
                              handleInputChange('enfermedadesCronicas', newEnfermedades);
                            }}
                            className="form-radio text-teal-600 focus:ring-teal-500 h-4 w-4"
                          />
                          <span className="ml-2 text-sm text-gray-700">Materna</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`genetica-${enfermedad.id}`}
                            value="paterna"
                            checked={enfermedad.genetica === 'paterna'}
                            onChange={(e) => {
                              const newEnfermedades = formData.enfermedadesCronicas.map(enf =>
                                enf.id === enfermedad.id ? { ...enf, genetica: e.target.value } : enf
                              );
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
                            name={`estado-${enfermedad.id}`}
                            value="vivo"
                            checked={enfermedad.estado === 'vivo'}
                            onChange={(e) => {
                              const newEnfermedades = formData.enfermedadesCronicas.map(enf =>
                                enf.id === enfermedad.id ? { ...enf, estado: e.target.value } : enf
                              );
                              handleInputChange('enfermedadesCronicas', newEnfermedades);
                            }}
                            className="form-radio text-green-600 focus:ring-green-500 h-4 w-4"
                          />
                          <span className="ml-2 text-sm text-gray-700">Vivo</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`estado-${enfermedad.id}`}
                            value="finado"
                            checked={enfermedad.estado === 'finado'}
                            onChange={(e) => {
                              const newEnfermedades = formData.enfermedadesCronicas.map(enf =>
                                enf.id === enfermedad.id ? { ...enf, estado: e.target.value } : enf
                              );
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
                        Detalles adicionales del parentesco {enfermedad.genetica === 'materna' ? 'materno' : 'paterno'}...
                      </label>
                      <textarea
                        value={enfermedad.detalles || ''}
                        onChange={(e) => {
                          const newEnfermedades = formData.enfermedadesCronicas.map(enf =>
                            enf.id === enfermedad.id ? { ...enf, detalles: e.target.value } : enf
                          );
                          handleInputChange('enfermedadesCronicas', newEnfermedades);
                        }}
                        rows={2}
                        placeholder={`Detalles adicionales del parentesco ${enfermedad.genetica === 'materna' ? 'materno' : 'paterno'}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Botón para agregar más enfermedades */}
              <button
                type="button"
                onClick={() => {
                  const newId = Math.max(...formData.enfermedadesCronicas.map(e => e.id), 0) + 1;
                  const newEnfermedad = {
                    id: newId,
                    descripcion: '',
                    genetica: '',
                    estado: ''
                  };
                  handleInputChange('enfermedadesCronicas', [...formData.enfermedadesCronicas, newEnfermedad]);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar otra enfermedad crónica
              </button>
            </div>
          </div>
        );

      case 3: // Antecedentes Patológicos
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">3. Antecedentes Patológicos</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Infancia / adolescencia</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enfermedad
                  </label>
                  <select
                    value={formData.infanciaEnfermedad}
                    onChange={(e) => handleInputChange('infanciaEnfermedad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Seleccione...</option>
                    <option value="ninguna">Ninguna</option>
                    <option value="asma">Asma</option>
                    <option value="alergias">Alergias</option>
                    <option value="fracturas">Fracturas</option>
                    <option value="otra">Otra</option>
                  </select>
                </div>

                {(formData.infanciaEnfermedad && formData.infanciaEnfermedad !== 'ninguna') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuál es?
                    </label>
                    <input
                      type="text"
                      value={formData.infanciaCualEnfermedad}
                      onChange={(e) => handleInputChange('infanciaCualEnfermedad', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha / evolución (día)
                  </label>
                  <input
                    type="date"
                    value={formData.infanciaFechaEvolucion}
                    onChange={(e) => handleInputChange('infanciaFechaEvolucion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamiento
                  </label>
                  <input
                    type="text"
                    value={formData.infanciaTratamiento}
                    onChange={(e) => handleInputChange('infanciaTratamiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Actuales</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enfermedad
                  </label>
                  <select
                    value={formData.actualEnfermedad}
                    onChange={(e) => handleInputChange('actualEnfermedad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Seleccione...</option>
                    <option value="ninguna">Ninguna</option>
                    <option value="diabetes">Diabetes</option>
                    <option value="hipertension">Hipertensión</option>
                    <option value="cardiopatia">Cardiopatía</option>
                    <option value="otra">Otra</option>
                  </select>
                </div>

                {(formData.actualEnfermedad && formData.actualEnfermedad !== 'ninguna') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuál es?
                    </label>
                    <input
                      type="text"
                      value={formData.actualCualEnfermedad}
                      onChange={(e) => handleInputChange('actualCualEnfermedad', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha / evolución (día)
                  </label>
                  <input
                    type="date"
                    value={formData.actualFechaEvolucion}
                    onChange={(e) => handleInputChange('actualFechaEvolucion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamiento
                  </label>
                  <input
                    type="text"
                    value={formData.actualTratamiento}
                    onChange={(e) => handleInputChange('actualTratamiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-gray-800 mb-3">Alergias</h4>
              <textarea
                value={formData.alergias}
                onChange={(e) => handleInputChange('alergias', e.target.value)}
                placeholder="Medicamentos, alimentos, sustancias, etc. Si no tiene alergias conocidas, escriba 'Ninguna'"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 4: // Antecedentes No Patológicos - Parte 1
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">4. Antecedentes No Patológicos - Parte 1</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alimentación (cantidad/calidad)
              </label>
              <textarea
                value={formData.alimentacion}
                onChange={(e) => handleInputChange('alimentacion', e.target.value)}
                placeholder="Describa hábitos alimentarios, frecuencia de comidas, tipo de dieta"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan nutricional
              </label>
              <textarea
                value={formData.planNutricional}
                onChange={(e) => handleInputChange('planNutricional', e.target.value)}
                placeholder="¿Sigue algún plan nutricional específico?"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hidratación (cantidad/ otras sustancias)
              </label>
              <textarea
                value={formData.hidratacion}
                onChange={(e) => handleInputChange('hidratacion', e.target.value)}
                placeholder="Cantidad de agua diaria, otros líquidos"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toxicomanías (alcohol/ tabaco/ drogas)
              </label>
              <textarea
                value={formData.toxicomanias}
                onChange={(e) => handleInputChange('toxicomanias', e.target.value)}
                placeholder="Frecuencia, cantidad, tiempo de consumo"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 5: // Antecedentes No Patológicos - Parte 2
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">4. Antecedentes No Patológicos - Parte 2</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hábitos de sueño (horas/complicaciones)
              </label>
              <textarea
                value={formData.habitosSueno}
                onChange={(e) => handleInputChange('habitosSueno', e.target.value)}
                placeholder="Horas de sueño, calidad del descanso, problemas para dormir"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actividad física/hobbies (frecuencia/duración)
              </label>
              <textarea
                value={formData.actividadFisica}
                onChange={(e) => handleInputChange('actividadFisica', e.target.value)}
                placeholder="Tipo de ejercicio, frecuencia, intensidad"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Síntomas emocionales (fecha/control)
              </label>
              <textarea
                value={formData.sintomasEmocionales}
                onChange={(e) => handleInputChange('sintomasEmocionales', e.target.value)}
                placeholder="Estrés, ansiedad, depresión, cambios de humor"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 6: // Antecedentes Gineco-Obstétricos
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">5. Antecedentes Gineco-Obstétricos</h3>
            <p className="text-sm text-gray-600 mb-4">Solo aplicable para mujeres</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gestación (Opción múltiple)
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.gestacionNatural}
                    onChange={(e) => handleInputChange('gestacionNatural', e.target.checked)}
                    className="mr-2"
                  />
                  Natural ( )
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.gestacionCesarea}
                    onChange={(e) => handleInputChange('gestacionCesarea', e.target.checked)}
                    className="mr-2"
                  />
                  Cesárea ( )
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.gestacionAbortos}
                    onChange={(e) => handleInputChange('gestacionAbortos', e.target.checked)}
                    className="mr-2"
                  />
                  Abortos ( )
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período: Días
                </label>
                <input
                  type="number"
                  value={formData.periodoDias}
                  onChange={(e) => handleInputChange('periodoDias', e.target.value)}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período: Ciclo
                </label>
                <input
                  type="number"
                  value={formData.periodoCiclo}
                  onChange={(e) => handleInputChange('periodoCiclo', e.target.value)}
                  placeholder="Días del ciclo (ej: 28)"
                  min="20"
                  max="40"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tratamiento hormonal: Tipo
              </label>
              <input
                type="text"
                value={formData.tratamientoHormonalTipo}
                onChange={(e) => handleInputChange('tratamientoHormonalTipo', e.target.value)}
                placeholder="Tipo de tratamiento hormonal"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tratamiento hormonal: Fecha (día)
              </label>
              <input
                type="date"
                value={formData.tratamientoHormonalFecha}
                onChange={(e) => handleInputChange('tratamientoHormonalFecha', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 7: // Traumatismo/Accidente
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">6. Traumatismo / Accidente</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo (descripción)
              </label>
              <select
                value={formData.traumatismoTipo}
                onChange={(e) => handleInputChange('traumatismoTipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Seleccione...</option>
                <option value="ninguno">Ninguno</option>
                <option value="caida">Caída</option>
                <option value="accidente_transito">Accidente de tránsito</option>
                <option value="accidente_laboral">Accidente laboral</option>
                <option value="accidente_deportivo">Accidente deportivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {(formData.traumatismoTipo && formData.traumatismoTipo !== 'ninguno') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuál es?
                  </label>
                  <input
                    type="text"
                    value={formData.traumatismoCual}
                    onChange={(e) => handleInputChange('traumatismoCual', e.target.value)}
                    placeholder="Describa el traumatismo o accidente específico"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha (día)
                  </label>
                  <input
                    type="date"
                    value={formData.traumatismoFecha}
                    onChange={(e) => handleInputChange('traumatismoFecha', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamiento / complicaciones
                  </label>
                  <textarea
                    value={formData.traumatismoTratamiento}
                    onChange={(e) => handleInputChange('traumatismoTratamiento', e.target.value)}
                    placeholder="Describa el tratamiento recibido y cualquier complicación"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 8: // Cirugía
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">7. Cirugía</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CIRUGÍA
              </label>
              <textarea
                value={formData.cirugia}
                onChange={(e) => handleInputChange('cirugia', e.target.value)}
                placeholder="Describa cualquier cirugía previa (tipo, fecha, complicaciones, etc.). Si no ha tenido cirugías, escriba 'Ninguna'"
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 9: // Exploración Física - Signos Vitales
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">8. Exploración Física (PACIENTE) - SIGNOS VITALES</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia cardiaca
                </label>
                <input
                  type="number"
                  value={formData.frecuenciaCardiaca}
                  onChange={(e) => handleInputChange('frecuenciaCardiaca', e.target.value)}
                  min="40"
                  max="200"
                  placeholder="60-100 bpm normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia respiratoria
                </label>
                <input
                  type="number"
                  value={formData.frecuenciaRespiratoria}
                  onChange={(e) => handleInputChange('frecuenciaRespiratoria', e.target.value)}
                  min="10"
                  max="30"
                  placeholder="12-20 rpm normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tensión arterial
                </label>
                <input
                  type="text"
                  value={formData.tensionArterial}
                  onChange={(e) => handleInputChange('tensionArterial', e.target.value)}
                  placeholder="120/80 mmHg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SpO2 - %
                </label>
                <input
                  type="number"
                  value={formData.spo2}
                  onChange={(e) => handleInputChange('spo2', e.target.value)}
                  min="70"
                  max="100"
                  placeholder="95-100% normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso - kg
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => handleInputChange('peso', e.target.value)}
                  min="20"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estatura - m
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estatura}
                  onChange={(e) => handleInputChange('estatura', e.target.value)}
                  min="1.00"
                  max="2.50"
                  placeholder="1.70"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {formData.peso && formData.estatura && (
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-teal-800">
                  IMC calculado: {((formData.peso / (formData.estatura * formData.estatura)).toFixed(2))} kg/m²
                </p>
              </div>
            )}
          </div>
        );

      case 10: // Exploración Física - Inspección
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">8. Exploración Física - INSPECCIÓN</h3>
            <p className="text-sm text-gray-600 mb-4">Segmento: Derecha / Izquierda</p>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Piel (estado/ textura/ coloración/alteraciones)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derecha
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionPielDerecha}
                    onChange={(e) => handleInputChange('inspeccionPielDerecha', e.target.value)}
                    placeholder="Estado, textura, coloración, alteraciones"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Izquierda
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionPielIzquierda}
                    onChange={(e) => handleInputChange('inspeccionPielIzquierda', e.target.value)}
                    placeholder="Estado, textura, coloración, alteraciones"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Cicatriz (ubicación/ longitud/ características)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derecha
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionCicatrizDerecha}
                    onChange={(e) => handleInputChange('inspeccionCicatrizDerecha', e.target.value)}
                    placeholder="Ubicación, longitud, características"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Izquierda
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionCicatrizIzquierda}
                    onChange={(e) => handleInputChange('inspeccionCicatrizIzquierda', e.target.value)}
                    placeholder="Ubicación, longitud, características"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Estructuras óseas (posicionamiento/simetría)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derecha
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionEstructurasOseasDerecha}
                    onChange={(e) => handleInputChange('inspeccionEstructurasOseasDerecha', e.target.value)}
                    placeholder="Posicionamiento, simetría"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Izquierda
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionEstructurasOseasIzquierda}
                    onChange={(e) => handleInputChange('inspeccionEstructurasOseasIzquierda', e.target.value)}
                    placeholder="Posicionamiento, simetría"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 11: // Exploración Física - Palpación
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">8. Exploración Física - PALPACIÓN</h3>
            
            {/* Lista de palpaciones */}
            <div className="space-y-4">
              {formData.palpaciones.map((palpacion, index) => (
                <div key={palpacion.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Segmento {formData.palpaciones.length > 1 ? `#${index + 1}` : ''}
                    </h4>
                    {formData.palpaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPalpaciones = formData.palpaciones.filter(p => p.id !== palpacion.id);
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especificar segmento corporal
                    </label>
                    <input
                      type="text"
                      value={palpacion.segmento}
                      onChange={(e) => {
                        const newPalpaciones = formData.palpaciones.map(p =>
                          p.id === palpacion.id ? { ...p, segmento: e.target.value } : p
                        );
                        handleInputChange('palpaciones', newPalpaciones);
                      }}
                      placeholder="Ej: Hombro, Rodilla, Tobillo..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-800 mb-3">Piel (estado/temperatura/tumefacción/edema/dolor)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Derecha
                        </label>
                        <input
                          type="text"
                          value={palpacion.piel.derecho}
                          onChange={(e) => {
                            const newPalpaciones = formData.palpaciones.map(p =>
                              p.id === palpacion.id ? { ...p, piel: { ...p.piel, derecho: e.target.value } } : p
                            );
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          placeholder="Estado, temperatura, tumefacción, edema, dolor"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Izquierda
                        </label>
                        <input
                          type="text"
                          value={palpacion.piel.izquierdo}
                          onChange={(e) => {
                            const newPalpaciones = formData.palpaciones.map(p =>
                              p.id === palpacion.id ? { ...p, piel: { ...p.piel, izquierdo: e.target.value } } : p
                            );
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          placeholder="Estado, temperatura, tumefacción, edema, dolor"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-800 mb-3">Estructuras óseas (sensaciones finales)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Derecha
                        </label>
                        <input
                          type="text"
                          value={palpacion.estructurasOseas.derecho}
                          onChange={(e) => {
                            const newPalpaciones = formData.palpaciones.map(p =>
                              p.id === palpacion.id ? { ...p, estructurasOseas: { ...p.estructurasOseas, derecho: e.target.value } } : p
                            );
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          placeholder="Sensaciones finales"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Izquierda
                        </label>
                        <input
                          type="text"
                          value={palpacion.estructurasOseas.izquierdo}
                          onChange={(e) => {
                            const newPalpaciones = formData.palpaciones.map(p =>
                              p.id === palpacion.id ? { ...p, estructurasOseas: { ...p.estructurasOseas, izquierdo: e.target.value } } : p
                            );
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          placeholder="Sensaciones finales"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-800 mb-3">Tejido blando (espasmo/tensión/debilidad/discontinuidad)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Derecha
                        </label>
                        <input
                          type="text"
                          value={palpacion.tejidoBlando.derecho}
                          onChange={(e) => {
                            const newPalpaciones = formData.palpaciones.map(p =>
                              p.id === palpacion.id ? { ...p, tejidoBlando: { ...p.tejidoBlando, derecho: e.target.value } } : p
                            );
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          placeholder="Espasmo, tensión, debilidad, discontinuidad"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Izquierda
                        </label>
                        <input
                          type="text"
                          value={palpacion.tejidoBlando.izquierdo}
                          onChange={(e) => {
                            const newPalpaciones = formData.palpaciones.map(p =>
                              p.id === palpacion.id ? { ...p, tejidoBlando: { ...p.tejidoBlando, izquierdo: e.target.value } } : p
                            );
                            handleInputChange('palpaciones', newPalpaciones);
                          }}
                          placeholder="Espasmo, tensión, debilidad, discontinuidad"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón para agregar más segmentos */}
              <button
                type="button"
                onClick={() => {
                  const newId = Math.max(...formData.palpaciones.map(p => p.id), 0) + 1;
                  const newPalpacion = {
                    id: newId,
                    segmento: '',
                    piel: { derecho: '', izquierdo: '' },
                    estructurasOseas: { derecho: '', izquierdo: '' },
                    tejidoBlando: { derecho: '', izquierdo: '' }
                  };
                  handleInputChange('palpaciones', [...formData.palpaciones, newPalpacion]);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar otro segmento de palpación
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PRUEBAS ESPECÍFICAS
              </label>
              <textarea
                value={formData.pruebasEspecificas}
                onChange={(e) => handleInputChange('pruebasEspecificas', e.target.value)}
                placeholder="Pruebas ortopédicas, neurológicas, funcionales realizadas"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 12: // Estudios de Gabinete
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">12. Estudios de Gabinete</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Estudio 1
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('estudioImagen1', e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {uploadProgress.estudioImagen1 !== undefined && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.estudioImagen1}%` }}></div>
                  </div>
                )}
                {formData.estudioImagen1 && (
                  <p className="text-sm text-green-600 mt-1">✅ Archivo cargado exitosamente</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Estudio 2
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('estudioImagen2', e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {uploadProgress.estudioImagen2 !== undefined && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.estudioImagen2}%` }}></div>
                  </div>
                )}
                {formData.estudioImagen2 && (
                  <p className="text-sm text-green-600 mt-1">✅ Archivo cargado exitosamente</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Estudio 3
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('estudioImagen3', e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {uploadProgress.estudioImagen3 !== undefined && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.estudioImagen3}%` }}></div>
                  </div>
                )}
                {formData.estudioImagen3 && (
                  <p className="text-sm text-green-600 mt-1">✅ Archivo cargado exitosamente</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del Estudio
              </label>
              <input
                type="date"
                value={formData.fechaEstudio}
                onChange={(e) => handleInputChange('fechaEstudio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Estudio
              </label>
              <textarea
                value={formData.descripcionEstudio}
                onChange={(e) => handleInputChange('descripcionEstudio', e.target.value)}
                placeholder="Tipo de estudio, hallazgos, interpretación"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 13: // Escala de Dolor (bilateral)
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">13. Escala de Dolor</h3>
            
            {/* Lista de escalas de dolor */}
            <div className="space-y-4">
              {formData.escalasDolor.map((escalaDolor, index) => (
                <div key={escalaDolor.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Segmento {formData.escalasDolor.length > 1 ? `#${index + 1}` : ''}
                    </h4>
                    {formData.escalasDolor.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newEscalas = formData.escalasDolor.filter(e => e.id !== escalaDolor.id);
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especificar segmento corporal
                    </label>
                    <input
                      type="text"
                      value={escalaDolor.segmento}
                      onChange={(e) => {
                        const newEscalas = formData.escalasDolor.map(esc =>
                          esc.id === escalaDolor.id ? { ...esc, segmento: e.target.value } : esc
                        );
                        handleInputChange('escalasDolor', newEscalas);
                      }}
                      placeholder="Ej: Hombro, Rodilla, Lumbar..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {[
                    { key: 'antiguedad', label: 'Antigüedad', placeholder: 'Tiempo de evolución del dolor' },
                    { key: 'localizacion', label: 'Localización', placeholder: 'Ubicación específica del dolor' },
                    { key: 'intensidad', label: 'Intensidad', placeholder: 'Intensidad del dolor (0-10 o descripción)' },
                    { key: 'caracter', label: 'Carácter', placeholder: 'Punzante, sordo, quemante...' },
                    { key: 'irradiacion', label: 'Irradiación', placeholder: 'Hacia dónde se extiende el dolor' },
                    { key: 'atenuacion', label: 'Atenuación', placeholder: 'Qué mejora o reduce el dolor' },
                    { key: 'agravacion', label: 'Agravación', placeholder: 'Qué empeora o aumenta el dolor' }
                  ].map((field) => (
                    <div key={field.key} className="border rounded-lg p-4 bg-white">
                      <h4 className="font-medium text-gray-800 mb-3">{field.label}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Derecha
                          </label>
                          <input
                            type="text"
                            value={escalaDolor[field.key].derecha}
                            onChange={(e) => {
                              const newEscalas = formData.escalasDolor.map(esc =>
                                esc.id === escalaDolor.id 
                                  ? { ...esc, [field.key]: { ...esc[field.key], derecha: e.target.value } } 
                                  : esc
                              );
                              handleInputChange('escalasDolor', newEscalas);
                            }}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Izquierda
                          </label>
                          <input
                            type="text"
                            value={escalaDolor[field.key].izquierda}
                            onChange={(e) => {
                              const newEscalas = formData.escalasDolor.map(esc =>
                                esc.id === escalaDolor.id 
                                  ? { ...esc, [field.key]: { ...esc[field.key], izquierda: e.target.value } } 
                                  : esc
                              );
                              handleInputChange('escalasDolor', newEscalas);
                            }}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Botón para agregar más segmentos */}
              <button
                type="button"
                onClick={() => {
                  const newId = Math.max(...formData.escalasDolor.map(e => e.id), 0) + 1;
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
                  handleInputChange('escalasDolor', [...formData.escalasDolor, newEscala]);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar otro segmento de dolor
              </button>
            </div>
          </div>
        );

      case 14: // Signos vitales
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Signos Vitales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia Cardíaca (bpm)
                </label>
                <input
                  type="number"
                  value={formData.frecuenciaCardiaca}
                  onChange={(e) => handleInputChange('frecuenciaCardiaca', e.target.value)}
                  min="40"
                  max="200"
                  placeholder="60-100 bpm normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia Respiratoria (rpm)
                </label>
                <input
                  type="number"
                  value={formData.frecuenciaRespiratoria}
                  onChange={(e) => handleInputChange('frecuenciaRespiratoria', e.target.value)}
                  min="10"
                  max="30"
                  placeholder="12-20 rpm normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tensión Arterial (mmHg)
                </label>
                <input
                  type="text"
                  value={formData.tensionArterial}
                  onChange={(e) => handleInputChange('tensionArterial', e.target.value)}
                  placeholder="120/80 mmHg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturación de Oxígeno (%)
                </label>
                <input
                  type="number"
                  value={formData.saturacionOxigeno}
                  onChange={(e) => handleInputChange('saturacionOxigeno', e.target.value)}
                  min="70"
                  max="100"
                  placeholder="95-100% normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => handleInputChange('peso', e.target.value)}
                  min="20"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estatura (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estatura}
                  onChange={(e) => handleInputChange('estatura', e.target.value)}
                  min="1.00"
                  max="2.50"
                  placeholder="1.70"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {formData.peso && formData.estatura && (
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-teal-800">
                  IMC calculado: {((formData.peso / (formData.estatura * formData.estatura)).toFixed(2))} kg/m²
                </p>
              </div>
            )}
          </div>
        );

      case 15: // Exploración física
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Exploración Física</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Inspección</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segmento
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionSegmento}
                    onChange={(e) => handleInputChange('inspeccionSegmento', e.target.value)}
                    placeholder="Parte del cuerpo examinada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piel
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionPiel}
                    onChange={(e) => handleInputChange('inspeccionPiel', e.target.value)}
                    placeholder="Color, textura, lesiones"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cicatriz
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionCicatriz}
                    onChange={(e) => handleInputChange('inspeccionCicatriz', e.target.value)}
                    placeholder="Presencia, tipo, características"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estructuras Óseas
                  </label>
                  <input
                    type="text"
                    value={formData.inspeccionEstructurasOseas}
                    onChange={(e) => handleInputChange('inspeccionEstructurasOseas', e.target.value)}
                    placeholder="Deformidades, asimetrías"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Palpación</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segmento
                  </label>
                  <input
                    type="text"
                    value={formData.palpacionSegmento}
                    onChange={(e) => handleInputChange('palpacionSegmento', e.target.value)}
                    placeholder="Área palpada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piel
                  </label>
                  <input
                    type="text"
                    value={formData.palpacionPiel}
                    onChange={(e) => handleInputChange('palpacionPiel', e.target.value)}
                    placeholder="Temperatura, humedad, sensibilidad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estructuras Óseas
                  </label>
                  <input
                    type="text"
                    value={formData.palpacionEstructurasOseas}
                    onChange={(e) => handleInputChange('palpacionEstructurasOseas', e.target.value)}
                    placeholder="Dolor, prominencias, irregularidades"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tejido Blando
                  </label>
                  <input
                    type="text"
                    value={formData.palpacionTejidoBlando}
                    onChange={(e) => handleInputChange('palpacionTejidoBlando', e.target.value)}
                    placeholder="Músculos, ligamentos, tendones"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pruebas Específicas
              </label>
              <textarea
                value={formData.pruebasEspecificas}
                onChange={(e) => handleInputChange('pruebasEspecificas', e.target.value)}
                placeholder="Pruebas ortopédicas, neurológicas, funcionales realizadas"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        );

      case 16: // FMS - Información General
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS (Functional Movement Screen) - Información General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Superior dominante
                </label>
                <select
                  value={formData.superiorDominante}
                  onChange={(e) => handleInputChange('superiorDominante', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="derecha">Derecha</option>
                  <option value="izquierda">Izquierda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lado dominante
                </label>
                <select
                  value={formData.ladoDominante}
                  onChange={(e) => handleInputChange('ladoDominante', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="derecha">Derecha</option>
                  <option value="izquierda">Izquierda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inferior dominante
                </label>
                <select
                  value={formData.inferiorDominante}
                  onChange={(e) => handleInputChange('inferiorDominante', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="derecha">Derecha</option>
                  <option value="izquierda">Izquierda</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 17: // FMS - Deep Squat
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS - Deep Squat (Sentadilla profunda)</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Dorsiflexión cadena cinética cerrada de tobillos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derecho
                  </label>
                  <input
                    type="text"
                    value={formData.deepSquatDorsiflexionDerecho}
                    onChange={(e) => handleInputChange('deepSquatDorsiflexionDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Izquierdo
                  </label>
                  <input
                    type="text"
                    value={formData.deepSquatDorsiflexionIzquierdo}
                    onChange={(e) => handleInputChange('deepSquatDorsiflexionIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Flexión de rodillas y caderas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derecho
                  </label>
                  <input
                    type="text"
                    value={formData.deepSquatFlexionDerecho}
                    onChange={(e) => handleInputChange('deepSquatFlexionDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Izquierdo
                  </label>
                  <input
                    type="text"
                    value={formData.deepSquatFlexionIzquierdo}
                    onChange={(e) => handleInputChange('deepSquatFlexionIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Implicación: Extensión columna torácica (Comentarios específicos)
              </label>
              <input
                type="text"
                value={formData.deepSquatExtensionToracica}
                onChange={(e) => handleInputChange('deepSquatExtensionToracica', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Flexión y abducción de hombros</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derecho
                  </label>
                  <input
                    type="text"
                    value={formData.deepSquatFlexionHombrosDerecho}
                    onChange={(e) => handleInputChange('deepSquatFlexionHombrosDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Izquierdo
                  </label>
                  <input
                    type="text"
                    value={formData.deepSquatFlexionHombrosIzquierdo}
                    onChange={(e) => handleInputChange('deepSquatFlexionHombrosIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Implicación: Activación musculatura central (Comentarios específicos)
              </label>
              <input
                type="text"
                value={formData.deepSquatActivacionCentral}
                onChange={(e) => handleInputChange('deepSquatActivacionCentral', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Bruta (número)
                </label>
                <input
                  type="number"
                  value={formData.deepSquatPuntuacionBruta}
                  onChange={(e) => handleInputChange('deepSquatPuntuacionBruta', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final (¿Automática?)
                </label>
                <input
                  type="number"
                  value={formData.deepSquatPuntuacionFinal}
                  onChange={(e) => handleInputChange('deepSquatPuntuacionFinal', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        );

      case 18: // FMS - Hurdle Step y otros
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS - Hurdle Step (Paso de obstáculo)</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Móvil: flexión de cadera y rodilla</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.hurdleStepMovilFlexionDerecho}
                    onChange={(e) => handleInputChange('hurdleStepMovilFlexionDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.hurdleStepMovilFlexionIzquierdo}
                    onChange={(e) => handleInputChange('hurdleStepMovilFlexionIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Móvil: dorsiflexión CCA de tobillo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.hurdleStepMovilDorsiflexionDerecho}
                    onChange={(e) => handleInputChange('hurdleStepMovilDorsiflexionDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.hurdleStepMovilDorsiflexionIzquierdo}
                    onChange={(e) => handleInputChange('hurdleStepMovilDorsiflexionIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Fija: estabilidad pie, rodilla y columna lumbar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.hurdleStepFijaEstabilidadDerecho}
                    onChange={(e) => handleInputChange('hurdleStepFijaEstabilidadDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.hurdleStepFijaEstabilidadIzquierdo}
                    onChange={(e) => handleInputChange('hurdleStepFijaEstabilidadIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Fija: máxima extensión de la CCC de cadera</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.hurdleStepFijaExtensionDerecho}
                    onChange={(e) => handleInputChange('hurdleStepFijaExtensionDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.hurdleStepFijaExtensionIzquierdo}
                    onChange={(e) => handleInputChange('hurdleStepFijaExtensionIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Implicación: Coordinación y equilibrio (Comentarios específicos)
              </label>
              <input
                type="text"
                value={formData.hurdleStepCoordinacion}
                onChange={(e) => handleInputChange('hurdleStepCoordinacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Derecha (número)
                </label>
                <input
                  type="number"
                  value={formData.hurdleStepPuntuacionDerecha}
                  onChange={(e) => handleInputChange('hurdleStepPuntuacionDerecha', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Izquierda (número)
                </label>
                <input
                  type="number"
                  value={formData.hurdleStepPuntuacionIzquierda}
                  onChange={(e) => handleInputChange('hurdleStepPuntuacionIzquierda', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        );

      case 19: // FMS - In-line lunge
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS - In-line lunge (Estocada lineal)</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Pierna delantera: movilidad de cadera (abd en CCC) y dorsiflexión de tobillo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.inlineLungeDelanteraMovilidadDerecho}
                    onChange={(e) => handleInputChange('inlineLungeDelanteraMovilidadDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.inlineLungeDelanteraMovilidadIzquierdo}
                    onChange={(e) => handleInputChange('inlineLungeDelanteraMovilidadIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Pierna delantera: estabilidad de rodilla y pie</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.inlineLungeDelanteraEstabilidadDerecho}
                    onChange={(e) => handleInputChange('inlineLungeDelanteraEstabilidadDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.inlineLungeDelanteraEstabilidadIzquierdo}
                    onChange={(e) => handleInputChange('inlineLungeDelanteraEstabilidadIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Pierna trasera: movilidad cadera (abd CCC) y extensión metatarsofalángica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.inlineLungeTraseraMovilidadDerecho}
                    onChange={(e) => handleInputChange('inlineLungeTraseraMovilidadDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.inlineLungeTraseraMovilidadIzquierdo}
                    onChange={(e) => handleInputChange('inlineLungeTraseraMovilidadIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Flexibilidad recto femoral</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.inlineLungeFlexibilidadDerecho}
                    onChange={(e) => handleInputChange('inlineLungeFlexibilidadDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.inlineLungeFlexibilidadIzquierdo}
                    onChange={(e) => handleInputChange('inlineLungeFlexibilidadIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Implicación: Equilibrio de tronco (Comentarios específicos)
              </label>
              <input
                type="text"
                value={formData.inlineLungeEquilibrio}
                onChange={(e) => handleInputChange('inlineLungeEquilibrio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Derecha (número)
                </label>
                <input
                  type="number"
                  value={formData.inlineLungePuntuacionDerecha}
                  onChange={(e) => handleInputChange('inlineLungePuntuacionDerecha', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Izquierda (número)
                </label>
                <input
                  type="number"
                  value={formData.inlineLungePuntuacionIzquierda}
                  onChange={(e) => handleInputChange('inlineLungePuntuacionIzquierda', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        );

      case 20: // Active Straight Leg Raise
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS - Active Straight Leg Raise (Levantamiento activo con pierna recta)</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Pierna evaluar: flexibilidad de isquios, glúteo, TFL, nervs, gastrosoleo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.aslrFlexibilidadDerecho}
                    onChange={(e) => handleInputChange('aslrFlexibilidadDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.aslrFlexibilidadIzquierdo}
                    onChange={(e) => handleInputChange('aslrFlexibilidadIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Pierna a evaluar: activación flexores de cadera</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.aslrActivacionDerecho}
                    onChange={(e) => handleInputChange('aslrActivacionDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.aslrActivacionIzquierdo}
                    onChange={(e) => handleInputChange('aslrActivacionIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Implicación: Pierna fija: extensión de rodilla y dorsiflexión de tobillo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                  <input
                    type="text"
                    value={formData.aslrExtensionFijaDerecho}
                    onChange={(e) => handleInputChange('aslrExtensionFijaDerecho', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                  <input
                    type="text"
                    value={formData.aslrExtensionFijaIzquierdo}
                    onChange={(e) => handleInputChange('aslrExtensionFijaIzquierdo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Implicación: Estabilidad lumbo sacra (Comentarios específicos)
              </label>
              <input
                type="text"
                value={formData.aslrEstabilidadLumbosacra}
                onChange={(e) => handleInputChange('aslrEstabilidadLumbosacra', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Derecha (número)
                </label>
                <input
                  type="number"
                  value={formData.aslrPuntuacionDerecha}
                  onChange={(e) => handleInputChange('aslrPuntuacionDerecha', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación: Izquierda (número)
                </label>
                <input
                  type="number"
                  value={formData.aslrPuntuacionIzquierda}
                  onChange={(e) => handleInputChange('aslrPuntuacionIzquierda', e.target.value)}
                  min="0"
                  max="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        );

      case 21: // Press up Clearing Test y Rotary Stability
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS - Press up Clearing Test & Rotary Stability</h3>
            
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-gray-800 mb-3">Press up Clearing Test</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Implicación: Detectar dolor de espalda baja
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                    <input
                      type="text"
                      value={formData.pressUpDolorDerecho}
                      onChange={(e) => handleInputChange('pressUpDolorDerecho', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                    <input
                      type="text"
                      value={formData.pressUpDolorIzquierdo}
                      onChange={(e) => handleInputChange('pressUpDolorIzquierdo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona</label>
                    <select
                      value={formData.pressUpDeteccion}
                      onChange={(e) => handleInputChange('pressUpDeteccion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Seleccione...</option>
                      <option value="positivo">Positivo</option>
                      <option value="negativo">Negativo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-3">Rotary Stability (Estabilidad rotatoria)</h4>
              
              <div className="border rounded-lg p-3 bg-white mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Implicación: Estabilidad asimétrica del tronco en plano sagital y transversal</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                    <input
                      type="text"
                      value={formData.rotaryEstabilidadDerecho}
                      onChange={(e) => handleInputChange('rotaryEstabilidadDerecho', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                    <input
                      type="text"
                      value={formData.rotaryEstabilidadIzquierdo}
                      onChange={(e) => handleInputChange('rotaryEstabilidadIzquierdo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-white mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Implicación: Movilidad asimétrica en extremidades superiores e inferiores</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                    <input
                      type="text"
                      value={formData.rotaryMovilidadDerecho}
                      onChange={(e) => handleInputChange('rotaryMovilidadDerecho', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                    <input
                      type="text"
                      value={formData.rotaryMovilidadIzquierdo}
                      onChange={(e) => handleInputChange('rotaryMovilidadIzquierdo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puntuación: Derecha (número)
                  </label>
                  <input
                    type="number"
                    value={formData.rotaryPuntuacionDerecha}
                    onChange={(e) => handleInputChange('rotaryPuntuacionDerecha', e.target.value)}
                    min="0"
                    max="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puntuación: Izquierda (número)
                  </label>
                  <input
                    type="number"
                    value={formData.rotaryPuntuacionIzquierda}
                    onChange={(e) => handleInputChange('rotaryPuntuacionIzquierda', e.target.value)}
                    min="0"
                    max="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 22: // Posterior Rocking Clearing Test y Total FMS
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">10. FMS - Posterior Rocking Clearing Test & TOTAL</h3>
            
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-gray-800 mb-3">Posterior Rocking Clearing Test</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Implicación: Detectar dolor en columna lumbar-torácica
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Derecho</label>
                    <input
                      type="text"
                      value={formData.posteriorRockingDolorDerecho}
                      onChange={(e) => handleInputChange('posteriorRockingDolorDerecho', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Izquierdo</label>
                    <input
                      type="text"
                      value={formData.posteriorRockingDolorIzquierdo}
                      onChange={(e) => handleInputChange('posteriorRockingDolorIzquierdo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona</label>
                    <select
                      value={formData.posteriorRockingDeteccion}
                      onChange={(e) => handleInputChange('posteriorRockingDeteccion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Seleccione...</option>
                      <option value="positivo">Positivo</option>
                      <option value="negativo">Negativo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-teal-50">
              <h4 className="font-medium text-teal-800 mb-3">TOTAL FMS</h4>
              
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-2">
                  TOTAL: Suma de los números de esta columna
                </label>
                <input
                  type="number"
                  value={formData.fmsTotal}
                  onChange={(e) => handleInputChange('fmsTotal', e.target.value)}
                  min="0"
                  max="21"
                  placeholder="Suma automática de todas las puntuaciones"
                  className="w-full px-3 py-2 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
              
              <div className="mt-3 text-sm text-teal-700">
                <p><strong>Interpretación:</strong></p>
                <ul className="list-disc list-inside mt-1">
                  <li>≤14: Alto riesgo de lesión</li>
                  <li>15-17: Riesgo moderado</li>
                  <li>≥18: Riesgo bajo</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 23: // Consulta y Diagnóstico
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">11. Consulta y Diagnóstico</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MOTIVO DE CONSULTA (recopilación de hechos y datos adjuntos)
              </label>
              <textarea
                value={formData.motivoConsulta}
                onChange={(e) => handleInputChange('motivoConsulta', e.target.value)}
                placeholder="Principal queja o razón de la visita, recopilación de hechos"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OBJETIVO DEL PACIENTE.
              </label>
              <textarea
                value={formData.objetivoPaciente}
                onChange={(e) => handleInputChange('objetivoPaciente', e.target.value)}
                placeholder="Metas y expectativas del paciente"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DIAGNÓSTICO FISIOTERAPÉUTICO. - Generales
                </label>
                <textarea
                  value={formData.diagnosticoFisioterapeuticoGeneral}
                  onChange={(e) => handleInputChange('diagnosticoFisioterapeuticoGeneral', e.target.value)}
                  placeholder="Diagnóstico fisioterapéutico general"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DIAGNÓSTICO FISIOTERAPÉUTICO. - Específicos
                </label>
                <textarea
                  value={formData.diagnosticoFisioterapeuticoEspecifico}
                  onChange={(e) => handleInputChange('diagnosticoFisioterapeuticoEspecifico', e.target.value)}
                  placeholder="Diagnóstico fisioterapéutico específico"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        );

      case 24: // Plan y Seguimiento + Estudios de Gabinete
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">12. Plan y Seguimiento + 13. Estudios de Gabinete</h3>
            
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-3">Plan y Seguimiento</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamiento propuesto
                  </label>
                  <textarea
                    value={formData.tratamientoPropuesto}
                    onChange={(e) => handleInputChange('tratamientoPropuesto', e.target.value)}
                    placeholder="Descripción del plan de tratamiento"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de hospitalización
                    </label>
                    <input
                      type="date"
                      value={formData.fechaHospitalizacion}
                      onChange={(e) => handleInputChange('fechaHospitalizacion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de alta
                    </label>
                    <input
                      type="date"
                      value={formData.fechaAlta}
                      onChange={(e) => handleInputChange('fechaAlta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de atención médica
                    </label>
                    <input
                      type="number"
                      value={formData.diasAtencionMedica}
                      onChange={(e) => handleInputChange('diasAtencionMedica', e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tx. a futuro
                    </label>
                    <textarea
                      value={formData.tratamientoFuturo}
                      onChange={(e) => handleInputChange('tratamientoFuturo', e.target.value)}
                      placeholder="Tratamientos futuros"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fármacos
                    </label>
                    <textarea
                      value={formData.farmacos}
                      onChange={(e) => handleInputChange('farmacos', e.target.value)}
                      placeholder="Medicamentos"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complicaciones
                  </label>
                  <textarea
                    value={formData.complicaciones}
                    onChange={(e) => handleInputChange('complicaciones', e.target.value)}
                    placeholder="Complicaciones observadas o potenciales"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-green-50">
              <h4 className="font-medium text-green-800 mb-3">Estudios de Gabinete (ALTA DE DOCUMENTOS)</h4>
              
              {/* Estudio 1 */}
              <div className="border rounded-lg p-3 bg-white mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Estudio 1</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estudio (imagen)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('estudio1Imagen', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {uploadProgress.estudio1Imagen !== undefined && (
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.estudio1Imagen}%` }}></div>
                      </div>
                    )}
                    {formData.estudio1Imagen && (
                      <p className="text-sm text-green-600 mt-1">✅ Archivo cargado</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha (día)</label>
                    <input
                      type="date"
                      value={formData.estudio1Fecha}
                      onChange={(e) => handleInputChange('estudio1Fecha', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (texto)</label>
                    <input
                      type="text"
                      value={formData.estudio1Descripcion}
                      onChange={(e) => handleInputChange('estudio1Descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Estudio 2 */}
              <div className="border rounded-lg p-3 bg-white mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Estudio 2</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estudio (imagen)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('estudio2Imagen', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {uploadProgress.estudio2Imagen !== undefined && (
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.estudio2Imagen}%` }}></div>
                      </div>
                    )}
                    {formData.estudio2Imagen && (
                      <p className="text-sm text-green-600 mt-1">✅ Archivo cargado</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha (día)</label>
                    <input
                      type="date"
                      value={formData.estudio2Fecha}
                      onChange={(e) => handleInputChange('estudio2Fecha', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (texto)</label>
                    <input
                      type="text"
                      value={formData.estudio2Descripcion}
                      onChange={(e) => handleInputChange('estudio2Descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Estudio 3 */}
              <div className="border rounded-lg p-3 bg-white">
                <h5 className="font-medium text-gray-700 mb-2">Estudio 3</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estudio (imagen)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('estudio3Imagen', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {uploadProgress.estudio3Imagen !== undefined && (
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.estudio3Imagen}%` }}></div>
                      </div>
                    )}
                    {formData.estudio3Imagen && (
                      <p className="text-sm text-green-600 mt-1">✅ Archivo cargado</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha (día)</label>
                    <input
                      type="date"
                      value={formData.estudio3Fecha}
                      onChange={(e) => handleInputChange('estudio3Fecha', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (texto)</label>
                    <input
                      type="text"
                      value={formData.estudio3Descripcion}
                      onChange={(e) => handleInputChange('estudio3Descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 25: // Intervención y Control
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">14. Intervención y Control</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                INTERVENCIÓN FISIOTERAPÉUTICA.
              </label>
              <textarea
                value={formData.intervencionFisioterapeutica}
                onChange={(e) => handleInputChange('intervencionFisioterapeutica', e.target.value)}
                placeholder="Plan de tratamiento y técnicas a utilizar"
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CONTROL DE SESIONES.
              </label>
              <textarea
                value={formData.controlSesiones}
                onChange={(e) => handleInputChange('controlSesiones', e.target.value)}
                placeholder="Frecuencia, duración y seguimiento de sesiones"
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="bg-teal-50 p-4 rounded-lg">
              <h4 className="font-medium text-teal-800 mb-2">¡Formulario Completo!</h4>
              <p className="text-teal-700 text-sm">
                Has completado todos los campos del historial clínico general. Revisa la información y finaliza la consulta.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Paso en desarrollo...</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Historia Clínica General</h2>
            <p className="text-teal-100 mt-1">
              Cliente: {selectedClient?.nombre} {selectedClient?.apellido}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Paso {currentStep} de {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-teal-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="flex space-x-4">
            <button
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
            Atrás
          </button>            <button
              onClick={goToNextStep}
              disabled={currentStep === totalSteps}
              className="flex items-center px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
            </button>
          </div>

          <div className="flex space-x-4">
            <button
            onClick={saveDraft}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-50 transition-colors"
          >
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar borrador'}
          </button>            {currentStep === totalSteps && (
              <button
                onClick={finishConsultation}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {isLoading ? 'Finalizando...' : 'Finalizar consulta'}
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl text-green-500 mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Consulta registrada exitosamente
              </h3>
              <p className="text-gray-600">
                La historia clínica se ha guardado correctamente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaNormalWizard;