import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Función helper para cargar imagen y convertirla a base64
const loadImageAsBase64 = async (imagePath) => {
  try {
    // Usar URL absoluta del servidor actual
    const url = `${window.location.origin}${imagePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`No se pudo cargar la imagen: ${url}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

// Función helper para formatear fecha
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Función helper para formatear objetos de checkboxes
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
    agudo: 'Agudo',
    cronico: 'Crónico',
    degenerativo: 'Degenerativo',
    // Intensidad del Dolor
    leve: 'Leve',
    moderado: 'Moderado',
    severo: 'Severo',
    insoportable: 'Insoportable',
    // Deporte
    crossfit: 'CrossFit',
    funcional: 'Funcional',
    halterofilia: 'Halterofilia',
    powerlifting: 'Powerlifting',
    strongman: 'Strongman',
    otro: 'Otro'
  };

  const selectedItems = Object.entries(obj)
    .filter(([key, value]) => value === true)
    .map(([key]) => labels[key] || key)
    .join(', ');

  return selectedItems || 'Ninguno';
};

// Función principal para generar PDF de consulta
export const generarPDFConsulta = async (consulta, cliente, tipoConsulta = 'normal') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Pre-cargar todas las imágenes del FMS
  const imagenesCache = {};
  const imagenesACargar = [
    'deep-squat.png',
    'hurdle-step.png',
    'in-line-lunge.png',
    'shoulder-mobility.png',
    'active-straight.png',
    'trunk-stability.png',
    'rotary-stability.png'
  ];

  for (const imagen of imagenesACargar) {
    try {
      const imgData = await loadImageAsBase64(`/img/${imagen}`);
      if (imgData) {
        imagenesCache[imagen] = imgData;
      }
    } catch (error) {
      console.log('No se pudo pre-cargar imagen:', imagen);
    }
  }

  // Header con logo/título (más pequeño y profesional)
  doc.setFillColor(6, 182, 212); // Teal-600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ELÍSEOS BOX & FITNESS', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(tipoConsulta === 'atleta' ? 'Historia Clínica Deportiva' : 'Historia Clínica Completa', pageWidth / 2, 21, { align: 'center' });

  yPosition = 38;

  // Información del Paciente
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Paciente', 14, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Nombre Completo', `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim()],
      ['Fecha de Nacimiento', formatDate(cliente.fechaNacimiento)],
      ['Edad', cliente.edad ? `${cliente.edad} años` : 'N/A'],
      ['Género', cliente.genero || 'N/A'],
      ['Email', cliente.email || 'N/A'],
      ['Teléfono', cliente.telefono || 'N/A'],
      ['Fecha de Consulta', formatDate(consulta.updatedAt || consulta.createdAt)]
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Función para agregar sección
  const agregarSeccion = (titulo, contenido) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text(titulo, 14, yPosition);
    yPosition += 2;

    // Línea decorativa
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (Array.isArray(contenido)) {
      const tableData = contenido.map(item => {
        if (Array.isArray(item)) return item;
        return [item.label, item.value];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Si se dibuja una nueva página, actualizar yPosition
          if (data.pageNumber > 1) {
            yPosition = 20;
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    } else {
      const lines = doc.splitTextToSize(contenido, pageWidth - 28);
      doc.text(lines, 14, yPosition);
      yPosition += lines.length * 5 + 10;
    }
  };

  const answers = consulta.answers || {};

  // ===== DATOS DE LA CONSULTA =====
  if (answers.fechaEvaluacion || answers.numeroExpediente) {
    const datosConsultaData = [];
    if (answers.fechaEvaluacion) datosConsultaData.push({ label: 'Fecha de Evaluación', value: answers.fechaEvaluacion });
    if (answers.numeroExpediente) datosConsultaData.push({ label: 'Número de Expediente', value: answers.numeroExpediente });
    if (datosConsultaData.length > 0) {
      agregarSeccion('Datos de la Consulta', datosConsultaData);
    }
  }

  // ===== HISTORIA CLÍNICA (ATLETA) - TABLA =====
  if (tipoConsulta === 'atleta') {
    const historiaClinicaQuestions = [
      { key: 'enfermedadCronica', label: 'ENFERMEDAD CRÓNICA' },
      { key: 'alteracionSistema', label: 'ALTERACIÓN DE ALGÚN SISTEMA/ÓRGANO' },
      { key: 'tratamientoMedico', label: 'TRATAMIENTO MÉDICO' },
      { key: 'patologiaColumna', label: 'PATOLOGÍA DE COLUMNA' },
      { key: 'patologiaHombro', label: 'PATOLOGÍA DE HOMBRO' },
      { key: 'patologiaCodo', label: 'PATOLOGÍA DE CODO' },
      { key: 'patologiaMuneca', label: 'PATOLOGÍA DE MUÑECA' },
      { key: 'patologiaCadera', label: 'PATOLOGÍA DE CADERA' },
      { key: 'patologiaRodilla', label: 'PATOLOGÍA DE RODILLA' },
      { key: 'patologiaTobillo', label: 'PATOLOGÍA DE TOBILLO' },
      { key: 'patologiaPie', label: 'PATOLOGÍA DE PIE' },
      { key: 'dolorMolestiaActual', label: 'DOLOR/MOLESTIA ACTUAL' },
      { key: 'lesionGrave', label: 'LESIÓN GRAVE' },
      { key: 'lesionesFrecuentes', label: 'LESIONES FRECUENTES' },
      { key: 'sufreMareos', label: '¿SUFRE MAREOS?' },
      { key: 'haSufridoDesmayos', label: '¿HA SUFRIDO DESMAYOS?' },
      { key: 'sufreConvulsiones', label: '¿SUFRE CONVULSIONES?' },
      { key: 'doloresCabezaFrecuentes', label: 'DOLORES DE CABEZA FRECUENTES' },
      { key: 'sufreHemorragiasNasales', label: '¿SUFRE HEMORRAGIAS NASALES?' },
      { key: 'dolorArticulaciones', label: 'DOLOR EN ARTICULACIONES' },
      { key: 'practicaDeporte', label: '¿PRACTICA DEPORTE?' }
    ];
    
    const tableData = [];
    historiaClinicaQuestions.forEach(({ key, label }) => {
      const data = answers[key];
      if (data && (data.respuesta === 'si' || data.respuesta === 'no')) {
        const cual = data.cual || '';
        const comentarios = data.comentarios || '';
        const fullComment = `${cual} ${comentarios}`.trim();
        
        tableData.push([
          label,
          data.respuesta === 'si' ? '✓' : '',
          data.respuesta === 'no' ? '✓' : '',
          fullComment || '-'
        ]);
      }
    });
    
    if (tableData.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text('Historia Clínica', 14, yPosition);
      yPosition += 10;
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Pregunta', 'Sí', 'No', 'Comentarios']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 10, halign: 'center' },
          3: { cellWidth: 'auto' }
        },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }


  // ===== RECOPILACIÓN DE HECHOS =====
  if (answers.recopilacionHechos) {
    agregarSeccion('Recopilación de Hechos', [
      { label: 'Motivo', value: formatCheckboxObject(answers.recopilacionHechos) }
    ]);
  }

  // ===== TIPO DE PADECIMIENTO =====
  if (answers.tipoPadecimiento || answers.fechaPadecimiento || answers.fechaDiagnostico || answers.descripcionPadecimiento) {
    const padecData = [];
    if (answers.tipoPadecimiento) padecData.push({ label: 'Tipo', value: formatCheckboxObject(answers.tipoPadecimiento) });
    if (answers.fechaPadecimiento) padecData.push({ label: 'Fecha del Padecimiento', value: answers.fechaPadecimiento });
    if (answers.fechaDiagnostico) padecData.push({ label: 'Fecha del Diagnóstico', value: answers.fechaDiagnostico });
    if (answers.descripcionPadecimiento) padecData.push({ label: 'Descripción', value: answers.descripcionPadecimiento });
    if (padecData.length > 0) {
      agregarSeccion('Padecimiento', padecData);
    }
  }

  // ===== ANTECEDENTES =====
  if (answers.antecedentesRelacionados || answers.diagnosticoMedicoEspecialista || answers.alergias) {
    const antData = [];
    if (answers.antecedentesRelacionados) antData.push({ label: 'Antecedentes Relacionados', value: answers.antecedentesRelacionados });
    if (answers.diagnosticoMedicoEspecialista) antData.push({ label: 'Diagnóstico Médico Especialista', value: answers.diagnosticoMedicoEspecialista });
    if (answers.alergias) antData.push({ label: 'Alergias', value: answers.alergias });
    if (antData.length > 0) {
      agregarSeccion('Antecedentes Generales', antData);
    }
  }

  // Enfermedades Crónicas
  if (answers.enfermedadesCronicas && answers.enfermedadesCronicas.length > 0 && answers.enfermedadesCronicas.some(e => e.descripcion)) {
    const tableData = answers.enfermedadesCronicas
      .filter(e => e.descripcion)
      .map(e => [
        e.descripcion || '-',
        e.genetica || '-',
        e.estado || '-',
        e.detalles || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Enfermedades Crónicas Heredo-Familiares', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Descripción', 'Genética', 'Estado', 'Detalles']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // Antecedentes Patológicos Infancia
  if (answers.antecedentesPatologicosInfancia && answers.antecedentesPatologicosInfancia.length > 0 &&
    answers.antecedentesPatologicosInfancia.some(a => a.enfermedad)) {
    const tableData = answers.antecedentesPatologicosInfancia
      .filter(a => a.enfermedad)
      .map(a => [
        a.enfermedad || '-',
        a.fechaEvolucion || '-',
        a.tratamiento || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Antecedentes Patológicos - Infancia/Adolescencia', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Enfermedad', 'Fecha/Evolución', 'Tratamiento']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // Antecedentes Patológicos Actuales
  if (answers.antecedentesPatologicosActuales && answers.antecedentesPatologicosActuales.length > 0 &&
    answers.antecedentesPatologicosActuales.some(a => a.enfermedad)) {
    const tableData = answers.antecedentesPatologicosActuales
      .filter(a => a.enfermedad)
      .map(a => [
        a.enfermedad || '-',
        a.fechaEvolucion || '-',
        a.tratamiento || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Antecedentes Patológicos - Actuales', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Enfermedad', 'Fecha/Evolución', 'Tratamiento']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // Antecedentes No Patológicos
  if (tipoConsulta === 'atleta') {
    const noPatolData = [];
    if (answers.objetivoPersonal) noPatolData.push({ label: 'Objetivo Personal', value: answers.objetivoPersonal });
    if (answers.alimentacion) noPatolData.push({ label: 'Alimentación', value: answers.alimentacion });
    if (answers.hidratacion) noPatolData.push({ label: 'Hidratación', value: answers.hidratacion });
    if (answers.perdidaPeso) noPatolData.push({ label: 'Pérdida de Peso', value: answers.perdidaPeso });
    if (answers.toxicomanias) noPatolData.push({ label: 'Toxicomanías', value: answers.toxicomanias });
    if (answers.habitosSueno) noPatolData.push({ label: 'Hábitos de Sueño', value: answers.habitosSueno });
    if (answers.sintomasEmocionales) noPatolData.push({ label: 'Síntomas Emocionales', value: answers.sintomasEmocionales });
    if (answers.gastoMedicoMayores) noPatolData.push({ label: 'Gastos Médicos Mayores', value: answers.gastoMedicoMayores });
    if (noPatolData.length > 0) {
      agregarSeccion('Antecedentes No Patológicos', noPatolData);
    }
  } else {
    // Normal consultations
    if (answers.alimentacionCantidadCalidad || answers.planNutricional || answers.hidratacionCantidad ||
      answers.toxicomanias || answers.habitosSuenoHoras || answers.actividadFisicaFrecuencia || answers.sintomasEmocionales) {
      const noPatolData = [];
      if (answers.alimentacionCantidadCalidad) noPatolData.push({ label: 'Alimentación', value: answers.alimentacionCantidadCalidad });
      if (answers.planNutricional) noPatolData.push({ label: 'Plan Nutricional', value: answers.planNutricional });
      if (answers.hidratacionCantidad) noPatolData.push({ label: 'Hidratación', value: answers.hidratacionCantidad });
      if (answers.toxicomanias) noPatolData.push({ label: 'Toxicomanías', value: answers.toxicomanias });
      if (answers.habitosSuenoHoras) noPatolData.push({ label: 'Hábitos de Sueño', value: answers.habitosSuenoHoras });
      if (answers.actividadFisicaFrecuencia) noPatolData.push({ label: 'Actividad Física', value: answers.actividadFisicaFrecuencia });
      if (answers.sintomasEmocionales) noPatolData.push({ label: 'Síntomas Emocionales', value: answers.sintomasEmocionales });
      if (noPatolData.length > 0) {
        agregarSeccion('Antecedentes No Patológicos', noPatolData);
      }
    }
  }

  // Antecedentes Gineco-Obstétricos
  if (answers.antecedentesGinecoObstetricos && Object.values(answers.antecedentesGinecoObstetricos).some(v => v)) {
    const go = answers.antecedentesGinecoObstetricos;
    const goData = [];
    if (go.gestacion) goData.push({ label: 'Gestación', value: go.gestacion });
    if (go.cesarea) goData.push({ label: 'Cesárea', value: go.cesarea });
    if (go.abortos) goData.push({ label: 'Abortos', value: go.abortos });
    if (go.periodo) goData.push({ label: 'Período', value: go.periodo });
    if (go.ciclo) goData.push({ label: 'Ciclo', value: go.ciclo });
    if (go.tratamientoHormonal) goData.push({ label: 'Tratamiento Hormonal', value: go.tratamientoHormonal });
    if (goData.length > 0) {
      agregarSeccion('Antecedentes Gineco-Obstétricos', goData);
    }
  }

  // Traumatismos
  if (answers.traumatismos && answers.traumatismos.length > 0 && answers.traumatismos.some(t => t.tipo)) {
    const tableData = answers.traumatismos
      .filter(t => t.tipo)
      .map(t => [
        t.tipo || '-',
        t.fechaEvolucion || '-',
        t.tratamientoComplicaciones || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Traumatismos / Accidentes', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Tipo', 'Fecha/Evolución', 'Tratamiento/Complicaciones']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // Cirugías
  if (answers.cirugias && answers.cirugias.length > 0 && answers.cirugias.some(c => c.tratamientoPropuesto)) {
    const tableData = answers.cirugias
      .filter(c => c.tratamientoPropuesto)
      .map(c => [
        c.tratamientoPropuesto || '-',
        c.fechaHospitalizacion || '-',
        c.fechaAlta || '-',
        c.diasAtencion || '-',
        c.txFuturo || '-',
        c.farmacos || '-',
        c.complicaciones || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Cirugías', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Tratamiento', 'F. Hosp.', 'F. Alta', 'Días', 'Tx Futuro', 'Fármacos', 'Complicaciones']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // Estudios de Gabinete
  if (answers.estudiosGabinete && answers.estudiosGabinete.length > 0 && answers.estudiosGabinete.some(e => e.estudio)) {
    const tableData = answers.estudiosGabinete
      .filter(e => e.estudio)
      .map(e => [
        e.estudio || '-',
        e.fecha || '-',
        e.descripcionHallazgos || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Estudios de Gabinete', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Estudio', 'Fecha', 'Descripción/Hallazgos']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 25 },
          2: { cellWidth: 'auto' }
        },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // ===== SIGNOS VITALES =====
  if (tipoConsulta === 'atleta') {
    const svData = [];
    if (answers.frecuenciaCardiacaReposo) svData.push({ label: 'Frecuencia Cardíaca en Reposo', value: `${answers.frecuenciaCardiacaReposo} bpm` });
    if (answers.frecuenciaCardiaca) svData.push({ label: 'Frecuencia Cardíaca', value: `${answers.frecuenciaCardiaca} bpm` });
    if (answers.tensionArterial) svData.push({ label: 'Tensión Arterial', value: answers.tensionArterial });
    if (answers.saturacionOxigeno) svData.push({ label: 'Saturación de Oxígeno (SpO2)', value: `${answers.saturacionOxigeno}%` });
    if (svData.length > 0) {
      agregarSeccion('Signos Vitales', svData);
    }

    // Medidas Antropométricas
    const antropData = [];
    if (answers.objetivoAntropometrico) antropData.push({ label: 'Objetivo Antropométrico', value: answers.objetivoAntropometrico });
    if (answers.altura) antropData.push({ label: 'Altura', value: `${answers.altura} cm` });
    if (answers.peso) antropData.push({ label: 'Peso', value: `${answers.peso} kg` });
    if (answers.imc) antropData.push({ label: 'IMC', value: answers.imc });
    if (answers.grasaCorporal) antropData.push({ label: 'Grasa Corporal', value: `${answers.grasaCorporal}%` });
    if (answers.musculoEsqueletico) antropData.push({ label: 'Músculo Esquelético', value: `${answers.musculoEsqueletico}%` });
    if (answers.metabolismoBasal) antropData.push({ label: 'Metabolismo Basal', value: `${answers.metabolismoBasal} kcal` });
    if (answers.edadCorporal) antropData.push({ label: 'Edad Corporal', value: `${answers.edadCorporal} años` });
    if (answers.grasaVisceral) antropData.push({ label: 'Grasa Visceral', value: answers.grasaVisceral });
    if (answers.comentarioAntropometrico) antropData.push({ label: 'Comentarios', value: answers.comentarioAntropometrico });
    if (antropData.length > 0) {
      agregarSeccion('Medidas Antropométricas', antropData);
    }

    // ===== EXAMINACIÓN NEUROFUNCIONAL (ATLETA) =====
    const neuroTests = [
      // Decúbito Prono
      { key: 'activacionGluteoMayorIsquios', label: 'ACTIVACIÓN DE GLÚTEO MAYOR-ISQUIOS', category: 'DECÚBITO PRONO' },
      { key: 'testRotadoresInternosCadera', label: 'TEST ROTADORES INTERNOS DE CADERA', category: 'DECÚBITO PRONO' },
      { key: 'testRotadoresExternosCadera', label: 'TEST ROTADORES EXTERNOS DE CADERA', category: 'DECÚBITO PRONO' },
      { key: 'testParaGluteoMayor', label: 'TEST PARA GLÚTEO MAYOR', category: 'DECÚBITO PRONO' },
      { key: 'testSerratosAnteriores', label: 'TEST SERRATOS ANTERIORES', category: 'DECÚBITO PRONO' },
      { key: 'testCoreFrontalEstatico', label: 'TEST CORE FRONTAL ESTÁTICO', category: 'DECÚBITO PRONO' },
      { key: 'testCoreFrontalDinamico', label: 'TEST CORE FRONTAL DINÁMICO', category: 'DECÚBITO PRONO' },
      { key: 'testCoreLateral', label: 'TEST CORE LATERAL', category: 'DECÚBITO PRONO' },
      // Decúbito Supino
      { key: 'pinzamientoFemoroacetabular', label: 'PINZAMIENTO FEMOROACETABULAR', category: 'DECÚBITO SUPINO' },
      { key: 'testDeFaber', label: 'TEST DE FABER', category: 'DECÚBITO SUPINO' },
      { key: 'activacionAbdominalesPsoas', label: 'ACTIVACIÓN ABDOMINALES-PSOAS', category: 'DECÚBITO SUPINO' },
      { key: 'activacionGluteoMayorPuente', label: 'ACTIVACIÓN GLÚTEO MAYOR (PUENTE)', category: 'DECÚBITO SUPINO' },
      { key: 'testRotadoresColumnaLumbar', label: 'TEST ROTADORES COLUMNA LUMBAR', category: 'DECÚBITO SUPINO' },
      { key: 'testIsquiosurales', label: 'TEST ISQUIOSURALES', category: 'DECÚBITO SUPINO' },
      { key: 'testThomasPsoas', label: 'TEST THOMAS (PSOAS)', category: 'DECÚBITO SUPINO' },
      { key: 'testThomasTensor', label: 'TEST THOMAS (TENSOR)', category: 'DECÚBITO SUPINO' },
      { key: 'testFlexoresDorsalesTobillo', label: 'TEST FLEXORES DORSALES TOBILLO', category: 'DECÚBITO SUPINO' },
      { key: 'testFlexoresPlantaresTobillo', label: 'TEST FLEXORES PLANTARES TOBILLO', category: 'DECÚBITO SUPINO' },
      { key: 'testParaAductoresSupino', label: 'TEST PARA ADUCTORES (SUPINO)', category: 'DECÚBITO SUPINO' },
      { key: 'testParaAductoresAisladoNeurofuncional', label: 'TEST PARA ADUCTORES AISLADO', category: 'DECÚBITO SUPINO' },
      // Sedestación
      { key: 'testActivacionEscapular', label: 'TEST ACTIVACIÓN ESCAPULAR', category: 'SEDESTACIÓN' },
      { key: 'testRotadoresTronco', label: 'TEST ROTADORES DE TRONCO', category: 'SEDESTACIÓN' },
      { key: 'testParaAductoresSedestacion', label: 'TEST PARA ADUCTORES (SEDESTACIÓN)', category: 'SEDESTACIÓN' },
      // Bipedestación
      { key: 'pinzamientoHombro', label: 'PINZAMIENTO DE HOMBRO', category: 'BIPEDESTACIÓN' },
      { key: 'testDorsiflexionTobillo', label: 'TEST DORSIFLEXIÓN DE TOBILLO', category: 'BIPEDESTACIÓN' }
    ];
    
    let currentCategory = '';
    
    neuroTests.forEach(({ key, label, category }) => {
      const testData = answers[key];
      if (!testData) return;
      
      // Check if test has any data - improved logic
      const hasFieldData = ['normal', 'pinzamiento', 'activacion', 'acortamiento', 'debilidad'].some(field => {
        return testData[field]?.derecho || testData[field]?.izquierdo;
      });
      
      const hasComments = testData.comentarios || testData.comentariosDerecho || testData.comentariosIzquierdo;
      
      if (!hasFieldData && !hasComments) return;
      
      // Add category header if changed
      if (category !== currentCategory) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add extra space before new category if not the first one
        if (currentCategory !== '') {
          yPosition += 8;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212);
        doc.text(`Examinación Neurofuncional - ${category}`, 14, yPosition);
        
        // Add decorative line under title
        doc.setDrawColor(6, 182, 212);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition + 2, pageWidth - 14, yPosition + 2);
        
        yPosition += 15;  // More space after title
        currentCategory = category;
      }
      
      // Build table row
      const row = [label];
      ['normal', 'pinzamiento', 'activacion', 'acortamiento', 'debilidad'].forEach(field => {
        const fieldData = testData[field];
        let cellText = '';
        if (fieldData?.derecho && fieldData?.izquierdo) cellText = 'DER/IZQ';
        else if (fieldData?.derecho) cellText = 'DER';
        else if (fieldData?.izquierdo) cellText = 'IZQ';
        row.push(cellText);
      });
      
      // Improved comments handling
      let comments = [];
      if (testData.comentarios) comments.push(testData.comentarios);
      if (testData.comentariosDerecho) comments.push(`Der: ${testData.comentariosDerecho}`);
      if (testData.comentariosIzquierdo) comments.push(`Izq: ${testData.comentariosIzquierdo}`);
      
      row.push(comments.length > 0 ? comments.join(' | ') : '-');
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Test', 'Normal', 'Pinz.', 'Activ.', 'Acort.', 'Debil.', 'Comentarios']],
        body: [row],
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 'auto' }
        },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 5;  // More space between tests
    });
  } else {
    // Normal consultations
    if (answers.signosVitales && Object.values(answers.signosVitales).some(v => v)) {
      const sv = answers.signosVitales;
      const svData = [];
      if (sv.frecuenciaCardiaca) svData.push({ label: 'Frecuencia Cardíaca', value: sv.frecuenciaCardiaca });
      if (sv.frecuenciaRespiratoria) svData.push({ label: 'Frecuencia Respiratoria', value: sv.frecuenciaRespiratoria });
      if (sv.tensionArterial) svData.push({ label: 'Tensión Arterial', value: sv.tensionArterial });
      if (sv.spo2) svData.push({ label: 'SpO2', value: sv.spo2 });
      if (sv.peso) svData.push({ label: 'Peso', value: sv.peso });
      if (sv.estatura) svData.push({ label: 'Estatura', value: sv.estatura });
      if (svData.length > 0) {
        agregarSeccion('Signos Vitales', svData);
      }
    }
  }

  // ===== ESCALAS DE DOLOR =====
  if (answers.escalasDolor && answers.escalasDolor.length > 0 && answers.escalasDolor.some(e => e.segmento)) {
    agregarSeccion('Escalas de Dolor', []);
    answers.escalasDolor.filter(e => e.segmento).forEach((escala, index) => {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text(`Segmento: ${escala.segmento}`, 14, yPosition);
      yPosition += 8;

      doc.setTextColor(0, 0, 0);

      const dolorData = [];
      if (escala.antiguedad?.derecha || escala.antiguedad?.izquierda) {
        dolorData.push(['Antigüedad', escala.antiguedad.derecha || '-', escala.antiguedad.izquierda || '-']);
      }
      if (escala.localizacion?.derecha || escala.localizacion?.izquierda) {
        dolorData.push(['Localización', escala.localizacion.derecha || '-', escala.localizacion.izquierda || '-']);
      }
      if (escala.intensidad?.derecha || escala.intensidad?.izquierda) {
        dolorData.push(['Intensidad', escala.intensidad.derecha || '-', escala.intensidad.izquierda || '-']);
      }
      if (escala.caracter?.derecha || escala.caracter?.izquierda) {
        dolorData.push(['Carácter', escala.caracter.derecha || '-', escala.caracter.izquierda || '-']);
      }
      if (escala.irradiacion?.derecha || escala.irradiacion?.izquierda) {
        dolorData.push(['Irradiación', escala.irradiacion.derecha || '-', escala.irradiacion.izquierda || '-']);
      }
      if (escala.atenuacion?.derecha || escala.atenuacion?.izquierda) {
        dolorData.push(['Atenuación', escala.atenuacion.derecha || '-', escala.atenuacion.izquierda || '-']);
      }
      if (escala.agravacion?.derecha || escala.agravacion?.izquierda) {
        dolorData.push(['Agravación', escala.agravacion.derecha || '-', escala.agravacion.izquierda || '-']);
      }

      if (dolorData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Aspecto', 'Derecha', 'Izquierda']],
          body: dolorData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' }
          },
          headStyles: { fillColor: [6, 182, 212], textColor: 255 },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }
    });
  }

  // ===== INSPECCIÓN Y PALPACIÓN =====
  if (answers.inspecciones && answers.inspecciones.length > 0 && answers.inspecciones.some(i => i.segmento)) {
    const tableData = answers.inspecciones
      .filter(i => i.segmento)
      .map(i => [
        i.segmento || '-',
        i.piel?.derecho || '-',
        i.piel?.izquierdo || '-',
        i.cicatriz?.derecho || '-',
        i.cicatriz?.izquierdo || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Inspección', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Segmento', 'Piel D', 'Piel I', 'Cicatriz D', 'Cicatriz I']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  if (answers.palpaciones && answers.palpaciones.length > 0 && answers.palpaciones.some(p => p.segmento)) {
    const tableData = answers.palpaciones
      .filter(p => p.segmento)
      .map(p => [
        p.segmento || '-',
        p.piel?.derecho || '-',
        p.piel?.izquierdo || '-',
        p.tejidoBlando?.derecho || '-',
        p.tejidoBlando?.izquierdo || '-'
      ]);

    if (tableData.length > 0) {
      agregarSeccion('Palpación', []);
      autoTable(doc, {
        startY: yPosition,
        head: [['Segmento', 'Piel D', 'Piel I', 'Tejido Blando D', 'Tejido Blando I']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // ===== PRUEBAS ESPECÍFICAS =====
  if (answers.pruebasEspecificas) {
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text('Pruebas Específicas', 14, yPosition);
    yPosition += 2;

    // Línea decorativa
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Dividir el texto en líneas y procesarlas
    const lineas = answers.pruebasEspecificas.split('\n').filter(l => l.trim());

    for (const linea of lineas) {
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      const lineaTrimmed = linea.trim();
      if (lineaTrimmed) {
        // Agregar viñeta si la línea no está vacía
        doc.setFont('helvetica', 'normal');
        doc.text('•', 16, yPosition);

        // Dividir la línea si es muy larga
        const textoFormateado = doc.splitTextToSize(lineaTrimmed, pageWidth - 35);
        doc.text(textoFormateado, 22, yPosition);

        yPosition += textoFormateado.length * 5 + 2;
      }
    }

    yPosition += 8;
  }

  // ===== FMS (FUNCTIONAL MOVEMENT SCREEN) =====
  const pruebasFMS = [
    {
      key: 'fmsDeepSquat',
      nombre: 'Deep Squat (Sentadilla profunda)',
      imagen: 'deep-squat.png',
      implicaciones: {
        dorsiflexionTobillos: 'Dorsiflexión cadena cinética cerrada de tobillos',
        flexionRodillasCaderas: 'Flexión de rodillas y caderas',
        extensionColumnaToracica: 'Extensión columna torácica',
        flexionAbduccionHombros: 'Flexión y abducción de hombros',
        activacionMusculaturaCentral: 'Activación musculatura central'
      }
    },
    {
      key: 'fmsHurdleStep',
      nombre: 'Hurdle Step (Paso de obstáculo 36 cm)',
      imagen: 'hurdle-step.png',
      implicaciones: {
        movilFlexionCaderaRodilla: 'Móvil: flexión de cadera y rodilla',
        movilDorsiflexionTobillo: 'Móvil: dorsiflexión CCA de tobillo',
        fijaEstabilidadPieRodillaLumbar: 'Fija: estabilidad pie, rodilla y columna lumbar',
        fijaExtensionCadera: 'Fija: máxima extensión de la CCC de cadera',
        coordinacionEquilibrio: 'Coordinación y Equilibrio'
      }
    },
    {
      key: 'fmsInlineLunge',
      nombre: 'In-line lunge (Estocada lineal)',
      imagen: 'in-line-lunge.png',
      implicaciones: {
        piernaDelanteraMovilidadCadera: 'Pierna delantera: movilidad de cadera (abd en CCC) y dorsiflexión de tobillo',
        piernaDelanteraEstabilidadRodillaPie: 'Pierna delantera: estabilidad de rodilla y pie',
        piernaTraseraMovilidadCadera: 'Pierna trasera: movilidad de cadera',
        flexibilidadRectoFemoral: 'Flexibilidad: recto femoral',
        equilibrioTronco: 'Equilibrio: tronco'
      }
    },
    {
      key: 'fmsShoulderMobility',
      nombre: 'Shoulder Mobility (Movilidad de hombro)',
      imagen: 'shoulder-mobility.png',
      implicaciones: {
        brazoFlexionAddRE: 'Brazo: flexión, add, RE',
        brazoExtensionAbdRI: 'Brazo: extensión, abd, RI',
        estabilidadEscapular: 'Estabilidad: escapular',
        extensionToracica: 'Extensión torácica',
        coordinacion: 'Coordinación'
      }
    },
    {
      key: 'fmsActiveStraightLegRaise',
      nombre: 'Active Straight-Leg Raise',
      imagen: 'active-straight.png',
      implicaciones: {
        piernaEvaluarFlexibilidad: 'Pierna a evaluar: flexibilidad',
        piernaEvaluarActivacion: 'Pierna a evaluar: activación',
        piernaFijaExtension: 'Pierna fija: extensión',
        estabilidadLumboSacra: 'Estabilidad lumbo-sacra'
      }
    },
    {
      key: 'fmsTrunkStabilityPushup',
      nombre: 'Trunk Stability Push-up',
      imagen: 'trunk-stability.png',
      implicaciones: {
        estabilidadSimetricaTronco: 'Estabilidad simétrica del tronco',
        movimientoSimetricoExtremidades: 'Movimiento simétrico de las extremidades'
      }
    },
    {
      key: 'fmsRotaryStability',
      nombre: 'Rotary Stability',
      imagen: 'rotary-stability.png',
      implicaciones: {
        estabilidadAsimetricaTronco: 'Estabilidad asimétrica del tronco',
        movilidadAsimetricaExtremidades: 'Movilidad asimétrica de las extremidades'
      }
    }
  ];

  let tieneDatosFMS = false;
  for (const prueba of pruebasFMS) {
    if (answers[prueba.key] && (answers[prueba.key].puntuacionFinal || answers[prueba.key].puntuacionBruta ||
      Object.values(answers[prueba.key]).some(v => v && v.comentariosDerecho || v && v.comentariosIzquierdo || v && v.comentarios))) {
      tieneDatosFMS = true;
      break;
    }
  }

  if (tieneDatosFMS) {
    // Salto de página para comenzar FMS en página limpia
    doc.addPage();
    yPosition = 20;

    agregarSeccion('FMS - Functional Movement Screen', []);

    if (answers.fmsSuperiorDominante || answers.fmsInferiorDominante) {
      const dominanciaData = [];
      if (answers.fmsSuperiorDominante) dominanciaData.push(['Superior Dominante', answers.fmsSuperiorDominante]);
      if (answers.fmsInferiorDominante) dominanciaData.push(['Inferior Dominante', answers.fmsInferiorDominante]);

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: dominanciaData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60, fillColor: [243, 244, 246] },
          1: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    for (const prueba of pruebasFMS) {
      const datosPrueba = answers[prueba.key];
      if (!datosPrueba) continue;

      // Solo renderizar si tiene puntuación final
      if (!datosPrueba.puntuacionFinal) continue;

      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 120) {
        doc.addPage();
        yPosition = 20;
      }

      // Título de la prueba
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text(prueba.nombre, 14, yPosition);
      yPosition += 7;

      // Tabla con imagen y datos
      const implicacionesData = [];
      if (prueba.implicaciones) {
        Object.entries(prueba.implicaciones).forEach(([key, label]) => {
          const valorCampo = datosPrueba[key];
          let comentD = '-';
          let comentI = '-';

          if (valorCampo && typeof valorCampo === 'object') {
            comentD = valorCampo.comentariosDerecho || valorCampo.comentarios || '-';
            comentI = valorCampo.comentariosIzquierdo || valorCampo.comentarios || '-';
          }

          implicacionesData.push([label, comentD, comentI]);
        });
      }

      if (implicacionesData.length > 0) {
        const startY = yPosition;
        let imgCellX = 0;
        let imgCellY = 0;
        let imgCellWidth = 0;
        let imgCellHeight = 0;

        autoTable(doc, {
          startY: startY,
          head: [['Test', 'Implicaciones Clínicas', 'Comentarios Derecho', 'Comentarios Izquierdo']],
          body: implicacionesData.map((row, index) => ['', ...row]),
          theme: 'grid',
          styles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            overflow: 'linebreak',
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 22, halign: 'center', valign: 'middle', fillColor: [250, 250, 250] },
            1: { cellWidth: 58, fontStyle: 'bold', fillColor: [240, 240, 240] },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' }
          },
          headStyles: {
            fillColor: [6, 182, 212],
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
          },
          didDrawCell: (data) => {
            // Guardar coordenadas de la primera celda de la columna de imagen
            if (data.column.index === 0 && data.row.index === 0) {
              imgCellX = data.cell.x;
              imgCellY = data.cell.y;
              imgCellWidth = data.cell.width;
            }
            // Calcular altura total en la última fila
            if (data.column.index === 0 && data.row.index === implicacionesData.length - 1) {
              imgCellHeight = (data.cell.y + data.cell.height) - imgCellY;
            }
          },
          margin: { left: 14, right: 14 }
        });

        // Agregar imagen centrada en la columna
        if (imagenesCache[prueba.imagen] && imgCellHeight > 0) {
          try {
            const imgSize = Math.min(imgCellWidth - 4, imgCellHeight - 4, 20);
            const imgX = imgCellX + (imgCellWidth / 2) - (imgSize / 2);
            const imgY = imgCellY + (imgCellHeight / 2) - (imgSize / 2);
            doc.addImage(imagenesCache[prueba.imagen], 'PNG', imgX, imgY, imgSize, imgSize);
          } catch (error) {
            console.log('Error al agregar imagen:', error);
          }
        }

        yPosition = doc.lastAutoTable.finalY + 5;
      }

      // Puntuaciones en tabla
      const puntuacionData = [];
      if (datosPrueba.tipoPuntuacionBruta) {
        puntuacionData.push(['Tipo Puntuación', datosPrueba.tipoPuntuacionBruta.toUpperCase()]);
      }
      if (datosPrueba.puntuacionBruta) {
        puntuacionData.push(['Puntuación Bruta', datosPrueba.puntuacionBruta]);
      }
      if (datosPrueba.puntuacionBrutaDerecha) {
        puntuacionData.push(['Punt. Bruta Derecha', datosPrueba.puntuacionBrutaDerecha]);
      }
      if (datosPrueba.puntuacionBrutaIzquierda) {
        puntuacionData.push(['Punt. Bruta Izquierda', datosPrueba.puntuacionBrutaIzquierda]);
      }
      if (datosPrueba.estadoCompensacion) {
        puntuacionData.push(['Estado Compensación', datosPrueba.estadoCompensacion]);
      }
      if (datosPrueba.estadoCompensacionDerecha) {
        puntuacionData.push(['Estado Comp. Derecha', datosPrueba.estadoCompensacionDerecha]);
      }
      if (datosPrueba.estadoCompensacionIzquierda) {
        puntuacionData.push(['Estado Comp. Izquierda', datosPrueba.estadoCompensacionIzquierda]);
      }
      if (datosPrueba.puntuacionFinal) {
        puntuacionData.push(['PUNTUACIÓN FINAL', datosPrueba.puntuacionFinal]);
      }

      if (puntuacionData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [],
          body: puntuacionData,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2.5 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60, fillColor: [243, 244, 246] },
            1: { cellWidth: 'auto', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      } else {
        yPosition += 5;
      }
    }

    // Tests de clearing
    const testsClearingData = [];
    if (answers.fmsImpingementClearingTest && (answers.fmsImpingementClearingTest.resultado ||
      answers.fmsImpingementClearingTest.comentariosDerecho || answers.fmsImpingementClearingTest.comentariosIzquierdo)) {
      testsClearingData.push([
        'Impingement Clearing Test',
        answers.fmsImpingementClearingTest.comentariosDerecho || '-',
        answers.fmsImpingementClearingTest.comentariosIzquierdo || '-',
        answers.fmsImpingementClearingTest.resultado || '-'
      ]);
    }
    if (answers.fmsPressUpClearingTest && (answers.fmsPressUpClearingTest.resultado ||
      answers.fmsPressUpClearingTest.comentariosDerecho || answers.fmsPressUpClearingTest.comentariosIzquierdo)) {
      testsClearingData.push([
        'Press Up Clearing Test',
        answers.fmsPressUpClearingTest.comentariosDerecho || '-',
        answers.fmsPressUpClearingTest.comentariosIzquierdo || '-',
        answers.fmsPressUpClearingTest.resultado || '-'
      ]);
    }
    if (answers.fmsPosteriorRockingTest && (answers.fmsPosteriorRockingTest.resultado ||
      answers.fmsPosteriorRockingTest.comentariosDerecho || answers.fmsPosteriorRockingTest.comentariosIzquierdo)) {
      testsClearingData.push([
        'Posterior Rocking Test',
        answers.fmsPosteriorRockingTest.comentariosDerecho || '-',
        answers.fmsPosteriorRockingTest.comentariosIzquierdo || '-',
        answers.fmsPosteriorRockingTest.resultado || '-'
      ]);
    }

    if (testsClearingData.length > 0) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text('Tests de Clearing', 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [['Test', 'Comentarios Derecho', 'Comentarios Izquierdo', 'Resultado']],
        body: testsClearingData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 }
        },
        headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // ===== DIAGNÓSTICO Y PLAN DE TRATAMIENTO =====
  if (answers.motivoConsulta || answers.objetivoPaciente || answers.diagnosticoFisioterapeutico ||
    answers.pronosticoFisioterapeutico || answers.intervencionFisioterapeutica ||
    answers.controlSesiones || answers.frecuenciaTratamiento) {

    agregarSeccion('Diagnóstico y Plan de Tratamiento', []);

    const diagnosticoData = [];
    if (answers.motivoConsulta) diagnosticoData.push({ label: 'Motivo de Consulta', value: answers.motivoConsulta });
    if (answers.objetivoPaciente) diagnosticoData.push({ label: 'Objetivo del Paciente', value: answers.objetivoPaciente });
    if (answers.diagnosticoFisioterapeutico) diagnosticoData.push({ label: 'Diagnóstico Fisioterapéutico', value: answers.diagnosticoFisioterapeutico });
    if (answers.pronosticoFisioterapeutico) diagnosticoData.push({ label: 'Pronóstico Fisioterapéutico', value: answers.pronosticoFisioterapeutico });
    if (answers.intervencionFisioterapeutica) diagnosticoData.push({ label: 'Intervención Fisioterapéutica', value: answers.intervencionFisioterapeutica });
    if (answers.controlSesiones) diagnosticoData.push({ label: 'Control de Sesiones', value: answers.controlSesiones });
    if (answers.frecuenciaTratamiento) diagnosticoData.push({ label: 'Frecuencia de Tratamiento', value: answers.frecuenciaTratamiento });

    if (diagnosticoData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: diagnosticoData.map(d => [d.label, d.value]),
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 65, fillColor: [243, 244, 246] },
          1: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // Actividad Deportiva (solo para consultas deportivas)
  if (tipoConsulta === 'atleta') {
    if (answers.actividadDeportiva) {
      const dep = answers.actividadDeportiva;
      const depData = [];
      if (dep.deporte) depData.push({ label: 'Deporte', value: formatCheckboxObject(dep.deporte) });
      if (dep.otroDeporte) depData.push({ label: 'Otro Deporte', value: dep.otroDeporte });
      if (dep.nivel) depData.push({ label: 'Nivel', value: dep.nivel });
      if (dep.frecuenciaSemanal) depData.push({ label: 'Frecuencia Semanal', value: dep.frecuenciaSemanal });
      if (dep.añosExperiencia) depData.push({ label: 'Años de Experiencia', value: dep.añosExperiencia });

      if (depData.length > 0) {
        agregarSeccion('Actividad Deportiva', depData);
      }
    }

    // Historia de Lesiones
    if (answers.historiaLesiones) {
      agregarSeccion('Historia de Lesiones', answers.historiaLesiones);
    }

    // Evaluación Funcional
    if (answers.evaluacionFuncional) {
      const evFunc = answers.evaluacionFuncional;
      const evData = [];
      if (evFunc.movimientosDolor) evData.push({ label: 'Movimientos con Dolor', value: evFunc.movimientosDolor });
      if (evFunc.limitacionesMovimiento) evData.push({ label: 'Limitaciones de Movimiento', value: evFunc.limitacionesMovimiento });
      if (evFunc.patrones) evData.push({ label: 'Patrones de Movimiento', value: evFunc.patrones });

      if (evData.length > 0) {
        agregarSeccion('Evaluación Funcional', evData);
      }
    }
  }

  // ===== HRR - HEART RATE RECOVERY (ATLETA) =====
  if (tipoConsulta === 'atleta' && (answers.hrrFases || answers.hrrFcInicial || answers.hrrHrr)) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text('HRR - Heart Rate Recovery', 14, yPosition);
    yPosition += 5;
    
    // Objective
    if (answers.hrrObjetivo) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text(`Objetivo: ${answers.hrrObjetivo}`, 14, yPosition);
      yPosition += 8;
    }
    
    // Phases table
    if (answers.hrrFases && answers.hrrFases.length > 0) {
      const tableData = answers.hrrFases.map(fase => [
        fase.fase || '-',
        fase.minutos || '-',
        fase.zonaIntensidad || '-',
        fase.frecuenciaCardiaca || '-',
        fase.rpe || '-'
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['FASE', 'MINUTOS', 'ZONA DE INTENSIDAD', 'FRECUENCIA CARDIACA', 'RPE']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' }
        },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
    
    // Recovery data
    if (answers.hrrFcInicial || answers.hrrHrr || answers.hrrClasificacion) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Recuperación', 14, yPosition);
      yPosition += 8;
      
      const recoveryData = [];
      if (answers.hrrFcInicial) recoveryData.push({ label: 'FC INICIAL', value: answers.hrrFcInicial });
      if (answers.hrrHrr) recoveryData.push({ label: 'HRR', value: answers.hrrHrr });
      if (answers.hrrClasificacion) recoveryData.push({ label: 'CLASIFICACIÓN', value: answers.hrrClasificacion });
      
      if (recoveryData.length > 0) {
        const tableData = recoveryData.map(item => [item.label, item.value]);
        
        autoTable(doc, {
          startY: yPosition,
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 60 },
            1: { cellWidth: 'auto' }
          },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }
    }
  }

  // ===== INFORME FISIOTERAPÉUTICO (ATLETA) =====
  console.log('Checking Informe Fisioterapéutico:', { tipoConsulta, hasInforme: !!answers.informeFisioterapeutico, informe: answers.informeFisioterapeutico });
  if (tipoConsulta === 'atleta' && answers.informeFisioterapeutico) {
    // Check if we need a new page for the report
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text('Informe Fisioterapéutico', 14, yPosition);
    yPosition += 2;

    // Línea decorativa
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Split the text into paragraphs and render
    const paragraphs = answers.informeFisioterapeutico.split('\n').filter(p => p.trim());

    for (const paragraph of paragraphs) {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const lines = doc.splitTextToSize(paragraph.trim(), pageWidth - 28);
      doc.text(lines, 14, yPosition);
      yPosition += lines.length * 5 + 5; // Add spacing between paragraphs
    }
  }

  // Footer en cada página
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Página ${i} de ${totalPages} | Generado el ${new Date().toLocaleDateString('es-MX')} | Elíseos Box & Fitness`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
};

