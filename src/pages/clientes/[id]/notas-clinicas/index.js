import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { User, FileText, Plus, Trash2, Edit2, Calendar, Clock, ChevronDown, ChevronUp, Save, X, Download, CheckSquare, Square } from 'lucide-react';
import { getNotasClinicas, createNotaClinica, updateNotaClinica, deleteNotaClinica } from '../../../../../lib/firebase/notasClinicasService';
import { generateNotaPDF, generateMultipleNotasPDF } from '../../../../utils/pdfGenerator';

function NotasClinicasPage({ initialUser, initialUserType, initialNotas }) {
  const router = useRouter();
  const { id } = router.query;

  const [user] = useState(initialUser);
  const [notas, setNotas] = useState(initialNotas || []);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNota, setCurrentNota] = useState(null);
  const [expandedNota, setExpandedNota] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false);

  // Estados para descarga de PDFs
  const [selectedNotas, setSelectedNotas] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    numeroSesion: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    subjetivo: '',
    objetivo: '',
    evaluacion: '',
    planTerapeutico: ''
  });

  const loadNotas = useCallback(async () => {
    try {
      const result = await getNotasClinicas(id);

      if (result.success) {
        setNotas(result.notas || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al cargar notas clínicas' });
      }
    } catch (error) {
      console.error('Error loading notas:', error);
      setMessage({ type: 'error', text: 'Error al cargar notas clínicas' });
    }
  }, [id]);

  const resetForm = () => {
    setFormData({
      numeroSesion: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      subjetivo: 'Actualmente refiere las siguientes manifestaciones:',
      objetivo: '',
      evaluacion: '',
      planTerapeutico: ''
    });
    setCurrentNota(null);
    setIsEditing(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (nota) => {
    setCurrentNota(nota);
    setIsEditing(true);

    // Extraer hora de la nota si existe
    let horaExistente = '12:00';
    if (nota.hora) {
      horaExistente = nota.hora;
    } else if (nota.fecha) {
      const fechaObj = nota.fecha instanceof Date ? nota.fecha : new Date(nota.fecha);
      horaExistente = fechaObj.toTimeString().slice(0, 5);
    }

    setFormData({
      numeroSesion: nota.numeroSesion || '',
      fecha: nota.fecha instanceof Date
        ? nota.fecha.toISOString().split('T')[0]
        : new Date(nota.fecha).toISOString().split('T')[0],
      hora: horaExistente,
      subjetivo: nota.subjetivo || '',
      objetivo: nota.objetivo || '',
      evaluacion: nota.evaluacion || '',
      planTerapeutico: nota.planTerapeutico || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir doble submit
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    // Validar que al menos un campo tenga contenido
    if (!formData.subjetivo.trim() && !formData.objetivo.trim() &&
      !formData.evaluacion.trim() && !formData.planTerapeutico.trim()) {
      setMessage({ type: 'error', text: 'Debe completar al menos un campo de la nota' });
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      let result;

      // Preparar la fecha con la hora seleccionada
      const horaFormateada = formData.hora || '12:00';
      const fechaCorregida = formData.fecha ? `${formData.fecha}T${horaFormateada}:00` : formData.fecha;

      if (isEditing && currentNota) {
        // Actualizar nota existente
        result = await updateNotaClinica(id, currentNota.id, {
          ...formData,
          fecha: fechaCorregida,
          hora: horaFormateada,
          numeroSesion: formData.numeroSesion ? parseInt(formData.numeroSesion) : null
        });
      } else {
        // Crear nueva nota
        result = await createNotaClinica(id, {
          ...formData,
          fecha: fechaCorregida,
          hora: horaFormateada,
          numeroSesion: formData.numeroSesion ? parseInt(formData.numeroSesion) : null
        });
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: isEditing ? 'Nota actualizada exitosamente' : 'Nota creada exitosamente'
        });
        // Auto-ocultar mensaje después de 3 segundos
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        handleCloseModal();
        await loadNotas();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving nota:', error);
      setMessage({ type: 'error', text: 'Error al guardar la nota' });
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleDelete = async (notaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota clínica?')) return;

    try {
      const result = await deleteNotaClinica(id, notaId);

      if (result.success) {
        setMessage({ type: 'success', text: 'Nota eliminada exitosamente' });
        // Auto-ocultar mensaje después de 3 segundos
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        await loadNotas();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error deleting nota:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la nota' });
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return 'Fecha no disponible';

    try {
      const date = fecha instanceof Date ? fecha : new Date(fecha);
      if (isNaN(date.getTime())) return 'Fecha no disponible';

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const formatTime = (nota) => {
    // Si tiene el campo hora guardado, usarlo
    if (nota.hora) {
      return nota.hora;
    }

    // Si no, intentar extraer de la fecha
    if (!nota.fecha) return null;

    try {
      const date = nota.fecha instanceof Date ? nota.fecha : new Date(nota.fecha);
      if (isNaN(date.getTime())) return null;

      return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return null;
    }
  };

  const toggleExpand = (notaId) => {
    setExpandedNota(expandedNota === notaId ? null : notaId);
  };

  // Funciones para manejo de selección y descarga de PDFs
  const handleToggleNota = (notaId) => {
    setSelectedNotas(prev =>
      prev.includes(notaId)
        ? prev.filter(id => id !== notaId)
        : [...prev, notaId]
    );
  };

  const handleToggleAll = () => {
    if (selectedNotas.length === notas.length) {
      setSelectedNotas([]);
    } else {
      setSelectedNotas(notas.map(n => n.id));
    }
  };

  const handleDownloadSingle = (nota) => {
    try {
      setIsDownloading(true);
      generateNotaPDF(nota, user);
      setMessage({ type: 'success', text: 'PDF descargado exitosamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedNotas.length === 0) return;

    try {
      setIsDownloading(true);
      const notasToDownload = notas.filter(n => selectedNotas.includes(n.id));
      generateMultipleNotasPDF(notasToDownload, user);
      setMessage({ type: 'success', text: `${selectedNotas.length} nota(s) descargada(s) exitosamente` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setSelectedNotas([]); // Limpiar selección
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = () => {
    if (notas.length === 0) return;

    try {
      setIsDownloading(true);
      generateMultipleNotasPDF(notas, user);
      setMessage({ type: 'success', text: `Todas las notas (${notas.length}) descargadas exitosamente` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-700 mb-2">Usuario no encontrado</h1>
          <p className="text-slate-500 mb-4">El usuario solicitado no existe</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mensaje de estado */}
      {message.text && (
        <div className={`mx-6 mt-6 p-4 rounded-xl shadow-sm border ${message.type === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              <p className="font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header con información del usuario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  {user.foto ? (
                    <img
                      src={user.foto}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-3xl font-bold shadow-md border-4 border-gray-50">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border-2 border-white ${user.type === 'atleta'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-cyan-600 text-white'
                    }`}>
                    {user.type === 'cliente' ? 'Cliente' : 'Atleta'}
                  </span>
                </div>

                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {user.name}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">{user.ocupacion}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="bg-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-gray-200 shadow-sm hover:shadow transition-shadow">
                    <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 font-medium truncate max-w-[150px]">{user.email}</span>
                  </div>

                  <div className="bg-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-gray-200 shadow-sm hover:shadow transition-shadow">
                    <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{user.telefono}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notas Clínicas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Notas Clínicas
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {notas.length} {notas.length === 1 ? 'nota registrada' : 'notas registradas'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Checkbox Seleccionar Todas */}
                {notas.length > 0 && (
                  <button
                    onClick={handleToggleAll}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={selectedNotas.length === notas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  >
                    {selectedNotas.length === notas.length ? (
                      <CheckSquare className="w-4 h-4 mr-2 text-cyan-600" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    {selectedNotas.length === notas.length ? 'Deseleccionar' : 'Seleccionar todas'}
                  </button>
                )}

                {/* Botón Descargar Seleccionadas */}
                {selectedNotas.length > 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    disabled={isDownloading}
                    className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Seleccionadas ({selectedNotas.length})
                  </button>
                )}

                {/* Botón Descargar Todas */}
                {notas.length > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Todas
                  </button>
                )}

                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Nota Clínica
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {notas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No hay notas clínicas
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm">
                  Este usuario aún no tiene notas clínicas registradas. Haz clic en &quot;Nueva Nota Clínica&quot; para crear la primera.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-5 py-2.5 font-semibold shadow-sm transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Nota
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {notas.map((nota, index) => (
                  <div
                    key={nota.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Header de la nota - clickeable */}
                    <div
                      className="bg-gray-50 px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleExpand(nota.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 flex-wrap">
                        {/* Checkbox de selección */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNota(nota.id);
                          }}
                          className="flex-shrink-0 hover:scale-110 transition-transform"
                          title={selectedNotas.includes(nota.id) ? 'Deseleccionar' : 'Seleccionar'}
                        >
                          {selectedNotas.includes(nota.id) ? (
                            <CheckSquare className="w-5 h-5 text-cyan-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-cyan-600" />
                          <span className="font-semibold text-gray-900">
                            {formatDate(nota.fecha)}
                          </span>
                        </div>
                        {formatTime(nota) && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatTime(nota)}
                            </span>
                          </div>
                        )}
                        {nota.numeroSesion && (
                          <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                            Sesión #{nota.numeroSesion}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSingle(nota);
                          }}
                          disabled={isDownloading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Descargar PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(nota);
                          }}
                          className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Editar nota"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(nota.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar nota"
                        >
                          <Trash2 size={18} />
                        </button>
                        {expandedNota === nota.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Contenido expandible */}
                    {expandedNota === nota.id && (
                      <div className="px-5 py-4 bg-white space-y-4">
                        {nota.subjetivo && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                              Subjetivo
                            </h4>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {nota.subjetivo}
                            </p>
                          </div>
                        )}

                        {nota.objetivo && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                              Objetivo
                            </h4>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {nota.objetivo}
                            </p>
                          </div>
                        )}

                        {nota.evaluacion && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                              Evaluación
                            </h4>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {nota.evaluacion}
                            </p>
                          </div>
                        )}

                        {nota.planTerapeutico && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                              Plan Terapéutico
                            </h4>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {nota.planTerapeutico}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear/editar nota */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            {/* Header del modal */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {isEditing ? 'Editar Nota Clínica' : 'Nueva Nota Clínica'}
                    </h3>
                    <p className="text-gray-600 text-sm">Completa los campos de la nota</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Fecha, Hora y Número de Sesión */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    Hora
                  </label>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    No. de Sesión (opcional)
                  </label>
                  <input
                    type="number"
                    name="numeroSesion"
                    value={formData.numeroSesion}
                    onChange={handleInputChange}
                    placeholder="Ej: 1, 2, 3..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    min="1"
                  />
                </div>
              </div>

              {/* Subjetivo */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  SUBJETIVO
                </label>
                <textarea
                  name="subjetivo"
                  value={formData.subjetivo}
                  onChange={handleInputChange}
                  placeholder="Actualmente refiere las siguientes manifestaciones..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                />
              </div>

              {/* Objetivo */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  OBJETIVO
                </label>
                <textarea
                  name="objetivo"
                  value={formData.objetivo}
                  onChange={handleInputChange}
                  placeholder="Evaluación objetiva del paciente..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                />
              </div>

              {/* Evaluación */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  EVALUACIÓN
                </label>
                <textarea
                  name="evaluacion"
                  value={formData.evaluacion}
                  onChange={handleInputChange}
                  placeholder="Evaluación profesional..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                />
              </div>

              {/* Plan Terapéutico */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  PLAN TERAPÉUTICO
                </label>
                <textarea
                  name="planTerapeutico"
                  value={formData.planTerapeutico}
                  onChange={handleInputChange}
                  placeholder="Plan de tratamiento..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditing ? 'Actualizar Nota' : 'Guardar Nota'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default NotasClinicasPage;

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const host = context.req.headers.host;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    // Llamar a la API para obtener datos del usuario
    const userResponse = await fetch(`${baseUrl}/api/clientes/${id}`);

    if (!userResponse.ok) {
      return { notFound: true };
    }

    const userData = await userResponse.json();

    if (!userData.success || !userData.data) {
      return { notFound: true };
    }

    // Construir objeto de usuario compatible
    const cliente = userData.data;
    const user = {
      id: cliente.id,
      name: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
      email: cliente.email || 'Sin email',
      telefono: cliente.telefonoContacto || 'Sin teléfono',
      ocupacion: cliente.ocupacion || 'Sin especificar',
      foto: cliente.foto || null,
      type: 'cliente'
    };

    // Obtener notas clínicas
    const notasResponse = await fetch(`${baseUrl}/api/clientes/${id}/notas-clinicas`);
    let initialNotas = [];

    if (notasResponse.ok) {
      const notasData = await notasResponse.json();
      initialNotas = notasData.notas || [];
    }

    return {
      props: {
        initialUser: user,
        initialUserType: 'cliente',
        initialNotas
      },
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    return { notFound: true };
  }
}
