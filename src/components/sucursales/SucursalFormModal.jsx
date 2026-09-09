import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faMapMarkerAlt, faPhone, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const SucursalFormModal = ({ isOpen, onClose, onSuccess, sucursalToEdit = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        status: 'active'
    });

    useEffect(() => {
        if (sucursalToEdit) {
            setFormData({
                name: sucursalToEdit.name || '',
                address: sucursalToEdit.address || '',
                phone: sucursalToEdit.phone || '',
                status: sucursalToEdit.status || 'active'
            });
        } else {
            setFormData({
                name: '',
                address: '',
                phone: '',
                status: 'active'
            });
        }
    }, [sucursalToEdit, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showErrorToast('El nombre de la sucursal es requerido');
            return;
        }

        try {
            setLoading(true);

            const sucursalData = {
                name: formData.name.trim(),
                address: formData.address.trim(),
                phone: formData.phone.trim(),
                status: formData.status,
                updatedAt: new Date().toISOString()
            };

            if (sucursalToEdit) {
                // Update existing
                const docRef = doc(db, 'sucursales', sucursalToEdit.id);
                await updateDoc(docRef, sucursalData);
                showSuccessToast('Sucursal actualizada exitosamente');

                // Trigger Sync
                try {
                    fetch('/api/integration/sync-trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'sucursal',
                            data: { id: sucursalToEdit.id, ...sucursalData }
                        })
                    });
                } catch (err) { console.error('Sync failed', err); }

            } else {
                // Create new
                sucursalData.createdAt = new Date().toISOString();
                const docRef = await addDoc(collection(db, 'sucursales'), sucursalData);
                showSuccessToast('Sucursal creada exitosamente');

                // Trigger Sync
                try {
                    fetch('/api/integration/sync-trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'sucursal',
                            data: { id: docRef.id, ...sucursalData }
                        })
                    });
                } catch (err) { console.error('Sync failed', err); }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving sucursal:', error);
            showErrorToast('Error al guardar la sucursal');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-[#1c4040]" />
                        {sucursalToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200 text-gray-500 hover:text-gray-700 hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la Sucursal <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Sede Principal"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección
                        </label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-transparent outline-none transition-all"
                                placeholder="Dirección completa"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-transparent outline-none transition-all"
                                placeholder="Teléfono de contacto"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-transparent outline-none transition-all"
                        >
                            <option value="active">Activa</option>
                            <option value="inactive">Inactiva</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all duration-200 hover:scale-105"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#1c4040] hover:bg-[#143030] text-white rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="w-4 h-4 text-[#c2ef03]" />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SucursalFormModal;
