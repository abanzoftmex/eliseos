export const ELISEOS_INFO = {
  nombre: 'ELISEOS BOX & FITNESS',
  domicilio: 'Carretera Federal Puebla Atlixco 4707, Jardines de San Carlos, Santa Fe, #72824, San Bernardino Tlaxcalancingo, Puebla, PLAZA ESTAMBRES',
  encabezadoTerminos: (paquete = '______________________') =>
    `ELISEOS BOX & FITNESS, con domicilio en Carretera Federal Puebla Atlixco 4707, Jardines de San Carlos, Santa Fe, #72824, San Bernardino Tlaxcalancingo, Puebla, PLAZA ESTAMBRES, establece estos Términos y Condiciones aplican para contratación PAQUETE: ${paquete || '______________________'} dentro del establecimiento y deben ser leídos y aceptados por todas las personas que deseen ser parte como socio de ELISEOS BOX & FITNESS.`
};

export const TERMINOS_LEGALES = {
  obligacionesPrestador: [
    'Brindar el acceso a las instalaciones conforme al plan contratado.',
    'Proporcionar entrenamiento de BOX y rutinas adecuadas al nivel del socio.',
    'Garantizar que el personal cuente con conocimientos básicos en primeros auxilios y técnicas de entrenamiento.',
    'Mantener las instalaciones en condiciones higiénicas y seguras.'
  ],
  obligacionesSocio: [
    'Respetar el reglamento interno del centro, incluyendo normas de comportamiento y seguridad.',
    'Realizar los pagos correspondientes de forma puntual.',
    'Presentar certificado médico si se le solicita, o firmar carta de exención de responsabilidad médica.',
    'Utilizar el equipo e instalaciones de forma adecuada.'
  ],
  politicasCancelacion: [
    'Las cancelaciones anticipadas no generan reembolso, salvo casos médicos debidamente comprobados.',
    'Las membresías podrán congelarse una sola vez por periodo, con previa notificación y aprobación.',
    'No se permiten transferencias de membresía entre personas, salvo autorización expresa.'
  ],
  exclusionResponsabilidad:
    'EL PRESTADOR no se hace responsable por lesiones o daños derivados del mal uso de las instalaciones, negligencia del socio o incumplimiento de instrucciones técnicas, siempre que no medie culpa directa del personal del gimnasio.',
  confidencialidad:
    'EL SOCIO autoriza el uso de sus datos personales únicamente para fines administrativos, operativos y de comunicación interna, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.',
  aceptacion:
    'Ambas partes declaran haber leído, entendido y aceptado el contenido del presente contrato, firmando en duplicado para constancia.'
};
