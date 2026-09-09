import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUpload, faShoppingBag, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { createProducto, uploadProductoImage } from '../../../lib/firebase/productosService';
import useSucursalStore from '../../store/sucursalStore';

function NuevoProductoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
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
      description: '',
      price: '',

      price: '',
      imageUrl: '',
      sucursales: [],
      tipo: '',
      otroTipo: '',
      inventario: '',
      imageUrl: ''
    }
  });

  const watchedPrice = watch('price');
  const watchedSucursales = watch('sucursales');
  const watchedTipo = watch('tipo');

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
      const result = await uploadProductoImage(file, `temp-${Date.now()}`);
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

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const productoData = {
        ...data,
        price: parseFloat(data.price),
        tipo: data.tipo === 'otro' ? data.otroTipo : data.tipo,
        inventarioInicial: parseInt(data.inventario),
        inventarioActual: parseInt(data.inventario)
      };

      // Limpiar el campo auxiliar
      delete productoData.otroTipo;

      const result = await createProducto(productoData);

      if (result.success) {
        showMessage('success', 'Producto creado exitosamente');
        setTimeout(() => {
          router.push('/productos');
        }, 2000);
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error creating producto:', error);
      showMessage('error', 'Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán todos los datos.')) {
      router.push('/productos');
    }
  };

  const customBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Gestión de Productos Únicos', href: '/productos' },
    { label: 'Crear Producto', href: '/productos/nuevo', isLast: true }
  ];

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center ml-16 lg:ml-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <FontAwesomeIcon icon={faShoppingBag} className="w-8 h-8 text-cyan-600" />
                Crear nuevo Producto Único
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Define los detalles del nuevo producto con cargo único
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      {...register('name', {
                        required: 'El nombre es requerido',
                        minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="Ej: Valoración Nutricional"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Precio (MXN) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price', {
                        required: 'El precio es requerido',
                        min: { value: 0.01, message: 'El precio debe ser mayor a 0' },
                        validate: value => !isNaN(parseFloat(value)) || 'Ingresa un precio válido'
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
                      Inventario Inicial *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      {...register('inventario', {
                        required: 'El inventario inicial es requerido',
                        min: { value: 0, message: 'El inventario no puede ser negativo' },
                        validate: value => Number.isInteger(Number(value)) || 'Debe ser un número entero'
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.inventario ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="0"
                    />
                    {errors.inventario && (
                      <p className="text-red-600 text-sm mt-1">{errors.inventario.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Cantidad inicial disponible para venta
                    </p>
                  </div>
                </div>

                {/* Tipo de Producto */}
                {/* Tipo de Producto y Sucursales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de Producto */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo de Producto *
                    </label>
                    <select
                      {...register('tipo', { required: 'El tipo es requerido' })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.tipo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="Cafetería">Cafetería</option>
                      <option value="Merch">Merch</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {errors.tipo && (
                      <p className="text-red-600 text-sm mt-1">{errors.tipo.message}</p>
                    )}
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

                  {/* Especificar Tipo (Condicional) */}
                  {watchedTipo === 'Otro' && (
                    <div className="md:col-span-2 animate-fadeIn">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Especificar Tipo *
                      </label>
                      <input
                        type="text"
                        {...register('otroTipo', {
                          required: watchedTipo === 'Otro' ? 'Especifica el tipo' : false
                        })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.otroTipo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Ej: Suplementos"
                      />
                      {errors.otroTipo && (
                        <p className="text-red-600 text-sm mt-1">{errors.otroTipo.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                    placeholder="Descripción detallada del producto..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe los beneficios y características del producto
                  </p>
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagen del Producto
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-cyan-500 transition-colors">
                    <div className="flex flex-col items-center">
                      {imagePreview ? (
                        <div className="relative w-full h-48 mb-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <FontAwesomeIcon icon={faUpload} className="w-12 h-12 text-gray-400 mb-4" />
                      )}
                      <label className="cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faUpload} />
                        {uploadingImage ? 'Subiendo...' : imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG o GIF (max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploadingImage}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {isSubmitting ? 'Guardando...' : 'Guardar producto'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div >
      </main >
    </>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      title: "Crear Producto Único - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Productos Únicos', href: '/productos' },
        { label: 'Crear Producto', href: '/productos/nuevo', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico'],
      activeSection: "productos"
    }
  };
}

export default NuevoProductoPage;