// Función para descargar el PDF
export const descargarPDF = async (consulta, cliente, tipoConsulta = 'normal') => {
  const doc = await generarPDFConsulta(consulta, cliente, tipoConsulta);
  const pdfBlob = doc.output('blob');
  const nombreArchivo = `Historia_Clinica_${cliente.nombre}_${cliente.apellidoPaterno || ''}_${cliente.apellidoMaterno || ''}_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.pdf`.replace(/\s+/g, '_');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pdfBlob);
  link.download = nombreArchivo;
  link.click();
};

// Función para abrir el PDF en una nueva ventana
export const visualizarPDF = async (consulta, cliente, tipoConsulta = 'normal') => {
  const doc = await generarPDFConsulta(consulta, cliente, tipoConsulta);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const ventana = window.open(pdfUrl, '_blank');

  // Limpiar el objeto URL después de que se cargue
  if (ventana) {
    ventana.onload = () => {
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    };
  }
};

// ===== FUNCIONES PARA NOTAS CLÍNICAS =====

/**
 * Formatea una fecha para mostrar en el PDF de notas clínicas
 */
const formatNotaDate = (fecha) => {
  if (!fecha) return 'Fecha no disponible';

  try {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha no disponible';
  }
};

/**
 * Formatea la hora para mostrar en el PDF de notas clínicas
 */
