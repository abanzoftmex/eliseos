'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faUpload,
  faCamera,
  faUser,
  faEnvelope as faMail,
  faPhone,
  faFileText,
  faBriefcase,
  faSave,
  faX,
  faMapMarkerAlt as faMapPin
} from '@fortawesome/free-solid-svg-icons';
import { db, storage } from '../../lib/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import useSucursalStore from '../store/sucursalStore';

export default function DirectorioForm({ profesional = null, mode = 'create' }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const sucursales = useSucursalStore((state) => state.sucursales);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSucursalesDropdown, setShowSucursalesDropdown] = useState(false);

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
    telefonoContacto: profesional?.telefonoContacto || profesional?.telefono || '',
    cedulaProfesional: profesional?.cedulaProfesional || '',
    especialidad: profesional?.especialidad || '',
    area: profesional?.area || '',
    status: profesional?.status || 'active',
    sucursales: Array.isArray(profesional?.sucursales) ? profesional.sucursales : (profesional?.sucursal ? [profesional.sucursal] : []),
    observaciones: profesional?.observaciones || ''
  });

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
    if (selectedSucursales.length === 0) return 'Seleccionar Sucursales';
    if (selectedSucursales.length === 1) return selectedSucursales[0].name;
    return `${selectedSucursales.length} sucursales seleccionadas`;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showErrorToast('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('La imagen no debe exceder 5MB');
      return;
    }

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

  const uploadImageToStorage = async (file) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `directorio/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.apellidoPaterno.trim()) {
      showErrorToast('Nombre y apellido paterno son requeridos');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showErrorToast('Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);

      let photoURL = formData.foto;
      if (formData.fotoFile) {
        photoURL = await uploadImageToStorage(formData.fotoFile);
      }

      const professionalData = {
        foto: photoURL || '',
        nombre: formData.nombre || '',
        apellidoPaterno: formData.apellidoPaterno || '',
        apellidoMaterno: formData.apellidoMaterno || '',
        puesto: formData.puesto || '',
        ocupacion: formData.puesto || '',
        abreviaturaEstudio: formData.abreviaturaEstudio || '',
        email: formData.email || '',
        telefono: formData.telefonoContacto || '',
        telefonoContacto: formData.telefonoContacto || '',
        cedulaProfesional: formData.cedulaProfesional || '',
        especialidad: formData.especialidad || '',
        area: formData.area || '',
        status: formData.status || 'active',
        sucursales: formData.sucursales || [],
        observaciones: formData.observaciones || '',
        updatedAt: new Date().toISOString()
      };

      if (mode === 'edit' && profesional?.id) {
        const professionalRef = doc(db, 'directorio', profesional.id);
        await updateDoc(professionalRef, professionalData);
        showSuccessToast('Profesional actualizado exitosamente');
        setTimeout(() => {
          router.push(`/directorio/${profesional.id}`);
        }, 1000);
      } else {
        professionalData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'directorio'), professionalData);
        showSuccessToast('Profesional guardado exitosamente');
        setTimeout(() => {
          router.push('/directorio');
        }, 1500);
      }

    } catch (error) {
      console.error('Error saving professional:', error);
      showErrorToast(`Error al guardar el profesional: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      formData.nombre !== (profesional?.nombre || '') ||
      formData.apellidoPaterno !== (profesional?.apellidoPaterno || '') ||
      formData.email !== (profesional?.email || '') ||
      formData.fotoFile !== null;

    if (hasChanges) {
      const confirmCancel = window.confirm(
        '¿Estás seguro que deseas cancelar? Se perderán todos los cambios.'
      );
      if (!confirmCancel) return;
    }

    if (mode === 'edit' && profesional?.id) {
      router.push(`/directorio/${profesional.id}`);
    } else {
      router.push('/directorio');
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="px-6 py-5">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold mb-4 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            Cancelar y Volver
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent">
                {mode === 'edit' ? 'Editar Profesional' : 'Nuevo Contacto Interno'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'edit' ? 'Actualiza la información del profesional' : 'Completa la información del nuevo profesional'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Foto Section */}
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faCamera} className="w-6 h-6 text-cyan-600" />
              Fotografía
            </h2>

            <div className="flex flex-col items-center gap-4">
              {formData.fotoPreview ? (
                <div className="relative w-40 h-40">
                  <Image
                    src={formData.fotoPreview}
                    alt="Preview"
                    fill
                    className="rounded-full object-cover shadow-lg border-4 border-cyan-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        fotoFile: null,
                        fotoPreview: ''
                      }));
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faX} className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center border-4 border-cyan-300">
                  <FontAwesomeIcon icon={faCamera} className="w-12 h-12 text-cyan-600" />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faUpload} className="w-5 h-5" />
                {uploading ? 'Subiendo...' : 'Subir Fotografía'}
              </button>

              <p className="text-sm text-gray-500">
                Formatos: JPG, PNG. Máximo 5MB
              </p>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Información Personal */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-cyan-600" />
              Información Personal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={formData.apellidoPaterno}
                  onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Pérez"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abreviatura Estudio
                </label>
                <input
                  type="text"
                  value={formData.abreviaturaEstudio}
                  onChange={(e) => handleInputChange('abreviaturaEstudio', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Dr., Lic., Mtra."
                />
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Información de Contacto */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faMail} className="w-6 h-6 text-cyan-600" />
              Información de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={formData.telefonoContacto}
                  onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: 555-1234567"
                />
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Información Profesional */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faBriefcase} className="w-6 h-6 text-cyan-600" />
              Información Profesional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puesto
                </label>
                <input
                  type="text"
                  value={formData.puesto}
                  onChange={(e) => handleInputChange('puesto', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Médico Deportivo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula Profesional
                </label>
                <input
                  type="text"
                  value={formData.cedulaProfesional}
                  onChange={(e) => handleInputChange('cedulaProfesional', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => handleInputChange('especialidad', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Medicina Deportiva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Medicina, Administración"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sucursales
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSucursalesDropdown(!showSucursalesDropdown)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapPin} className="w-4 h-4 text-gray-400" />
                      <span className={formData.sucursales?.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                        {getSucursalesText()}
                      </span>
                    </div>
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
                            <FontAwesomeIcon icon={faX} className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Observaciones */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileText} className="w-6 h-6 text-cyan-600" />
              Observaciones
            </h2>

            <textarea
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Notas adicionales sobre el profesional..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading || uploading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {mode === 'edit' ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="w-5 h-5" />
                  {mode === 'edit' ? 'Guardar Cambios' : 'Guardar Profesional'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
