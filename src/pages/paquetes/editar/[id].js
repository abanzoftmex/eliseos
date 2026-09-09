import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUpload, faPlus, faTimes, faBox, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../../components/layout/Layout';
import useSucursalStore from '../../../store/sucursalStore';

import {
  getPackageById,
  updatePackage,
  uploadPackageImage
} from '../../../../lib/firebase/packagesService';

function EditarPaquetePage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({ name: '', percentage: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [packageNotFound, setPackageNotFound] = useState(false);
  const [showSucursalesDropdown, setShowSucursalesDropdown] = useState(false);
  const sucursales = useSucursalStore((state) => state.sucursales);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm();

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

  const loadPackageData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const result = await getPackageById(id);
      if (result.success) {
        const pkg = result.package;

        // Llenar el formulario con los datos existentes
        reset({
          name: pkg.name,
          targetAudience: pkg.targetAudience,
          tipo: pkg.tipo || 'grupal',
          paymentType: pkg.paymentType,
          description: pkg.description,
          price: pkg.price,
          sessions: pkg.sessions || 1,
          validityDays: pkg.validityDays || '',
          imageUrl: pkg.imageUrl || '',
          sucursales: pkg.sucursales || []
        });

        setDiscounts(pkg.discounts || []);
        setImagePreview(pkg.imageUrl || null);
      } else {
        setPackageNotFound(true);
        showMessage('error', 'Paquete no encontrado');
      }
    } catch (error) {
      console.error('Error loading package:', error);
      showMessage('error', 'Error al cargar el paquete');
      setPackageNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadPackageData();
  }, [loadPackageData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadPackageImage(file, id);
      if (result.success) {
        setValue('imageUrl', result.imageUrl);
        setImagePreview(result.imageUrl);
        showMessage('success', 'Imagen actualizada exitosamente');
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
    if (!window.confirm('¿Estás seguro de que quieres actualizar este paquete?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const packageData = {
        ...data,
        price: parseFloat(data.price),
        sessions: parseInt(data.sessions, 10),
        validityDays: data.validityDays ? parseInt(data.validityDays, 10) : null,
        discounts,
        sucursales: data.sucursales || []
      };

      const result = await updatePackage(id, packageData);

      if (result.success) {
        showMessage('success', 'Paquete actualizado exitosamente');
        setTimeout(() => {
          router.push('/paquetes');
        }, 2000);
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error updating package:', error);
      showMessage('error', 'Error al actualizar el paquete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
      router.push('/paquetes');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando paquete...</p>
        </div>
      </div>
    );
  }

  if (packageNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faBox} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-500 mb-2">Paquete/Plan no encontrado</h2>
          <p className="text-gray-400 mb-6">El paquete/plan que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push('/paquetes')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Volver a Paquetes/Planes
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center ml-16 lg:ml-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                <FontAwesomeIcon icon={faBox} className="w-8 h-8 text-cyan-600" />
                Editar Paquete/Plan
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Modifica los detalles del paquete/plan de servicios
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="mx-auto">

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Columna izquierda - Imagen */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagen del Paquete</h3>

                  {/* Preview de imagen */}
                  <div className="mb-4">
                    <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FontAwesomeIcon icon={faBox} className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de subir imagen */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <div className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                      {uploadingImage ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600">Subiendo...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <FontAwesomeIcon icon={faUpload} className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                          </span>
                        </div>
                      )}
                    </div>
                  </label>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Formatos: JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>
              </div>

              {/* Columna derecha - Información del paquete */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="p-6 space-y-6">
                    {/* Información básica */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre del Paquete *
                          </label>
                          <input
                            type="text"
                            {...register('name', {
                              required: 'El nombre es requerido',
                              minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                            })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            placeholder="Ej: Paquete Básico de Nutrición"
                          />
                          {errors.name && (
                            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Público Objetivo *
                          </label>
                          <select
                            {...register('targetAudience', { required: 'Selecciona el público objetivo' })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.targetAudience ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                          >
                            <option value="clientes">Clientes</option>
                            <option value="atletas">Atletas</option>
                            <option value="ambos">Ambos</option>
                          </select>
                          {errors.targetAudience && (
                            <p className="text-red-600 text-sm mt-1">{errors.targetAudience.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Paquete *
                          </label>
                          <select
                            {...register('tipo', { required: 'Selecciona el tipo de paquete' })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.tipo ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.paymentType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                          >
                            <option value="unico">Pago Único</option>
                            <option value="mensual">Mensual</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="semestral">Semestral</option>
                            <option value="anual">Anual</option>
                          </select>
                          {errors.paymentType && (
                            <p className="text-red-600 text-sm mt-1">{errors.paymentType.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Precio (MXN) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('price', {
                              required: 'El precio es requerido',
                              min: { value: 0, message: 'El precio debe ser mayor o igual a 0' },
                              validate: value => !isNaN(parseFloat(value)) || 'Debe ser un número válido'
                            })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            placeholder="0.00"
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
                            Número de Sesiones *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            {...register('sessions', {
                              required: 'El número de sesiones es requerido',
                              min: { value: 1, message: 'Debe ser al menos 1 sesión' },
                              validate: value => Number.isInteger(Number(value)) || 'Debe ser un número entero'
                            })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.sessions ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            placeholder="1"
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h3>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Descripción *
                        </label>
                        <textarea
                          rows="5"
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

                      {/* Descuentos */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-4">
                          Descuentos Disponibles
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
                                  className="text-red-600 hover:text-red-800 transition-colors"
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
                            className="px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
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
                          {isSubmitting ? 'Actualizando...' : 'Actualizar Paquete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> {/* cierre grid */}
          </form>

        </div> {/* cierre mx-auto */}
      </main>
    </>
  );
}

// Proteger la ruta - requiere permiso 'paquetes'
// Roles permitidos: admin
export default EditarPaquetePage;