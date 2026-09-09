import { useState } from 'react';
import { useRouter } from 'next/router';
import { useRecurringExpenses } from '../../lib/hooks/useRecurringExpenses';
import { recurringExpenseService } from '../../lib/services/recurringExpenseService';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';

const RecurringExpenseAlert = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPendingGeneration, pendingExpenses, refetch } = useRecurringExpenses();
  const [generating, setGenerating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const toast = useToast();

  if (!hasPendingGeneration || dismissed) {
    return null;
  }

  const handleGenerateNow = async () => {
    try {
      setGenerating(true);
      
      // First, run migration for existing expenses that don't have generatedMonths
      await recurringExpenseService.migrateExistingExpenses();
      
      // Then generate pending transactions for current month
      const generatedTransactions = await recurringExpenseService.generatePendingTransactions(user);
      
      if (generatedTransactions.length > 0) {
        const currentMonthName = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        toast.success(`Se generaron ${generatedTransactions.length} transacciones pendientes para ${currentMonthName}`);
        refetch(); // Refresh the data
      } else {
        toast.info("No hay gastos recurrentes pendientes de generar para este mes");
      }
    } catch (error) {
      console.error("Error generating transactions:", error);
      toast.error("Error al generar las transacciones pendientes");
    } finally {
      setGenerating(false);
    }
  };

  const handleViewRecurring = () => {
    router.push('/admin/transacciones/recurrentes');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-rose-400 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gastos Recurrentes Pendientes
            </h3>
            <p className="text-gray-700 mb-3">
              Tienes <span className="font-semibold text-rose-500">{pendingExpenses.length}</span> gastos recurrentes 
              que necesitan ser generados para el próximo mes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerateNow}
                disabled={generating}
                className="px-4 py-2 bg-rose-400 text-white rounded-lg hover:bg-rose-500 focus:ring-4 focus:ring-rose-400/20 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Generar Ahora
                  </>
                )}
              </button>
              <button
                onClick={handleViewRecurring}
                className="px-4 py-2 bg-white text-rose-500 border border-rose-300 rounded-lg hover:bg-rose-50 focus:ring-4 focus:ring-rose-400/20 transition-all duration-200 font-medium"
              >
                Ver Gastos Recurrentes
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 text-rose-300 hover:text-rose-400 hover:bg-rose-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Lista de gastos pendientes */}
      {pendingExpenses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-rose-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Gastos pendientes de generar:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {pendingExpenses.slice(0, 6).map((expense, index) => (
              <div key={expense.id} className="bg-white/60 rounded-lg p-3 border border-rose-200">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {expense.description || 'Gasto recurrente'}
                </p>
                <p className="text-xs text-gray-600">
                  ${expense.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
            {pendingExpenses.length > 6 && (
              <div className="bg-white/60 rounded-lg p-3 border border-rose-200 flex items-center justify-center">
                <p className="text-xs text-gray-600">
                  +{pendingExpenses.length - 6} más
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseAlert;