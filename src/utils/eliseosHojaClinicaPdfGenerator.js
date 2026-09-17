import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TERMINOS_LEGALES } from '../components/notas-clinicas/constants/legalTexts';

const loadImageAsBase64 = async (imagePath) => {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}${imagePath}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load image for PDF:', imagePath, error);
    return null;
  }
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '__________________';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return fechaStr;
  }
};

export const generarHojaClinicaEliseosPDF = async (nota, cliente = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2 - 12; // Dejar 12mm en el margen derecho para la textura de laureles

  // Cargar imágenes institucionales
  const logoBase64 = await loadImageAsBase64('/img/eliseos/LOGO COLOR.png');
  const texturaBase64 = await loadImageAsBase64('/img/eliseos/TEXTURA LAUREL.png');

  // Función para dibujar la textura en el margen derecho
  const drawSideDecoration = (pageDoc) => {
    if (texturaBase64) {
      try {
        const texWidth = 10;
        const texHeight = 35;
        const texX = pageWidth - 12;
        // Repetir la textura verticalmente
        for (let y = 10; y < pageHeight - 20; y += 38) {
          pageDoc.addImage(texturaBase64, 'PNG', texX, y, texWidth, texHeight);
        }
      } catch (err) {
        console.warn('Error adding texture to PDF:', err);
      }
    }
  };

  // ==========================================
  // PÁGINA 1
  // ==========================================
  drawSideDecoration(doc);

  // Logo Eliseos en la esquina superior izquierda
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 12, 36, 18);
    } catch (e) {
      console.warn('Error adding logo:', e);
    }
  }

  // Título: HOJA CLÍNICA SOCIOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('HOJA CLÍNICA SOCIOS', pageWidth / 2, 22, { align: 'center' });

  // Párrafo de apertura y términos con domicilio
  let currentY = 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const paqueteTexto = nota.paquete || '______________________';
  const introTexto = `ELISEOS BOX & FITNESS, con domicilio en Carretera Federal Puebla Atlixco 4707, Jardines de San Carlos, Santa Fe, #72824, San Bernardino, Tlaxcalancingo, Puebla, PLAZA ESTAMBRES, establece estos Términos y Condiciones aplican para contratación PAQUETE: ${paqueteTexto} dentro del establecimiento y deben ser leídos y aceptados por todas las personas que deseen ser parte como socio de ELISEOS BOX & FITNESS.`;

  const introLines = doc.splitTextToSize(introTexto, contentWidth);
  doc.text(introLines, margin, currentY);
  currentY += introLines.length * 4.2 + 4;

  // Fechas: CONTRATACION y PAGO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const fechaContratacionStr = formatFecha(nota.fechaContratacion || nota.fecha);
  const fechaPagoStr = formatFecha(nota.fechaPago);

  doc.text(`FECHA CONTRATACION: ${fechaContratacionStr}`, margin, currentY);
  doc.text(`FECHA PAGO: ${fechaPagoStr}`, margin + 85, currentY);
  currentY += 6;

  // Tabla con estructura exacta del PDF
  const datosSocio = nota.datosSocio || {};
  const nombreSocio = datosSocio.nombreCompleto || nota.nombreCompleto || cliente.name || '';
  const correoSocio = datosSocio.correo || nota.correo || cliente.email || '';
  const fechaNacSocio = datosSocio.fechaNacimiento || nota.fechaNacimiento || cliente.fechaNacimiento || '';
  const celularSocio = datosSocio.celular || nota.celular || cliente.telefono || '';

  const contactoEmergencia = nota.contactoEmergencia || '';
  const telDirEmergencia = nota.telefonoDireccion || '';

  const objetivos = nota.objetivos || {};
  const objetivoAsistir = objetivos.objetivoAsistir || nota.objetivoAsistir || '';
  const equipoCompetencia = objetivos.equipoCompetencia || nota.equipoCompetencia || '';

  const datosClinicos = nota.datosClinicos || {};
  const peso = datosClinicos.peso || nota.peso || '';
  const lesiones = datosClinicos.lesiones || nota.lesiones || '';
  const cardiacos = datosClinicos.problemasCardiacos || nota.problemasCardiacos || '';
  const comoSeEntero = datosClinicos.comoSeEntero || nota.comoSeEntero || '';

  const tableBody = [
    // SECCIÓN 1: DATOS SOCIO
    [{ content: 'DATOS SOCIO', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
    [{ content: 'NOMBRE COMPLETO', styles: { fontStyle: 'bold', cellWidth: 55 } }, nombreSocio],
    [{ content: 'CORREO', styles: { fontStyle: 'bold' } }, correoSocio],
    [{ content: 'FECHA NACIMIENTO', styles: { fontStyle: 'bold' } }, fechaNacSocio],
    [{ content: 'CELULAR', styles: { fontStyle: 'bold' } }, celularSocio],

    // SECCIÓN 2: EN CASO DE EMERGENCIA
    [{ content: 'EN CASO DE EMERGENCIA', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
    [{ content: 'En este apartado favor de colocar algún contacto familiar o amistad cercana', colSpan: 2, styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139], fontSize: 7.5 } }],
    [{ content: 'Contacto en caso emergencia', styles: { fontStyle: 'bold' } }, contactoEmergencia],
    [{ content: 'Teléfono y dirección', styles: { fontStyle: 'bold' } }, telDirEmergencia],

    // SECCIÓN 3: OBJETIVOS
    [{ content: 'OBJETIVOS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
    [{ content: 'Aquí especifica que te gustaría obtener e ELISEOS al entrenar con nosotros', colSpan: 2, styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139], fontSize: 7.5 } }],
    [{ content: '¿Cuál es tu objetivo de asistir?', styles: { fontStyle: 'bold' } }, objetivoAsistir],
    [{ content: '¿Te gustaría formar parte del equipo de competencia?', styles: { fontStyle: 'bold' } }, equipoCompetencia],

    // SECCIÓN 4: DATOS CLINICOS
    [{ content: 'DATOS CLINICOS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
    [{ content: 'PESO:', styles: { fontStyle: 'bold' } }, peso],
    [{ content: 'LESIONES:', styles: { fontStyle: 'bold' } }, lesiones],
    [{ content: 'SUFRE PROBLEMAS CARDIACOS?', styles: { fontStyle: 'bold' } }, cardiacos],
    [{ content: '¿COMO SE ENTERO DE NOSOTROS?', styles: { fontStyle: 'bold' } }, comoSeEntero]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin + 12 },
    body: tableBody,
    theme: 'grid',
    tableWidth: contentWidth,
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 62 }
    }
  });

  // ==========================================
  // PÁGINA 2
  // ==========================================
  doc.addPage();
  drawSideDecoration(doc);

  // Logo Eliseos en página 2
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 12, 36, 18);
    } catch (e) {
      console.warn('Error adding logo:', e);
    }
  }

  let y2 = 34;

  // Cláusula: OBLIGACIONES DE LAS PARTES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OBLIGACIONES DE LAS PARTES', margin, y2);
  y2 += 5;

  doc.setFontSize(8.5);
  doc.text('1. Obligaciones de EL PRESTADOR:', margin, y2);
  y2 += 4;

  doc.setFont('helvetica', 'normal');
  TERMINOS_LEGALES.obligacionesPrestador.forEach((item) => {
    const lines = doc.splitTextToSize(`•  ${item}`, contentWidth - 4);
    doc.text(lines, margin + 3, y2);
    y2 += lines.length * 3.8;
  });
  y2 += 2;

  doc.setFont('helvetica', 'bold');
  doc.text('2. Obligaciones de EL SOCIO:', margin, y2);
  y2 += 4;

  doc.setFont('helvetica', 'normal');
  TERMINOS_LEGALES.obligacionesSocio.forEach((item) => {
    const lines = doc.splitTextToSize(`•  ${item}`, contentWidth - 4);
    doc.text(lines, margin + 3, y2);
    y2 += lines.length * 3.8;
  });
  y2 += 4;

  // Cláusula: POLÍTICA DE CANCELACIÓN Y CONGELACIÓN
  doc.setFont('helvetica', 'bold');
  doc.text('POLÍTICA DE CANCELACIÓN Y CONGELACIÓN', margin, y2);
  y2 += 4;

  doc.setFont('helvetica', 'normal');
  TERMINOS_LEGALES.politicasCancelacion.forEach((item) => {
    const lines = doc.splitTextToSize(`•  ${item}`, contentWidth - 4);
    doc.text(lines, margin + 3, y2);
    y2 += lines.length * 3.8;
  });
  y2 += 4;

  // Cláusula: EXCLUSIÓN DE RESPONSABILIDAD
  doc.setFont('helvetica', 'bold');
  doc.text('EXCLUSIÓN DE RESPONSABILIDAD', margin, y2);
  y2 += 4;

  doc.setFont('helvetica', 'normal');
  const exclusionLines = doc.splitTextToSize(TERMINOS_LEGALES.exclusionResponsabilidad, contentWidth);
  doc.text(exclusionLines, margin, y2);
  y2 += exclusionLines.length * 3.8 + 4;

  // Cláusula: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS', margin, y2);
  y2 += 4;

  doc.setFont('helvetica', 'normal');
  const confLines = doc.splitTextToSize(TERMINOS_LEGALES.confidencialidad, contentWidth);
  doc.text(confLines, margin, y2);
  y2 += confLines.length * 3.8 + 4;

  // Cláusula: ACEPTACIÓN
  doc.setFont('helvetica', 'bold');
  doc.text('ACEPTACIÓN', margin, y2);
  doc.setFont('helvetica', 'normal');
  const aceptacionTexto = ` ${TERMINOS_LEGALES.aceptacion}`;
  const aceptLines = doc.splitTextToSize(aceptacionTexto, contentWidth - 25);
  doc.text(aceptLines, margin + 24, y2);
  y2 += Math.max(aceptLines.length * 3.8, 6) + 4;

  // SECCIÓN DE FIRMAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Firmas', margin, y2);
  y2 += 6;

  const firmas = nota.firmas || {};
  const prestadorNombre = firmas.prestadorNombre || nota.prestadorNombre || '__________________________';
  const prestadorFirma = firmas.prestadorFirma || nota.prestadorFirma || '';
  const prestadorFecha = formatFecha(firmas.prestadorFecha || nota.prestadorFecha);

  const socioFirmaNombre = firmas.socioNombre || nota.socioNombre || nombreSocio || '__________________________';
  const socioFirma = firmas.socioFirma || nota.socioFirma || '';
  const socioFecha = formatFecha(firmas.socioFecha || nota.socioFecha);

  const colWidth = (contentWidth - 10) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 10;

  // COLUMNA PRESTADOR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EL PRESTADOR / RECEPCIONISTA', col1X, y2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${prestadorNombre}`, col1X, y2 + 5);
  doc.text('Firma:', col1X, y2 + 10);

  // Estampar firma digital del prestador si existe
  if (prestadorFirma) {
    try {
      doc.addImage(prestadorFirma, 'PNG', col1X + 15, y2 + 6, 38, 14);
    } catch (e) {
      console.warn('Error embedding prestador signature:', e);
    }
  } else {
    doc.line(col1X + 15, y2 + 17, col1X + 65, y2 + 17);
  }
  doc.text(`Fecha: ${prestadorFecha}`, col1X, y2 + 23);

  // COLUMNA SOCIO
  doc.setFont('helvetica', 'bold');
  doc.text('EL SOCIO', col2X, y2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${socioFirmaNombre}`, col2X, y2 + 5);
  doc.text('Firma:', col2X, y2 + 10);

  // Estampar firma digital del socio si existe
  if (socioFirma) {
    try {
      doc.addImage(socioFirma, 'PNG', col2X + 15, y2 + 6, 38, 14);
    } catch (e) {
      console.warn('Error embedding socio signature:', e);
    }
  } else {
    doc.line(col2X + 15, y2 + 17, col2X + 65, y2 + 17);
  }
  doc.text(`Fecha: ${socioFecha}`, col2X, y2 + 23);

  y2 += 34;

  // Cierre institucional: Atentamente: ELISEOS BOX & FITNESS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Atentamente:  ELISEOS BOX & FITNESS', margin, y2);

  // Guardar archivo
  const safeName = (nombreSocio || 'socio').replace(/[^a-zA-Z0-9]/g, '_');
  const fechaDoc = (nota.fechaContratacion || nota.fecha || 'hoja').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`F-ELI-16_Hoja_Clinica_${safeName}_${fechaDoc}.pdf`);
};
