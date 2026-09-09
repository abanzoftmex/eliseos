// Función para formatear monedas
export const formatCurrency = (amount) => {
  const numValue = parseFloat(amount);
  if (isNaN(numValue)) return "$0.00";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(numValue);
};

// Función para formatear números
export const formatNumber = (number) => {
  const numValue = parseFloat(number);
  if (isNaN(numValue)) return "0";
  return new Intl.NumberFormat("es-MX").format(numValue);
};

// Función para formatear porcentajes
export const formatPercentage = (percentage) => {
  const numValue = parseFloat(percentage);
  if (isNaN(numValue)) return "0.0%";
  return `${numValue.toFixed(1)}%`;
};

// Función para formatear fechas
export const formatDate = (date) => {
  if (!date) return "N/A";
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString("es-MX");
};

// Función para formatear fecha y hora
export const formatDateTime = (date) => {
  if (!date) return "N/A";
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleString("es-MX");
};
