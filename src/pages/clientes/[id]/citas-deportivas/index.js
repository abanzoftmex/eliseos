import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, setDoc, getDoc, getDocs, query, where, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import FichaDeportivaForm from '@/components/forms/FichaDeportivaForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { descargarPDF, visualizarPDF } from '@/utils/pdfGenerator';
import { invalidateClientesCache } from '@/components/dashboard/ClientesContent';
import {
  faArrowLeft,
  faSave,
  faCheck,
  faChartLine as faActivity,
  faTimes as faX,
  faShareSquare as faShare2,
  faFileArrowDown as faFileDown,
  faPrint as faPrinter
} from '@fortawesome/free-solid-svg-icons';

const ConsultaAtletaCompletaPage = () => {
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

  // Estado del formulario COMPLETO para ATLETAS con TODOS los campos
  const [formData, setFormData] = useState({
    // ===== 1. DATOS PERSONALES =====
    numeroExpediente: '',
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

    // ===== 2. HISTORIA CLÍNICA =====
    // Cada campo tiene: respuesta (si/no), cual (texto) y comentarios (texto)
    enfermedadCronica: { respuesta: '', cual: '', comentarios: '' },
    alteracionSistema: { respuesta: '', cual: '', comentarios: '' },
    tratamientoMedico: { respuesta: '', cual: '', comentarios: '' },
    patologiaColumna: { respuesta: '', cual: '', comentarios: '' },
    patologiaHombro: { respuesta: '', cual: '', comentarios: '' },
    patologiaCodo: { respuesta: '', cual: '', comentarios: '' },
    patologiaMuneca: { respuesta: '', cual: '', comentarios: '' },
    patologiaCadera: { respuesta: '', cual: '', comentarios: '' },
    patologiaRodilla: { respuesta: '', cual: '', comentarios: '' },
    patologiaTobillo: { respuesta: '', cual: '', comentarios: '' },
    patologiaPie: { respuesta: '', cual: '', comentarios: '' },
    dolorMolestiaActual: { respuesta: '', cual: '', comentarios: '' },
    lesionGrave: { respuesta: '', cual: '', comentarios: '' },
    lesionesFrecuentes: { respuesta: '', cual: '', comentarios: '' },
    sufreMareos: { respuesta: '', comentarios: '' },
    haSufridoDesmayos: { respuesta: '', comentarios: '' },
    sufreConvulsiones: { respuesta: '', comentarios: '' },
    doloresCabezaFrecuentes: { respuesta: '', comentarios: '' },
    sufreHemorragiasNasales: { respuesta: '', comentarios: '' },
    dolorArticulaciones: { respuesta: '', cual: '', comentarios: '' },
    practicaDeporte: { respuesta: '', cual: '', comentarios: '' },
    objetivoPersonal: '',
    alimentacion: '',
    hidratacion: '',
    perdidaPeso: '',
    toxicomanias: '',
    habitosSueno: '',
    sintomasEmocionales: '',
    gastoMedicoMayores: '',

    // ===== 3. SIGNOS VITALES Y MEDIDAS ANTROPOMÉTRICAS =====
    frecuenciaCardiacaReposo: '',
    frecuenciaCardiaca: '',
    tensionArterial: '',
    saturacionOxigeno: '',

    // Medidas Antropométricas
    objetivoAntropometrico: '',
    altura: '',
    peso: '',
    imc: '',
    grasaCorporal: '',
    musculoEsqueletico: '',
    metabolismoBasal: '',
    edadCorporal: '',
    grasaVisceral: '',
    comentarioAntropometrico: '',

    // ===== 4. EXAMINACIÓN NEUROFUNCIONAL =====
    // Cada test tiene: normal, pinzamiento, activacion, acortamiento, debilidad (cada uno con derecho/izquierdo y un comentario por grupo), descripcion, comentarios generales

    // DECÚBITO PRONO
    activacionGluteoMayorIsquios: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Activación: glúteo-isquios. Rodilla extendida o flexionada + despegue de la camilla.',
      comentarios: ''
    },
    testRotadoresInternosCadera: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'La pierna a evaluar forma un ángulo con la camilla de 0° a 60°.',
      comentarios: ''
    },
    testRotadoresExternosCadera: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Las piernas forman un ángulo de 0° a 45º en relación con la camilla.',
      comentarios: ''
    },
    testParaGluteoMayor: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: '3 direcciones: vertical-rotación interna y externa. Despegar muslo de camilla. Mantener resistencia.',
      comentarios: ''
    },
    testSerratosAnteriores: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Push up. Escápulas se mantienen pegadas contra columna torácica.',
      comentarios: ''
    },
    testCoreFrontalEstatico: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Alineación de tobillos, cadera y hombros. Pelvis neutra. +30 segundos.',
      comentarios: ''
    },
    testCoreFrontalDinamico: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Aterriza de manera controlada. Mantiene estable la pelvis.',
      comentarios: ''
    },
    testCoreLateral: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Alineación de hombro, cadera, rodilla, pies. +30 segundos.',
      comentarios: ''
    },

    // DECÚBITO SUPINO
    pinzamientoFemoroacetabular: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Flexión máxima + rotación externa e interna de cadera. Presión hacia adentro y abajo.',
      comentarios: ''
    },
    testDeFaber: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Hipomovilidad de cadera - sacroilíaca que active pinzamiento.',
      comentarios: ''
    },
    activacionAbdominalesPsoas: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Hiperlordosis lumbar + inactivación muscular.',
      comentarios: ''
    },
    activacionGluteoMayorPuente: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Activación: isquios-glúteo. Alineación de hombros- caderas y rodillas.',
      comentarios: ''
    },
    testRotadoresColumnaLumbar: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Alineación paralela del fémur con la camilla. Hombros en contacto con la camilla.',
      comentarios: ''
    },
    testIsquiosurales: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: ' ',
      comentarios: ''
    },
    testThomasPsoas: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Muslo en contacto con la camilla.',
      comentarios: ''
    },
    testThomasTensor: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Cadera en posición neutra, rodilla alineada en línea vertical.',
      comentarios: ''
    },
    testFlexoresDorsalesTobillo: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Alineación de la cabeza 5to MTT con maléolo externo. Punta del pie hacia abajo.',
      comentarios: ''
    },
    testFlexoresPlantaresTobillo: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'La cabeza del 5to MTT forma un ángulo + 90º con la tibia.',
      comentarios: ''
    },
    testParaAductoresSupino: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Mantiene la posición simétrica contra la fuerza ejercida.',
      comentarios: ''
    },
    testParaAductoresAisladoNeurofuncional: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Mantiene la posición simétrica ejerciendo la misma fuerza bilateral.',
      comentarios: ''
    },

    // SEDESTACIÓN
    testActivacionEscapular: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Mantiene elevación simétrica + 5 segundos.',
      comentarios: ''
    },
    testRotadoresTronco: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'El hombro pasa de la línea del cuerpo.',
      comentarios: ''
    },
    testParaAductoresSedestacion: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Rodillas alineadas. Ángulo entre camilla y rodilla entre 0º-45º.',
      comentarios: ''
    },

    // BIPEDESTACIÓN
    pinzamientoHombro: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Elevación de brazo activa por sobre 90º, puede reproducir síntoma o dolor.',
      comentarios: ''
    },
    testRotadoresHombro: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Brazo en 90º de abducción, terapeuta genera rotación interna y externa. Evalúa ROM y/o debilidad.',
      comentarios: ''
    },

    // BIPEDESTACIÓN
    testDorsalAncho: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Pulgares hacen contacto con pared, manteniendo el bastón en posición inicial.',
      comentarios: ''
    },
    testGluteoMedio: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Capaz de mantener la cadera en posición neutra.',
      comentarios: ''
    },
    testSoleo: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'Rodilla contacta con pared sin despegar talón del suelo.',
      comentarios: ''
    },
    testParaTibialPosterior: {
      normal: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      pinzamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      activacion: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      acortamiento: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      debilidad: {
        derecho: false,
        izquierdo: false,
        comentario: ''
      },
      descripcion: 'El calcáneo se mueve en dirección.',
      comentarios: ''
    },

    // ===== 5. FMS (FUNCTIONAL MOVEMENT SCREEN) =====
    fmsObjetivo: '',
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
      puntuacionFinal: ''
    },

    // Impingement Clearing Test
    fmsImpingementClearingTest: {
      derecho: '',
      izquierdo: ''
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
      puntuacionFinal: ''
    },

    // Trunk Stability Push-up
    fmsTrunkStabilityPushup: {
      estabilidadSimetricaTronco: { comentarios: '' },
      movimientoSimetricoExtremidades: { comentarios: '' },
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      puntuacionFinal: ''
    },

    // Press Up Clearing Test
    fmsPressUpClearingTest: '',

    // Rotary Stability
    fmsRotaryStability: {
      estabilidadAsimetricaTronco: { comentarios: '' },
      movilidadAsimetricaExtremidades: { comentariosDerecho: '', comentariosIzquierdo: '' },
      tipoPuntuacionBruta: 'neutral',
      puntuacionBruta: '',
      puntuacionBrutaDerecha: '',
      puntuacionBrutaIzquierda: '',
      puntuacionFinal: ''
    },

    // Posterior Rocking Clearing Test
    fmsPosteriorRockingClearingTest: '',

    // Total FMS
    fmsTotalPuntuacion: 0,

    // ===== 6. HRR (HEART RATE RECOVERY) =====
    hrrObjetivo: 'evaluar niveles de energía y recuperación aeróbica',

    // Tabla de Fases de Ejercicio
    hrrFases: [
      { fase: 'CALENTAMIENTO', minutos: '2', zonaIntensidad: 'ZONA GRIS', frecuenciaCardiaca: '126-130', rpe: '' },
      { fase: 'EJERCICIO', minutos: '2', zonaIntensidad: 'ZONA AZUL', frecuenciaCardiaca: '132', rpe: '' },
      { fase: 'EJERCICIO', minutos: '2', zonaIntensidad: 'ZONA VERDE', frecuenciaCardiaca: '140', rpe: '' },
      { fase: 'EJERCICIO', minutos: '2', zonaIntensidad: 'ZONA NARANJA', frecuenciaCardiaca: '158-164', rpe: '' },
      { fase: 'EJERCICIO', minutos: '2', zonaIntensidad: 'ZONA ROJA', frecuenciaCardiaca: '164', rpe: '' }
    ],

    // Recuperación
    hrrPicoFrecuencia: '',
    hrrFcInicial: '',
    hrrHrr: '',
    hrrClasificacion: '',

    // ===== 7. INFORME FISIOTERAPÉUTICO =====
    informeFisioterapeutico: ''
  });

  // Función para normalizar datos de tests neurofuncionales al cargar desde Firebase
  const normalizeNeuroTestData = (data) => {
    const testKeys = [
      'activacionGluteoMayorIsquios', 'testRotadoresInternosCadera', 'testRotadoresExternosCadera',
      'testParaGluteoMayor', 'testSerratosAnteriores', 'testCoreFrontalEstatico',
      'testCoreFrontalDinamico', 'testCoreLateral', 'pinzamientoFemoroacetabular',
      'activacionAbdominalesPsoas', 'activacionGluteoMayorPuente', 'testRotadoresColumnaLumbar',
      'testIsquiosurales', 'testThomasPsoas', 'testThomasTensor',
      'testFlexoresDorsalesTobillo', 'testFlexoresPlantaresTobillo', 'testParaAductoresSupino',
      'testActivacionEscapular', 'testRotadoresTronco', 'testParaAductoresSedestacion',
      'pinzamientoHombro', 'testRotadoresHombro', 'testDorsalAncho', 'testGluteoMedio', 'testSoleo'
    ];

    const normalizedData = { ...data };

    testKeys.forEach(testKey => {
      if (normalizedData[testKey]) {
        // Asegurar que todos los campos necesarios existan
        if (!normalizedData[testKey].pinzamiento) {
          normalizedData[testKey].pinzamiento = { derecho: false, izquierdo: false };
        }
        if (!normalizedData[testKey].activacion) {
          normalizedData[testKey].activacion = { derecho: false, izquierdo: false };
        }
        // Asegurar que los otros campos también existan
        if (!normalizedData[testKey].normal) {
          normalizedData[testKey].normal = { derecho: false, izquierdo: false };
        }
        if (!normalizedData[testKey].anormal) {
          normalizedData[testKey].anormal = { derecho: false, izquierdo: false };
        }
        if (!normalizedData[testKey].acortado) {
          normalizedData[testKey].acortado = { derecho: false, izquierdo: false };
        }
        if (!normalizedData[testKey].debil) {
          normalizedData[testKey].debil = { derecho: false, izquierdo: false };
        }
        if (normalizedData[testKey].comentarios === undefined) {
          normalizedData[testKey].comentarios = '';
        }
      }
    });

    return normalizedData;
  };

  // Función para normalizar campos FMS al cargar desde Firebase
  const normalizeFMSData = (data) => {
    const normalizedData = { ...data };

    // Normalizar fmsImpingementClearingTest si viene como string antiguo
    if (normalizedData.fmsImpingementClearingTest && typeof normalizedData.fmsImpingementClearingTest === 'string') {
      // Si es un string, convertirlo a objeto con el valor en ambos lados o solo en derecho
      normalizedData.fmsImpingementClearingTest = {
        derecho: normalizedData.fmsImpingementClearingTest,
        izquierdo: ''
      };
    } else if (!normalizedData.fmsImpingementClearingTest || typeof normalizedData.fmsImpingementClearingTest !== 'object') {
      // Si no existe o no es un objeto, inicializarlo
      normalizedData.fmsImpingementClearingTest = {
        derecho: '',
        izquierdo: ''
      };
    } else {
      // Asegurar que tenga ambas propiedades
      if (!normalizedData.fmsImpingementClearingTest.derecho) {
        normalizedData.fmsImpingementClearingTest.derecho = '';
      }
      if (!normalizedData.fmsImpingementClearingTest.izquierdo) {
        normalizedData.fmsImpingementClearingTest.izquierdo = '';
      }
    }

    return normalizedData;
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
          let normalizedAnswers = normalizeNeuroTestData(consultaData.answers || {});
          normalizedAnswers = normalizeFMSData(normalizedAnswers);

          // MERGE con el estado inicial para preservar valores por defecto como hrrFases
          setFormData(prev => {
            const mergedData = {
              ...prev, // Valores por defecto primero
              ...normalizedAnswers, // Datos guardados encima
              // Solo llenar si no existen en answers
              nombres: normalizedAnswers.nombres || clienteData?.nombre || '',
              apellidoPaterno: normalizedAnswers.apellidoPaterno || clienteData?.apellidos?.split(' ')[0] || '',
              apellidoMaterno: normalizedAnswers.apellidoMaterno || clienteData?.apellidos?.split(' ')[1] || '',
              fechaNacimiento: normalizedAnswers.fechaNacimiento || clienteData?.fechaNacimiento || '',
              genero: normalizedAnswers.genero || clienteData?.genero || '',
              contacto: normalizedAnswers.contacto || clienteData?.telefono || '',
            };
            return mergedData;
          });
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

  // Función para actualizar campos de historia clínica (respuesta/cual)
  const handleHistoriaChange = (field, type, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  // Función para actualizar tests neurofuncionales
  const handleNeuroTestChange = (testName, category, side, value) => {
    setFormData(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [category]: {
          ...(prev[testName]?.[category] || {}),
          [side]: value
        }
      }
    }));
  };

  // Función para actualizar arrays (HRR fases)
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

  // Guardar borrador
  // REMOVED: saveDraft function - draft functionality has been eliminated

  // Finalizar consulta
  const finishConsultation = async () => {
    setIsLoading(true);

    try {
      // Si estamos en viewMode y hay consultaId, usar ese ID (actualizar consulta existente)
      // Si no hay ninguno, crear nuevo ID
      const targetConsultaId = consultaId || `consulta_atleta_${clienteId}_${Date.now()}`;

      const consultaData = {
        clienteId: clienteId,
        uidTrabajador: 'admin-temp',
        answers: formData,
        status: 'completed',
        type: 'atleta',
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

      const successMsg = isViewMode ? 'Cambios guardados exitosamente ✅' : 'Evaluación deportiva registrada exitosamente ✅';
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

  // Compartir consulta con URL corta
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    const shareableId = consultaId;
    if (!shareableId) {
      alert('No hay una consulta para compartir. Guarda primero.');
      return;
    }

    setIsSharing(true);

    try {
      // Usar el acortador de URLs
      const response = await fetch('/api/s/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultaId: shareableId,
          type: 'atleta'
        })
      });

      if (response.ok) {
        const { shortUrl } = await response.json();
        await navigator.clipboard.writeText(shortUrl);
        setSuccessMessage('¡Link copiado al portapapeles! ✅');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error('Error al crear URL corta');
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      // Fallback a URL larga
      const shareUrl = `${window.location.origin}/compartir/consulta/${shareableId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setSuccessMessage('Link copiado al portapapeles ✅');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        alert(`Link de compartir:\n${shareUrl}`);
      }
    } finally {
      setIsSharing(false);
    }
  };


  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando evaluación deportiva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6 mb-6 space-y-6">
        {/* Header con información del atleta */}
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
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-md border-4 border-gray-50">
                      {cliente?.nombre?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border-2 border-white bg-emerald-600 text-white">
                    Atleta
                  </span>
                </div>

                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {cliente?.nombre} {cliente?.apellidos}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Evaluación Deportiva Completa</p>
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
                <div className={`w-10 h-10 ${isViewMode ? 'bg-green-50' : 'bg-emerald-50'} rounded-lg flex items-center justify-center`}>
                  <FontAwesomeIcon icon={faActivity} className={`w-5 h-5 ${isViewMode ? 'text-green-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isViewMode ? 'Evaluación Deportiva Terminada (Editable)' : 'Nueva Evaluación Deportiva'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isViewMode ? 'Puedes editar y guardar cambios en esta evaluación' : 'Formulario completo para atletas'}
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
                          await visualizarPDF(consultaActual, cliente, 'atleta');
                        } catch (error) {
                          console.error('Error generando PDF:', error);
                          alert('Error al generar el PDF');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                      title="Generar PDF"
                    >
                      <FontAwesomeIcon icon={faPrinter} className="w-4.5 h-4.5" />
                      <span className="hidden sm:inline">Generar PDF</span>
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                      title="Compartir consulta"
                    >
                      {isSharing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Generando...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faShare2} className="w-4.5 h-4.5" />
                          <span className="hidden sm:inline">Compartir</span>
                        </>
                      )}
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
        <FichaDeportivaForm
          formData={formData}
          onInputChange={handleInputChange}
          onNestedChange={handleNestedChange}
          onHistoriaChange={handleHistoriaChange}
          onNeuroTestChange={handleNeuroTestChange}
          onFMSSubtestChange={handleFMSSubtestChange}
          onArrayChange={handleArrayChange}
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
              className="flex items-center px-6 py-3 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2 w-5 h-5" />
              {isLoading ? 'Finalizando...' : 'Finalizar evaluación'}
            </button>
          )}
        </div>

        {/* Mensaje de éxito al finalizar */}
        {showSuccess && successMessage.includes('registrada') && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center max-w-md shadow-2xl">
              <div className="text-6xl text-green-500 mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Evaluación Deportiva Completada!
              </h3>
              <p className="text-gray-600">
                La evaluación deportiva se ha guardado correctamente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaAtletaCompletaPage;
