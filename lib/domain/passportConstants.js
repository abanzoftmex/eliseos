// lib/domain/passportConstants.js
/**
 * CONSTANTES DE NEGOCIO Y REGLAS OFICIALES - PASAPORTE SCIENCE IN MOTION (REWARDS)
 * Fuente de verdad: Documento "PASAPORTE Science in motion.pdf"
 */

export const PASSPORT_DEFAULT_YEAR = 2026;

// ==========================================
// 1. MESES Y CONTENIDO EDITORIAL
// ==========================================
export const PASSPORT_MONTHS = [
  {
    id: 'enero',
    nombre: 'Enero',
    numero: 1,
    trimestre: 'Q1',
    tituloEditorial: 'Tu compromiso marca el inicio',
    fraseEditorial: 'No se trata de empezar perfecto, sino de no rendirte.',
    tieneComposicionCorporal: true
  },
  {
    id: 'febrero',
    nombre: 'Febrero',
    numero: 2,
    trimestre: 'Q1',
    tituloEditorial: 'La constancia se construye',
    fraseEditorial: 'Lo que repites, te transforma.',
    tieneComposicionCorporal: false
  },
  {
    id: 'marzo',
    nombre: 'Marzo',
    numero: 3,
    trimestre: 'Q1',
    tituloEditorial: 'Cerrar fuerte también es avanzar',
    fraseEditorial: 'La disciplina vence a la motivación.',
    tieneComposicionCorporal: true
  },
  {
    id: 'abril',
    nombre: 'Abril',
    numero: 4,
    trimestre: 'Q2',
    tituloEditorial: 'El progreso ya se nota',
    fraseEditorial: 'Estás más cerca de lo que crees.',
    tieneComposicionCorporal: false
  },
  {
    id: 'mayo',
    nombre: 'Mayo',
    numero: 5,
    trimestre: 'Q2',
    tituloEditorial: 'La disciplina ya es parte de ti',
    fraseEditorial: 'Cuando te comprometes contigo, todo cambia.',
    tieneComposicionCorporal: false
  },
  {
    id: 'junio',
    nombre: 'Junio',
    numero: 6,
    trimestre: 'Q2',
    tituloEditorial: 'Mitad del camino, misma meta',
    fraseEditorial: 'No pares ahora, lo mejor viene después.',
    tieneComposicionCorporal: true
  },
  {
    id: 'julio',
    nombre: 'Julio',
    numero: 7,
    trimestre: 'Q3',
    tituloEditorial: 'Tu esfuerzo ya es visible',
    fraseEditorial: 'El cambio se nota cuando no te rindes.',
    tieneComposicionCorporal: false
  },
  {
    id: 'agosto',
    nombre: 'Agosto',
    numero: 8,
    trimestre: 'Q3',
    tituloEditorial: 'La constancia es tu ventaja',
    fraseEditorial: 'Lo difícil ya pasó, ahora es constancia.',
    tieneComposicionCorporal: false
  },
  {
    id: 'septiembre',
    nombre: 'Septiembre',
    numero: 9,
    trimestre: 'Q3',
    tituloEditorial: 'Estás creando un nuevo tú',
    fraseEditorial: 'No entrenas solo el cuerpo, entrenas tu carácter.',
    tieneComposicionCorporal: true
  },
  {
    id: 'octubre',
    nombre: 'Octubre',
    numero: 10,
    trimestre: 'Q4',
    tituloEditorial: 'Llegar lejos también cansa',
    fraseEditorial: 'Descansar no es rendirse.',
    tieneComposicionCorporal: false
  },
  {
    id: 'noviembre',
    nombre: 'Noviembre',
    numero: 11,
    trimestre: 'Q4',
    tituloEditorial: 'Todo el año te preparó para este momento',
    fraseEditorial: 'Todo el año te preparó para este momento.',
    tieneComposicionCorporal: false
  },
  {
    id: 'diciembre',
    nombre: 'Diciembre',
    numero: 12,
    trimestre: 'Q4',
    // Nota: El PDF en pág. 33 titula la página previa al premio de Dic como "NOVIEMBRE: Cierre con orgullo".
    // En el sistema representamos formalmente Diciembre conservando la frase de cierre con orgullo.
    tituloEditorial: 'Cierre con orgullo',
    fraseEditorial: 'No fue suerte. Fue constancia.',
    tieneComposicionCorporal: true
  }
];

