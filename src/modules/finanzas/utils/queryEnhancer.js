// Mapeo de términos comunes a términos del sistema
const TERM_MAPPINGS = {
  // Jornadas
  'j1': 'jornada 1',
  'j2': 'jornada 2', 
  'j3': 'jornada 3',
  'jornada1': 'jornada 1',
  'jornada2': 'jornada 2',
  'jornada3': 'jornada 3',
  'primera jornada': 'jornada 1',
  'segunda jornada': 'jornada 2',
  'tercera jornada': 'jornada 3',
  
  // Categorías generales comunes
  'generales': 'categorías generales',
  'general': 'categoría general',
  'categorias': 'categorías generales',
  'categoria': 'categoría general',
  
  // Conceptos
  'conceptos': 'conceptos',
  'concepto': 'concepto',
  
  // Subconceptos
  'subconceptos': 'subconceptos',
  'subconcepto': 'subconcepto',
  'sub-conceptos': 'subconceptos',
  'sub-concepto': 'subconcepto',
  
  // Divisiones
  'divisiones': 'divisiones',
  'division': 'división',
  'general': 'división general',
  '2da division': '2nda división profesional',
  '3ra division': '3ra división profesional',
  'segunda division': '2nda división profesional',
  'tercera division': '3ra división profesional',
  'division profesional': 'división profesional',
  
  // Proveedores
  'proveedores': 'proveedores',
  'proveedor': 'proveedor',
  'supplier': 'proveedor',
  'suppliers': 'proveedores',
  
  // Gastos/Ingresos
  'gastos': 'salidas',
  'gasto': 'salida',
  'egresos': 'salidas',
  'egreso': 'salida',
  'ingresos': 'entradas',
  'ingreso': 'entrada',
  
  // Períodos
  'mes actual': 'este mes',
  'mes pasado': 'el mes pasado',
  'ultimo mes': 'el mes pasado',
  'última semana': 'la semana pasada',
  'ultima semana': 'la semana pasada',
  'semana pasada': 'la semana pasada',
  'año actual': 'este año',
  'ano actual': 'este año',
  'último año': 'el año pasado',
  'ultimo ano': 'el año pasado',
  
  // Estados
  'pendientes': 'pendiente',
  'pagados': 'pagado',
  'parciales': 'parcial',
  
  // Análisis
  'analisis': 'análisis',
  'resumen': 'resumen',
  'estadisticas': 'estadísticas',
  'estadística': 'estadística',
  'metricas': 'métricas',
  'metrica': 'métrica'
};

// Función para normalizar y expandir consultas
export const enhanceQuery = (query) => {
  if (!query || typeof query !== 'string') return query;
  
  let enhancedQuery = query.toLowerCase().trim();
  
  // Aplicar mapeo de términos
  Object.entries(TERM_MAPPINGS).forEach(([term, replacement]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    enhancedQuery = enhancedQuery.replace(regex, replacement);
  });
  
  // Agregar sinónimos y contexto adicional
  enhancedQuery = addContextualSynonyms(enhancedQuery);
  
  return enhancedQuery;
};

// Función para agregar sinónimos contextuales
const addContextualSynonyms = (query) => {
  let expandedQuery = query;
  
  // Si menciona "generales" agregar contexto sobre categorías
  if (query.includes('categorías generales') || query.includes('general')) {
    expandedQuery += ' (incluye todas las categorías principales de gastos e ingresos, como las diferentes jornadas, tipos de gastos administrativos, operacionales, etc.)';
  }
  
  // Si menciona jornadas, agregar contexto
  if (query.includes('jornada')) {
    expandedQuery += ' (se refiere a las diferentes categorías de jornadas laborales o eventos deportivos)';
  }
  
  // Si menciona subconceptos, agregar contexto
  if (query.includes('subconcepto')) {
    expandedQuery += ' (los subconceptos son subcategorías específicas dentro de cada concepto principal)';
  }
  
  // Si menciona divisiones, agregar contexto
  if (query.includes('división') || query.includes('division')) {
    expandedQuery += ' (las divisiones incluyen: General, 2nda división profesional, y 3ra división profesional)';
  }
  
  // Si pide "del mes" sin especificar, asumir mes actual
  if (query.includes('del mes') && !query.includes('mes pasado') && !query.includes('último mes')) {
    expandedQuery = expandedQuery.replace('del mes', 'del mes actual (septiembre 2025)');
  }
  
  return expandedQuery;
};

