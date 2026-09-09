'use client';

import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faUpload, 
  faArrowLeft, 
  faArrowRight, 
  faCheck,
  faUser,
  faEnvelope,
  faPhone,
  faFileText,
  faCamera,
  faBuilding,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import useSucursalStore from '../../store/sucursalStore';

const DirectorioFormModal = ({ isOpen, onClose, onSuccess, profesional = null, mode = 'create' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSucursalesDropdown, setShowSucursalesDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const sucursales = useSucursalStore((state) => state.sucursales);
  
  const [formData, setFormData] = useState({
    foto: profesional?.foto || '',
    fotoFile: null,
    fotoPreview: profesional?.foto || '',
    nombre: profesional?.nombre || '',
    apellidoPaterno: profesional?.apellidoPaterno || '',
    apellidoMaterno: profesional?.apellidoMaterno || '',
    puesto: profesional?.puesto || '',
    abreviaturaEstudio: profesional?.abreviaturaEstudio || '',
    email: profesional?.email || '',
    telefonoContacto: profesional?.telefonoContacto || '',
    cedulaProfesional: profesional?.cedulaProfesional || '',
    especialidad: profesional?.especialidad || '',
    area: profesional?.area || '',
    tipo: profesional?.tipo || 'Médico',
    status: profesional?.status || 'active',
    sucursales: Array.isArray(profesional?.sucursales) ? profesional.sucursales : (profesional?.sucursal ? [profesional.sucursal] : []),
    observaciones: profesional?.observaciones || ''
  });

  // Efecto para actualizar el formulario cuando cambia el profesional o el modo
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && profesional) {
        // Cargar datos del profesional para editar
        setFormData({
          foto: profesional.foto || '',
          fotoFile: null,
          fotoPreview: profesional.foto || '',
          nombre: profesional.nombre || '',
          apellidoPaterno: profesional.apellidoPaterno || '',
          apellidoMaterno: profesional.apellidoMaterno || '',
          puesto: profesional.puesto || '',
          abreviaturaEstudio: profesional.abreviaturaEstudio || '',
          email: profesional.email || '',
          telefonoContacto: profesional.telefonoContacto || profesional.telefono || '',
          cedulaProfesional: profesional.cedulaProfesional || '',
          especialidad: profesional.especialidad || '',
          area: profesional.area || '',
          tipo: profesional.tipo || 'Médico',
          status: profesional.status || 'active',
          sucursales: Array.isArray(profesional.sucursales) ? profesional.sucursales : (profesional.sucursal ? [profesional.sucursal] : []),
          observaciones: profesional.observaciones || ''
        });
      } else {
        // Limpiar formulario para crear nuevo profesional
        setFormData({
          foto: '',
          fotoFile: null,
          fotoPreview: '',
          nombre: '',
          apellidoPaterno: '',
          apellidoMaterno: '',
          puesto: '',
          abreviaturaEstudio: '',
          email: '',
          telefonoContacto: '',
          cedulaProfesional: '',
          especialidad: '',
          area: '',
          tipo: 'Médico',
          status: 'active',
          sucursales: [],
          observaciones: ''
        });
      }
      // Resetear paso del wizard
      setCurrentStep(1);
      setSuccessMessage('');
    }
  }, [isOpen, profesional, mode]);

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
      const storageRef = ref(storage, `directorio/${fileName}`);
      
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



  // Save complete professional to Firestore
  const saveProfessional = async () => {
    try {
      setLoading(true);
      
      // Upload photo if exists and is new
      let photoURL = formData.foto;
      if (formData.fotoFile) {
        photoURL = await uploadImageToStorage(formData.fotoFile);
      }
      
      // Clean data for Firestore (ensure no undefined values)
      const professionalData = {
        foto: photoURL || '',
        nombre: formData.nombre || '',
        apellidoPaterno: formData.apellidoPaterno || '',
        apellidoMaterno: formData.apellidoMaterno || '',
        puesto: formData.puesto || '',
        ocupacion: formData.puesto || '', // Alias para compatibilidad
        abreviaturaEstudio: formData.abreviaturaEstudio || '',
        email: formData.email || '',
        telefono: formData.telefonoContacto || '',
        telefonoContacto: formData.telefonoContacto || '',
        cedulaProfesional: formData.cedulaProfesional || '',
        especialidad: formData.especialidad || '',
        area: formData.area || '',
        tipo: formData.tipo || 'Médico',
        status: formData.status || 'active',
        sucursales: formData.sucursales || [],
        observaciones: formData.observaciones || '',
        updatedAt: new Date().toISOString()
      };

      if (mode === 'edit' && profesional?.id) {
        // Update existing professional
        const professionalRef = doc(db, 'directorio', profesional.id);
        await updateDoc(professionalRef, professionalData);
        console.log('Professional updated with ID:', profesional.id);
        setSuccessMessage('Profesional actualizado exitosamente ✅');
      } else {
        // Create new professional
        professionalData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'directorio'), professionalData);
        console.log('Professional saved with ID:', docRef.id);
        setSuccessMessage('Profesional guardado exitosamente ✅');
      }
      
      setTimeout(() => {
        setSuccessMessage('');
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving professional:', error);
      alert(`Error al guardar el profesional: ${error.message}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    const initialData = mode === 'edit' && profesional ? {
      foto: profesional.foto || '',
      fotoFile: null,
      fotoPreview: profesional.foto || '',
      nombre: profesional.nombre || '',
      apellidoPaterno: profesional.apellidoPaterno || '',
      apellidoMaterno: profesional.apellidoMaterno || '',
      puesto: profesional.puesto || '',
      abreviaturaEstudio: profesional.abreviaturaEstudio || '',
      email: profesional.email || '',
      telefonoContacto: profesional.telefonoContacto || '',
      cedulaProfesional: profesional.cedulaProfesional || '',
      especialidad: profesional.especialidad || '',
      area: profesional.area || '',
      tipo: profesional.tipo || 'Médico',
      status: profesional.status || 'active',
      sucursales: Array.isArray(profesional.sucursales) ? profesional.sucursales : (profesional.sucursal ? [profesional.sucursal] : []),
      observaciones: profesional.observaciones || ''
    } : {
      foto: '',
      fotoFile: null,
      fotoPreview: '',
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      puesto: '',
      abreviaturaEstudio: '',
      email: '',
      telefonoContacto: '',
      cedulaProfesional: '',
      especialidad: '',
      area: '',
      tipo: 'Médico',
      status: 'active',
      sucursales: [],
      observaciones: ''
    };
    
    setFormData(initialData);
    setCurrentStep(1);
  };

  // Check if form has data
  const hasFormData = () => {
    return formData.nombre || formData.apellidoPaterno || formData.email || 
           formData.telefonoContacto || formData.fotoPreview;
  };

  // Handle modal close with confirmation
  const handleClose = () => {
    if (hasFormData() && !successMessage) {
      const confirmClose = window.confirm(
        '¿Estás seguro que deseas cerrar? Se perderán todos los datos ingresados.'
      );
      if (!confirmClose) return;
    }
    resetForm();
    onClose();
  };

  // Navigation handlers
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation for step 1
  const isStep1Valid = () => {
    return formData.nombre.trim() && 
           formData.apellidoPaterno.trim() && 
           formData.email.trim() &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email); // Basic email validation
  };

  // Validation for step 2  
  const isStep2Valid = () => {
    return formData.telefonoContacto.trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white shadow-2xl transition-all duration-300 scale-100">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-cyan-50 to-cyan-100">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-700 to-cyan-900 bg-clip-text text-transparent">
                {mode === 'edit' ? 'Editar Profesional' : 'Registro de nuevo Personal Interno'}
              </h2>
              <p className="text-sm text-cyan-600 font-medium">
                Paso {currentStep} de 2 - Personal Interno
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3">
            <div className="h-3 bg-gray-200 rounded-full">
              <div 
                className="h-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-4 p-3 bg-cyan-100 border border-cyan-200 rounded-lg">
              <p className="text-cyan-800 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Form Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                
                {/* Photo Upload */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto del Cliente
                  </label>
                  <div className="flex flex-col items-center">
                    {formData.fotoPreview ? (
                      <div className="relative">
                        <img
                          src={formData.fotoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                        />
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, fotoPreview: '', fotoFile: null }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50"
                      >
                        <FontAwesomeIcon icon={faCamera} className="w-6 h-6 text-gray-400" />
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
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {formData.fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                  </div>
                  {uploading && (
                    <p className="text-sm text-blue-600 mt-2">Subiendo imagen...</p>
                  )}
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Ingresa el nombre"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Paterno *
                    </label>
                    <input
                      type="text"
                      value={formData.apellidoPaterno}
                      onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Apellido paterno"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      value={formData.apellidoMaterno}
                      onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Apellido materno"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puesto
                    </label>
                    <input
                      type="text"
                      value={formData.puesto}
                      onChange={(e) => handleInputChange('puesto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ej: Entrenador, Fisioterapeuta..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Abreviatura de Estudio
                    </label>
                    <input
                      type="text"
                      value={formData.abreviaturaEstudio}
                      onChange={(e) => handleInputChange('abreviaturaEstudio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ej: Lic., Dr., Mtro."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information & Summary */}
            {currentStep === 2 && (
              <div className="space-y-6">
                
                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefonoContacto}
                      onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="55 1234 5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula Profesional
                    </label>
                    <input
                      type="text"
                      value={formData.cedulaProfesional}
                      onChange={(e) => handleInputChange('cedulaProfesional', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Número de cédula"
                    />
                  </div>
                </div>

                {/* Additional Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidad
                    </label>
                    <input
                      type="text"
                      value={formData.especialidad}
                      onChange={(e) => handleInputChange('especialidad', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ej: Fisioterapia, Medicina Deportiva"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ej: Rehabilitación, Consulta Externa"
                    />
                  </div>
                </div>

                {/* Status and Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Profesional
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="Médico">Médico</option>
                      <option value="Fisioterapeuta">Fisioterapeuta</option>
                      <option value="Nutricionista">Nutricionista</option>
                      <option value="Psicólogo">Psicólogo</option>
                      <option value="Entrenador">Entrenador</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Sucursales Multi-Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sucursales
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSucursalesDropdown(!showSucursalesDropdown)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
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
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.sucursales.map((sucursalId) => {
                        const sucursal = sucursales.find(s => s.id === sucursalId);
                        if (!sucursal) return null;
                        return (
                          <span
                            key={sucursalId}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm"
                          >
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

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Notas adicionales sobre el profesional..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faFileText} className="w-5 h-5 mr-2" />
                    Resumen de la Información
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Nombre:</span> {formData.nombre || 'No especificado'}</p>
                      <p><span className="font-medium">Apellidos:</span> {`${formData.apellidoPaterno} ${formData.apellidoMaterno}`.trim() || 'No especificado'}</p>
                      <p><span className="font-medium">Puesto:</span> {formData.puesto || 'No especificado'}</p>
                      <p><span className="font-medium">Abreviatura:</span> {formData.abreviaturaEstudio || 'No especificado'}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Email:</span> {formData.email || 'No especificado'}</p>
                      <p><span className="font-medium">Teléfono:</span> {formData.telefonoContacto || 'No especificado'}</p>
                      <p><span className="font-medium">Cédula:</span> {formData.cedulaProfesional || 'No especificado'}</p>
                      <p><span className="font-medium">Foto:</span> {formData.fotoPreview ? 'Sí' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              
              {/* Left side buttons */}
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                    Atrás
                  </button>
                )}
              </div>

              {/* Right side buttons */}
              <div className="flex space-x-2">
                {/* Next or Submit */}
                {currentStep < 2 ? (
                  <button
                    onClick={nextStep}
                    disabled={!isStep1Valid() || loading || uploading}
                    className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    Siguiente
                    <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={saveProfessional}
                    disabled={!isStep2Valid() || loading || uploading}
                    className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                    {loading ? (mode === 'edit' ? 'Actualizando...' : 'Guardando...') : (mode === 'edit' ? 'Actualizar Profesional' : 'Guardar Profesional')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorioFormModal;