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
import useSucursalStore from '../../../store/sucursalStore';

import { 
  getClassById,
  updateClass,
  uploadClassImage,
  CLASS_TYPES,
  CLASS_TYPE_LABELS
} from '../../../../lib/firebase/classesService';

function EditarClasePage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    modoProgramacion: 'recurrente',
    instructor: '',
    instructorId: '',
    precio: '',
    duracion: '60',
    ubicacion: '',
    sucursal: '',
    maxParticipantes: '20',
    equipamientoNecesario: '',
    // Campos para clases recurrentes
    diasSemana: [],
    horaInicio: '',
    // Campos para clases de fecha específica
    fechaEspecifica: '',
    horaEspecifica: '',
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

  useEffect(() => {
    if (id) {
      loadClass();
    }
  }, [id]);

  // Sincronizar instructorId cuando profesionales y datos de clase estén listos
  useEffect(() => {
    if (profesionales.length > 0 && formData.instructor && !formData.instructorId) {
      const match = profesionales.find(p => {
        const nombre = `${p.nombre} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.trim();
        return nombre === formData.instructor;
      });
      if (match) {
        setFormData(prev => ({ ...prev, instructorId: match.id }));
      }
    }
  }, [profesionales, formData.instructor, formData.instructorId]);

  const loadClass = async () => {
    try {
      const result = await getClassById(id);
      if (result.success) {
        const classData = result.class;
        
        // Extraer fecha y hora específica del array fechasEspecificas si existe
        let fechaEspecifica = classData.fechaEspecifica || '';
        let horaEspecifica = classData.horaEspecifica || '';
        
        if (classData.modoProgramacion === 'especifica' && classData.fechasEspecificas?.length > 0) {
          const primera = classData.fechasEspecificas[0];
          if (!fechaEspecifica && primera.fecha) {
            fechaEspecifica = primera.fecha;
          }
          if (!horaEspecifica && primera.hora) {
            horaEspecifica = primera.hora;
          }
        }

        setFormData({
          nombre: classData.nombre || '',
          descripcion: classData.descripcion || '',
          tipo: classData.tipo || CLASS_TYPES.GRUPAL,
          modoProgramacion: classData.modoProgramacion || 'recurrente',
          instructor: classData.instructor || '',
          instructorId: classData.instructorId || '',
          precio: classData.precio?.toString() || '',
          duracion: classData.duracion?.toString() || '60',
          ubicacion: classData.ubicacion || '',
          sucursal: classData.sucursal || '',
          maxParticipantes: classData.maxParticipantes?.toString() || '20',
          equipamientoNecesario: classData.equipamientoNecesario?.join(', ') || '',
          // Horarios recurrentes
          diasSemana: classData.diasSemana || [],
          horaInicio: classData.horaInicio || '',
          // Horarios específicos
          fechaEspecifica,
          horaEspecifica,
          // Campos específicos
          clienteAsignado: classData.clienteAsignado || '',
          objetivos: classData.objetivos?.join(', ') || '',
          plan: classData.plan || '',
          tipoSesion: classData.tipoSesion || 'masaje',
          notas: classData.notas || ''
        });
        
        if (classData.imageUrl) {
          setImagePreview(classData.imageUrl);
        }
      } else {
        toast.error('No se pudo cargar la clase');
      }
    } catch (error) {
      console.error('Error loading class:', error);
      toast.error('Error al cargar la clase');
    } finally {
      setLoading(false);
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
        setFormData(prev => ({ ...prev, [name]: value, precio: defaultPrice }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const loadingToast = toast.loading('Actualizando clase...');

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
        if (!formData.horaInicio) {
          throw new Error('La hora de inicio es requerida');
        }
        if (formData.diasSemana.length === 0) {
          throw new Error('Debes seleccionar al menos un día de la semana');
        }
      } else {
        if (!formData.fechaEspecifica) {
          throw new Error('La fecha es requerida');
        }
        if (!formData.horaEspecifica) {
          throw new Error('La hora es requerida');
        }
      }

      // Preparar datos para enviar
      const updateData = {
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
          : []
      };

      // Agregar datos de horario según el modo de programación
      updateData.modoProgramacion = formData.modoProgramacion;
      if (formData.modoProgramacion === 'recurrente') {
        updateData.diasSemana = formData.diasSemana;
        updateData.horaInicio = formData.horaInicio;
      } else {
        updateData.fechaEspecifica = formData.fechaEspecifica;
        updateData.horaEspecifica = formData.horaEspecifica;
        updateData.fechasEspecificas = [{
          fecha: formData.fechaEspecifica,
          hora: formData.horaEspecifica
        }];
      }

      // maxParticipantes siempre se toma del formulario
      updateData.maxParticipantes = parseInt(formData.maxParticipantes) || 20;

      // Agregar campos específicos según el tipo
      if (formData.tipo === CLASS_TYPES.PERSONALIZADO) {
        updateData.clienteAsignado = formData.clienteAsignado || null;
        updateData.objetivos = formData.objetivos 
          ? formData.objetivos.split(',').map(obj => obj.trim())
          : [];
        updateData.plan = formData.plan.trim();
      } else if (formData.tipo === CLASS_TYPES.SESION) {
        updateData.tipoSesion = formData.tipoSesion;
        updateData.clienteAsignado = formData.clienteAsignado || null;
        updateData.notas = formData.notas.trim();
      }

      // Actualizar la clase
      const result = await updateClass(id, updateData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Subir imagen si existe
      if (imageFile) {
        toast.loading('Subiendo imagen...', { id: loadingToast });
        const uploadResult = await uploadClassImage(id, imageFile);
        if (!uploadResult.success) {
          console.warn('Error uploading image:', uploadResult.error);
          // No interrumpir el flujo por error de imagen
        }
      }

      toast.success('¡Clase actualizada exitosamente!', { id: loadingToast });
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push(`/clases/${id}`);
      }, 1000);

    } catch (error) {
      console.error('Error updating class:', error);
      toast.error(error.message, { id: loadingToast });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

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
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent">
                    Editar Actividad
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Modificar información de la actividad
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-6xl mx-auto">
          
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
                    disabled // Normalmente no permitimos cambiar el tipo después de crear
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-100"
                  >
                    {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">El tipo de clase no se puede modificar</p>
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
                    placeholder="Descripción detallada de la clase..."
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

                {/* Para clases recurrentes: hora de inicio */}
                {formData.modoProgramacion === 'recurrente' && (
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
                )}

                {/* Para clases de fecha específica */}
                {formData.modoProgramacion === 'especifica' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        name="fechaEspecifica"
                        value={formData.fechaEspecifica}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora *
                      </label>
                      <input
                        type="time"
                        name="horaEspecifica"
                        value={formData.horaEspecifica}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}

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

              {/* Días de la semana - Para clases recurrentes */}
              {formData.modoProgramacion === 'recurrente' && (
                <div className="mt-6">
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
                    La clase se repetirá cada semana en los días seleccionados a las {formData.horaInicio || '__:__'}
                  </p>
                </div>
              )}

              {/* Mensaje informativo para clases de fecha específica */}
              {formData.modoProgramacion === 'especifica' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Esta clase se realizará en la fecha y hora específica seleccionada. 
                    No es una clase recurrente.
                  </p>
                </div>
              )}
            </div>
          </div>

            {/* Precio y participantes */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Precio y Participantes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Participantes
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faUsers} className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                  </div>
                </div>  
              </div>

          {/* Equipamiento necesario */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Equipamiento</h3>
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
                  placeholder="Ej: Mat de yoga, Mancuernas, Banda elástica"
                />
              </div>
            </div>
          </div>

          {/* Imagen de la actividad */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Imagen de la Actividad</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de la Actividad
                </label>
                
                {/* Preview de imagen existente o nueva */}
                {imagePreview && (
                  <div className="mb-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mx-auto h-48 w-auto rounded-lg border-2 border-gray-200 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FontAwesomeIcon icon={faUpload} className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">{imagePreview ? 'Cambiar imagen' : 'Click para subir'}</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                
                {imageFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Nueva imagen seleccionada: {imageFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Campos específicos por tipo de clase personalizada */}
          {formData.tipo === CLASS_TYPES.PERSONALIZADO && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Configuración de Clase Personalizada</h3>
              <div className="space-y-4">
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
                    placeholder="Describe el plan de entrenamiento personalizado..."
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {formData.tipo === CLASS_TYPES.SESION && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
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
                    Notas
                  </label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Notas adicionales sobre la sesión..."
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Botones */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
            <div className="flex gap-4 border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </div>
              ) : (
                'Guardar Cambios'
              )}
            </button>
            </div>
          </div>


          
        </div>
        </form>
      </main>
    </div>
  );
}

export default EditarClasePage;