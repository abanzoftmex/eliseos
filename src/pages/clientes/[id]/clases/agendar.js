import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faClock, 
  faDollarSign, 
  faFileText, 
  faArrowLeft, 
  faPlus, 
  faSearch 
} from '@fortawesome/free-solid-svg-icons';
import { getUserType } from '../../../../../lib/firebase/packagesService';
import { db } from '../../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createClass, CLASS_TYPES, CLASS_TYPE_LABELS, getClasses, assignUserToClass } from '../../../../../lib/firebase/classesService';

function AgendarClasePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para clases grupales
  const [clasesGrupales, setClasesGrupales] = useState([]);
  const [loadingClasesGrupales, setLoadingClasesGrupales] = useState(false);
  const [selectedClaseGrupal, setSelectedClaseGrupal] = useState(null);
  
  const [userPackages, setUserPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [formData, setFormData] = useState({
    tipo: CLASS_TYPES.SESION,
    nombre: '',
    descripcion: '',
    instructor: '',
    precio: '0',
    duracion: '60',
    ubicacion: '',
    fechaEspecifica: new Date().toISOString().split('T')[0],
    horaEspecifica: '09:00',
    objetivos: '',
    plan: '',
    clienteAsignado: '',
    paymentMode: 'package', // 'package' or 'custom'
    packageId: '',
    tipoSesion: 'fisioterapia',
    notas: '',
    maxParticipantes: '1'
  });

  const loadUserData = useCallback(async () => {
    try {
      const type = await getUserType(id);
      setUserType(type);
      
      if (type) {
        const userCollection = type === 'cliente' ? 'clientes' : 'atletas';
        const userRef = doc(db, userCollection, id);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userName = `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim();
          
          setUser({
            id: id,
            name: userName,
            ...userData
          });

          setFormData(prev => ({
            ...prev,
            clienteAsignado: id,
            nombre: `Sesión de ${formData.tipoSesion} - ${userName}`
          }));

          // Cargar paquetes del usuario
          setLoadingPackages(true);
          const pkgResult = await getUserPackages(id);
          if (pkgResult.success) {
            setUserPackages(pkgResult.packages.filter(p => p.activo));
          }
          setLoadingPackages(false);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id, formData.tipoSesion]);

  useEffect(() => {
    if (!id) return;
    loadUserData();
  }, [id, loadUserData]);

  // Cargar clases grupales cuando se seleccione tipo grupal
  useEffect(() => {
    if (formData.tipo === CLASS_TYPES.GRUPAL) {
      loadClasesGrupales();
    }
  }, [formData.tipo]);

  const loadClasesGrupales = async () => {
    setLoadingClasesGrupales(true);
    try {
      const result = await getClasses({ tipo: CLASS_TYPES.GRUPAL });
      if (result.success) {
        setClasesGrupales(result.classes || []);
      } else {
        toast.error('Error al cargar clases grupales');
      }
    } catch (error) {
      console.error('Error loading clases grupales:', error);
      toast.error('Error al cargar clases grupales');
    } finally {
      setLoadingClasesGrupales(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Actualizar precio por defecto según el tipo de clase
    if (name === 'tipo') {
      const defaultPrice = value !== CLASS_TYPES.GRUPAL ? '800' : '';
      setFormData(prev => ({
        ...prev,
        [name]: value,
        precio: defaultPrice
      }));
      // Limpiar selección de clase grupal si cambia el tipo
      setSelectedClaseGrupal(null);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.tipo) {
      toast.error('Selecciona el tipo de clase');
      return;
    }

    // Si es clase grupal, solo permite asignar a clase existente
    if (formData.tipo === CLASS_TYPES.GRUPAL) {
      if (!selectedClaseGrupal) {
        toast.error('Selecciona una clase grupal');
        return;
      }

      setSubmitting(true);

      try {
        const result = await assignUserToClass(
          selectedClaseGrupal.id,
          id,
          userType
        );

        if (result.success) {
          toast.success('Usuario asignado a la clase grupal exitosamente');
          router.push(`/clientes/${id}`);
        } else {
          toast.error(result.error || 'Error al asignar a la clase');
        }
      } catch (error) {
        console.error('Error assigning to class:', error);
        toast.error('Error al asignar a la clase');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Validaciones para crear una nueva clase (personalizada o sesión)
    if (!formData.fechaEspecifica) {
      toast.error('Selecciona una fecha para la clase');
      return;
    }

    if (!formData.horaEspecifica) {
      toast.error('Selecciona una hora para la clase');
      return;
    }

    if (!formData.instructor) {
      toast.error('Ingresa el nombre del instructor');
      return;
    }

    setSubmitting(true);

    try {
      const sessionData = {
        ...formData,
        modoProgramacion: 'especifica',
        fechasEspecificas: [{
          fecha: formData.fechaEspecifica,
          hora: formData.horaEspecifica
        }],
        precio: Number(formData.precio) || 0,
        estado: 'programada'
      };

      const response = await fetch('/api/admin/clases/agendar-especifica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          userType: userType,
          sessionData: sessionData
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Sesión agendada correctamente');
        router.push(`/clientes/${id}`);
      } else {
        toast.error(result.error || 'Error al agendar la clase');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Error al agendar la clase');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
     
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-slate-700">Cargando...</p>
          </div>
        </div>
    
    );
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-slate-700">Usuario no encontrado</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
   
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Volver
          </button>
          
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              {user.foto ? (
                <img 
                  src={user.foto} 
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">Agendar Actividad</h1>
                <p className="text-cyan-100">Para {user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Tipo de Clase */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Clase *
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                required
              >
                {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de modo para clases grupales */}
            {formData.tipo === CLASS_TYPES.GRUPAL && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4">
                  Selecciona una clase grupal para asignar al usuario
                </h4>

                {/* Selector de clases grupales existentes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Clases Grupales Disponibles *
                  </label>
                  {loadingClasesGrupales ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Cargando clases...</p>
                    </div>
                  ) : clasesGrupales.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600">No hay clases grupales disponibles</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Las clases grupales deben crearse desde la sección de Clases
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {clasesGrupales.map((clase) => (
                          <button
                            key={clase.id}
                            type="button"
                            onClick={() => setSelectedClaseGrupal(clase)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              selectedClaseGrupal?.id === clase.id
                                ? 'border-cyan-500 bg-cyan-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-cyan-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900">{clase.nombre}</h5>
                                {clase.descripcion && (
                                  <p className="text-sm text-gray-600 mt-1">{clase.descripcion}</p>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-700">
                                  {clase.instructor && (
                                    <span className="flex items-center gap-1">
                                      👤 {clase.instructor}
                                    </span>
                                  )}
                                  {clase.diasSemana && clase.diasSemana.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      📅 {clase.diasSemana.join(', ')}
                                    </span>
                                  )}
                                  {clase.horaInicio && (
                                    <span className="flex items-center gap-1">
                                      🕐 {clase.horaInicio}
                                    </span>
                                  )}
                                  {clase.ubicacion && (
                                    <span className="flex items-center gap-1">
                                      📍 {clase.ubicacion}
                                    </span>
                                  )}
                                  {clase.maxParticipantes && (
                                    <span className="flex items-center gap-1">
                                      👥 {clase.participantesActuales || 0}/{clase.maxParticipantes}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedClaseGrupal?.id === clase.id && (
                                <div className="ml-3 text-cyan-600">
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Mostrar campos solo si NO es clase grupal */}
            {formData.tipo !== CLASS_TYPES.GRUPAL && (
              <>
                {/* Nombre de la clase (opcional, se puede editar) */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de la Clase (opcional)
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="Ej: Sesión de fisioterapia"
                  />
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fechaEspecifica" className="block text-sm font-semibold text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 inline mr-1" />
                      Fecha *
                    </label>
                    <input
                      type="date"
                      id="fechaEspecifica"
                      name="fechaEspecifica"
                      value={formData.fechaEspecifica}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="horaEspecifica" className="block text-sm font-semibold text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 inline mr-1" />
                      Hora *
                    </label>
                    <input
                      type="time"
                      id="horaEspecifica"
                      name="horaEspecifica"
                      value={formData.horaEspecifica}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Resto de campos - solo si NO es clase grupal */}
            {formData.tipo !== CLASS_TYPES.GRUPAL && (
              <>
                {/* Instructor */}
                <div>
                  <label htmlFor="instructor" className="block text-sm font-semibold text-gray-700 mb-2">
                    Instructor *
                  </label>
                  <input
                    type="text"
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="Nombre del instructor"
                    required
                  />
                </div>

                {/* Duración y Modo de Pago */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="duracion" className="block text-sm font-semibold text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 inline mr-1" />
                      Duración (minutos)
                    </label>
                    <input
                      type="number"
                      id="duracion"
                      name="duracion"
                      value={formData.duracion}
                      onChange={handleInputChange}
                      min="15"
                      step="15"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="paymentMode" className="block text-sm font-semibold text-gray-700 mb-2">
                      Modo de Pago *
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'package', precio: '0' }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.paymentMode === 'package' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}
                      >
                        Cargar a Paquete
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'custom', packageId: '' }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.paymentMode === 'custom' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}
                      >
                        Costo Personalizado
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalles de Pago Dinámicos */}
                <div className="animate-fade-in">
                  {formData.paymentMode === 'package' ? (
                    <div>
                      <label htmlFor="packageId" className="block text-sm font-semibold text-gray-700 mb-2">
                        Seleccionar Paquete Destino *
                      </label>
                      <select
                        id="packageId"
                        name="packageId"
                        value={formData.packageId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        required={formData.paymentMode === 'package'}
                      >
                        <option value="">— Seleccionar Paquete —</option>
                        {userPackages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.nombre} ({pkg.numeroServicios - (pkg.sessionsTaken || 0)} ses. restantes)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="precio" className="block text-sm font-semibold text-gray-700 mb-2">
                        <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4 inline mr-1" />
                        Precio de la Sesión (MXN) *
                      </label>
                      <input
                        type="number"
                        id="precio"
                        name="precio"
                        value={formData.precio}
                        onChange={handleInputChange}
                        min="0"
                        step="50"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        placeholder="800"
                        required={formData.paymentMode === 'custom'}
                      />
                      <p className="mt-2 text-[10px] text-gray-400 font-medium italic">
                        * Esta actividad se registrará como una deuda pendiente en el estado de cuenta del portal.
                      </p>
                    </div>
                  )}
                </div>

                {/* Ubicación */}
                <div>
                  <label htmlFor="ubicacion" className="block text-sm font-semibold text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    id="ubicacion"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="Consultorio, sala, etc."
                  />
                </div>
              </>
            )}

            {/* Objetivos (solo para entrenamientos personalizados) */}
            {formData.tipo === CLASS_TYPES.PERSONALIZADO && (
              <div>
                <label htmlFor="objetivos" className="block text-sm font-semibold text-gray-700 mb-2">
                  Objetivos
                </label>
                <textarea
                  id="objetivos"
                  name="objetivos"
                  value={formData.objetivos}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                  placeholder="Objetivos del entrenamiento"
                />
              </div>
            )}

            {/* Plan (solo para entrenamientos personalizados) */}
            {formData.tipo === CLASS_TYPES.PERSONALIZADO && (
              <div>
                <label htmlFor="plan" className="block text-sm font-semibold text-gray-700 mb-2">
                  Plan de Entrenamiento
                </label>
                <textarea
                  id="plan"
                  name="plan"
                  value={formData.plan}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                  placeholder="Descripción del plan de entrenamiento"
                />
              </div>
            )}

            {/* Campos específicos para sesiones */}
            {formData.tipo === CLASS_TYPES.SESION && (
              <div>
                <label htmlFor="tipoSesion" className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Sesión
                </label>
                <select
                  id="tipoSesion"
                  name="tipoSesion"
                  value={formData.tipoSesion || 'masaje'}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                >
                  <option value="masaje">Masaje</option>
                  <option value="rehabilitacion">Rehabilitación</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            )}

            {/* Descripción/Notas */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-2">
                <FontAwesomeIcon icon={faFileText} className="w-4 h-4 inline mr-1" />
                Notas o Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
                placeholder="Notas adicionales sobre la clase"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Agendando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                  Agendar Clase
                </>
              )}
            </button>
          </div>
        </form>
      </div>
  
  );
}

export default AgendarClasePage;