const formatNotaTime = (nota) => {
  if (nota.hora) {
    return nota.hora;
  }

  if (!nota.fecha) return null;

  try {
    const date = nota.fecha instanceof Date ? nota.fecha : new Date(nota.fecha);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return null;
  }
};

/**
 * Agrega el header del PDF de notas clínicas con branding
 */
const addNotasHeader = (doc, userData, pageNumber = 1) => {
  const pageWidth = doc.internal.pageSize.width;

  // Título principal
  doc.setFontSize(20);
  doc.setTextColor(6, 182, 212); // cyan-600
  doc.setFont('helvetica', 'bold');
  doc.text('Elíseos Box & Fitness', pageWidth / 2, 20, { align: 'center' });

  // Subtítulo
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // gray-500
  doc.setFont('helvetica', 'normal');
  doc.text('Notas Clínicas', pageWidth / 2, 28, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.5);
  doc.line(20, 32, pageWidth - 20, 32);

  // Información del paciente
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // gray-600
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', 20, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(userData.name, 45, 40);

  if (userData.ocupacion && userData.ocupacion !== 'Sin especificar') {
    doc.setFont('helvetica', 'bold');
    doc.text('Ocupación:', 20, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.ocupacion, 45, 46);
  }

  return 52; // Retorna la posición Y donde termina el header
};