// Función para analizar el tipo de consulta y determinar qué datos necesita
export const analyzeQueryType = (query) => {
  const lowerQuery = query.toLowerCase();
  
  const analysis = {
    type: 'general',
    needsGenerals: false,
    needsConcepts: false,
    needsProviders: false,
    needsTransactions: true,
    timeframe: 'current_month',
    focus: [],
    filters: {}
  };
  
  // Detectar si necesita datos de generales/categorías
  if (lowerQuery.includes('general') || lowerQuery.includes('categoría') || lowerQuery.includes('jornada')) {
    analysis.needsGenerals = true;
    analysis.focus.push('generals');
  }
  
  // Detectar si necesita datos de conceptos
  if (lowerQuery.includes('concepto')) {
    analysis.needsConcepts = true;
    analysis.focus.push('concepts');
  }
  
  // Detectar si necesita datos de proveedores
  if (lowerQuery.includes('proveedor') || lowerQuery.includes('supplier')) {
    analysis.needsProviders = true;
    analysis.focus.push('providers');
  }
  
  // Detectar si necesita datos de subconceptos
  if (lowerQuery.includes('subconcepto') || lowerQuery.includes('sub-concepto')) {
    analysis.needsSubconcepts = true;
    analysis.focus.push('subconcepts');
  }
  
  // Detectar si necesita datos de divisiones
  if (lowerQuery.includes('división') || lowerQuery.includes('division') || 
      lowerQuery.includes('profesional') || lowerQuery.includes('general')) {
    analysis.needsDivisions = true;
    analysis.focus.push('divisions');
  }
  
  // Detectar período de tiempo
  if (lowerQuery.includes('año') || lowerQuery.includes('anual')) {
    analysis.timeframe = 'current_year';
  } else if (lowerQuery.includes('semana')) {
    analysis.timeframe = 'current_week';
  } else if (lowerQuery.includes('trimestre')) {
    analysis.timeframe = 'current_quarter';
  } else if (lowerQuery.includes('histórico') || lowerQuery.includes('tendencia')) {
    analysis.timeframe = 'historical';
  }
  
  // Detectar tipo de análisis
  if (lowerQuery.includes('balance') || lowerQuery.includes('resumen')) {
    analysis.type = 'summary';
  } else if (lowerQuery.includes('comparar') || lowerQuery.includes('comparación')) {
    analysis.type = 'comparison';
  } else if (lowerQuery.includes('tendencia') || lowerQuery.includes('evolución')) {
    analysis.type = 'trends';
  } else if (lowerQuery.includes('mayor') || lowerQuery.includes('top') || lowerQuery.includes('más')) {
    analysis.type = 'ranking';
  }
  
  // Detectar filtros específicos
  if (lowerQuery.includes('pendiente')) {
    analysis.filters.status = 'pendiente';
  } else if (lowerQuery.includes('pagado')) {
    analysis.filters.status = 'pagado';
  }
  
  if (lowerQuery.includes('entrada') || lowerQuery.includes('ingreso')) {
    analysis.filters.type = 'entrada';
  } else if (lowerQuery.includes('salida') || lowerQuery.includes('gasto')) {
    analysis.filters.type = 'salida';
  }
  
  return analysis;
};

// Función para determinar qué componentes visuales usar
export const determineVisualizationComponents = (queryAnalysis, data) => {
  const components = [];
  
  // Siempre incluir un resumen en texto
  components.push({
    type: 'text',
    title: 'Resumen del Análisis',
    priority: 1
  });
  
  // Agregar métricas si hay datos numéricos
  if (data && (data.totalAmount || data.metrics)) {
    components.push({
      type: 'metrics',
      title: 'Métricas Principales',
      priority: 2
    });
  }
  
  // Determinar tipo de gráfico según el análisis
  if (queryAnalysis.focus.includes('generals') || queryAnalysis.focus.includes('concepts')) {
    components.push({
      type: 'chart',
      chartType: 'bar',
      title: queryAnalysis.focus.includes('generals') ? 'Distribución por Categoría General' : 'Distribución por Concepto',
      priority: 3
    });
  }
  
  // Agregar tabla de detalles si es necesario
  if (queryAnalysis.type === 'ranking' || queryAnalysis.type === 'summary') {
    components.push({
      type: 'table',
      title: 'Detalles',
      priority: 4
    });
  }
  
  // Agregar gráfico de tendencias si es análisis temporal
  if (queryAnalysis.type === 'trends' || queryAnalysis.timeframe === 'historical') {
    components.push({
      type: 'chart',
      chartType: 'line',
      title: 'Tendencia Temporal',
      priority: 5
    });
  }
  
  return components.sort((a, b) => a.priority - b.priority);
};

