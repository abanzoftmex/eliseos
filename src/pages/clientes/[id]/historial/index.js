import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { visualizarPDF } from '@/utils/pdfGenerator';
import {
  faCalendar,
  faFileText,
  faChartLine,
  faChevronRight,
  faUser,
  faClock,
  faEye,
  faArrowLeft,
  faFilter,
  faDownload,
  faPersonRunning,
  faShare,
  faCheck,
  faSpinner,
  faCopy,
  faTrash,
  faLink,
  faFilePdf,
  faPrint,
  faHeartPulse
} from '@fortawesome/free-solid-svg-icons';

function HistorialConsultasPage() {
  const router = useRouter();
  const { id: clienteId } = router.query;

  const [cliente, setCliente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todas'); // 'todas', 'atleta', 'normal'
  const [sharingId, setSharingId] = useState(null); // ID de la consulta que se está compartiendo
  const [copiedId, setCopiedId] = useState(null); // ID de la consulta cuyo link se copió
  const [deletingLinkId, setDeletingLinkId] = useState(null); // ID de la consulta cuyo link se está eliminando
  const [sharedLinks, setSharedLinks] = useState({}); // Links compartidos existentes por consultaId

  const loadData = async () => {
    if (!clienteId) return;

    setLoading(true);
    try {
      // Cargar información del cliente (con fallback a colección atletas)
      let clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      if (!clienteDoc.exists()) {
        clienteDoc = await getDoc(doc(db, 'atletas', clienteId));
      }
      if (clienteDoc.exists()) {
        setCliente({ id: clienteDoc.id, ...clienteDoc.data() });
      }

      // Cargar consultas completadas
      const consultasRef = collection(db, 'consultas');
      let consultasList = [];
      try {
        const q = query(
          consultasRef,
          where('clienteId', '==', clienteId),
          where('status', '==', 'completed'),
          orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        consultasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e1) {
        // Fallback si falta índice compuesto o se filtran sin status
        console.warn('Fallback consulta query:', e1);
        const q2 = query(consultasRef, where('clienteId', '==', clienteId));
        const s2 = await getDocs(q2);
        consultasList = s2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Si no se encontraron por clienteId, intentar por atletaId
      if (consultasList.length === 0) {
        try {
          const qAtleta = query(consultasRef, where('atletaId', '==', clienteId));
          const sAtleta = await getDocs(qAtleta);
          consultasList = sAtleta.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e2) {
          console.warn('Fallback atletaId query:', e2);
        }
      }

      // Ordenar en memoria por fecha más reciente
      consultasList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

      setConsultas(consultasList);
      
      // Cargar links compartidos existentes para estas consultas
      if (consultasList.length > 0) {
        const shortUrlsRef = collection(db, 'shortUrls');
        const consultaIds = consultasList.map(c => c.id);
        
        // Firebase no permite más de 10 elementos en 'in', dividir si es necesario
        const chunks = [];
        for (let i = 0; i < consultaIds.length; i += 10) {
          chunks.push(consultaIds.slice(i, i + 10));
        }
        
        const existingLinks = {};
        for (const chunk of chunks) {
          const linksQuery = query(shortUrlsRef, where('consultaId', 'in', chunk));
          const linksSnapshot = await getDocs(linksQuery);
          linksSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const rutaTipo = data.type === 'atleta' ? 'citas-deportivas' : 'citas';
            existingLinks[data.consultaId] = {
              code: doc.id,
              url: `${window.location.origin}/f/${rutaTipo}/${doc.id}`,
              views: data.views || 0
            };
          });
        }
        setSharedLinks(existingLinks);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clienteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTipoConsulta = (consulta) => {
    // Usar el campo type para determinar el tipo de consulta
    if (consulta.type === 'atleta') {
      return { tipo: 'Ficha de Atleta', icon: faPersonRunning, color: 'blue' };
    }
    // Por defecto es consulta médica normal
    return { tipo: 'Ficha de Paciente', icon: faFileText, color: 'emerald' };
  };

  const formatPadecimiento = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      const labels = {
        urgencia: 'Urgencia',
        enfermedad: 'Enfermedad',
        segundaOpinion: 'Segunda Opinión',
        accidente: 'Accidente'
      };
      return Object.entries(val)
        .filter(([_, v]) => v)
        .map(([k]) => labels[k] || k)
        .join(', ');
    }
    return '';
  };

  const handleVerDetalle = (consultaId) => {
    router.push(`/clientes/${clienteId}/historial/${consultaId}`);
  };

  // Función para compartir ficha con URL corta
  const handleShare = async (consultaId, type) => {
    setSharingId(consultaId);
    
    try {
      const response = await fetch('/api/s/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultaId,
          type: type || 'normal'
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear URL corta');
      }

      const { shortUrl, shortCode } = await response.json();

      // Copiar al portapapeles
      await navigator.clipboard.writeText(shortUrl);
      
      // Mostrar confirmación
      setCopiedId(consultaId);
      setTimeout(() => setCopiedId(null), 3000);
      
      // Guardar el link en el estado con info completa
      const rutaTipo = (type || 'normal') === 'atleta' ? 'citas-deportivas' : 'citas';
      setSharedLinks(prev => ({ 
        ...prev, 
        [consultaId]: {
          code: shortCode,
          url: shortUrl,
          views: 0
        }
      }));
      
    } catch (error) {
      console.error('Error compartiendo ficha:', error);
      alert('Error al generar el link de compartir');
    } finally {
      setSharingId(null);
    }
  };

  // Función para eliminar link compartido
  const handleDeleteLink = async (consultaId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar el link compartido? Las personas con el link ya no podrán acceder a la ficha.')) {
      return;
    }
    
    setDeletingLinkId(consultaId);
    
    try {
      const response = await fetch('/api/s/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consultaId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar link');
      }

      // Eliminar del estado local
      setSharedLinks(prev => {
        const newLinks = { ...prev };
        delete newLinks[consultaId];
        return newLinks;
      });
      
      alert('Link eliminado correctamente');
      
    } catch (error) {
      console.error('Error eliminando link:', error);
      alert(error.message || 'Error al eliminar el link');
    } finally {
      setDeletingLinkId(null);
    }
  };

  // Función para generar y visualizar PDF profesional
  const handleVerPDF = async (consultaIdParam, tipoConsulta) => {
    try {
      // Buscar la consulta en el array de consultas cargadas
      const consultaData = consultas.find(c => c.id === consultaIdParam);
      if (!consultaData) {
        alert('No se encontró la consulta');
        return;
      }
      
      await visualizarPDF(consultaData, cliente, tipoConsulta);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  // Filtrar consultas por tipo
  const consultasFiltradas = consultas.filter(consulta => {
    if (filtroTipo === 'todas') return true;
    return consulta.type === filtroTipo;
  });

  // Estadísticas
  const totalConsultas = consultas.length;
  const consultasMedicas = consultas.filter(c => c.type !== 'atleta').length;
  const consultasDeportivas = consultas.filter(c => c.type === 'atleta').length;

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Bar - Similar al diseño del directorio */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Botón volver */}
              <button
                onClick={() => router.push(`/clientes/${clienteId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6 text-gray-600" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faCalendar} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent">
                    Historial Médico
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {cliente?.nombre} {cliente?.apellidos}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/clientes/${clienteId}/citas`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm font-medium"
              >  
                <FontAwesomeIcon icon={faHeartPulse} className="w-4 h-4" />
                Nueva ficha de Paciente
              </button>
              <button
                onClick={() => router.push(`/clientes/${clienteId}/citas-deportivas`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm font-medium"
              >
                <FontAwesomeIcon icon={faPersonRunning} className="w-4 h-4" />
                Nueva ficha de Atleta
              </button>
            </div>
          </div>

          {/* Estadísticas y filtros */}
          <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-900">{totalConsultas}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl px-4 py-3 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faFileText} className="w-5 h-5 text-emerald-600" />
                  <div className="text-lg font-bold text-emerald-900">{consultasMedicas}</div>
                  <div className="text-sm text-emerald-700">Ficha(s) / Paciente</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl px-4 py-3 border border-blue-200">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-blue-600" />
                  <div className="text-lg font-bold text-blue-900">{consultasDeportivas}</div>
                  <div className="text-sm text-blue-700">Ficha(s) / Atleta</div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-gray-500" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltroTipo('todas')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroTipo === 'todas'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFiltroTipo('normal')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroTipo === 'normal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  Médicas
                </button>
                <button
                  onClick={() => setFiltroTipo('atleta')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroTipo === 'atleta'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  Deportivas
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-8">
        {consultasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              {filtroTipo === 'todas' ? (
                <>
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faFileText} className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No hay consultas registradas
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Este cliente aún no tiene consultas completadas en el sistema
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faFilter} className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No hay consultas {filtroTipo === 'atleta' ? 'deportivas' : 'médicas'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Intenta cambiar el filtro o crear una nueva consulta
                  </p>
                  <button
                    onClick={() => setFiltroTipo('todas')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Ver todas las consultas
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {consultasFiltradas.map((consulta) => {
              const { tipo, icon: Icon, color } = getTipoConsulta(consulta);
              const colorClasses = {
                emerald: {
                  gradient: 'from-emerald-50 to-emerald-100',
                  border: 'border-emerald-200',
                  icon: 'text-emerald-600',
                  iconBg: 'bg-emerald-100',
                  badge: 'bg-emerald-100 text-emerald-800',
                  button: 'bg-emerald-600 hover:bg-emerald-700',
                  hover: 'hover:border-emerald-300'
                },
                blue: {
                  gradient: 'from-blue-50 to-blue-100',
                  border: 'border-blue-200',
                  icon: 'text-blue-600',
                  iconBg: 'bg-blue-100',
                  badge: 'bg-blue-100 text-blue-800',
                  button: 'bg-blue-600 hover:bg-blue-700',
                  hover: 'hover:border-blue-300'
                }
              };
              const colors = colorClasses[color];

              return (
                <div
                  key={consulta.id}
                  className={`bg-white rounded-2xl shadow-sm border-2 ${colors.border} ${colors.hover} transition-all duration-200 overflow-hidden group`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Contenido principal */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon con gradiente */}
                        <div className={`bg-gradient-to-br ${colors.gradient} rounded-xl p-4 ${colors.border} border-2 shadow-sm`}>
                          <FontAwesomeIcon icon={Icon} className={`w-8 h-8 ${colors.icon}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {tipo}
                            </h3>
                            <span className={`${colors.badge} px-3 py-1 rounded-full text-xs font-semibold`}>
                              Completada
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{formatDate(consulta.updatedAt)}</span>
                            </div>
                            {consulta.uidTrabajador && (
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400" />
                                <span>Atendido por: <span className="font-medium">{consulta.uidTrabajador}</span></span>
                              </div>
                            )}
                          </div>

                          {/* Preview de datos importantes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {consulta.answers?.recopilacionHechos && formatPadecimiento(consulta.answers.recopilacionHechos) && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1 font-medium">Motivo de consulta</div>
                                <div className="text-sm font-semibold text-gray-800 line-clamp-2">
                                  {formatPadecimiento(consulta.answers.recopilacionHechos)}
                                </div>
                              </div>
                            )}
                            {consulta.answers?.tipoPadecimiento && formatPadecimiento(consulta.answers.tipoPadecimiento) && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1 font-medium">Tipo de padecimiento</div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {formatPadecimiento(consulta.answers.tipoPadecimiento)}
                                </div>
                              </div>
                            )}
                            {consulta.answers?.diagnosticoMedico && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1 font-medium">Diagnóstico médico</div>
                                <div className="text-sm font-semibold text-gray-800 line-clamp-2">
                                  {consulta.answers.diagnosticoMedico}
                                </div>
                              </div>
                            )}
                            {consulta.answers?.objetivoPersonal && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1 font-medium">Objetivo personal</div>
                                <div className="text-sm font-semibold text-gray-800 line-clamp-2">
                                  {consulta.answers.objetivoPersonal}
                                </div>
                              </div>
                            )}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500 mb-1 font-medium">Información registrada</div>
                              <div className="text-sm font-bold text-gray-900">
                                {Object.keys(consulta.answers || {}).length} campos completados
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleVerDetalle(consulta.id)}
                          className={`${colors.button} text-white px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md font-medium flex items-center gap-2 whitespace-nowrap group-hover:scale-105`}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                          Ver detalle
                          <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Botón para generar PDF */}
                        <button
                          onClick={() => handleVerPDF(consulta.id, consulta.type)}
                          className="px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2 bg-red-600 text-white border-2 border-red-700 hover:bg-red-700"
                        >
                          <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" />
                          Generar PDF
                        </button>
                        
                        {/* Si ya tiene link compartido, mostrar el código y opciones */}
                        {sharedLinks[consulta.id] ? (
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2 text-purple-700">
                              <FontAwesomeIcon icon={faLink} className="w-4 h-4" />
                              <span className="text-xs font-semibold">Link compartido activo</span>
                              {sharedLinks[consulta.id].views > 0 && (
                                <span className="text-xs bg-purple-200 px-2 py-0.5 rounded-full">
                                  {sharedLinks[consulta.id].views} vista{sharedLinks[consulta.id].views !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border border-purple-200 text-purple-800 font-mono truncate">
                                {sharedLinks[consulta.id].url}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await navigator.clipboard.writeText(sharedLinks[consulta.id].url);
                                  setCopiedId(consulta.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                  copiedId === consulta.id
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-100'
                                }`}
                              >
                                <FontAwesomeIcon icon={copiedId === consulta.id ? faCheck : faCopy} className="w-3.5 h-3.5" />
                                {copiedId === consulta.id ? 'Copiado' : 'Copiar'}
                              </button>
                              <button
                                onClick={() => handleDeleteLink(consulta.id)}
                                disabled={deletingLinkId === consulta.id}
                                className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-white text-red-600 border border-red-300 hover:bg-red-50 transition-all"
                              >
                                {deletingLinkId === consulta.id ? (
                                  <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                                )}
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleShare(consulta.id, consulta.type)}
                            disabled={sharingId === consulta.id}
                            className={`px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2 whitespace-nowrap border-2 ${
                              copiedId === consulta.id
                                ? 'bg-green-100 border-green-300 text-green-700'
                                : `bg-white ${colors.border} ${colors.icon} hover:bg-gray-50`
                            }`}
                          >
                            {sharingId === consulta.id ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" />
                                Generando...
                              </>
                            ) : copiedId === consulta.id ? (
                              <>
                                <FontAwesomeIcon icon={faCheck} className="w-5 h-5" />
                                ¡Link copiado!
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faShare} className="w-5 h-5" />
                                Compartir
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

// Proteger la ruta - requiere permiso 'clientes'
// Roles permitidos: admin, medico, asistente
export default HistorialConsultasPage;