/**
 * Agrega el footer del PDF de notas clínicas
 */
const addNotasFooter = (doc, pageNumber, totalPages) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // gray-400
  doc.setFont('helvetica', 'normal');

  // Fecha de generación
  const now = new Date();
  const generatedDate = now.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${generatedDate}`, 20, pageHeight - 10);

  // Número de página
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
};

/**
 * Agrega una nota al PDF
 */
const addNotaContentToPDF = (doc, nota, startY) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let currentY = startY;

  // Verificar si necesitamos una nueva página
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // Fecha y hora de la nota
  doc.setFontSize(11);
  doc.setTextColor(6, 182, 212); // cyan-600
  doc.setFont('helvetica', 'bold');
  const fechaTexto = formatNotaDate(nota.fecha);
  const horaTexto = formatNotaTime(nota);
  const fechaHora = horaTexto ? `${fechaTexto} - ${horaTexto}` : fechaTexto;
  doc.text(fechaHora, margin, currentY);
  currentY += 6;

  // Número de sesión si existe
  if (nota.numeroSesion) {
    doc.setFontSize(9);
    doc.setTextColor(8, 145, 178); // cyan-700
    doc.text(`Sesión #${nota.numeroSesion}`, margin, currentY);
    currentY += 6;
  }

  currentY += 2;

  // Función auxiliar para agregar secciones
  const addSection = (title, content) => {
    if (!content || !content.trim()) return currentY;

    // Verificar espacio disponible
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    // Título de la sección
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // gray-600
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin, currentY);
    currentY += 6;

    // Contenido de la sección
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // gray-700
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(content, maxWidth);

    for (let i = 0; i < lines.length; i++) {
      // Verificar si necesitamos nueva página
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(lines[i], margin, currentY);
      currentY += 5;
    }

    currentY += 3;
    return currentY;
  };

  // Agregar secciones SOAP
  currentY = addSection('Subjetivo', nota.subjetivo);
  currentY = addSection('Objetivo', nota.objetivo);
  currentY = addSection('Evaluación', nota.evaluacion);
  currentY = addSection('Plan Terapéutico', nota.planTerapeutico);

  // Línea separadora entre notas
  currentY += 3;
  if (currentY < pageHeight - 20) {
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

  return currentY;
};

