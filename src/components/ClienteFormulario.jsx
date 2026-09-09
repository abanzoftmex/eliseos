import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  X,
  Check,
  User,
  Mail,
  Phone,
  FileText,
  Camera,
  Calendar,
  Users,
  ArrowLeft,
  Save,
  Activity,
  MapPin
} from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import useSucursalStore from '../store/sucursalStore';
import { invalidateClientesCache } from './dashboard/ClientesContent';

/**
 * Componente de formulario reutilizable para crear y editar clientes
 * @param {Object} props
 * @param {string} props.mode - 'create' o 'edit'
 * @param {string} props.clienteId - ID del cliente (requerido en modo edit)
 * @param {Object} props.initialData - Datos iniciales del cliente (opcional, útil en modo edit)
 * @param {Function} props.onSuccess - Callback ejecutado después de guardar exitosamente
 * @param {Function} props.onCancel - Callback ejecutado al cancelar
 * @param {boolean} props.showHeader - Mostrar encabezado del formulario (default: true)
 */
export default function ClienteFormulario({
  mode = 'create',
  clienteId = null,
  initialData = null,
  onSuccess,
  onCancel,
  showHeader = true
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profesionales, setProfesionales] = useState([]);
  const [loadingProfesionales, setLoadingProfesionales] = useState(true);
  const [loadingCliente, setLoadingCliente] = useState(mode === 'edit');
  const [showSucursalesDropdown, setShowSucursalesDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const sucursales = useSucursalStore((state) => state.sucursales);

  const [formData, setFormData] = useState({
    foto: '',
    fotoFile: null,
    fotoPreview: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    edad: '',
    fechaNacimiento: '',
    ocupacion: '',
    genero: '',
    ladoDominante: '',
    telefonoContacto: '',
    telefonoEmergencia: '',
    nombreContactoEmergencia: '',
    email: '',
    plataformaFitness: '',
    otraPlataforma: '',
    responsable: '',
    responsableId: '',
    sucursales: []
  });

  // Cargar datos del cliente en modo edición
  useEffect(() => {
    const loadClienteData = async () => {
      if (mode === 'edit' && clienteId) {
        try {
          setLoadingCliente(true);

          // Si se proporcionaron datos iniciales, usarlos
          if (initialData) {
            setFormData({
              foto: initialData.foto || '',
              fotoFile: null,
              fotoPreview: initialData.foto || '',
              nombre: initialData.nombre || '',
              apellidoPaterno: initialData.apellidoPaterno || '',
              apellidoMaterno: initialData.apellidoMaterno || '',
              edad: initialData.edad?.toString() || '',
              fechaNacimiento: initialData.fechaNacimiento || '',
              ocupacion: initialData.ocupacion || '',
              genero: initialData.genero || '',
              ladoDominante: initialData.ladoDominante || '',
              telefonoContacto: initialData.telefonoContacto || '',
              telefonoEmergencia: initialData.telefonoEmergencia || '',
              nombreContactoEmergencia: initialData.nombreContactoEmergencia || '',
              email: initialData.email || '',
              plataformaFitness: initialData.plataformaFitness || '',
              otraPlataforma: initialData.otraPlataforma || '',
              responsable: initialData.responsable || '',
              responsableId: initialData.responsableId || '',
              sucursales: Array.isArray(initialData.sucursales) ? initialData.sucursales : (initialData.sucursal ? [initialData.sucursal] : [])
            });
          } else {
            // Cargar desde Firestore
            const clienteRef = doc(db, 'clientes', clienteId);
            const clienteSnap = await getDoc(clienteRef);

            if (clienteSnap.exists()) {
              const data = clienteSnap.data();
              setFormData({
                foto: data.foto || '',
                fotoFile: null,
                fotoPreview: data.foto || '',
                nombre: data.nombre || '',
                apellidoPaterno: data.apellidoPaterno || '',
                apellidoMaterno: data.apellidoMaterno || '',
                edad: data.edad?.toString() || '',
                fechaNacimiento: data.fechaNacimiento || '',
                ocupacion: data.ocupacion || '',
                genero: data.genero || '',
                ladoDominante: data.ladoDominante || '',
                telefonoContacto: data.telefonoContacto || '',
                telefonoEmergencia: data.telefonoEmergencia || '',
                nombreContactoEmergencia: data.nombreContactoEmergencia || '',
                email: data.email || '',
                plataformaFitness: data.plataformaFitness || '',
                otraPlataforma: data.otraPlataforma || '',
                responsable: data.responsable || '',
                responsableId: data.responsableId || '',
                sucursales: Array.isArray(data.sucursales) ? data.sucursales : (data.sucursal ? [data.sucursal] : [])
              });
            } else {
              console.error('Cliente no encontrado');
              alert('No se encontró el cliente');
            }
          }
        } catch (error) {
          console.error('Error al cargar cliente:', error);
          alert('Error al cargar los datos del cliente');
        } finally {
          setLoadingCliente(false);
        }
      }
    };

    loadClienteData();
  }, [mode, clienteId, initialData]);

  // Cargar profesionales del directorio
  useEffect(() => {
    const fetchProfesionales = async () => {
      try {
        setLoadingProfesionales(true);
        const directorioRef = collection(db, 'directorio');
        const snapshot = await getDocs(directorioRef);
        const profesionalesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProfesionales(profesionalesData);
      } catch (error) {
        console.error('Error al cargar profesionales:', error);
      } finally {
        setLoadingProfesionales(false);
      }
    };

    fetchProfesionales();
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSucursal = (sucursalId) => {
    setFormData(prev => {
      const sucursales = prev.sucursales || [];
      const isSelected = sucursales.includes(sucursalId);

      return {
        ...prev,
        sucursales: isSelected
          ? sucursales.filter(id => id !== sucursalId)
          : [...sucursales, sucursalId]
      };
    });
  };

  const getSucursalesText = () => {
    const selectedSucursales = sucursales.filter(s => formData.sucursales?.includes(s.id));
    if (selectedSucursales.length === 0) return 'Seleccionar sucursales';
    if (selectedSucursales.length === 1) return selectedSucursales[0].name;
    return `${selectedSucursales.length} sucursales seleccionadas`;
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe exceder 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        fotoFile: file,
        fotoPreview: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Firebase Storage
  const uploadImageToStorage = async (file) => {
    try {
      setUploading(true);

      // Create a unique filename
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `clientes/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;

    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age.toString();
  };

  // Handle birth date change
  const handleBirthDateChange = (date) => {
    // Validar que la fecha no sea futura
    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

      if (selectedDate > today) {
        // Fecha futura detectada - rechazar
        alert('No se puede seleccionar una fecha de nacimiento futura. Por favor selecciona una fecha válida.');
        handleInputChange('fechaNacimiento', '');
        handleInputChange('edad', '');
        return;
      }
    }

    handleInputChange('fechaNacimiento', date);
    const age = calculateAge(date);
    handleInputChange('edad', age);
  };

  // Save client to Firestore
  const saveClient = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Upload photo if exists
      let photoURL = formData.foto;
      if (formData.fotoFile && !photoURL) {
        photoURL = await uploadImageToStorage(formData.fotoFile);
      } else if (formData.fotoFile) {
        // Nueva foto para actualizar
        photoURL = await uploadImageToStorage(formData.fotoFile);
      }

      // Clean data for Firestore (ensure no undefined values)
      const clientData = {
        foto: photoURL || '',
        nombre: formData.nombre || '',
        apellidoPaterno: formData.apellidoPaterno || '',
        apellidoMaterno: formData.apellidoMaterno || '',
        edad: parseInt(formData.edad) || 0,
        fechaNacimiento: formData.fechaNacimiento || '',
        ocupacion: formData.ocupacion || '',
        genero: formData.genero || '',
        ladoDominante: formData.ladoDominante || '',
        telefonoContacto: formData.telefonoContacto || '',
        telefonoEmergencia: formData.telefonoEmergencia || '',
        nombreContactoEmergencia: formData.nombreContactoEmergencia || '',
        email: formData.email || '',
        plataformaFitness: formData.plataformaFitness === 'Otra' ? formData.otraPlataforma : formData.plataformaFitness,
        responsable: formData.responsable || '',
        responsableId: formData.responsableId || '',
        sucursales: formData.sucursales || [],
        updatedAt: new Date().toISOString()
      };

      if (mode === 'edit' && clienteId) {
        try {
          // Intentar actualización directa en Firestore (usa la sesión autenticada del cliente)
          await updateDoc(doc(db, 'clientes', clienteId), clientData);
          console.log('Cliente actualizado directamente en Firestore con ID:', clienteId);
        } catch (directError) {
          console.warn('Actualización directa falló, intentando vía API:', directError);
          const response = await fetch(`/api/clientes/${clienteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'No se pudo actualizar el cliente');
          }
        }

        // Invalidar caché de clientes para refrescar la lista
        invalidateClientesCache();

        // Callback de éxito
        if (onSuccess) {
          onSuccess(clienteId, clientData);
        } else {
          router.push('/clientes');
        }
      } else {
        let savedId = null;
        let syncWarning = null;

        try {
          // Guardar directamente en Firestore con la sesión autenticada del usuario
          const docRef = await addDoc(collection(db, 'clientes'), {
            ...clientData,
            tipo: clientData.tipo || 'cliente',
            status: clientData.status || 'active',
            createdAt: new Date().toISOString()
          });
          savedId = docRef.id;
          console.log('Cliente guardado exitosamente en Firestore con ID:', savedId);
        } catch (directError) {
          console.warn('Escritura directa en Firestore falló, intentando vía API:', directError);
          const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
          });

          const result = await response.json();

          if (!response.ok || !result.success || !result.id) {
            throw new Error(result.error || 'No se pudo registrar el cliente');
          }
          savedId = result.id;
          if (result.warning) syncWarning = result.warning;
        }

        if (syncWarning) {
          alert(`Cliente registrado, pero la sincronización con el sistema administrativo falló: ${syncWarning}`);
        }

        // Invalidar caché de clientes para refrescar la lista
        invalidateClientesCache();

        // Callback de éxito
        if (onSuccess) {
          onSuccess(savedId, clientData);
        } else {
          router.push('/clientes');
        }
      }

    } catch (error) {
      console.error('Error saving client:', error);
      alert(`Error al ${mode === 'edit' ? 'actualizar' : 'registrar'} el cliente: ${error.message}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  // Check if form has data
  const hasFormData = () => {
    return formData.nombre || formData.apellidoPaterno || formData.email ||
      formData.telefonoContacto || formData.fotoPreview;
  };

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (hasFormData() && mode === 'create') {
      const confirmClose = window.confirm(
        '¿Estás seguro que deseas cancelar? Se perderán todos los datos ingresados.'
      );
      if (!confirmClose) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      router.push('/clientes');
    }
  };

  // Validation
  const isFormValid = () => {
    return formData.nombre.trim() &&
      formData.apellidoPaterno.trim() &&
      formData.fechaNacimiento &&
      formData.telefonoContacto.trim() &&
      formData.genero &&
      formData.ocupacion.trim();
  };

  // Mostrar loader mientras se cargan datos del cliente
  if (loadingCliente) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-cyan-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Cargando datos del cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      {showHeader && (
        <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Users size={32} className="text-cyan-600" />
                  {mode === 'edit' ? 'Editar Cliente' : 'Nuevo Paciente / Atleta'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {mode === 'edit'
                    ? 'Actualiza la información del cliente'
                    : 'Completa todos los campos para registrar un nuevo cliente'}
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={showHeader ? "container mx-auto py-8 px-8" : ""}>
        <form onSubmit={saveClient} className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

            {/* Form Content */}
            <div className="px-8 py-8">

              {/* Photo Upload Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Camera size={24} className="mr-2 text-cyan-600" />
                  Fotografía del Cliente
                </h3>
                <div className="flex flex-col items-center">
                  {formData.fotoPreview ? (
                    <div className="relative">
                      <img
                        src={formData.fotoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-cyan-100 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, fotoPreview: '', fotoFile: null }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all"
                    >
                      <Camera size={32} className="text-gray-400" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium hover:bg-cyan-50 rounded-lg transition-colors"
                  >
                    {formData.fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {uploading && (
                    <p className="text-sm text-cyan-600 mt-2 font-medium">Subiendo imagen...</p>
                  )}
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User size={24} className="mr-2 text-cyan-600" />
                  Información Personal
                </h3>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido Paterno <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellidoPaterno}
                      onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Apellido paterno"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      value={formData.apellidoMaterno}
                      onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Apellido materno"
                    />
                  </div>
                </div>

                {/* Age and Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Fecha de Nacimiento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaNacimiento}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={formData.edad}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 outline-none"
                      placeholder="Se calcula automáticamente"
                    />
                  </div>
                </div>

                {/* Gender and Dominant Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.genero}
                      onChange={(e) => handleInputChange('genero', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                    >
                      <option value="">Seleccionar género</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lado Dominante
                    </label>
                    <select
                      value={formData.ladoDominante}
                      onChange={(e) => handleInputChange('ladoDominante', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                    >
                      <option value="">Seleccionar lado dominante</option>
                      <option value="Derecho">Derecho</option>
                      <option value="Izquierdo">Izquierdo</option>
                      <option value="Ambidiestro">Ambidiestro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fitness Platform Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Activity size={24} className="mr-2 text-cyan-600" />
                  Plataforma Fitness
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Viene de una plataforma fitness?
                    </label>
                    <select
                      value={formData.plataformaFitness}
                      onChange={(e) => {
                        handleInputChange('plataformaFitness', e.target.value);
                        if (e.target.value !== 'Otra') {
                          handleInputChange('otraPlataforma', '');
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                    >
                      <option value="">No / Sin plataforma</option>
                      <option value="Fitpass">Fitpass</option>
                      <option value="Wellhub">Wellhub</option>
                      <option value="Totalpass">Totalpass</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>

                  {formData.plataformaFitness === 'Otra' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Especifica la plataforma
                      </label>
                      <input
                        type="text"
                        value={formData.otraPlataforma}
                        onChange={(e) => handleInputChange('otraPlataforma', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                        placeholder="Nombre de la plataforma"
                      />
                    </div>
                  )}
                </div>

                {formData.plataformaFitness && formData.plataformaFitness !== '' && (
                  <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="text-sm text-cyan-800">
                      ℹ️ <strong>Cliente de plataforma fitness:</strong> {formData.plataformaFitness === 'Otra' ? formData.otraPlataforma : formData.plataformaFitness}
                    </p>
                  </div>
                )}
              </div>

              {/* Responsable/Personal a Cargo Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User size={24} className="mr-2 text-cyan-600" />
                  Personal Responsable
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal a cargo del cliente
                    </label>
                    {loadingProfesionales ? (
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                        <span className="text-sm text-gray-500">Cargando personal...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.responsableId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedProfessional = profesionales.find(p => p.id === selectedId);
                          handleInputChange('responsableId', selectedId);
                          handleInputChange('responsable', selectedProfessional ? `${selectedProfessional.nombre} ${selectedProfessional.apellidoPaterno}` : '');
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      >
                        <option value="">Sin asignar</option>
                        {profesionales.map((prof) => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nombre} {prof.apellidoPaterno} {prof.apellidoMaterno || ''} - {prof.especialidad || 'Sin especialidad'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {formData.responsable && (
                    <div className="flex items-center p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                      <User size={20} className="text-cyan-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Personal asignado</p>
                        <p className="text-sm text-cyan-700 font-semibold">{formData.responsable}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sucursales Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin size={24} className="mr-2 text-cyan-600" />
                  Sucursales
                </h3>

                <div className="grid grid-cols-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sucursales a las que pertenece el cliente
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSucursalesDropdown(!showSucursalesDropdown)}
                        className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className={formData.sucursales?.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                          {getSucursalesText()}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${showSucursalesDropdown ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showSucursalesDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowSucursalesDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {sucursales.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No hay sucursales disponibles
                              </div>
                            ) : (
                              <div className="py-1">
                                {sucursales.map((sucursal) => {
                                  const isSelected = formData.sucursales?.includes(sucursal.id);
                                  return (
                                    <label
                                      key={sucursal.id}
                                      className="flex items-center px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSucursal(sucursal.id)}
                                        className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                      />
                                      <span className="ml-3 text-sm text-gray-900">
                                        {sucursal.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {formData.sucursales?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.sucursales.map((sucursalId) => {
                          const sucursal = sucursales.find(s => s.id === sucursalId);
                          if (!sucursal) return null;
                          return (
                            <span
                              key={sucursalId}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm"
                            >
                              <MapPin size={14} />
                              {sucursal.name}
                              <button
                                type="button"
                                onClick={() => toggleSucursal(sucursalId)}
                                className="ml-1 hover:bg-cyan-200 rounded-full p-0.5 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Phone size={24} className="mr-2 text-cyan-600" />
                  Información de Contacto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.telefonoContacto}
                      onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="55 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Emergencia
                    </label>
                    <input
                      type="tel"
                      value={formData.telefonoEmergencia}
                      onChange={(e) => handleInputChange('telefonoEmergencia', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Contacto de Emergencia
                    </label>
                    <input
                      type="text"
                      value={formData.nombreContactoEmergencia}
                      onChange={(e) => handleInputChange('nombreContactoEmergencia', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Nombre completo del contacto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ocupación <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ocupacion}
                      onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Ej: Estudiante, Profesional"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-linear-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText size={20} className="mr-2 text-cyan-600" />
                  Resumen del Cliente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Nombre Completo:</span>
                      <span className="text-gray-900">
                        {`${formData.nombre} ${formData.apellidoPaterno} ${formData.apellidoMaterno}`.trim() || 'No especificado'}
                      </span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Edad:</span>
                      <span className="text-gray-900">{formData.edad ? `${formData.edad} años` : 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Fecha de Nacimiento:</span>
                      <span className="text-gray-900">{formData.fechaNacimiento || 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Género:</span>
                      <span className="text-gray-900">{formData.genero || 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Lado Dominante:</span>
                      <span className="text-gray-900">{formData.ladoDominante || 'No especificado'}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Ocupación:</span>
                      <span className="text-gray-900">{formData.ocupacion || 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Plataforma Fitness:</span>
                      <span className="text-gray-900">
                        {formData.plataformaFitness === 'Otra' ? formData.otraPlataforma : (formData.plataformaFitness || 'No especificado')}
                      </span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Tel. Contacto:</span>
                      <span className="text-gray-900">{formData.telefonoContacto || 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Tel. Emergencia:</span>
                      <span className="text-gray-900">{formData.telefonoEmergencia || 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Contacto Emergencia:</span>
                      <span className="text-gray-900">{formData.nombreContactoEmergencia || 'No especificado'}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium text-gray-700 min-w-[140px]">Email:</span>
                      <span className="text-gray-900">{formData.email || 'No especificado'}</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer with Action Buttons */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!isFormValid() || loading || uploading}
                  className="flex items-center px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {mode === 'edit' ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {mode === 'edit' ? 'Actualizar Paciente / Atleta' : 'Registrar Cliente'}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      </main>
    </>
  );
}
