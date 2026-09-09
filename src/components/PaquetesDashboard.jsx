import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  Users, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Upload,
  DollarSign,
  Tag,
  User,
  Calendar,
  Edit2
} from 'lucide-react';
import {
  createPackage,
  getPackages,
  updatePackage,
  deletePackage,
  assignPackageToUser,
  getUserPackages,
  getAllUsers,
  cancelUserPackage,
  uploadPackageImage,
  formatPrice,
  validatePackageData,
  updateAssignedPackage
} from '../../lib/firebase/packagesService';
import EditarPaqueteAsignadoModal from './EditarPaqueteAsignadoModal';

const PaquetesDashboard = () => {
  // Estados principales
  const [packages, setPackages] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPackages, setUserPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para crear/editar paquete
  const [isCreating, setIsCreating] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    targetAudience: 'clientes',
    paymentType: 'unico',
    description: '',
    price: '',
    imageUrl: '',
    discounts: []
  });

  // Estados para asignar paquete
  const [assignForm, setAssignForm] = useState({
    userId: '',
    packageId: '',
    discountName: '',
    fechaAsignacion: new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
  });

  // Estados auxiliares
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newDiscount, setNewDiscount] = useState({ name: '', percentage: '' });
  
  // Estados para editar paquete asignado
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [packagesResult, usersResult, userPackagesResult] = await Promise.all([
        getPackages(),
        getAllUsers(),
        getUserPackages()
      ]);

      if (packagesResult.success) setPackages(packagesResult.packages);
      if (usersResult.success) setUsers(usersResult.users);
      if (userPackagesResult.success) setUserPackages(userPackagesResult.userPackages);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // ====== FUNCIONES PARA PAQUETES ======

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    
    const validation = validatePackageData(packageForm);
    if (!validation.isValid) {
      showMessage('error', validation.errors.join(', '));
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPackage({
        ...packageForm,
        price: parseFloat(packageForm.price)
      });
      
      if (result.success) {
        showMessage('success', 'Paquete creado exitosamente');
        setPackageForm({
          name: '', targetAudience: 'clientes', paymentType: 'unico',
          description: '', price: '', imageUrl: '', discounts: []
        });
        await loadAllData();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Error al crear el paquete');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg.id);
    setPackageForm({
      name: pkg.name,
      targetAudience: pkg.targetAudience,
      paymentType: pkg.paymentType,
      description: pkg.description,
      price: pkg.price.toString(),
      imageUrl: pkg.imageUrl || '',
      discounts: pkg.discounts || []
    });
    
    // Scroll al formulario cuando se inicia la edición
    setTimeout(() => {
      const formElement = document.querySelector('#package-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    
    const validation = validatePackageData(packageForm);
    if (!validation.isValid) {
      showMessage('error', validation.errors.join(', '));
      return;
    }

    try {
      const result = await updatePackage(editingPackage, {
        ...packageForm,
        price: parseFloat(packageForm.price)
      });
      
      if (result.success) {
        showMessage('success', 'Paquete actualizado exitosamente');
        setEditingPackage(null);
        setPackageForm({
          name: '', targetAudience: 'clientes', paymentType: 'unico',
          description: '', price: '', imageUrl: '', discounts: []
        });
        await loadAllData();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Error al actualizar el paquete');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este paquete?')) return;

    try {
      const result = await deletePackage(packageId);
      if (result.success) {
        showMessage('success', 'Paquete eliminado exitosamente');
        await loadAllData();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Error al eliminar el paquete');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadPackageImage(file, `temp-${Date.now()}`);
      if (result.success) {
        setPackageForm({ ...packageForm, imageUrl: result.imageUrl });
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
    if (!newDiscount.name || !newDiscount.percentage) {
      showMessage('error', 'Completa el nombre y porcentaje del descuento');
      return;
    }

    if (newDiscount.percentage < 0 || newDiscount.percentage > 100) {
      showMessage('error', 'El porcentaje debe estar entre 0 y 100');
      return;
    }

    setPackageForm({
      ...packageForm,
      discounts: [...packageForm.discounts, { ...newDiscount, percentage: parseFloat(newDiscount.percentage) }]
    });
    setNewDiscount({ name: '', percentage: '' });
  };

  const removeDiscount = (index) => {
    setPackageForm({
      ...packageForm,
      discounts: packageForm.discounts.filter((_, i) => i !== index)
    });
  };

  // ====== FUNCIONES PARA ASIGNACIONES ======

  const handleAssignPackage = async (e) => {
    e.preventDefault();
    
    if (!assignForm.userId || !assignForm.packageId) {
      showMessage('error', 'Selecciona usuario y paquete');
      return;
    }

    if (!assignForm.fechaAsignacion) {
      showMessage('error', 'La fecha de asignación es requerida');
      return;
    }

    try {
      let discountToApply = null;
      if (assignForm.discountName && assignForm.discountName.trim() !== '') {
        try {
          discountToApply = JSON.parse(assignForm.discountName);
        } catch (e) {
          // Si no se puede parsear, asumir que es el nombre directo (retrocompatibilidad)
          discountToApply = assignForm.discountName;
        }
      }
      console.log('Asignando paquete con descuento:', discountToApply, 'fecha:', assignForm.fechaAsignacion);
      
      const result = await assignPackageToUser(
        assignForm.userId,
        assignForm.packageId,
        discountToApply,
        assignForm.fechaAsignacion // Pasar la fecha personalizada
      );
      
      if (result.success) {
        showMessage('success', 'Paquete asignado exitosamente');
        setAssignForm({ 
          userId: '', 
          packageId: '', 
          discountName: '',
          fechaAsignacion: new Date().toISOString().split('T')[0]
        });
        await loadAllData();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Error al asignar el paquete');
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta asignación?')) return;

    try {
      const result = await cancelUserPackage(assignmentId);
      if (result.success) {
        showMessage('success', 'Asignación cancelada exitosamente');
        await loadAllData();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Error al cancelar la asignación');
    }
  };

  // ====== FUNCIONES PARA EDITAR PAQUETES ASIGNADOS ======

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async (updateData) => {
    if (!editingAssignment) return;

    try {
      // Parsear el descuento si viene en formato JSON
      let descuentoToSave = updateData.descuento;
      if (descuentoToSave && typeof descuentoToSave === 'string' && descuentoToSave.trim() !== '') {
        try {
          descuentoToSave = JSON.parse(descuentoToSave);
        } catch (e) {
          // Si no se puede parsear, dejar el valor como está (retrocompatibilidad)
        }
      } else if (!descuentoToSave) {
        descuentoToSave = null;
      }

      const result = await updateAssignedPackage(
        editingAssignment.userId,
        editingAssignment.id,
        { ...updateData, descuento: descuentoToSave }
      );

      if (result.success) {
        showMessage('success', 'Paquete actualizado exitosamente');
        setIsEditModalOpen(false);
        setEditingAssignment(null);
        await loadAllData();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      showMessage('error', 'Error al actualizar el paquete');
    }
  };

  // ====== FUNCIONES AUXILIARES ======

  const getSelectedPackageDiscounts = () => {
    const selectedPackage = packages.find(p => p.id === assignForm.packageId);
    return selectedPackage?.discounts || [];
  };

  const getSelectedPackage = () => {
    return packages.find(p => p.id === assignForm.packageId);
  };

  const getDiscountDetails = (assignment) => {
    if (!assignment.discountApplied) return null;
    
    // Buscar el paquete para obtener los detalles del descuento
    const packageData = packages.find(p => p.id === assignment.packageId);
    if (!packageData || !packageData.discounts) return { name: assignment.discountApplied, percentage: 0 };
    
    const discount = packageData.discounts.find(d => d.name === assignment.discountApplied);
    return discount || { name: assignment.discountApplied, percentage: 0 };
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'Usuario no encontrado';
    
    const nombre = user.nombre || '';
    const apellidos = user.apellidos || '';
    const fullName = `${nombre} ${apellidos}`.trim();
    const type = user.type ? ` (${user.type})` : '';
    
    return fullName ? `${fullName}${type}` : 'Usuario sin nombre';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando paquetes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Package className="mr-3" size={32} />
            Gestión de Paquetes
          </h1>
          <p className="text-gray-600 mt-2">Crea, gestiona y asigna paquetes a clientes y atletas</p>
        </div>

        {/* Mensaje de estado */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          } border`}>
            <div className="flex items-center">
              {message.type === 'success' ? <Check size={20} className="mr-2" /> : <X size={20} className="mr-2" />}
              {message.text}
            </div>
          </div>
        )}

        {/* Sección 1: Crear/Editar Paquete */}
        <section className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Plus className="mr-2" size={20} />
            {editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}
          </h2>

          <form id="package-form" onSubmit={editingPackage ? handleUpdatePackage : handleCreatePackage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Paquete</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Paquete Básico de Nutrición"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Público Objetivo</label>
                <select
                  value={packageForm.targetAudience}
                  onChange={(e) => setPackageForm({ ...packageForm, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="clientes">Clientes</option>
                  <option value="atletas">Atletas</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
                <select
                  value={packageForm.paymentType}
                  onChange={(e) => setPackageForm({ ...packageForm, paymentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="unico">Pago Único</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Describe el contenido y beneficios del paquete..."
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Paquete</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="package-image"
                />
                <label
                  htmlFor="package-image"
                  className="cursor-pointer flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <Upload size={16} className="mr-2" />
                  {uploadingImage ? 'Subiendo...' : 'Seleccionar Imagen'}
                </label>
                {packageForm.imageUrl && (
                  <img src={packageForm.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
                )}
              </div>
            </div>

            {/* Descuentos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descuentos</label>
              
              {/* Lista de descuentos existentes */}
              {packageForm.discounts.length > 0 && (
                <div className="mb-3 space-y-2">
                  {packageForm.discounts.map((discount, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">{discount.name} - {discount.percentage}%</span>
                      <button
                        type="button"
                        onClick={() => removeDiscount(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nuevo descuento */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nombre del descuento"
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="number"
                  placeholder="Porcentaje"
                  min="0"
                  max="100"
                  value={newDiscount.percentage}
                  onChange={(e) => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={addDiscount}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {isCreating ? 'Guardando...' : (editingPackage ? 'Actualizar Paquete' : 'Crear Paquete')}
              </button>
              
              {editingPackage && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPackage(null);
                    setPackageForm({
                      name: '', targetAudience: 'clientes', paymentType: 'unico',
                      description: '', price: '', imageUrl: '', discounts: []
                    });
                    showMessage('info', 'Edición cancelada');
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Sección 2: Paquetes Registrados */}
        <section className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Package className="mr-2" size={20} />
            Paquetes Registrados ({packages.length})
          </h2>

          {packages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay paquetes registrados aún</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                  {pkg.imageUrl && (
                    <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-32 object-cover rounded mb-3" />
                  )}
                  
                  <h3 className="font-semibold text-gray-800 mb-2">{pkg.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p><span className="font-medium">Público:</span> {pkg.targetAudience}</p>
                    <p><span className="font-medium">Tipo:</span> {pkg.paymentType}</p>
                    <p><span className="font-medium">Precio:</span> {formatPrice(pkg.price)}</p>
                    <p><span className="font-medium">Descuentos:</span> {pkg.discounts?.length || 0}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      <Edit size={16} className="mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sección 3: Asignar Paquetes */}
        <section className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            Asignar Paquete a Usuario
          </h2>

          <form onSubmit={handleAssignPackage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <select
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccionar usuario...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} {user.apellidos} ({user.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paquete</label>
                <select
                  value={assignForm.packageId}
                  onChange={(e) => setAssignForm({ ...assignForm, packageId: e.target.value, discountName: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccionar paquete...</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatPrice(pkg.price)}
                    </option>
                  ))}
                </select>
                {/* Mostrar descripción del paquete seleccionado */}
                {assignForm.packageId && getSelectedPackage() && (
                  <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-md">
                    <div className="flex items-start">
                      <Package size={16} className="text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-cyan-900 mb-1">Descripción del paquete:</p>
                        <p className="text-sm text-gray-700">
                          {getSelectedPackage().description || 'Sin descripción disponible'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (Opcional)</label>
                <select
                  value={assignForm.discountName}
                  onChange={(e) => setAssignForm({ ...assignForm, discountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={!assignForm.packageId || getSelectedPackageDiscounts().length === 0}
                >
                  <option value="">Sin descuento</option>
                  {getSelectedPackageDiscounts().map((discount, index) => (
                    <option key={index} value={JSON.stringify({ name: discount.name, percentage: discount.percentage })}>
                      {discount.name} ({discount.percentage}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Asignación
              </label>
              <input
                type="date"
                value={assignForm.fechaAsignacion}
                onChange={(e) => setAssignForm({ ...assignForm, fechaAsignacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes seleccionar una fecha anterior si estás registrando un paquete asignado previamente
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              Asignar Paquete
            </button>
          </form>
        </section>

        {/* Sección 4: Paquetes Asignados */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Paquetes Asignados ({userPackages.length})
          </h2>

          {userPackages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay paquetes asignados aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Paquete</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Precio Original</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Descuento</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Precio Final</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userPackages.map(assignment => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">{getUserName(assignment.userId)}</td>
                      <td className="px-4 py-3 text-gray-800">{assignment.packageName}</td>
                      <td className="px-4 py-3 text-gray-800">{formatPrice(assignment.originalPrice)}</td>
                      <td className="px-4 py-3">
                        {assignment.discountApplied ? (
                          (() => {
                            const discountInfo = getDiscountDetails(assignment);
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <Tag size={12} className="mr-1" />
                                {discountInfo.name} ({discountInfo.percentage}%)
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">Sin descuento</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-teal-600">
                        {formatPrice(assignment.finalPrice)}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {assignment.assignedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar paquete"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleCancelAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancelar asignación"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal de edición de paquete asignado */}
      <EditarPaqueteAsignadoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAssignment(null);
        }}
        assignment={editingAssignment}
        onUpdate={handleUpdateAssignment}
      />
    </div>
  );
};

export default PaquetesDashboard;