// Función para preparar datos específicos según la consulta
export const prepareDataForQuery = (transactions, concepts, providers, generals, subconcepts, divisions, queryAnalysis) => {
  const result = {
    processedData: [],
    metrics: [],
    chartData: [],
    tableData: [],
    systemInfo: {
      totalGenerals: generals.length,
      totalConcepts: concepts.length,
      totalSubconcepts: subconcepts.length,
      totalProviders: providers.length,
      availableDivisions: divisions.map(d => d.label)
    }
  };
  
  // Crear mapas para referencia rápida
  const conceptMap = {};
  concepts.forEach(c => conceptMap[c.id] = c);
  
  const providerMap = {};
  providers.forEach(p => providerMap[p.id] = p);
  
  const generalMap = {};
  generals.forEach(g => generalMap[g.id] = g);
  
  const subconceptMap = {};
  subconcepts.forEach(s => subconceptMap[s.id] = s);
  
  const divisionMap = {};
  divisions.forEach(d => divisionMap[d.value] = d);
  
  // Procesar transacciones con información completa
  const enrichedTransactions = transactions.map(t => {
    const concept = conceptMap[t.conceptId];
    const provider = providerMap[t.providerId];
    const general = generalMap[t.generalId] || (concept ? generalMap[concept.generalId] : null);
    const subconcept = subconceptMap[t.subconceptId];
    const division = divisionMap[t.division];
    
    return {
      ...t,
      conceptName: concept?.name || 'Sin concepto',
      providerName: provider?.name || 'Sin proveedor',
      generalName: general?.name || 'Sin categoría',
      subconceptName: subconcept?.name || 'Sin subconcepto',
      divisionName: division?.label || 'Sin división',
      date: t.date.toDate ? t.date.toDate() : new Date(t.date)
    };
  });
  
  // Generar datos específicos según el foco de la consulta
  if (queryAnalysis.focus.includes('generals')) {
    result.chartData = generateGeneralsBreakdown(enrichedTransactions);
    result.tableData = generateGeneralsTable(enrichedTransactions);
  }
  
  if (queryAnalysis.focus.includes('concepts')) {
    result.chartData = generateConceptsBreakdown(enrichedTransactions);
    result.tableData = generateConceptsTable(enrichedTransactions);
  }
  
  if (queryAnalysis.focus.includes('providers')) {
    result.chartData = generateProvidersBreakdown(enrichedTransactions);
    result.tableData = generateProvidersTable(enrichedTransactions);
  }
  
  if (queryAnalysis.focus.includes('subconcepts')) {
    result.chartData = generateSubconceptsBreakdown(enrichedTransactions);
    result.tableData = generateSubconceptsTable(enrichedTransactions);
  }
  
  if (queryAnalysis.focus.includes('divisions')) {
    result.chartData = generateDivisionsBreakdown(enrichedTransactions);
    result.tableData = generateDivisionsTable(enrichedTransactions);
  }
  
  // Generar métricas generales
  result.metrics = generateMetrics(enrichedTransactions, queryAnalysis);
  
  return result;
};

// Funciones auxiliares para generar breakdowns específicos
// Función helper para agrupar valores grandes en un rango
const groupLargeValues = (breakdown, threshold = 100000) => {
  const result = {};
  let largeValuesTotal = 0;
  let largeValuesCount = 0;
  const largeValueItems = [];
  
  Object.entries(breakdown).forEach(([key, item]) => {
    if (item.value >= threshold) {
      largeValuesTotal += item.value;
      largeValuesCount += item.count;
      largeValueItems.push(item.name);
    } else {
      result[key] = item;
    }
  });
  
  // Si hay valores grandes, agregarlos como una categoría
  if (largeValuesTotal > 0) {
    const categoryName = `Gastos +$100K (${largeValueItems.length} categorías)`;
    result[categoryName] = {
      name: categoryName,
      value: largeValuesTotal,
      count: largeValuesCount,
      isGrouped: true,
      groupedItems: largeValueItems
    };
  }
  
  return result;
};

