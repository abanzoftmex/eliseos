'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  User,
  Mail,
  Phone,
  FileText,
  Camera,
  Calendar,
  Users,
  MapPin
} from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import useSucursalStore from '../store/sucursalStore';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { invalidateClientesCache } from './dashboard/ClientesContent';

const ClienteRegistroModal = ({ isOpen, onClose, onSuccess, cliente, mode = 'create' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  
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
    email: '',
    sucursal: ''
  });

  // Obtener sucursales del store
  const sucursales = useSucursalStore((state) => state.sucursales);

  // Cargar datos del cliente cuando estamos en modo edición
  useEffect(() => {
    if (mode === 'edit' && cliente) {
      setFormData({
        foto: cliente.foto || '',
        fotoFile: null,
        fotoPreview: cliente.foto || '',
        nombre: cliente.nombre || '',
        apellidoPaterno: cliente.apellidoPaterno || '',
        apellidoMaterno: cliente.apellidoMaterno || '',
        edad: cliente.edad || '',
        fechaNacimiento: cliente.fechaNacimiento || '',
        ocupacion: cliente.ocupacion || '',
        genero: cliente.genero || '',
        ladoDominante: cliente.ladoDominante || '',
        telefonoContacto: cliente.telefonoContacto || '',
        telefonoEmergencia: cliente.telefonoEmergencia || '',
        email: cliente.email || '',
        sucursal: cliente.sucursal || ''
      });
    } else {
      // Reset form para nuevo cliente
      setFormData({
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
        email: '',
        sucursal: ''
      });
    }
  }, [mode, cliente]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
  const saveClient = async () => {
    try {
      setLoading(true);
      
      // Upload photo if exists
      let photoURL = formData.foto;
      if (formData.fotoFile && !photoURL) {
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
        email: formData.email || '',
        sucursal: formData.sucursal || '',
        tipo: 'cliente',
        status: 'active',
        updatedAt: new Date().toISOString()
      };
      
      if (mode === 'edit' && cliente?.id) {
        // Actualizar cliente existente
        const clientRef = doc(db, 'clientes', cliente.id);
        await updateDoc(clientRef, clientData);
        console.log('Client updated with ID:', cliente.id);
        setSuccessMessage('Miembro actualizado exitosamente ✅');
      } else {
        // Crear nuevo miembro
        clientData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'clientes'), clientData);
        console.log('Client saved with ID:', docRef.id);
        setSuccessMessage('Miembro registrado exitosamente ✅');
      }
      
      // Invalidar caché de clientes para que se recarguen
      invalidateClientesCache();
      
      setTimeout(() => {
        setSuccessMessage('');
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving client:', error);
      alert(`Error al ${mode === 'edit' ? 'actualizar' : 'registrar'} el miembro: ${error.message}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
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
      email: '',
      sucursal: ''
    });
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
           formData.fechaNacimiento;
  };

  // Validation for step 2  
  const isStep2Valid = () => {
    return formData.telefonoContacto.trim() && 
           formData.genero && 
           formData.ocupacion.trim();
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
        <div className="relative w-full max-w-3xl transform rounded-xl bg-white shadow-2xl transition-all duration-300 scale-100">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-[#f4f8f8]">
            <div>
              <h2 className="text-2xl font-bold text-[#1c4040]">
                {mode === 'edit' ? 'Editar Miembro' : 'Registro de Nuevo Miembro'}
              </h2>
              <p className="text-sm text-[#357070] font-medium">
                Paso {currentStep} de 2 - Información del Miembro
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3">
            <div className="h-3 bg-gray-200 rounded-full">
              <div 
                className="h-3 bg-[#1c4040] rounded-full transition-all duration-300 shadow-sm"
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
            
            {/* Step 1: Personal Information */}
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
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all"
                      >
                        <Camera size={24} className="text-gray-400" />
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
                      className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      {formData.fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                  </div>
                  {uploading && (
                    <p className="text-sm text-cyan-600 mt-2 font-medium">Subiendo imagen...</p>
                  )}
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Nombre"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      placeholder="Apellido paterno"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      value={formData.apellidoMaterno}
                      onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      placeholder="Apellido materno"
                    />
                  </div>
                </div>

                {/* Age and Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={formData.edad}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                      placeholder="Se calcula automáticamente"
                    />
                  </div>
                </div>

                {/* Occupation and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ocupación *
                    </label>
                    <input
                      type="text"
                      value={formData.ocupacion}
                      onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      placeholder="Ej: Estudiante, Profesional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Additional Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                
                {/* Gender and Dominant Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género *
                    </label>
                    <select
                      value={formData.genero}
                      onChange={(e) => handleInputChange('genero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    >
                      <option value="">Seleccionar género</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lado Dominante
                    </label>
                    <select
                      value={formData.ladoDominante}
                      onChange={(e) => handleInputChange('ladoDominante', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    >
                      <option value="">Seleccionar lado dominante</option>
                      <option value="Derecho">Derecho</option>
                      <option value="Izquierdo">Izquierdo</option>
                      <option value="Ambidiestro">Ambidiestro</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefonoContacto}
                      onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      placeholder="55 1234 5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono de Emergencia
                    </label>
                    <input
                      type="tel"
                      value={formData.telefonoEmergencia}
                      onChange={(e) => handleInputChange('telefonoEmergencia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>

                {/* Sucursal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sucursal
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={formData.sucursal}
                      onChange={(e) => handleInputChange('sucursal', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
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

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText size={20} className="mr-2" />
                    Resumen del Cliente
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Nombre:</span> {formData.nombre || 'No especificado'}</p>
                      <p><span className="font-medium">Apellidos:</span> {`${formData.apellidoPaterno} ${formData.apellidoMaterno}`.trim() || 'No especificado'}</p>
                      <p><span className="font-medium">Edad:</span> {formData.edad ? `${formData.edad} años` : 'No especificado'}</p>
                      <p><span className="font-medium">Fecha de Nacimiento:</span> {formData.fechaNacimiento || 'No especificado'}</p>
                      <p><span className="font-medium">Ocupación:</span> {formData.ocupacion || 'No especificado'}</p>
                      <p><span className="font-medium">Sucursal:</span> {formData.sucursal ? sucursales.find(s => s.id === formData.sucursal)?.name || formData.sucursal : 'Sin sucursal'}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Género:</span> {formData.genero || 'No especificado'}</p>
                      <p><span className="font-medium">Lado Dominante:</span> {formData.ladoDominante || 'No especificado'}</p>
                      <p><span className="font-medium">Tel. Contacto:</span> {formData.telefonoContacto || 'No especificado'}</p>
                      <p><span className="font-medium">Tel. Emergencia:</span> {formData.telefonoEmergencia || 'No especificado'}</p>
                      <p><span className="font-medium">Email:</span> {formData.email || 'No especificado'}</p>
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
                    <ArrowLeft size={16} className="mr-2" />
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
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1c4040] rounded-lg hover:bg-[#143030] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Siguiente
                    <ArrowRight size={16} className="ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={saveClient}
                    disabled={!isStep2Valid() || loading || uploading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1c4040] rounded-lg hover:bg-[#143030] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Check size={16} className="mr-2 text-[#c2ef03]" />
                    {loading ? 'Guardando...' : (mode === 'edit' ? 'Actualizar Miembro' : 'Registrar Miembro')}
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

export default ClienteRegistroModal;