// ==========================================
// 2. TRIMESTRES Y METAS
// ==========================================
export const PASSPORT_QUARTERS = [
  {
    id: 'Q1',
    nombre: 'Primer Trimestre',
    mesFinal: 'marzo',
    meses: ['enero', 'febrero', 'marzo'],
    metaConstancia: 12,
    metaExperiencia: 2,
    metaAcumulada: 14,
    recompensaPeriodoLabel: 'Marzo — 14 sellos'
  },
  {
    id: 'Q2',
    nombre: 'Segundo Trimestre',
    mesFinal: 'junio',
    meses: ['abril', 'mayo', 'junio'],
    metaConstancia: 24,
    metaExperiencia: 4,
    metaAcumulada: 28,
    recompensaPeriodoLabel: 'Junio — 28 sellos'
  },
  {
    id: 'Q3',
    nombre: 'Tercer Trimestre',
    mesFinal: 'septiembre',
    meses: ['julio', 'agosto', 'septiembre'],
    metaConstancia: 36,
    metaExperiencia: 6,
    metaAcumulada: 42,
    recompensaPeriodoLabel: 'Septiembre — 42 sellos'
  },
  {
    id: 'Q4',
    nombre: 'Cuarto Trimestre',
    mesFinal: 'diciembre',
    meses: ['octubre', 'noviembre', 'diciembre'],
    metaConstancia: 48,
    metaExperiencia: 8,
    metaAcumulada: 56,
    recompensaPeriodoLabel: 'Diciembre — 56 sellos'
  }
];

// ==========================================
// 3. TIPOS DE SELLOS Y REQUISITOS
// ==========================================
export const STAMP_CATEGORIES = {
  CONSTANCIA: 'constancia',
  EXPERIENCIA: 'experiencia'
};

export const CONSTANCY_STAMP_TYPES = {
  ASISTENCIA: {
    id: 'asistencia',
    nombre: 'Asistencia',
    categoria: STAMP_CATEGORIES.CONSTANCIA,
    requisito: 'Asistir mínimo 3 días por semana (12 entrenamientos al mes)',
    icono: 'Flame',
    color: '#06b6d4'
  },
  RECUPERACION: {
    id: 'recuperacion',
    nombre: 'Recuperación',
    categoria: STAMP_CATEGORIES.CONSTANCIA,
    requisito: 'Tomar 1 terapia de recuperación al mes (15% desc. exclusivo Rewards)',
    icono: 'HeartPulse',
    color: '#10b981'
  },
  NUTRICION: {
    id: 'nutricion',
    nombre: 'Nutrición',
    categoria: STAMP_CATEGORIES.CONSTANCIA,
    requisito: 'Consumir 2 shakes al mes en Science in Motion',
    icono: 'CupSoda',
    color: '#f59e0b'
  },
  PRESENCIA_DIGITAL: {
    id: 'presencia_digital',
    nombre: 'Presencia Digital',
    categoria: STAMP_CATEGORIES.CONSTANCIA,
    requisito: 'Mencionar a Science in Motion en redes sociales 2 veces al mes (Post, Reel o Story)',
    icono: 'Share2',
    color: '#8b5cf6'
  }
};

export const EXPERIENCE_STAMP_TYPES = {
  EXPERIENCIA_DEPORTIVA: {
    id: 'experiencia_deportiva',
    nombre: 'Experiencia Deportiva',
    categoria: STAMP_CATEGORIES.EXPERIENCIA,
    requisito: 'Participar en una actividad deportiva externa (Carrera, IRONMAN, HYROX o reto personal)',
    icono: 'Trophy',
    color: '#ec4899'
  },
  COMUNIDAD: {
    id: 'comunidad',
    nombre: 'Comunidad SIM',
    categoria: STAMP_CATEGORIES.EXPERIENCIA,
    requisito: 'Invitar a 1 persona al trimestre a una clase muestra',
    icono: 'Users',
    color: '#3b82f6'
  }
};

export const MAX_MONTHLY_CONSTANCY_STAMPS = 4;
export const MAX_QUARTERLY_EXPERIENCE_STAMPS = 2;
export const MAX_ANNUAL_STAMPS = 56; // 48 constancia + 8 experiencia

// ==========================================
// 4. CATÁLOGO DE RECOMPENSAS MENSUALES (POR TRIMESTRE)
// ==========================================
export const MONTHLY_REWARDS_BY_QUARTER = {
  Q1: [
    {
      id: 'inbody_gratis',
      titulo: 'Análisis de composición corporal con InBody gratis',
      descripcion: 'Evaluación completa de métricas corporales.'
    },
    {
      id: 'shake_gratis',
      titulo: 'Un shake gratis',
      descripcion: 'En la barra de nutrición Science in Motion.'
    },
    {
      id: 'desc_15_mensualidad',
      titulo: '15% de descuento en tu próxima mensualidad',
      descripcion: 'Aplicable en tu siguiente pago de plan/paquete.'
    }
  ],
  Q2: [
    {
      id: 'terapia_gratis',
      titulo: 'Terapia de recuperación gratis',
      descripcion: 'Sesión de recuperación deportiva o fisioterapia.'
    },
    {
      id: 'desc_20_mensualidad',
      titulo: '20% de descuento en tu mensualidad',
      descripcion: 'Aplicable en tu siguiente pago de plan/paquete.'
    },
    {
      id: 'chamarra_gratis',
      titulo: 'Chamarra gratis',
      descripcion: 'Chamarra oficial Science in Motion.'
    }
  ],
  Q3: [
    {
      id: 'audifonos_gratis',
      titulo: 'Audífonos gratis',
      descripcion: 'Audífonos deportivos.'
    },
    {
      id: 'mochila_gratis',
      titulo: 'Mochila Science in Motion gratis',
      descripcion: 'Mochila deportiva oficial SIM.'
    },
    {
      id: 'calcetas_gratis',
      titulo: 'Par de calcetas deportivas gratis',
      descripcion: 'Calcetas técnicas de alto rendimiento SIM.'
    }
  ],
  Q4: [
    {
      id: 'gorro_invierno_gratis',
      titulo: 'Gorro de invierno gratis',
      descripcion: 'Gorro térmico Science in Motion.'
    },
    {
      id: 'desc_25_mensualidad',
      titulo: '25% de descuento en tu mensualidad',
      descripcion: 'Aplicable en tu siguiente pago de plan/paquete.'
    },
    {
      id: 'playera_especial_sim_gratis',
      titulo: 'Playera especial SIM gratis',
      descripcion: 'Edición especial de atleta Science in Motion.'
    }
  ]
};

