import { useState } from 'react';
import { useToast } from '../ui/Toast';

const DeleteTransactionsModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [progressStats, setProgressStats] = useState({ processed: 0, total: 0 });
  const toast = useToast();

  const months = [
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedMonth === '') {
      toast.error('Selecciona un mes');
      return;
    }

    if (confirmText !== 'BORRAR') {
      toast.error('Escribe "BORRAR" para confirmar');
      return;
    }

    const selectedMonthName = months.find(m => m.value === parseInt(selectedMonth))?.label;
    
    try {
      setIsDeleting(true);
      setProgressStats({ processed: 0, total: 0 });
      
      // Create progress callback
      const updateProgress = (processed, total) => {
        setProgressStats({ processed, total });
      };
      
      await onConfirm(selectedYear, parseInt(selectedMonth), updateProgress);
      
      toast.success(`Transacciones de ${selectedMonthName} ${selectedYear} eliminadas exitosamente`);
      handleClose();
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error(error.message || 'Error al eliminar transacciones');
    } finally {
      setIsDeleting(false);
      setProgressStats({ processed: 0, total: 0 });
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setSelectedMonth('');
      setSelectedYear(currentYear);
      setConfirmText('');
      setProgressStats({ processed: 0, total: 0 });
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedMonthName = selectedMonth !== '' ? months.find(m => m.value === parseInt(selectedMonth))?.label : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🗑️ Eliminar Transacciones por Mes
        </h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">⚠️ Acción Irreversible</h4>
              <p className="text-sm text-red-700 mt-1">
                Esta acción eliminará TODAS las transacciones del mes seleccionado y no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isDeleting}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isDeleting}
                required
              >
                <option value="">Seleccionar mes...</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMonth !== '' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Se eliminarán todas las transacciones de:</strong>
              </p>
              <p className="text-lg font-semibold text-red-600">
                {selectedMonthName} {selectedYear}
              </p>
            </div>
          )}

          {isDeleting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    Eliminando transacciones...
                  </p>
                  {progressStats.total > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-700">
                        {progressStats.processed} de {progressStats.total} transacciones procesadas
                      </p>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: progressStats.total > 0 
                              ? `${(progressStats.processed / progressStats.total) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmación
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Escribe "BORRAR" para confirmar'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={isDeleting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Escribe exactamente "BORRAR" (en mayúsculas) para confirmar
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDeleting || selectedMonth === '' || confirmText !== 'BORRAR'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {progressStats.total > 0 ? (
                    `Procesando... ${progressStats.processed}/${progressStats.total}`
                  ) : (
                    'Eliminando...'
                  )}
                </div>
              ) : (
                '🗑️ Eliminar Transacciones'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteTransactionsModal;
