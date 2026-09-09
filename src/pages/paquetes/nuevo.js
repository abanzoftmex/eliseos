import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUpload, faPlus, faTimes, faBox, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import useSucursalStore from '../../store/sucursalStore';
import { createPackage, uploadPackageImage } from '../../../lib/firebase/packagesService';

function NuevoPaquetePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({ name: '', percentage: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSucursalesDropdown, setShowSucursalesDropdown] = useState(false);
  const sucursales = useSucursalStore((state) => state.sucursales);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      name: '',
      targetAudience: 'clientes',
      tipo: 'grupal',
      paymentType: 'unico',
      description: '',
      price: '',
      sessions: '',
      validityDays: '',
      imageUrl: '',
      sucursales: []
    }
  });

  const watchedPrice = watch('price');
  const watchedSucursales = watch('sucursales');

  const toggleSucursal = (sucursalId) => {
    const currentSucursales = watchedSucursales || [];
    const isSelected = currentSucursales.includes(sucursalId);

    if (isSelected) {
      setValue('sucursales', currentSucursales.filter(id => id !== sucursalId));
    } else {
      setValue('sucursales', [...currentSucursales, sucursalId]);
    }
  };

  const getSucursalesText = () => {
    const currentSucursales = watchedSucursales || [];
    const selectedList = sucursales.filter(s => currentSucursales.includes(s.id));
    if (selectedList.length === 0) return 'Todas las sucursales (Global)';
    if (selectedList.length === 1) return selectedList[0].name;
    return `${selectedList.length} sucursales seleccionadas`;
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadPackageImage(file, `temp-${Date.now()}`);
      if (result.success) {
        setValue('imageUrl', result.imageUrl);
        setImagePreview(result.imageUrl);
        showMessage('success', 'Imagen subida exitosamente');
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const addDiscount = () => {
    if (!newDiscount.name.trim() || !newDiscount.percentage) {
      showMessage('error', 'Completa el nombre y porcentaje del descuento');
      return;
    }

    const percentage = parseFloat(newDiscount.percentage);
    if (percentage < 0 || percentage > 100) {
      showMessage('error', 'El porcentaje debe estar entre 0 y 100');
      return;
    }

    if (discounts.some(d => d.name.toLowerCase() === newDiscount.name.toLowerCase())) {
      showMessage('error', 'Ya existe un descuento con ese nombre');
      return;
    }

    setDiscounts([...discounts, {
      name: newDiscount.name.trim(),
      percentage
    }]);
    setNewDiscount({ name: '', percentage: '' });
  };

  const removeDiscount = (index) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (discounts.length === 0 && !window.confirm('¿Quieres crear el paquete sin descuentos?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const packageData = {
        ...data,
        price: data.price ? parseFloat(data.price) : null,
        sessions: data.sessions ? parseInt(data.sessions, 10) : null,
        validityDays: data.validityDays ? parseInt(data.validityDays, 10) : null,
        discounts,
        sucursales: data.sucursales || []
      };

      const result = await createPackage(packageData);

      if (result.success) {
        showMessage('success', 'Paquete creado exitosamente');
        setTimeout(() => {
          router.push('/paquetes');
        }, 2000);
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error creating package:', error);
      showMessage('error', 'Error al crear el paquete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán todos los datos.')) {
      router.push('/paquetes');
    }
  };

  const customBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Gestión de Paquetes / Planes', href: '/paquetes' },
    { label: 'Crear Paquete / Plan', href: '/paquetes/nuevo', isLast: true }
  ];

  return (
    <  >
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center ml-16 lg:ml-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <FontAwesomeIcon icon={faBox} className="w-8 h-8 text-cyan-600" />
                Crear nuevo Paquete / Plan
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Define los detalles del nuevo Paquete / Plan de servicios
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">

          {/* Mensaje de estado */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              {message.text}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre del Paquete / Plan *
                    </label>
                    <input
                      type="text"
                      {...register('name', {
                        required: 'El nombre es requerido',
                        minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="Ej: Paquete Básico de Nutrición"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Miembros *
                    </label>
                    <select
                      {...register('targetAudience', { required: 'Selecciona el público objetivo' })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.targetAudience ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                      <option value="clientes">Miembros</option>
                      <option value="atletas">Atletas</option>
                      <option value="ambos">General / Todos</option>
                    </select>
                    {errors.targetAudience && (
                      <p className="text-red-600 text-sm mt-1">{errors.targetAudience.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo de Paquete / Plan *
                    </label>
                    <select
                      {...register('tipo', { required: 'Selecciona el tipo de paquete' })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.tipo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                      <option value="grupal">Grupal / Exos Training</option>
                      <option value="personalizado">Personalizado</option>
                      <option value="sesion">Terapia / Therapy</option>
                    </select>
                    {errors.tipo && (
                      <p className="text-red-600 text-sm mt-1">{errors.tipo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo de Pago *
                    </label>
                    <select
                      {...register('paymentType', { required: 'Selecciona el tipo de pago' })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.paymentType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                      <option value="unico">Pago Único</option>
                      <option value="mensual">Mensual</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                      <option value="sin_cargo">S/N (Sin cargo)</option>
                    </select>
                    {errors.paymentType && (
                      <p className="text-red-600 text-sm mt-1">{errors.paymentType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Precio (MXN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price', {
                        validate: value => {
                          if (!value || value === '') return true;
                          if (isNaN(parseFloat(value))) return 'Ingresa un precio válido';
                          if (parseFloat(value) < 0) return 'El precio no puede ser negativo';
                          return true;
                        }
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="0.00 (opcional)"
                    />
                    {errors.price && (
                      <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                    )}
                    {watchedPrice && !errors.price && (
                      <p className="text-cyan-600 text-sm mt-1">
                        Precio: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(watchedPrice)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Número de Sesiones
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      {...register('sessions', {
                        validate: value => {
                          if (!value || value === '') return true;
                          const numValue = Number(value);
                          if (numValue < 1) return 'Debe ser al menos 1 sesión';
                          if (!Number.isInteger(numValue)) return 'Debe ser un número entero';
                          return true;
                        }
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.sessions ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="1 (opcional)"
                    />
                    {errors.sessions && (
                      <p className="text-red-600 text-sm mt-1">{errors.sessions.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vigencia (días)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      {...register('validityDays', {
                        validate: value => {
                          if (!value) return true;
                          const numValue = Number(value);
                          if (numValue < 1) return 'Debe ser al menos 1 día';
                          if (!Number.isInteger(numValue)) return 'Debe ser un número entero';
                          return true;
                        }
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.validityDays ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="Ej: 30, 90, 365 (opcional)"
                    />
                    {errors.validityDays && (
                      <p className="text-red-600 text-sm mt-1">{errors.validityDays.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Si no se especifica, el plan no tendrá fecha de expiración
                    </p>
                  </div>

                  {/* Sucursales */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Disponibilidad por Sucursal
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSucursalesDropdown(!showSucursalesDropdown)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-gray-700 truncate">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-cyan-600 flex-shrink-0" />
                          <span className="truncate">{getSucursalesText()}</span>
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${showSucursalesDropdown ? 'transform rotate-180' : ''}`}
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
                            <div className="py-1">
                              {sucursales.map((sucursal) => {
                                const isSelected = (watchedSucursales || []).includes(sucursal.id);
                                return (
                                  <label
                                    key={sucursal.id}
                                    className="flex items-center px-4 py-3 hover:bg-cyan-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSucursal(sucursal.id)}
                                      className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">
                                      {sucursal.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Si no seleccionas ninguna, estará disponible en todas (Global).
                    </p>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    rows="4"
                    {...register('description', {
                      required: 'La descripción es requerida',
                      minLength: { value: 10, message: 'Mínimo 10 caracteres' }
                    })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Describe el contenido y beneficios del paquete..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagen del Paquete / Plan (Opcional)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="package-image"
                      />
                      <label
                        htmlFor="package-image"
                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-200 hover:scale-105"
                      >
                        <FontAwesomeIcon icon={faUpload} className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          {uploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
                        </span>
                      </label>
                    </div>

                    {imagePreview && (
                      <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden relative">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Descuentos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Descuentos Disponibles (Opcional)
                  </label>

                  {/* Lista de descuentos existentes */}
                  {discounts.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {discounts.map((discount, index) => (
                        <div key={index} className="flex items-center justify-between bg-cyan-50 px-4 py-3 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">
                            {discount.name} - {discount.percentage}%
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDiscount(index)}
                            className="text-red-600 hover:text-red-800 transition-all duration-200 hover:scale-110"
                          >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar nuevo descuento */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nombre del descuento"
                      value={newDiscount.name}
                      onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder="Porcentaje"
                      min="0"
                      max="100"
                      step="0.01"
                      value={newDiscount.percentage}
                      onChange={(e) => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                      className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={addDiscount}
                      className="px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all duration-200 hover:scale-105 hover:shadow-md"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:bg-cyan-400 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed hover:shadow-md hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                    {isSubmitting ? 'Creando...' : 'Crear Paquete / Plan'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

// Proteger la ruta - requiere permiso 'paquetes'
// Roles permitidos: admin
export default NuevoPaquetePage;