/**
 * Genera un PDF con una sola nota clínica
 */
export const generateNotaPDF = (nota, userData) => {
  const doc = new jsPDF();

  // Agregar header
  let currentY = addNotasHeader(doc, userData);
  currentY += 8;

  // Agregar la nota
  addNotaContentToPDF(doc, nota, currentY);

  // Agregar footer
  addNotasFooter(doc, 1, 1);

  // Generar nombre del archivo
  const fechaFormateada = formatNotaDate(nota.fecha).replace(/ /g, '-');
  const nombreArchivo = `nota-clinica-${userData.name.replace(/ /g, '-')}-${fechaFormateada}.pdf`;

  // Descargar el PDF
  doc.save(nombreArchivo);
};

/**
 * Genera un PDF con múltiples notas clínicas
 */
export const generateMultipleNotasPDF = (notas, userData) => {
  if (!notas || notas.length === 0) {
    console.error('No hay notas para generar el PDF');
    return;
  }

  const doc = new jsPDF();
  let pageNumber = 1;

  // Agregar header
  let currentY = addNotasHeader(doc, userData, pageNumber);
  currentY += 8;

  // Título de sección
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105); // gray-600
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de notas: ${notas.length}`, 20, currentY);
  currentY += 10;

  // Ordenar notas por fecha (más reciente primero)
  const notasOrdenadas = [...notas].sort((a, b) => {
    const fechaA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
    const fechaB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
    return fechaB - fechaA;
  });

  // Agregar cada nota
  notasOrdenadas.forEach((nota, index) => {
    currentY = addNotaContentToPDF(doc, nota, currentY);

    // Si no es la última nota y estamos cerca del final de la página, agregar nueva página
    if (index < notasOrdenadas.length - 1 && currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      pageNumber++;
      currentY = 20;
    }
  });

  // Agregar footers a todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addNotasFooter(doc, i, totalPages);
  }

  // Generar nombre del archivo
  const fechaActual = new Date().toISOString().split('T')[0];
  const nombreArchivo = `notas-clinicas-${userData.name.replace(/ /g, '-')}-${fechaActual}.pdf`;

  // Descargar el PDF
  doc.save(nombreArchivo);
};

/**
 * Genera un PDF de Consulta Rápida (Historia Clínica)
 */
export const generateConsultaRapidaPDF = (consultaData, clienteData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Header con logo y título
  doc.setFillColor(6, 182, 212); // Cyan-600
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CLÍNICA DE FISIOTERAPIA Y REHABILITACIÓN', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(0, 255, 255);
  doc.text('ELÍSEOS BOX & FITNESS', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('LFT. DIANA LAURA LÓPEZ SALDAÑA', pageWidth / 2, 28, { align: 'center' });
  doc.text('Cédula profesional: 13183162', pageWidth - 14, 32, { align: 'right' });

  yPosition = 45;

  // Título: HISTORIA CLÍNICA
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('HISTORIA CLÍNICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Fecha de evaluación y No. expediente
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de evaluación: ${consultaData.fechaEvaluacion || ''}`, 14, yPosition);
  if (consultaData.numeroExpediente) {
    doc.text(`No. expediente: ${consultaData.numeroExpediente}`, pageWidth - 14, yPosition, { align: 'right' });
  }
  yPosition += 8;

  // DATOS PERSONALES
  doc.setFillColor(173, 216, 230); // Light blue
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DATOS PERSONALES', 16, yPosition + 5);
  yPosition += 10;

  // Tabla de datos personales
  const dp = consultaData.datosPersonales || {};
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Nombre', dp.nombre || '', 'Apellido paterno', dp.apellidoPaterno || '', 'Apellido materno', dp.apellidoMaterno || ''],
      ['Edad', dp.edad || '', 'Fecha de nacimiento', dp.fechaNacimiento || '', '', ''],
      ['Género', dp.genero || '', 'Ocupación', dp.ocupacion || '', '', ''],
      ['Lado dominante', dp.ladoDominante || '', 'Contacto', dp.contacto || '', '', ''],
      ['Contacto de emergencia', dp.contactoEmergencia || '', '', '', '', '']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 'auto' },
      5: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // MOTIVO DE CONSULTA
  doc.setFillColor(173, 216, 230);
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('MOTIVO DE CONSULTA', 16, yPosition + 5);
  yPosition += 10;

  const mc = consultaData.motivoConsulta || {};
  const motivosSeleccionados = [];
  if (mc.enfermedad) motivosSeleccionados.push('Enfermedad');
  if (mc.accidente) motivosSeleccionados.push('Accidente');
  if (mc.urgencia) motivosSeleccionados.push('Urgencia');
  if (mc.segundaOpinion) motivosSeleccionados.push('Segunda opinión');

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [[motivosSeleccionados.join(', ') || 'Ninguno seleccionado']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // TIPO DE PADECIMIENTO
  doc.setFillColor(173, 216, 230);
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('TIPO DE PADECIMIENTO', 16, yPosition + 5);
  yPosition += 10;

  const tp = consultaData.tipoPadecimiento || {};
  const tiposSeleccionados = [];
  if (tp.congenito) tiposSeleccionados.push('Congénito');
  if (tp.adquirido) tiposSeleccionados.push('Adquirido');
  if (tp.agudo) tiposSeleccionados.push('Agudo');
  if (tp.cronico) tiposSeleccionados.push('Crónico');

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      [tiposSeleccionados.join(', ') || 'Ninguno seleccionado'],
      ['Fecha de padecimiento', tp.fechaPadecimiento || '', 'Fecha de dx.', tp.fechaDx || '']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      1: { cellWidth: 'auto' },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      3: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // Verificar si necesitamos nueva página
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  // DESCRIPCIÓN
  doc.setFillColor(173, 216, 230);
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción (dolor/limitación/acortamiento/ etc.). Acontecimiento signos/ síntomas', 16, yPosition + 5);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const descripcionLines = doc.splitTextToSize(consultaData.descripcion || 'Sin descripción', pageWidth - 32);
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [[descripcionLines.join('\n')]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // ANTECEDENTES RELACIONADOS
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(173, 216, 230);
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Antecedentes relacionados (fecha de diagnóstico/evolución/ características).', 16, yPosition + 5);
  yPosition += 10;

  const antecedentesLines = doc.splitTextToSize(consultaData.antecedentes || 'Sin antecedentes', pageWidth - 32);
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [[antecedentesLines.join('\n')]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // EXPLORACIÓN FÍSICA
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(173, 216, 230);
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Exploración Física', 16, yPosition + 5);
  yPosition += 10;

  const exploracionLines = doc.splitTextToSize(consultaData.exploracionFisica || 'Sin exploración física', pageWidth - 32);
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [[exploracionLines.join('\n')]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // DIAGNÓSTICO MÉDICO / ESPECIALISTA
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(173, 216, 230);
  doc.rect(14, yPosition, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico médico / especialista', 16, yPosition + 5);
  yPosition += 10;

  const diagnosticoLines = doc.splitTextToSize(consultaData.diagnosticoMedico || 'Sin diagnóstico', pageWidth - 32);
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [[diagnosticoLines.join('\n')]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  // Footer con información de contacto
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');

    const footerY = pageHeight - 10;
    doc.text('Elíseos Box & Fitness', 14, footerY);
    doc.text('@eliseos_box', 60, footerY);
    doc.text('contacto@eliseos.mx', 100, footerY);
    doc.text('Val' + '’' + 'Quirico', pageWidth - 14, footerY, { align: 'right' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  }

  // Generar nombre del archivo
  const nombreCliente = `${dp.nombre || 'Cliente'}-${dp.apellidoPaterno || ''}`.replace(/ /g, '-');
  const fechaFormateada = consultaData.fechaEvaluacion || new Date().toISOString().split('T')[0];
  const nombreArchivo = `consulta-rapida-${nombreCliente}-${fechaFormateada}.pdf`;

  // Descargar el PDF
  doc.save(nombreArchivo);
};