const generateGeneralsBreakdown = (transactions) => {
  const breakdown = {};
  let total = 0;
  
  transactions.forEach(t => {
    const key = t.generalName || 'Sin categoría';
    if (!breakdown[key]) {
      breakdown[key] = { name: key, value: 0, count: 0 };
    }
    const amount = parseFloat(t.amount) || 0;
    breakdown[key].value += amount;
    breakdown[key].count += 1;
    total += amount;
  });
  
  // Agrupar valores grandes
  const groupedBreakdown = groupLargeValues(breakdown);
  
  return Object.values(groupedBreakdown).map(item => ({
    ...item,
    value: isNaN(item.value) ? 0 : item.value,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));
};

const generateConceptsBreakdown = (transactions) => {
  const breakdown = {};
  let total = 0;
  
  transactions.forEach(t => {
    const key = t.conceptName || 'Sin concepto';
    if (!breakdown[key]) {
      breakdown[key] = { name: key, value: 0, count: 0 };
    }
    const amount = parseFloat(t.amount) || 0;
    breakdown[key].value += amount;
    breakdown[key].count += 1;
    total += amount;
  });
  
  // Agrupar valores grandes
  const groupedBreakdown = groupLargeValues(breakdown);
  
  return Object.values(groupedBreakdown).map(item => ({
    ...item,
    value: isNaN(item.value) ? 0 : item.value,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));
};

const generateProvidersBreakdown = (transactions) => {
  const breakdown = {};
  let total = 0;
  
  transactions.filter(t => t.type === 'salida').forEach(t => {
    const key = t.providerName || 'Sin proveedor';
    if (!breakdown[key]) {
      breakdown[key] = { name: key, value: 0, count: 0 };
    }
    const amount = parseFloat(t.amount) || 0;
    breakdown[key].value += amount;
    breakdown[key].count += 1;
    total += amount;
  });
  
  // Agrupar valores grandes
  const groupedBreakdown = groupLargeValues(breakdown);
  
  return Object.values(groupedBreakdown).map(item => ({
    ...item,
    value: isNaN(item.value) ? 0 : item.value,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));
};

const generateSubconceptsBreakdown = (transactions) => {
  const breakdown = {};
  let total = 0;
  
  transactions.forEach(t => {
    const key = t.subconceptName || 'Sin subconcepto';
    if (!breakdown[key]) {
      breakdown[key] = { name: key, value: 0, count: 0 };
    }
    const amount = parseFloat(t.amount) || 0;
    breakdown[key].value += amount;
    breakdown[key].count += 1;
    total += amount;
  });
  
  // Agrupar valores grandes
  const groupedBreakdown = groupLargeValues(breakdown);
  
  return Object.values(groupedBreakdown).map(item => ({
    ...item,
    value: isNaN(item.value) ? 0 : item.value,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));
};

const generateDivisionsBreakdown = (transactions) => {
  const breakdown = {};
  let total = 0;
  
  transactions.filter(t => t.type === 'salida').forEach(t => {
    const key = t.divisionName || 'Sin división';
    if (!breakdown[key]) {
      breakdown[key] = { name: key, value: 0, count: 0 };
    }
    const amount = parseFloat(t.amount) || 0;
    breakdown[key].value += amount;
    breakdown[key].count += 1;
    total += amount;
  });
  
  // Agrupar valores grandes
  const groupedBreakdown = groupLargeValues(breakdown);
  
  return Object.values(groupedBreakdown).map(item => ({
    ...item,
    value: isNaN(item.value) ? 0 : item.value,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));
};

const generateGeneralsTable = (transactions) => {
  const breakdown = generateGeneralsBreakdown(transactions);
  return breakdown.map(item => ({
    categoria: item.name,
    amount: item.value,
    count: item.count,
    percentage: item.percentage
  }));
};

const generateConceptsTable = (transactions) => {
  const breakdown = generateConceptsBreakdown(transactions);
  return breakdown.map(item => ({
    concepto: item.name,
    amount: item.value,
    count: item.count,
    percentage: item.percentage
  }));
};

const generateProvidersTable = (transactions) => {
  const breakdown = generateProvidersBreakdown(transactions);
  return breakdown.map(item => ({
    proveedor: item.name,
    amount: item.value,
    count: item.count,
    percentage: item.percentage
  }));
};

const generateSubconceptsTable = (transactions) => {
  const breakdown = generateSubconceptsBreakdown(transactions);
  return breakdown.map(item => ({
    subconcepto: item.name,
    amount: item.value,
    count: item.count,
    percentage: item.percentage
  }));
};

const generateDivisionsTable = (transactions) => {
  const breakdown = generateDivisionsBreakdown(transactions);
  return breakdown.map(item => ({
    division: item.name,
    amount: item.value,
    count: item.count,
    percentage: item.percentage
  }));
};

const generateMetrics = (transactions, queryAnalysis) => {
  const metrics = [];
  
  const totalEntradas = transactions.filter(t => t.type === 'entrada').reduce((sum, t) => {
    const amount = parseFloat(t.amount) || 0;
    return sum + amount;
  }, 0);
  
  const totalSalidas = transactions.filter(t => t.type === 'salida').reduce((sum, t) => {
    const amount = parseFloat(t.amount) || 0;
    return sum + amount;
  }, 0);
  
  const balance = totalEntradas - totalSalidas;
  
  metrics.push({
    label: 'Total de Ingresos',
    value: isNaN(totalEntradas) ? 0 : totalEntradas,
    type: 'income'
  });
  
  metrics.push({
    label: 'Total de Gastos',
    value: isNaN(totalSalidas) ? 0 : totalSalidas,
    type: 'expense'
  });
  
  metrics.push({
    label: 'Balance',
    value: isNaN(balance) ? 0 : balance,
    type: 'balance'
  });
  
  metrics.push({
    label: 'Total de Transacciones',
    value: transactions.length || 0,
    type: 'count'
  });
  
  return metrics;
};
