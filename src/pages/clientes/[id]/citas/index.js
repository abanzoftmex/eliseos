import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, setDoc, getDoc, getDocs, query, where, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../../lib/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { descargarPDF, visualizarPDF } from '@/utils/pdfGenerator';
import { invalidateClientesCache } from '@/components/dashboard/ClientesContent';
import {
  faArrowLeft,
  faSave,
  faCheck,
  faFileText,
  faCalendar,
  faShareSquare as faShare2,
  faDownload as faFileDown,
  faPrint as faPrinter
} from '@fortawesome/free-solid-svg-icons';
import FichaMedicaForm from '@/components/forms/FichaMedicaForm';

const HistoriaClinicaCompletaPage = () => {
  const router = useRouter();
  const { id: clienteId, consultaId, viewMode, print } = router.query;

  // Determinar si estamos en modo de solo lectura
  const isViewMode = viewMode === 'true';

  // Detectar modo de impresión
  const isPrintMode = print === 'preview' || print === 'direct';
  const isPrintDirect = print === 'direct';

  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cliente, setCliente] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Helper para formatear objetos de checkboxes a texto legible
  const formatCheckboxObject = (obj) => {
    if (!obj || typeof obj !== 'object') return '';

    const labels = {
      // Recopilación de Hechos
      enfermedad: 'Enfermedad',
      accidente: 'Accidente',
      urgencia: 'Urgencia',
      segundaOpinion: 'Segunda opinión',
      // Tipo de Padecimiento
      congenito: 'Congénito',
      adquirido: 'Adquirido',
      agudo: 'Agudo',
      cronico: 'Crónico'
    };

    return Object.entries(obj)
      .filter(([_, value]) => value === true)
      .map(([key]) => labels[key] || key)
      .join(', ') || 'Ninguno seleccionado';
  };

  // Estado del formulario COMPLETO con TODOS los campos
  const [formData, setFormData] = useState({
    // ===== 1. DATOS PERSONALES Y ANAMNESIS =====
    fechaEvaluacion: '',
    numeroExpediente: '',
    // Datos personales (algunos vienen del cliente)
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    edad: '',
    fechaNacimiento: '',
    genero: '',
    ocupacion: '',
    ladoDominante: '',
    contacto: '',
    contactoEmergencia: '',

    // Recopilación de Hechos (checkboxes)
    recopilacionHechos: {
      enfermedad: false,
      accidente: false,
      urgencia: false,
      segundaOpinion: false
    },

    // Tipo de Padecimiento (checkboxes)
    tipoPadecimiento: {
      congenito: false,
      adquirido: false,
      agudo: false,
      cronico: false
    },

    fechaPadecimiento: '',
    fechaDiagnostico: '',
    descripcionPadecimiento: '',

    // ===== 2. ANTECEDENTES =====
    antecedentesRelacionados: '',
    diagnosticoMedicoEspecialista: '',

    // Antecedentes Heredo-Familiares
    enfermedadesCronicas: [
      {
        id: 1,
        descripcion: '',
        genetica: '',
        estado: '',
        detalles: ''
      }
    ],

    // Antecedentes Patológicos - Infancia/Adolescencia (tabla)
    antecedentesPatologicosInfancia: [
      { enfermedad: '', fechaEvolucion: '', tratamiento: '' }
    ],

    // Antecedentes Patológicos - Actuales (tabla)
    antecedentesPatologicosActuales: [
      { enfermedad: '', fechaEvolucion: '', tratamiento: '' }
    ],

    alergias: '',

    // Antecedentes No Patológicos
    alimentacionCantidadCalidad: '',
    planNutricional: '',
    hidratacionCantidad: '',
    toxicomanias: '', // alcohol/tabaco/drogas
    habitosSuenoHoras: '',
    actividadFisicaFrecuencia: '',
    sintomasEmocionales: '',

    // Antecedentes Gineco-Obstétricos (tabla)
    antecedentesGinecoObstetricos: {
      gestacion: '',
      cesarea: '',
      abortos: '',
      periodo: '',
      ciclo: '',
      tratamientoHormonal: ''
    },

    // ===== 3. TRAUMATISMO / ACCIDENTE, CIRUGÍA Y ESTUDIOS =====
    // Traumatismo / Accidente (tabla)
    traumatismos: [
      { tipo: '', fechaEvolucion: '', tratamientoComplicaciones: '' }
    ],

    // Cirugía (tabla)
    cirugias: [
      {
        tratamientoPropuesto: '',
        fechaHospitalizacion: '',
        fechaAlta: '',
        diasAtencion: '',
        txFuturo: '',
        farmacos: '',
        complicaciones: ''
      }
    ],

    // Estudios de Gabinete (tabla)
    estudiosGabinete: [
      { estudio: '', fecha: '', descripcionHallazgos: '', archivo: null }
    ],

    // ===== 4. DOLOR Y EXPLORACIÓN FÍSICA =====
    // Escala de Dolor (tabla con segmentos, derecha, izquierda)
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

    // Signos Vitales
    signosVitales: {
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      tensionArterial: '',
      spo2: '',
      peso: '',
      estatura: ''
    },

    // Inspección (tabla: segmento, derecho, izquierdo)
    inspecciones: [
      {
        id: 1,
        segmento: '',
        piel: { derecho: '', izquierdo: '' },
        cicatriz: { derecho: '', izquierdo: '' },
        estructurasOseas: { derecho: '', izquierdo: '' }
      }
    ],

    // Palpación (tabla: segmento, derecho, izquierdo)
    palpaciones: [
      {
        id: 1,
        segmento: '',
        piel: { derecho: '', izquierdo: '' },
        estructurasOseas: { derecho: '', izquierdo: '' },
        tejidoBlando: { derecho: '', izquierdo: '' }
      }
    ],

    // ===== 5. PRUEBAS ESPECÍFICAS =====
    pruebasEspecificas: '',

    // ===== 6. FMS (FUNCTIONAL MOVEMENT SCREEN) =====
    fmsSuperiorDominante: '',
    fmsInferiorDominante: '',

    // Deep Squat
    fmsDeepSquat: {
      dorsiflexionTobillos: { comentariosDerecho: '', comentariosIzquierdo: '' },
      flexionRodillasCaderas: { comentariosDerecho: '', comentariosIzquierdo: '' },
      extensionColumnaToracica: { comentarios: '' },
      flexionAbduccionHombros: { comentariosDerecho: '', comentariosIzquierdo: '' },
      activacionMusculaturaCentral: { comentarios: '' },
      tipoPuntuacionBruta: 'neutral', // 'neutral' o 'lateral'
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // Hurdle Step
    fmsHurdleStep: {
      movilFlexionCaderaRodilla: { comentariosDerecho: '', comentariosIzquierdo: '' },
      movilDorsiflexionTobillo: { comentariosDerecho: '', comentariosIzquierdo: '' },
      fijaEstabilidadPieRodillaLumbar: { comentariosDerecho: '', comentariosIzquierdo: '' },
      fijaExtensionCadera: { comentariosDerecho: '', comentariosIzquierdo: '' },
      coordinacionEquilibrio: { comentarios: '' },
      medida: '',
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // In-line Lunge
    fmsInlineLunge: {
      piernaDelanteraMovilidadCadera: { comentariosDerecho: '', comentariosIzquierdo: '' },
      piernaDelanteraEstabilidadRodillaPie: { comentariosDerecho: '', comentariosIzquierdo: '' },
      piernaTraseraMovilidadCadera: { comentariosDerecho: '', comentariosIzquierdo: '' },
      flexibilidadRectoFemoral: { comentariosDerecho: '', comentariosIzquierdo: '' },
      equilibrioTronco: { comentarios: '' },
      medida: '',
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // Shoulder Mobility
    fmsShoulderMobility: {
      brazoFlexionAddRE: { comentariosDerecho: '', comentariosIzquierdo: '' },
      brazoExtensionAbdRI: { comentariosDerecho: '', comentariosIzquierdo: '' },
      estabilidadEscapular: { comentariosDerecho: '', comentariosIzquierdo: '' },
      extensionToracica: { comentarios: '' },
      coordinacion: { comentarios: '' },
      medida: '',
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // Impingement Clearing Test
    fmsImpingementClearingTest: {
      comentariosDerecho: '',
      comentariosIzquierdo: '',
      resultado: ''
    },

    // Active Straight-Leg Raise
    fmsActiveStraightLegRaise: {
      piernaEvaluarFlexibilidad: { comentariosDerecho: '', comentariosIzquierdo: '' },
      piernaEvaluarActivacion: { comentariosDerecho: '', comentariosIzquierdo: '' },
      piernaFijaExtension: { comentariosDerecho: '', comentariosIzquierdo: '' },
      estabilidadLumboSacra: { comentarios: '' },
      medida: '',
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // Trunk Stability Push-up
    fmsTrunkStabilityPushup: {
      estabilidadSimetricaTronco: { comentarios: '' },
      movimientoSimetricoExtremidades: { comentariosDerecho: '', comentariosIzquierdo: '' },
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // Press Up Clearing Test
    fmsPressUpClearingTest: {
      comentariosDerecho: '',
      comentariosIzquierdo: '',
      resultado: ''
    },

    // Rotary Stability
    fmsRotaryStability: {
      estabilidadAsimetricaTronco: { comentariosDerecho: '', comentariosIzquierdo: '' },
      movilidadAsimetricaExtremidades: { comentariosDerecho: '', comentariosIzquierdo: '' },
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      estadoCompensacion: '',
      estadoCompensacionDerecha: '',
      estadoCompensacionIzquierda: '',
      puntuacionFinal: ''
    },

    // Posterior Rocking Clearing Test
    fmsPosteriorRockingClearingTest: {
      comentariosDerecho: '',
      comentariosIzquierdo: '',
      resultado: ''
    },

    // Total FMS
    fmsTotalPuntuacion: 0,

    // ===== 7. DIAGNÓSTICO Y PLAN DE TRATAMIENTO =====
    motivoConsulta: '',

    objetivoPaciente: '',

    diagnosticoFisioterapeutico: '',

    pronosticoFisioterapeutico: '',

    intervencionFisioterapeutica: '',
    controlSesiones: '',
    frecuenciaTratamiento: ''
  });

  // Helper function to safely merge loaded data with initial state
  const safelyMergeFormData = (loadedData, clienteData) => {
    return {
      ...formData, // Start with the initial state (has all default nested objects)
      ...loadedData, // Override with loaded data
      // Ensure nested objects are properly merged
      parentescoMaterno: {
        varon: false,
        femenino: false,
        detalles: '',
        ...(loadedData.parentescoMaterno || {})
      },
      parentescoPaterno: {
        varon: false,
        femenino: false,
        detalles: '',
        ...(loadedData.parentescoPaterno || {})
      },
      recopilacionHechos: {
        enfermedad: false,
        accidente: false,
        urgencia: false,
        segundaOpinion: false,
        ...(loadedData.recopilacionHechos || {})
      },
      tipoPadecimiento: {
        congenito: false,
        adquirido: false,
        agudo: false,
        cronico: false,
        ...(loadedData.tipoPadecimiento || {})
      },
      antecedentesGinecoObstetricos: {
        gestacion: '',
        cesarea: '',
        abortos: '',
        periodo: '',
        ciclo: '',
        tratamientoHormonal: '',
        ...(loadedData.antecedentesGinecoObstetricos || {})
      },
      // Fill missing fields with client data
      nombres: loadedData.nombres || clienteData?.nombre || '',
      apellidoPaterno: loadedData.apellidoPaterno || clienteData?.apellidos?.split(' ')[0] || '',
      apellidoMaterno: loadedData.apellidoMaterno || clienteData?.apellidos?.split(' ')[1] || '',
      fechaNacimiento: loadedData.fechaNacimiento || clienteData?.fechaNacimiento || '',
      genero: loadedData.genero || clienteData?.genero || '',
      contacto: loadedData.contacto || clienteData?.telefono || '',
    };
  };

  // Cargar datos al inicializar
  useEffect(() => {
    if (clienteId) {
      loadInitialData();
    }
  }, [clienteId, consultaId]);

  // Trigger print cuando se carga en modo impresión
  useEffect(() => {
    if (isPrintDirect && !loadingData) {
      // Expandir todos los textareas antes de imprimir
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });

      // Esperar a que el DOM se renderice completamente
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isPrintDirect, loadingData]);

  // Función para expandir textareas antes de imprimir
  useEffect(() => {
    const handleBeforePrint = () => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.style.minHeight = textarea.scrollHeight + 'px';
      });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Cargar información del cliente
      const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      let clienteData = null;
      if (clienteDoc.exists()) {
        clienteData = clienteDoc.data();
        setCliente(clienteData);
      }

      // Si estamos en modo de vista, cargar la consulta específica
      if (consultaId && isViewMode) {
        const consultaDoc = await getDoc(doc(db, 'consultas', consultaId));
        if (consultaDoc.exists()) {
          const consultaData = consultaDoc.data();
          const answers = consultaData.answers || {};

          console.log('📊 Datos de consulta cargados:', {
            totalCampos: Object.keys(answers).length,
            campos: Object.keys(answers),
            muestra: answers
          });

          const mergedData = safelyMergeFormData(answers, clienteData);

          console.log('✅ Datos finales a cargar:', {
            totalCampos: Object.keys(mergedData).length,
            nombres: mergedData.nombres,
            edad: mergedData.edad,
            genero: mergedData.genero
          });

          setFormData(mergedData);
        }
      }
      // Nueva consulta - pre-rellenar con datos del cliente
      else if (!isViewMode && clienteData) {
        setFormData(prev => ({
          ...prev,
          nombres: clienteData.nombre || '',
          apellidoPaterno: clienteData.apellidos?.split(' ')[0] || '',
          apellidoMaterno: clienteData.apellidos?.split(' ')[1] || '',
          fechaNacimiento: clienteData.fechaNacimiento || '',
          genero: clienteData.genero || '',
          contacto: clienteData.telefono || '',
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Función para actualizar campos del formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para actualizar campos anidados
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Función para actualizar subpruebas de FMS (test > subtest > field)
  const handleFMSSubtestChange = (test, subtest, field, value) => {
    setFormData(prev => ({
      ...prev,
      [test]: {
        ...prev[test],
        [subtest]: {
          ...prev[test][subtest],
          [field]: value
        }
      }
    }));
  };

  // Función para actualizar arrays (antecedentes, traumatismos, etc.)
  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = {
        ...newArray[index],
        [field]: value
      };
      return {
        ...prev,
        [arrayName]: newArray
      };
    });
  };

  // Agregar nueva fila a arrays
  const addArrayRow = (arrayName, emptyRow) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], emptyRow]
    }));
  };

  // Eliminar fila de arrays
  const removeArrayRow = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  // Función para manejar la carga de archivos en Estudios de Gabinete
  const handleFileUpload = async (index, file) => {
    if (!file) return;

    // Validar tipo de archivo (imágenes o PDF)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, sube solo imágenes (JPG, PNG, GIF) o archivos PDF');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El tamaño máximo es 10MB');
      return;
    }

    try {
      setIsLoading(true);

      // Crear referencia única para el archivo
      const fileExtension = file.name.split('.').pop();
      const fileName = `estudios-gabinete/${clienteId}/${Date.now()}_${index}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      // Subir archivo
      await uploadBytes(storageRef, file);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      // Actualizar formData con la URL del archivo
      handleArrayChange('estudiosGabinete', index, 'archivo', downloadURL);

    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir el archivo. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVED: saveDraft function - draft functionality has been eliminated

  // Finalizar consulta
  const finishConsultation = async () => {
    setIsLoading(true);

    try {
      // Si estamos en viewMode y hay consultaId, usar ese ID (actualizar consulta existente)
      // Si no hay ninguno, crear nuevo ID
      const targetConsultaId = consultaId || `consulta_normal_${clienteId}_${Date.now()}`;

      const consultaData = {
        clienteId: clienteId,
        uidTrabajador: 'admin-temp',
        answers: formData,
        status: 'completed',
        type: 'normal',
        createdAt: consultaId ? undefined : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      Object.keys(consultaData).forEach(key => {
        if (consultaData[key] === undefined) {
          delete consultaData[key];
        }
      });

      await setDoc(doc(db, 'consultas', targetConsultaId), consultaData, { merge: true });

      // Invalidar caché de clientes para refrescar la lista
      invalidateClientesCache();

      const successMsg = isViewMode ? 'Cambios guardados exitosamente ✅' : 'Historia clínica registrada exitosamente ✅';
      setSuccessMessage(successMsg);
      setShowSuccess(true);

      setTimeout(() => {
        if (isViewMode) {
          // Si estamos editando, recargar la página para mostrar los cambios
          window.location.reload();
        } else {
          router.push(`/clientes/${clienteId}`);
        }
      }, 2000);
    } catch (error) {
      console.error('Error finalizando consulta:', error);
      alert('Error al finalizar consulta');
    } finally {
      setIsLoading(false);
    }
  };

  // Compartir consulta
  const handleShare = async () => {
    const shareableId = consultaId;
    if (!shareableId) {
      alert('No hay una consulta para compartir. Guarda primero.');
      return;
    }

    try {
      // Crear URL corta usando el acortador
      const response = await fetch('/api/s/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultaId: shareableId,
          type: 'normal'
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear URL corta');
      }

      const { shortUrl } = await response.json();

      await navigator.clipboard.writeText(shortUrl);
      setSuccessMessage('Link copiado al portapapeles ✅');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error compartiendo:', error);
      // Fallback: URL larga
      const shareUrl = `${window.location.origin}/compartir/consulta/${shareableId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setSuccessMessage('Link copiado al portapapeles ✅');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (clipError) {
        alert(`Link de compartir:\n${shareUrl}`);
      }
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historia clínica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6 mb-6 space-y-6">
        {/* Header con información del paciente */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  {cliente?.foto ? (
                    <img
                      src={cliente.foto}
                      alt={`${cliente.nombre} ${cliente.apellidos}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-3xl font-bold shadow-md border-4 border-gray-50">
                      {cliente?.nombre?.charAt(0).toUpperCase() || 'P'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border-2 border-white bg-teal-600 text-white">
                    Paciente
                  </span>
                </div>

                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {cliente?.nombre} {cliente?.apellidos}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Historia Clínica Completa</p>
                </div>
              </div>

              {!isPrintMode && (
                <button
                  onClick={() => router.push(`/clientes/${clienteId}`)}
                  className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-semibold transition-all shadow-sm hover:shadow no-print"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 inline mr-2" />
                  Volver al Perfil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Header de acción */}
        {!isPrintMode && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print-hide no-print">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isViewMode ? 'bg-green-50' : 'bg-teal-50'} rounded-lg flex items-center justify-center`}>
                  <FontAwesomeIcon icon={faFileText} className={`w-5 h-5 ${isViewMode ? 'text-green-600' : 'text-teal-600'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isViewMode ? 'Consulta Terminada (Editable)' : 'Nueva Historia Clínica'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isViewMode ? 'Puedes editar y guardar cambios en esta consulta' : 'Formulario completo de evaluación'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isViewMode && (consultaId || draftId) && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          const consultaActual = consultaId ?
                            await getDoc(doc(db, 'consultas', consultaId)).then(d => ({ id: d.id, ...d.data() })) :
                            { answers: formData };
                          await visualizarPDF(consultaActual, cliente, 'normal');
                        } catch (error) {
                          console.error('Error generando PDF:', error);
                          alert('Error al generar el PDF');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                      title="Generar PDF / Imprimir"
                    >
                      <FontAwesomeIcon icon={faPrinter} className="w-4.5 h-4.5" />
                      <span className="hidden sm:inline">Generar PDF</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                      title="Compartir consulta"
                    >
                      <FontAwesomeIcon icon={faShare2} className="w-4.5 h-4.5" />
                      <span className="hidden sm:inline">Compartir</span>
                    </button>
                  </>
                )}
                {isViewMode && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium text-green-700">Editable</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de éxito */}
        {showSuccess && !isPrintMode && (
          <div className="bg-green-50 border-green-200 border rounded-lg p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheck} className="mr-2 text-green-600 w-5 h-5" />
              <p className="font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* FORMULARIO COMPLETO */}
        <FichaMedicaForm
          formData={formData}
          onInputChange={handleInputChange}
          onNestedChange={handleNestedChange}
          onFMSSubtestChange={handleFMSSubtestChange}
          onArrayChange={handleArrayChange}
          onAddArrayRow={addArrayRow}
          onRemoveArrayRow={removeArrayRow}
          onFileUpload={handleFileUpload}
        />


        {/* Botones de acción */}
        <div className="flex justify-between items-center mt-8 pb-8">
          <button
            onClick={() => router.push(`/clientes/${clienteId}`)}
            className="flex items-center px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-2" />
            {isViewMode ? 'Volver' : 'Cancelar'}
          </button>

          {isViewMode && consultaId && (
            <button
              onClick={finishConsultation}
              disabled={isLoading}
              className="flex items-center px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faSave} className="mr-2 w-5 h-5" />
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}

          {!isViewMode && (
            <button
              onClick={finishConsultation}
              disabled={isLoading}
              className="flex items-center px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2 w-5 h-5" />
              {isLoading ? 'Finalizando...' : 'Finalizar consulta'}
            </button>
          )}
        </div>

        {/* Mensaje de éxito al finalizar */}
        {showSuccess && successMessage.includes('registrada') && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center max-w-md shadow-2xl">
              <div className="text-6xl text-green-500 mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Historia Clínica Completada!
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

export default HistoriaClinicaCompletaPage;
