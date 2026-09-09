import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@finanzas/components/layout/AdminLayout";
import TransactionForm from "@finanzas/components/forms/TransactionForm";
import ProtectedRoute from "@finanzas/components/auth/ProtectedRoute";
import AdvancedDateSelector from "@finanzas/components/dashboard/AdvancedDateSelector";
import { useAuth } from "@finanzas/context/AuthContext";
import { useToast } from "@finanzas/components/ui/Toast";
import { transactionService } from "@finanzas/lib/services/transactionService";
import { conceptService } from "@finanzas/lib/services/conceptService";
import { clienteService } from "@finanzas/lib/services/clienteService";
import { sucursalService } from "@finanzas/lib/services/sucursalService";
import { 
  PlusIcon,
  ArrowTrendingUpIcon,
  PencilIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Ingresos = () => {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonthName, setCurrentMonthName] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    clienteId: "",
    sucursalId: ""
  });
  const [initialized, setInitialized] = useState(false);
  const toast = useToast();

  // Check permissions based on user role
  const canManageTransactions = checkPermission("canManageTransactions");
  const canDeleteTransactions = checkPermission("canDeleteTransactions");

  // Initialize filters from URL
  useEffect(() => {
    if (router.isReady && !initialized) {
      const { search, clienteId, sucursalId } = router.query;
      if (search) setSearchTerm(search);
      setFilters({
        clienteId: clienteId || "",
        sucursalId: sucursalId || ""
      });
      setInitialized(true);
    }
  }, [router.isReady, router.query, initialized]);

  // Update URL when filters change
  const updateURL = useCallback((newSearch, newFilters) => {
    const query = {};
    if (newSearch) query.search = newSearch;
    if (newFilters.clienteId) query.clienteId = newFilters.clienteId;
    if (newFilters.sucursalId) query.sucursalId = newFilters.sucursalId;
    
    router.replace(
      { pathname: router.pathname, query },
      undefined,
      { shallow: true }
    );
  }, [router]);

  // Load clientes and sucursales for filters
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [clientesResult, sucursalesData] = await Promise.all([
          clienteService.getAll(),
          sucursalService.getAll()
        ]);
        setClientes(clientesResult.clientes || []);
        setSucursales(sucursalesData || []);
      } catch (error) {
        console.error("Error loading filter data:", error);
      }
    };
    loadFilterData();
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);

      // Get first and last day of the selected month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      const transactionQuery = { 
        type: "entrada", 
        limit: 100,
        startDate: startOfMonth,
        endDate: endOfMonth,
        ...(filters.clienteId && { clienteId: filters.clienteId }),
        ...(filters.sucursalId && { sucursalId: filters.sucursalId })
      };

      const [transactionsData, conceptsData] = await Promise.all(
        [
          transactionService.getAll(transactionQuery),
          conceptService.getAll(),
        ]
      );
      setTransactions(transactionsData);
      setConcepts(conceptsData);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Error al cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }, [toast, currentDate, filters]);

  const updateMonthName = useCallback(() => {
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    setCurrentMonthName(monthName.charAt(0).toUpperCase() + monthName.slice(1));
  }, [currentDate]);

  useEffect(() => {
    if (initialized) {
      loadTransactions();
    }
    updateMonthName();
  }, [loadTransactions, currentDate, updateMonthName, initialized]);

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleTransactionSuccess = (transaction) => {
    if (editingTransaction) {
      // Update existing transaction
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? transaction : t))
      );
      toast.success("Ingreso actualizado exitosamente");
    } else {
      // Add new transaction to the list
      setTransactions((prev) => [transaction, ...prev]);
    }
    setShowForm(false);
    setEditingTransaction(null);
    // The toast is already shown in the TransactionForm component for new transactions
  };

  const handleNewTransaction = () => {
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction) => {
    router.push(`/finanzas/transacciones/editar/${transaction.id}`);
  };

  const getConceptName = (conceptId) => {
    const concept = concepts.find((c) => c.id === conceptId);
    return concept ? concept.name : "N/A";
  };

  const getClienteName = (clienteId) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? cliente.nombre : null;
  };

  const getSucursalName = (sucursalId) => {
    const sucursal = sucursales.find((s) => s.id === sucursalId);
    return sucursal ? sucursal.name : null;
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    // If sucursal changes, reset cliente filter
    if (filterName === 'sucursalId') {
      newFilters.clienteId = '';
    }
    setFilters(newFilters);
    updateURL(searchTerm, newFilters);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateURL(value, filters);
  };

  const clearFilters = () => {
    setFilters({ clienteId: "", sucursalId: "" });
    setSearchTerm("");
    updateURL("", { clienteId: "", sucursalId: "" });
  };

  const hasActiveFilters = filters.clienteId || filters.sucursalId || searchTerm;



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    
    // Ajustar la fecha para mostrar la fecha correcta en la zona horaria local
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    // Crear una nueva fecha usando solo año, mes y día para evitar problemas de zona horaria
    const adjustedDate = new Date(year, month, day);
    
    return adjustedDate.toLocaleDateString("es-MX");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendiente: { color: "bg-red-100 text-red-800", text: "Pendiente" },
      parcial: { color: "bg-yellow-100 text-yellow-800", text: "Parcial" },
      pagado: { color: "bg-green-100 text-green-800", text: "Pagado" },
    };

    const config = statusConfig[status] || statusConfig.pendiente;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const handleViewDetails = (transactionId) => {
    router.push(`/finanzas/transacciones/detalle/${transactionId}`);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Si hay un término de búsqueda, filtrar por él
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const conceptName = getConceptName(transaction.conceptId).toLowerCase();
      const amountStr = (transaction.amount ?? "").toString();
      const statusStr = (transaction.status ?? "").toString().toLowerCase();
      const clienteName = (getClienteName(transaction.clienteId) || "").toLowerCase();
      const sucursalName = (getSucursalName(transaction.sucursalId) || "").toLowerCase();
      return (
        conceptName.includes(query) ||
        amountStr.includes(query) ||
        statusStr.includes(query) ||
        clienteName.includes(query) ||
        sucursalName.includes(query)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <AdminLayout
        title="Ingreso"
        breadcrumbs={[
          { name: "Dashboard", href: "/finanzas/dashboard" },
          { name: "Transacciones" },
          { name: "Ingreso" },
        ]}
      >
        <div className="space-y-6">
          {/* Header with action button */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Ingresos - {currentMonthName}
                    </h1>
                    <AdvancedDateSelector
                      currentDate={currentDate}
                      onDateChange={handleDateChange}
                      onSuccess={toast.success}
                      onError={toast.error}
                    />
                  </div>
                  <p className="text-gray-600 mt-1">
                    Registra y consulta los ingresos de la organización
                  </p>
                </div>
              </div>
              {!showForm && canManageTransactions && (
                <button
                  onClick={handleNewTransaction}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-500/20 focus:ring-offset-2 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                ><PlusIcon className="h-4 w-4 mr-1.5" />
                  Nuevo Ingreso
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {!showForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Filtros</span>
                  {hasActiveFilters && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      Activos
                    </span>
                  )}
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showFilters && (
                <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sucursal
                      </label>
                      <select
                        value={filters.sucursalId}
                        onChange={(e) => handleFilterChange('sucursalId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        <option value="">Todas las sucursales</option>
                        {sucursales.map((sucursal) => (
                          <option key={sucursal.id} value={sucursal.id}>
                            {sucursal.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente
                      </label>
                      <select
                        value={filters.clienteId}
                        onChange={(e) => handleFilterChange('clienteId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        <option value="">Todos los clientes</option>
                        {clientes
                          .filter(c => !filters.sucursalId || (c.sucursales && c.sucursales.includes(filters.sucursalId)))
                          .map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors flex items-center space-x-1"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          <span>Limpiar filtros</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction Form */}
          {showForm && (
            <div className="bg-background rounded-lg border border-border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-foreground">
                  {editingTransaction ? "Editar Ingreso" : "Nuevo Ingreso"}
                </h3>
                <button
                  onClick={handleCancelForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <TransactionForm
                type="entrada"
                initialData={editingTransaction}
                onSuccess={handleTransactionSuccess}
                onCancel={handleCancelForm}
              />
            </div>
          )}

          {/* Recent Transactions Table */}
          {!showForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Ingresos Recientes
                      </h3>
                      <p className="text-sm text-gray-600">
                        Últimos {Math.min(filteredTransactions.length, 10)}{" "}
                        ingresos registrados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {
                          filteredTransactions.filter(
                            (t) => t.status === "pendiente"
                          ).length
                        }{" "}
                        Pendientes
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {
                          filteredTransactions.filter(
                            (t) => t.status === "parcial"
                          ).length
                        }{" "}
                        Parciales
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {
                          filteredTransactions.filter(
                            (t) => t.status === "pagado"
                          ).length
                        }{" "}
                        Pagados
                      </span>
                    </div>
                    <div className="w-full md:w-80">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Buscar por concepto, cliente, monto..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">
                    Cargando ingresos...
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        No hay ingresos registrados
                      </p>
                      <button
                        onClick={handleNewTransaction}
                        className="text-primary hover:text-primary text-sm font-medium"
                      >
                        Registrar primer ingreso
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Concepto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Cliente / Sucursal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {filteredTransactions
                          .sort((a, b) => {
                            const statusOrder = { pendiente: 1, parcial: 2, pagado: 3 };
                            return statusOrder[a.status] - statusOrder[b.status];
                          })
                          .slice(0, 10)
                          .map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-muted/50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {getConceptName(transaction.conceptId)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                <div className="flex flex-col">
                                  {transaction.clienteId && (
                                    <span className="text-gray-900 font-medium">
                                      {getClienteName(transaction.clienteId) || '-'}
                                    </span>
                                  )}
                                  {transaction.sucursalId && (
                                    <span className="text-xs text-green-600">
                                      {getSucursalName(transaction.sucursalId)}
                                    </span>
                                  )}
                                  {!transaction.clienteId && !transaction.sucursalId && (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(transaction.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                  {canManageTransactions && (
                                    <button
                                      onClick={() => handleEditTransaction(transaction)}
                                      className="bg-cyan-100 hover:bg-cyan-200 text-cyan-600 hover:text-cyan-800 py-1.5 px-2.5 rounded-md transition-colors flex items-center"
                                      title="Editar ingreso"
                                      cursor="pointer"
                                    >
                                    <PencilIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleViewDetails(transaction.id)
                                    }
                                    className="bg-cyan-100 hover:bg-cyan-200 text-cyan-600 hover:text-cyan-800 py-1.5 px-2.5 rounded-md transition-colors"
                                    title="Ver detalles"
                                    cursor="pointer"
                                  >
                                    <EyeIcon className="h-4 w-4" />  
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-border">
                    {filteredTransactions
                      .sort((a, b) => {
                        const statusOrder = { pendiente: 1, parcial: 2, pagado: 3 };
                        return statusOrder[a.status] - statusOrder[b.status];
                      })
                      .slice(0, 10)
                      .map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ingreso
                              </span>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {getConceptName(transaction.conceptId)}
                            </p>
                            {(transaction.clienteId || transaction.sucursalId) && (
                              <div className="mt-1">
                                {transaction.clienteId && (
                                  <span className="text-xs text-gray-700 font-medium">
                                    {getClienteName(transaction.clienteId)}
                                  </span>
                                )}
                                {transaction.sucursalId && (
                                  <span className="text-xs text-green-600 ml-2">
                                    ({getSucursalName(transaction.sucursalId)})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-3">
                            {canManageTransactions && (
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                                title="Editar ingreso"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(transaction.id)}
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              Ver Detalles
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredTransactions.length > 10 && (
                    <div className="px-6 py-4 border-t border-border text-center">
                      <p className="text-sm text-muted-foreground">
                        Mostrando los 10 ingresos más recientes.{" "}
                        <Link
                          href="/finanzas/transacciones/historial?type=entrada"
                          className="text-primary hover:text-primary/80"
                        >
                          Ver historial completo
                        </Link>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Ingresos;
