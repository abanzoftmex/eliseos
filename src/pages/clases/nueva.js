import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faCalendar, 
  faUsers, 
  faClock, 
  faMapMarkerAlt, 
  faDollarSign, 
  faUpload, 
  faMagnifyingGlass as faSearch, 
  faTimes as faX 
} from '@fortawesome/free-solid-svg-icons';
import useSucursalStore from '../../store/sucursalStore';

import { 
  createClass,
  CLASS_TYPES,
  CLASS_TYPE_LABELS,
  uploadClassImage
} from '../../../lib/firebase/classesService';

function NuevaClasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const sucursales = useSucursalStore((state) => state.sucursales);
  
  // Estados para búsqueda de clientes
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteSearchResults, setClienteSearchResults] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Estados para directorio (instructores)
  const [profesionales, setProfesionales] = useState([]);
  const [loadingProfesionales, setLoadingProfesionales] = useState(true);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: CLASS_TYPES.GRUPAL,
    instructor: '',
    instructorId: '',
    precio: '',
    duracion: '60',
    ubicacion: '',
    sucursal: '',
    maxParticipantes: '20',
    equipamientoNecesario: '',
    // Modo de programación: 'recurrente' o 'especifica'
    modoProgramacion: 'recurrente',
    // Campos para modo recurrente (días de la semana)
    diasSemana: [],
    horaInicio: '',
    // Campos para modo específico (fechas y horas concretas)
    fechasEspecificas: [], // Array de objetos {fecha: 'YYYY-MM-DD', hora: 'HH:MM'}
    // Campos específicos para entrenamientos personalizados
    clienteAsignado: '',
    objetivos: '',
    plan: '',
    // Campos específicos para sesiones
    tipoSesion: 'masaje',
    notas: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Estados para agregar fechas/horas específicas múltiples
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');

  // Cargar profesionales del directorio al montar el componente
  useEffect(() => {
    const fetchProfesionales = async () => {
      try {
        setLoadingProfesionales(true);
        const response = await fetch('/api/directorio?limit=all');
        const result = await response.json();
        
        if (result.success) {
          setProfesionales(result.data || []);
        } else {
          toast.error('Error al cargar profesionales del directorio');
        }
      } catch (error) {
        console.error('Error fetching profesionales:', error);
        toast.error('Error al cargar profesionales');
      } finally {
        setLoadingProfesionales(false);
      }
    };

    fetchProfesionales();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'diasSemana') {
        const newDias = checked 
          ? [...formData.diasSemana, value]
          : formData.diasSemana.filter(dia => dia !== value);
        setFormData(prev => ({ ...prev, diasSemana: newDias }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      // Si cambia el tipo de clase, actualizar el precio por defecto
      if (name === 'tipo') {
        const defaultPrice = (value !== CLASS_TYPES.GRUPAL) ? '800' : '';
        const defaultCupo = (value === CLASS_TYPES.GRUPAL) ? '20' : '1';
        setFormData(prev => ({ ...prev, [name]: value, precio: defaultPrice, maxParticipantes: defaultCupo }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Buscar clientes con debounce
  useEffect(() => {
    if (clienteSearch.trim().length < 2) {
      setClienteSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await searchClientes(clienteSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [clienteSearch]);

  const searchClientes = async (search) => {
    setLoadingClientes(true);
    try {
      const response = await fetch(`/api/clientes?search=${encodeURIComponent(search)}&limit=10`);
      const result = await response.json();
      
      if (result.success) {
        setClienteSearchResults(result.data || []);
        setShowClienteDropdown(true);
      }
    } catch (error) {
      console.error('Error searching clientes:', error);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setFormData(prev => ({ ...prev, clienteAsignado: cliente.id }));
    setClienteSearch(`${cliente.nombre} ${cliente.apellidoPaterno || ''}`);
    setShowClienteDropdown(false);
  };

  const handleClearCliente = () => {
    setSelectedCliente(null);
    setFormData(prev => ({ ...prev, clienteAsignado: '' }));
    setClienteSearch('');
    setClienteSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading('Creando clase...');

    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        throw new Error('El nombre de la clase es requerido');
      }

      if (!formData.instructor.trim()) {
        throw new Error('El instructor es requerido');
      }

      // Validaciones según el modo de programación
      if (formData.modoProgramacion === 'recurrente') {
        // Modo recurrente: necesita días de la semana y hora de inicio
        if (!formData.horaInicio) {
          throw new Error('La hora de inicio es requerida para actividades recurrentes');
        }
        if (formData.diasSemana.length === 0) {
          throw new Error('Debes seleccionar al menos un día de la semana para actividades recurrentes');
        }
      } else if (formData.modoProgramacion === 'especifica') {
        // Modo específico: necesita al menos una fecha y hora
        if (formData.fechasEspecificas.length === 0) {
          throw new Error('Debes agregar al menos una fecha y hora específica');
        }
      }

      // Validaciones adicionales según el tipo de actividad
      if (formData.tipo === CLASS_TYPES.PERSONALIZADO || formData.tipo === CLASS_TYPES.SESION) {
        if (!formData.clienteAsignado) {
          throw new Error('Debes asignar un cliente para esta actividad');
        }
      }

      if (formData.tipo === CLASS_TYPES.SESION && !formData.tipoSesion) {
        throw new Error('Debes seleccionar el tipo de sesión');
      }

      // Preparar datos para enviar
      const classData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo,
        instructor: formData.instructor.trim(),
        instructorId: formData.instructorId || '',
        precio: parseFloat(formData.precio) || 0,
        duracion: parseInt(formData.duracion) || 60,
        ubicacion: formData.ubicacion.trim(),
        sucursal: formData.sucursal || '',
        equipamientoNecesario: formData.equipamientoNecesario 
          ? formData.equipamientoNecesario.split(',').map(item => item.trim())
          : [],
        modoProgramacion: formData.modoProgramacion
      };

      // Agregar datos de horario según el modo de programación
      if (formData.modoProgramacion === 'recurrente') {
        // Actividades recurrentes: días de la semana + hora fija
        classData.diasSemana = formData.diasSemana;
        classData.horaInicio = formData.horaInicio;
      } else {
        // Actividades específicas: array de fechas y horas
        classData.fechasEspecificas = formData.fechasEspecificas;
      }

      // Cupo: lo define el admin para CUALQUIER tipo (default 1 si lo dejan vacío)
      classData.maxParticipantes = parseInt(formData.maxParticipantes) || 1;

      // Campos específicos según el tipo
      if (formData.tipo === CLASS_TYPES.PERSONALIZADO) {
        classData.clienteAsignado = formData.clienteAsignado || null;
        classData.objetivos = formData.objetivos
          ? formData.objetivos.split(',').map(obj => obj.trim())
          : [];
        classData.plan = formData.plan.trim();
      } else if (formData.tipo === CLASS_TYPES.SESION) {
        classData.tipoSesion = formData.tipoSesion;
        classData.clienteAsignado = formData.clienteAsignado || null;
        classData.notas = formData.notas.trim();
      }

      // Crear la clase
      const result = await createClass(classData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Subir imagen si existe
      if (imageFile && result.classId) {
        toast.loading('Subiendo imagen...', { id: loadingToast });
        const uploadResult = await uploadClassImage(result.classId, imageFile);
        if (!uploadResult.success) {
          console.warn('Error uploading image:', uploadResult.error);
          // No interrumpir el flujo por error de imagen
        }
      }

      toast.success('¡Clase creada exitosamente!', { id: loadingToast });
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push(`/clases/${result.classId}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating class:', error);
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const diasSemanaOptions = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        
        {/* Encabezado */}
        <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center ml-16 lg:ml-0">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendar} className="w-8 h-8 text-cyan-600" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-teal-700 bg-clip-text text-transparent">
                    Crear nueva Actividad
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Define los detalles de la nueva actividad para el miembro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Formulario Completo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 ">
          {/* Información básica */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Actividad *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Ej: Yoga matutino, Entrenamiento funcional..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Actividad *
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Descripción detallada de la actividad..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Responsable y horarios */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Responsable y Horarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable (Personal Interno) *
                  </label>
                  <select
                    name="instructor"
                    value={formData.instructorId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const profesional = profesionales.find(p => p.id === selectedId);
                        if (profesional) {
                          const nombreCompleto = `${profesional.nombre} ${profesional.apellidoPaterno || ''} ${profesional.apellidoMaterno || ''}`.trim();
                          setFormData(prev => ({ 
                            ...prev, 
                            instructor: nombreCompleto,
                            instructorId: selectedId 
                          }));
                        }
                      } else {
                        setFormData(prev => ({ ...prev, instructor: '', instructorId: '' }));
                      }
                    }}
                    required
                    disabled={loadingProfesionales}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingProfesionales ? 'Cargando profesionales...' : 'Selecciona un responsable'}
                    </option>
                    {profesionales.map((profesional) => (
                      <option key={profesional.id} value={profesional.id}>
                        {profesional.nombre} {profesional.apellidoPaterno || ''} {profesional.apellidoMaterno || ''} 
                        {profesional.especialidad ? ` - ${profesional.especialidad}` : ''}
                        {profesional.puesto ? ` (${profesional.puesto})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Selecciona al profesional responsable de esta actividad
                  </p>
                </div>

                {/* Selector de Modo de Programación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de Programación *
                  </label>
                  <select
                    name="modoProgramacion"
                    value={formData.modoProgramacion}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="recurrente">Días recurrentes (se repite semanalmente)</option>
                    <option value="especifica">Fechas y horas específicas</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.modoProgramacion === 'recurrente' 
                      ? 'La actividad se repetirá cada semana en los días seleccionados' 
                      : 'Define fechas y horas concretas para la actividad'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleInputChange}
                    min="15"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Salón, gimnasio, piscina..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal
                  </label>
                  <select
                    name="sucursal"
                    value={formData.sucursal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">Sin sucursal</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modo Recurrente: Días de la semana + hora fija */}
              {formData.modoProgramacion === 'recurrente' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      name="horaInicio"
                      value={formData.horaInicio}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Días de la semana *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {diasSemanaOptions.map(dia => (
                        <label 
                          key={dia.value} 
                          className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.diasSemana.includes(dia.value)
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'bg-white border-gray-300 hover:border-emerald-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="diasSemana"
                            value={dia.value}
                            checked={formData.diasSemana.includes(dia.value)}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{dia.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      La actividad se repetirá cada semana en los días seleccionados a las {formData.horaInicio || '__:__'}
                    </p>
                  </div>
                </div>
              )}

              {/* Modo Específico: Fechas y horas concretas */}
              {formData.modoProgramacion === 'especifica' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Agregar Fecha y Hora *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="date"
                          value={nuevaFecha}
                          onChange={(e) => setNuevaFecha(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          placeholder="Fecha"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          value={nuevaHora}
                          onChange={(e) => setNuevaHora(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          placeholder="Hora"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (nuevaFecha && nuevaHora) {
                              setFormData(prev => ({
                                ...prev,
                                fechasEspecificas: [
                                  ...prev.fechasEspecificas,
                                  { fecha: nuevaFecha, hora: nuevaHora }
                                ]
                              }));
                              setNuevaFecha('');
                              setNuevaHora('');
                            } else {
                              toast.error('Debes seleccionar fecha y hora');
                            }
                          }}
                          className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de fechas agregadas */}
                  {formData.fechasEspecificas.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fechas y horas programadas ({formData.fechasEspecificas.length})
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {formData.fechasEspecificas.map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium text-gray-900">
                                {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-emerald-600 ml-2" />
                              <span className="text-gray-700">{item.hora}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  fechasEspecificas: prev.fechasEspecificas.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <FontAwesomeIcon icon={faX} className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.fechasEspecificas.length === 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        ⚠️ Debes agregar al menos una fecha y hora para la actividad
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Precio y participantes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Precio y Participantes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="precio"
                      value={formData.precio}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Participantes (cupos)
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUsers} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="maxParticipantes"
                      value={formData.maxParticipantes}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Número de lugares disponibles por sesión. Usa 1 para atención individual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campos específicos por tipo de actividad de entrenamiento personalizado */}
          {formData.tipo === CLASS_TYPES.PERSONALIZADO && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Configuración de Actividad Personalizada</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miembro *
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={clienteSearch}
                          onChange={(e) => {
                            setClienteSearch(e.target.value);
                            if (selectedCliente) {
                              setSelectedCliente(null);
                              setFormData(prev => ({ ...prev, clienteAsignado: '' }));
                            }
                          }}
                          onFocus={() => clienteSearchResults.length > 0 && setShowClienteDropdown(true)}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Buscar cliente por nombre o email..."
                        />
                        {selectedCliente && (
                          <button
                            type="button"
                            onClick={handleClearCliente}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FontAwesomeIcon icon={faX} className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown de resultados */}
                      {showClienteDropdown && clienteSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {clienteSearchResults.map((cliente) => (
                            <button
                              key={cliente.id}
                              type="button"
                              onClick={() => handleSelectCliente(cliente)}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                              </div>
                              <div className="text-sm text-gray-600">
                                {cliente.email}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mensaje de carga */}
                      {loadingClientes && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-600">
                          Buscando clientes...
                        </div>
                      )}

                      {/* Cliente seleccionado */}
                      {selectedCliente && (
                        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-emerald-900">
                                ✓ {selectedCliente.nombre} {selectedCliente.apellidoPaterno}
                              </div>
                              <div className="text-sm text-emerald-700">
                                {selectedCliente.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objetivos (separados por comas)
                    </label>
                    <input
                      type="text"
                      name="objetivos"
                      value={formData.objetivos}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Ej: Pérdida de peso, Fortalecimiento, Flexibilidad"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan de Entrenamiento
                    </label>
                    <textarea
                      name="plan"
                      value={formData.plan}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Descripción detallada del plan de entrenamiento..."
                    />
                  </div>
                </div>
              </div>
          </div>
          )}
            
          {/* Campos específicos por tipo de actividad de sesion </div> */}
          {formData.tipo === CLASS_TYPES.SESION && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Configuración de Sesión</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Sesión
                  </label>
                  <select
                    name="tipoSesion"
                    value={formData.tipoSesion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="masaje">Masaje</option>
                    <option value="rehabilitacion">Rehabilitación</option>
                    <option value="fisioterapia">Fisioterapia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={clienteSearch}
                        onChange={(e) => {
                          setClienteSearch(e.target.value);
                          if (selectedCliente) {
                            setSelectedCliente(null);
                            setFormData(prev => ({ ...prev, clienteAsignado: '' }));
                          }
                        }}
                        onFocus={() => clienteSearchResults.length > 0 && setShowClienteDropdown(true)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Buscar cliente por nombre o email..."
                      />
                      {selectedCliente && (
                        <button
                          type="button"
                          onClick={handleClearCliente}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={faX} className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown de resultados */}
                    {showClienteDropdown && clienteSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {clienteSearchResults.map((cliente) => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => handleSelectCliente(cliente)}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                            </div>
                            <div className="text-sm text-gray-600">
                              {cliente.email}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mensaje de carga */}
                    {loadingClientes && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-600">
                        Buscando clientes...
                      </div>
                    )}

                    {/* Cliente seleccionado */}
                    {selectedCliente && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-emerald-900">
                              ✓ {selectedCliente.nombre} {selectedCliente.apellidoPaterno}
                            </div>
                            <div className="text-sm text-emerald-700">
                              {selectedCliente.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de la Sesión
                  </label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Notas especiales, tratamiento, etc..."
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Equipamiento */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Equipamiento y Imagen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipamiento Necesario (separado por comas)
                  </label>
                  <input
                    type="text"
                    name="equipamientoNecesario"
                    value={formData.equipamientoNecesario}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Ej: Esterilla, mancuernas, bandas elásticas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de la Actividad
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="mb-4">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="mx-auto h-32 w-auto rounded-lg"
                          />
                        </div>
                      ) : (
                        <FontAwesomeIcon icon={faUpload} className="w-12 h-12 text-gray-400 mx-auto" />
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                          <span>Subir imagen</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creando...
                  </div>
                ) : (
                  'Crear Actividad'
                )}
              </button>
            </div>
          </div>

            
        </form>
      </main>
    </div>
  );
}

export default NuevaClasePage;