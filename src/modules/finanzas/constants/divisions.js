// Constantes para divisiones del sistema
export const DIVISIONS = [
  {
    value: 'general',
    label: 'General',
    description: 'División general para gastos administrativos y operacionales'
  },
  {
    value: '2da_division',
    label: '2nda división profesional',
    description: 'División profesional de segunda categoría'
  },
  {
    value: '3ra_division',
    label: '3ra división profesional',
    description: 'División profesional de tercera categoría'
  }
];

// Función helper para obtener el label de una división por su valor
export const getDivisionLabel = (value) => {
  const division = DIVISIONS.find(d => d.value === value);
  return division ? division.label : value;
};

// Función helper para obtener la descripción de una división
export const getDivisionDescription = (value) => {
  const division = DIVISIONS.find(d => d.value === value);
  return division ? division.description : '';
};

// Función para formatear división para mostrar
export const formatDivision = (value) => {
  if (!value) return 'No especificada';
  return getDivisionLabel(value);
};
