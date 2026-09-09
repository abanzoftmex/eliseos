import { useState, useEffect } from 'react';
import { recurringExpenseService } from '../services/recurringExpenseService';

export const useRecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecurringExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const expenses = await recurringExpenseService.getAll({ isActive: true });
      setRecurringExpenses(expenses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurringExpenses();
  }, []);

  // Check if there are expenses that need to be generated for current month
  const checkPendingGeneration = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()).padStart(2, '0')}`; // Format: YYYY-MM
    
    return recurringExpenses.filter(expense => {
      if (!expense.isActive) return false;
      
      // Initialize generatedMonths array if it doesn't exist (for backward compatibility)
      const generatedMonths = expense.generatedMonths || [];
      
      // Check if we already generated for current month using the generatedMonths array
      return !generatedMonths.includes(currentMonthKey);
    });
  };

  const pendingExpenses = checkPendingGeneration();
  const hasPendingGeneration = pendingExpenses.length > 0;

  return {
    recurringExpenses,
    loading,
    error,
    hasPendingGeneration,
    pendingExpenses,
    refetch: loadRecurringExpenses
  };
};