// ==========================================
// 5. CATÁLOGO DE RECOMPENSAS TRIMESTRALES
// ==========================================
export const QUARTERLY_REWARDS = {
  Q1: {
    periodo: 'Q1',
    metaSellos: 14,
    mesNombre: 'Marzo',
    opciones: [
      {
        id: 'playera_sim_gratis',
        titulo: 'Playera Science in Motion gratis',
        descripcion: 'Playera deportiva oficial de entrenamiento.'
      },
      {
        id: 'shaker_gratis',
        titulo: 'Shaker gratis',
        descripcion: 'Shaker ergonómico SIM.'
      },
      {
        id: 'guantes_gratis',
        titulo: 'Guantes de entrenamiento gratis',
        descripcion: 'Guantes técnicos para gimnasio.'
      }
    ]
  },
  Q2: {
    periodo: 'Q2',
    metaSellos: 28,
    mesNombre: 'Junio',
    opciones: [
      {
        id: 'proteina_50_descuento',
        titulo: 'Bote de proteína al 50%',
        descripcion: 'Descuento del 50% en proteína premium de barra.'
      },
      {
        id: 'ligas_gratis',
        titulo: 'Juego de ligas gratis',
        descripcion: 'Kit de bandas de resistencia SIM.'
      },
      {
        id: 'mensualidad_invitado_gratis',
        titulo: 'Una mensualidad gratis para un invitado',
        descripcion: 'Regala 1 mes de acceso a un amigo o familiar.'
      }
    ]
  },
  Q3: {
    periodo: 'Q3',
    metaSellos: 42,
    mesNombre: 'Septiembre',
    opciones: [
      {
        id: 'sesion_fotos_gratis',
        titulo: 'Sesión de fotos deportiva gratis',
        descripcion: 'Shooting fotográfico profesional de entrenamiento.'
      },
      {
        id: 'cena_toscalia',
        titulo: 'Cena para dos personas en Toscalia*',
        descripcion: 'Experiencia gastronómica para dos personas.'
      },
      {
        id: 'hoodie_sim_gratis',
        titulo: 'Hoodie Science in Motion gratis',
        descripcion: 'Sudadera premium oficial SIM.'
      }
    ]
  },
  Q4: {
    periodo: 'Q4',
    metaSellos: 56,
    mesNombre: 'Diciembre',
    opciones: [
      {
        id: 'smartwatch',
        titulo: 'Smartwatch',
        descripcion: 'Reloj inteligente para monitoreo deportivo.'
      },
      {
        id: 'mensualidad_gratis',
        titulo: 'Una mensualidad gratis',
        descripcion: '100% de descuento en tu siguiente mes de membresía.'
      },
      {
        id: 'bote_proteina_gratis',
        titulo: 'Bote de proteína gratis',
        descripcion: 'Bote completo de proteína premium.'
      }
    ]
  }
};

// ==========================================
// 6. CAMPOS DE COMPOSICIÓN CORPORAL (INBODY)
// ==========================================
export const BODY_COMPOSITION_PERIODS = ['enero', 'marzo', 'junio', 'septiembre', 'diciembre'];

export const BODY_COMPOSITION_FIELDS = [
  { key: 'peso', label: 'Peso', unit: 'kg', step: '0.1' },
  { key: 'imc', label: 'IMC', unit: 'kg/m²', step: '0.1' },
  { key: 'grasaCorporal', label: '% Grasa Corporal', unit: '%', step: '0.1' },
  { key: 'musculoEsqueletico', label: '% Músculo Esquelético', unit: '%', step: '0.1' },
  { key: 'grasaVisceral', label: 'Grasa Visceral', unit: 'Nivel', step: '0.5' },
  { key: 'metabolismoBasal', label: 'Metabolismo Basal', unit: 'kcal', step: '1' },
  { key: 'edadCorporal', label: 'Edad Corporal', unit: 'años', step: '1' }
];
