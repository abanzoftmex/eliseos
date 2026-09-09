import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Calendar, User, Loader2, Search, Clock, MapPin, Tag } from 'lucide-react';

const ParticipantsSidePanel = ({ classData, isOpen, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const classId = classData?.id;

  useEffect(() => {
    if (isOpen && classId) {
      loadParticipants();
    }
  }, [isOpen, classId]);

  const loadParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clases/${classId}/usuarios?limit=100`);
      const result = await response.json();

      if (result.success) {
        setParticipants(result.data.users);
      } else {
        setError(result.error || 'Error al cargar participantes');
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      setError('Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type) => {
    const colors = {
      grupal: 'bg-blue-500',
      personalizado: 'bg-purple-500',
      sesion: 'bg-green-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTypeLabel = (type) => {
    const labels = {
      grupal: 'Grupal',
      personalizado: 'Personalizado',
      sesion: 'Sesión'
    };
    return labels[type] || type;
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const formatDays = (diasSemana) => {
    if (!diasSemana || diasSemana.length === 0) return '';
    const diasMap = {
      'lunes': 'Lun',
      'martes': 'Mar',
      'miercoles': 'Mié',
      'jueves': 'Jue',
      'viernes': 'Vie',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };
    return diasSemana.map(dia => diasMap[dia] || dia).join(', ');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-b border-cyan-800">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Users size={24} />
                <h2 className="text-xl font-bold">Participantes</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {classData && (
              <div className="space-y-2">
                {/* Nombre de la clase */}
                <div>
                  <h3 className="text-lg font-bold text-white truncate">
                    {classData.nombre}
                  </h3>
                </div>

                {/* Tipo de clase */}
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-cyan-200 flex-shrink-0" />
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getTypeColor(classData.tipo)} text-white`}>
                    {getTypeLabel(classData.tipo)}
                  </span>
                </div>

                {/* Información adicional en grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Horario */}
                  {(classData.horaInicio || classData.horaEspecifica) && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100">
                        {formatTime(classData.horaInicio || classData.horaEspecifica)}
                      </span>
                    </div>
                  )}

                  {/* Duración */}
                  {classData.duracion && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100">
                        {classData.duracion} min
                      </span>
                    </div>
                  )}

                  {/* Ubicación */}
                  {classData.ubicacion && (
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100 truncate">
                        {classData.ubicacion}
                      </span>
                    </div>
                  )}

                  {/* Días de la semana */}
                  {classData.diasSemana && classData.diasSemana.length > 0 && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100">
                        {formatDays(classData.diasSemana)}
                      </span>
                    </div>
                  )}

                  {/* Fecha específica */}
                  {classData.fechaEspecifica && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100">
                        {formatDate(classData.fechaEspecifica)}
                      </span>
                    </div>
                  )}

                  {/* Max participantes */}
                  {classData.maxParticipantes && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Users size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100">
                        Máx: {classData.maxParticipantes} personas
                      </span>
                    </div>
                  )}

                  {/* Instructor */}
                  {classData.instructor && (
                    <div className="flex items-center gap-2 col-span-2">
                      <User size={14} className="text-cyan-200 flex-shrink-0" />
                      <span className="text-sm text-cyan-100 truncate">
                        {classData.instructor}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar participantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 360px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="animate-spin text-cyan-600 mb-4" size={32} />
              <p className="text-gray-500">Cargando participantes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <div className="text-red-500 mb-2">
                <Users size={48} />
              </div>
              <p className="text-gray-800 font-semibold mb-1">Error</p>
              <p className="text-gray-500 text-sm text-center">{error}</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <Users className="text-gray-300 mb-4" size={48} />
              <p className="text-gray-800 font-semibold mb-1">
                {searchTerm ? 'No se encontraron participantes' : 'Sin participantes'}
              </p>
              <p className="text-gray-500 text-sm text-center">
                {searchTerm 
                  ? 'No hay participantes que coincidan con tu búsqueda'
                  : 'Esta clase aún no tiene participantes asignados'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Counter */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-cyan-900">
                    Total de participantes:
                  </span>
                  <span className="text-lg font-bold text-cyan-600">
                    {filteredParticipants.length}
                  </span>
                </div>
              </div>

              {/* Participants List */}
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.assignmentId || participant.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {participant.name}
                      </h3>
                      <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        participant.type === 'Cliente' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {participant.type}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{participant.email}</span>
                  </div>

                  {/* Assigned Date */}
                  {participant.assignedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>Asignado: {formatDate(participant.assignedAt)}</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  {participant.estado && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        participant.estado === 'activa' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.estado === 'activa' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantsSidePanel;
