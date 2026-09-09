import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import FMSForm from '../../../components/FMSForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck,
  faChartLine as faActivity
} from '@fortawesome/free-solid-svg-icons';

/**
 * Página pública para ver evaluación deportiva (tipo atleta)
 * Accesible via URL corta: /f/citas-deportivas/[code]
 * NO requiere autenticación - Solo lectura
 */
const EvaluacionDeportivaPublicaPage = () => {
  const router = useRouter();
  const { code } = router.query;
  
  // Siempre en modo solo lectura
  const isViewMode = true;
  
  // ID de la consulta (se obtiene del shortener)
  const [consultaId, setConsultaId] = useState(null);
  const [clienteId, setClienteId] = useState(null);

  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cliente, setCliente] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Estado del formulario COMPLETO para ATLETAS con TODOS los campos
  const [formData, setFormData] = useState({
    // ===== 1. DATOS PERSONALES =====
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
      descripcion: '',
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
      descripcion: '',
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
      comentarios: ''
    },
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
    hrrClasificacion: ''
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

  // Cargar datos al inicializar - resolver código corto primero
  useEffect(() => {
    if (code) {
      resolveAndLoadData();
    }
  }, [code]);

  const resolveAndLoadData = async () => {
    setLoadingData(true);
    try {
      // Resolver el código corto para obtener consultaId
      const response = await fetch(`/api/s/${code}`);
      if (!response.ok) {
        console.error('Código no encontrado');
        setLoadingData(false);
        return;
      }
      
      const { consultaId: resolvedConsultaId } = await response.json();
      setConsultaId(resolvedConsultaId);
      
      // Cargar la consulta
      const consultaDoc = await getDoc(doc(db, 'consultas', resolvedConsultaId));
      if (!consultaDoc.exists()) {
        console.error('Consulta no encontrada');
        setLoadingData(false);
        return;
      }
      
      const consultaData = consultaDoc.data();
      let normalizedAnswers = normalizeNeuroTestData(consultaData.answers || {});
      normalizedAnswers = normalizeFMSData(normalizedAnswers);
      setClienteId(consultaData.clienteId);
      
      // Cargar información del cliente
      let clienteData = null;
      if (consultaData.clienteId) {
        const clienteDoc = await getDoc(doc(db, 'clientes', consultaData.clienteId));
        if (clienteDoc.exists()) {
          clienteData = clienteDoc.data();
          setCliente(clienteData);
        }
      }
      
      // MERGE con el estado inicial para preservar valores por defecto
      setFormData(prev => {
        const mergedData = {
          ...prev,
          ...normalizedAnswers,
          nombres: normalizedAnswers.nombres || clienteData?.nombre || '',
          apellidoPaterno: normalizedAnswers.apellidoPaterno || clienteData?.apellidos?.split(' ')[0] || '',
          apellidoMaterno: normalizedAnswers.apellidoMaterno || clienteData?.apellidos?.split(' ')[1] || '',
          fechaNacimiento: normalizedAnswers.fechaNacimiento || clienteData?.fechaNacimiento || '',
          genero: normalizedAnswers.genero || clienteData?.genero || '',
          contacto: normalizedAnswers.contacto || clienteData?.telefono || '',
        };
        return mergedData;
      });
      
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

  // Función para calcular IMC automáticamente
  const calculateIMC = (altura, peso) => {
    if (altura && peso && altura > 0 && peso > 0) {
      const alturaEnMetros = altura / 100; // Convertir cm a metros
      const imc = peso / (alturaEnMetros * alturaEnMetros);
      return imc.toFixed(2);
    }
    return '';
  };

  // Función para actualizar altura o peso y calcular IMC automáticamente
  const handleAlturaOrPesoChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Calcular IMC si tenemos ambos valores
      if (field === 'altura' || field === 'peso') {
        const altura = field === 'altura' ? value : prev.altura;
        const peso = field === 'peso' ? value : prev.peso;
        newData.imc = calculateIMC(altura, peso);
      }
      
      return newData;
    });
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
          ...prev[testName][category],
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

  // Estado de error para mostrar si no se encuentra la consulta
  const [error, setError] = useState(null);

  // Función helper para obtener el color de fondo según la zona de intensidad
  const getZonaColor = (zona) => {
    const zonaUpper = zona?.toUpperCase() || '';
    if (zonaUpper.includes('GRIS')) return 'bg-gray-300';
    if (zonaUpper.includes('AZUL')) return 'bg-blue-500';
    if (zonaUpper.includes('VERDE')) return 'bg-green-500';
    if (zonaUpper.includes('NARANJA')) return 'bg-orange-500';
    if (zonaUpper.includes('ROJA')) return 'bg-red-500';
    return 'bg-gray-100';
  };

  // Componente helper para renderizar una fila de la tabla de Historia Clínica
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
          className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
        />
      </td>
      <td className="border border-gray-300 px-4 py-3 text-center">
        <input
          type="radio"
          name={field}
          checked={formData[field]?.respuesta === 'no'}
          onChange={() => handleHistoriaChange(field, 'respuesta', 'no')}
          className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
        />
      </td>
      <td className="border border-gray-300 px-4 py-3">
        <textarea
          value={formData[field]?.comentarios || ''}
          onChange={(e) => handleHistoriaChange(field, 'comentarios', e.target.value)}
          placeholder="Comentarios adicionales..."
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-y"
        />
      </td>
    </tr>
  );

  if (loadingData) {
    return (
      <>
        <Head>
          <title>Cargando Evaluación Deportiva - Elíseos Box & Fitness</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando evaluación deportiva...</p>
          </div>
        </div>
      </>
    );
  }

  if (!consultaId || error) {
    return (
      <>
        <Head>
          <title>Error - Elíseos Box & Fitness</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md">
            <FontAwesomeIcon icon={faActivity} className="mx-auto text-gray-300 mb-4 w-16 h-16" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Evaluación no encontrada</h2>
            <p className="text-gray-600">El enlace puede haber expirado o la evaluación no existe.</p>
          </div>
        </div>
      </>
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
                    Miembro
                  </span>
                </div>
                
                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {cliente?.nombre} {cliente?.apellidos}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">Evaluación Deportiva Completa</p>
                </div>
              </div>
              
              {/* Logo Elíseos Box & Fitness */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faActivity} className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-800">Elíseos Box & Fitness</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header de acción */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faActivity} className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Evaluación Deportiva</h2>
                <p className="text-sm text-gray-600">Vista de solo lectura</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-blue-700">Modo de lectura</span>
            </div>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="bg-green-50 border-green-200 border rounded-lg p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheck} className="mr-2 text-green-600 w-5 h-5" />
              <p className="font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* FORMULARIO COMPLETO */}
        <fieldset disabled={isViewMode} className="space-y-6">
          <style jsx>{`
            fieldset:disabled input,
            fieldset:disabled textarea,
            fieldset:disabled select {
              background-color: #f9fafb;
              color: #1f2937;
              cursor: default;
              opacity: 1;
            }
            fieldset:disabled input[type="checkbox"],
            fieldset:disabled input[type="radio"] {
              opacity: 0.8;
              cursor: default;
            }
          `}</style>
          {/* ===== SECCIÓN 1: HISTORIA CLÍNICA ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
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

            <div className="mt-6 grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OBJETIVO PERSONAL</label>
                <textarea
                  value={formData.objetivoPersonal}
                  onChange={(e) => handleInputChange('objetivoPersonal', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  placeholder="Describa el objetivo personal del atleta..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ALIMENTACIÓN (calidad/cantidad)</label>
                  <textarea
                    value={formData.alimentacion}
                    onChange={(e) => handleInputChange('alimentacion', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HIDRATACIÓN (cantidad/sustancias)</label>
                  <textarea
                    value={formData.hidratacion}
                    onChange={(e) => handleInputChange('hidratacion', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PÉRDIDA DE PESO</label>
                  <textarea
                    value={formData.perdidaPeso}
                    onChange={(e) => handleInputChange('perdidaPeso', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TOXICOMANÍAS (tabaco/alcohol/drogas)</label>
                  <textarea
                    value={formData.toxicomanias}
                    onChange={(e) => handleInputChange('toxicomanias', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HÁBITOS DE SUEÑO (horas/complicaciones)</label>
                  <textarea
                    value={formData.habitosSueno}
                    onChange={(e) => handleInputChange('habitosSueno', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SÍNTOMAS EMOCIONALES (anteriores/activos)</label>
                  <textarea
                    value={formData.sintomasEmocionales}
                    onChange={(e) => handleInputChange('sintomasEmocionales', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GASTOS MÉDICOS MAYORES</label>
                  <textarea
                    value={typeof formData.gastoMedicoMayores === 'string' ? formData.gastoMedicoMayores : ''}
                    onChange={(e) => handleInputChange('gastoMedicoMayores', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECCIÓN 3: SIGNOS VITALES Y MEDIDAS ANTROPOMÉTRICAS ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-red-700 font-bold">3</span>
              </div>
              Signos Vitales y Medidas Antropométricas
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Signos Vitales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FRECUENCIA CARDÍACA EN REPOSO (bpm)</label>
                  <input
                    type="number"
                    value={formData.frecuenciaCardiacaReposo}
                    onChange={(e) => handleInputChange('frecuenciaCardiacaReposo', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FRECUENCIA CARDÍACA (bpm)</label>
                  <input
                    type="number"
                    value={formData.frecuenciaCardiaca}
                    onChange={(e) => handleInputChange('frecuenciaCardiaca', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TENSIÓN ARTERIAL (mmHg)</label>
                  <input
                    type="text"
                    value={formData.tensionArterial}
                    onChange={(e) => handleInputChange('tensionArterial', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="120/80"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SATURACIÓN DE OXÍGENO (%)</label>
                  <input
                    type="number"
                    value={formData.saturacionOxigeno}
                    onChange={(e) => handleInputChange('saturacionOxigeno', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Medidas Antropométricas</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">OBJETIVO:</label>
                <textarea
                  value={formData.objetivoAntropometrico}
                  onChange={(e) => handleInputChange('objetivoAntropometrico', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ALTURA (cm)</label>
                  <input
                    type="number"
                    value={formData.altura}
                    onChange={(e) => handleAlturaOrPesoChange('altura', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PESO (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => handleAlturaOrPesoChange('peso', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IMC/BMI (calculado automáticamente)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.imc}
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
                    value={formData.grasaCorporal}
                    onChange={(e) => handleInputChange('grasaCorporal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">% MÚSCULO ESQUELÉTICO</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.musculoEsqueletico}
                    onChange={(e) => handleInputChange('musculoEsqueletico', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">METABOLISMO BASAL (kcal)</label>
                  <input
                    type="number"
                    value={formData.metabolismoBasal}
                    onChange={(e) => handleInputChange('metabolismoBasal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">EDAD CORPORAL</label>
                  <input
                    type="number"
                    value={formData.edadCorporal}
                    onChange={(e) => handleInputChange('edadCorporal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NIVEL DE GRASA VISCERAL</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.grasaVisceral}
                    onChange={(e) => handleInputChange('grasaVisceral', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Comentario:</label>
                <textarea
                  value={formData.comentarioAntropometrico}
                  onChange={(e) => handleInputChange('comentarioAntropometrico', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  placeholder="Observaciones sobre las medidas antropométricas..."
                />
              </div>
            </div>
          </div>

          {/* ===== SECCIÓN 4: EXAMINACIÓN NEUROFUNCIONAL ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-700 font-bold">4</span>
              </div>
              Examinación Neurofuncional
            </h2>
            
           

            {/* Tabla Neurofuncional */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Test</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Descripción</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800" colSpan="2">NORMAL</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800" colSpan="2">PINZAMIENTO</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800" colSpan="2">ACTIVACIÓN</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800" colSpan="2">ACORTAMIENTO</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800" colSpan="2">DEBILIDAD</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Comentarios Derecho</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Comentarios Izquierdo</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2"></th>
                    <th className="border border-gray-300 px-3 py-2"></th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">DER</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">IZQ</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">DER</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">IZQ</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">DER</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">IZQ</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">DER</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">IZQ</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">DER</th>
                    <th className="border border-gray-300 px-2 py-1 text-xs text-center">IZQ</th>
                    <th className="border border-gray-300 px-3 py-2"></th>
                    <th className="border border-gray-300 px-3 py-2"></th>
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
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.normal?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.acortamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.acortamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.debilidad?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.debilidad?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.comentariosDerecho || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)}
              placeholder="Comentarios derecho..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.comentariosIzquierdo || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)}
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
                        {/* Fila de checkboxes */}
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-xs font-medium">{testLabels[testKey]}</td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.descripcion || ''}
              onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)}
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
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.normal?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                            type="checkbox"
                            checked={formData[testKey]?.activacion?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.acortamiento?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.acortamiento?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.debilidad?.derecho || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData[testKey]?.debilidad?.izquierdo || false}
                            onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea
              value={formData[testKey]?.comentariosDerecho || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)}
              placeholder="Comentarios derecho..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <textarea
              value={formData[testKey]?.comentariosIzquierdo || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)}
              placeholder="Comentarios izquierdo..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
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
                            <textarea
              value={formData[testKey]?.descripcion || ''}
              onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)}
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
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.normal?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.acortamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.acortamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.debilidad?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.debilidad?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.comentariosDerecho || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)}
              placeholder="Comentarios derecho..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.comentariosIzquierdo || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)}
              placeholder="Comentarios izquierdo..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
                          </td>
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
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.descripcion || ''}
              onChange={(e) => handleNestedChange(testKey, 'descripcion', e.target.value)}
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
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.normal?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'normal', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.pinzamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'pinzamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.activacion?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'activacion', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.acortamiento?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.acortamiento?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'acortamiento', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.debilidad?.derecho || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'derecho', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData[testKey]?.debilidad?.izquierdo || false}
                              onChange={(e) => handleNeuroTestChange(testKey, 'debilidad', 'izquierdo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.comentariosDerecho || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosDerecho', e.target.value)}
              placeholder="Comentarios derecho..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <textarea
              value={formData[testKey]?.comentariosIzquierdo || ''}
              onChange={(e) => handleNestedChange(testKey, 'comentariosIzquierdo', e.target.value)}
              placeholder="Comentarios izquierdo..."
              rows="2"
              className="w-full px-2 py-1 border-0 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded resize-y"
            />
                          </td>
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
            handleInputChange={handleInputChange}
            handleNestedChange={handleNestedChange}
            handleFMSSubtestChange={handleFMSSubtestChange}
          />

          {/* ===== SECCIÓN 6: HRR (HEART RATE RECOVERY) ===== */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg mb-0">
              <h2 className="text-2xl font-bold uppercase">HRR (HEART RATE RECOVERY)</h2>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 mb-6">
              <p className="text-sm text-gray-700">Objetivo: <span className="italic text-gray-600">{formData.hrrObjetivo || 'evaluar niveles de energía y recuperación aeróbica'}</span></p>
            </div>

            <div className="overflow-x-auto mb-6">
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
                  {formData.hrrFases.map((fase, index) => {
                    const isEjercicio = fase.fase === 'EJERCICIO';
                    const ejercicioIndices = formData.hrrFases
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

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recuperación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">FC INICIAL</label>
                <input
                  type="number"
                  value={formData.hrrFcInicial}
                  onChange={(e) => handleInputChange('hrrFcInicial', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="bpm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HRR</label>
                <input
                  type="number"
                  value={formData.hrrHrr}
                  onChange={(e) => handleInputChange('hrrHrr', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CLASIFICACIÓN</label>
                <input
                  type="text"
                  value={formData.hrrClasificacion}
                  onChange={(e) => handleInputChange('hrrClasificacion', e.target.value)}
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
        </fieldset>

        {/* Footer de la ficha pública */}
        <div className="text-center py-8 border-t border-gray-200 mt-8">
          <p className="text-sm text-gray-500">
            Esta es una ficha de evaluación deportiva de solo lectura compartida por Elíseos Box & Fitness
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvaluacionDeportivaPublicaPage;
