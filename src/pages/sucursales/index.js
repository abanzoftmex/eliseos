import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faMapMarkerAlt,
    faSearch,
    faEdit,
    faTrash,
    faBuilding,
    faPhone
} from '@fortawesome/free-solid-svg-icons';
import { db } from '../../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import SucursalFormModal from '../../components/sucursales/SucursalFormModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import SearchBar from '../../components/common/SearchBar';
import ViewToggle from '../../components/common/ViewToggle';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import useSucursalStore from '../../store/sucursalStore';
import useViewStore from '../../store/viewStore';

export default function SucursalesPage() {
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // View mode from store
    const { viewMode } = useViewStore();

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [sucursalToEdit, setSucursalToEdit] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sucursalToDelete, setSucursalToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Store action to update global state
    const setGlobalSucursales = useSucursalStore((state) => state.setSucursales);

    const fetchSucursales = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'sucursales'), orderBy('name'));
            const querySnapshot = await getDocs(q);

            const sucursalesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setSucursales(sucursalesData);

            // Update global store
            setGlobalSucursales(sucursalesData);

        } catch (error) {
            console.error('Error fetching sucursales:', error);
            showErrorToast('Error al cargar las sucursales');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSucursales();
    }, []);

    const handleEdit = (sucursal) => {
        setSucursalToEdit(sucursal);
        setIsFormOpen(true);
    };

    const handleDelete = (sucursal) => {
        setSucursalToDelete(sucursal);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!sucursalToDelete) return;

        try {
            setIsDeleting(true);
            await deleteDoc(doc(db, 'sucursales', sucursalToDelete.id));
            showSuccessToast('Sucursal eliminada exitosamente');
            await fetchSucursales();
            setIsDeleteModalOpen(false);
            setSucursalToDelete(null);
        } catch (error) {
            console.error('Error deleting sucursal:', error);
            showErrorToast('Error al eliminar la sucursal');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredSucursales = sucursales.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1c4040] flex items-center gap-3">
                            <FontAwesomeIcon icon={faBuilding} className="w-8 h-8 text-[#1c4040]" />
                            Gestión de Sucursales
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Administra tus sucursales disponibles en Elíseos Box & Fitness
                        </p>
                    </div>
                    
                    {/* Search Bar y View Toggle */}
                    <div className="flex items-center gap-3 max-w-2xl w-full">
                        <SearchBar
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Buscar sucursal por nombre o dirección..."
                            className="flex-1"
                        />
                        <ViewToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto py-8 px-8">
                {/* Action Buttons */}
                <div className="mb-8">
                    <button
                        onClick={() => {
                            setSucursalToEdit(null);
                            setIsFormOpen(true);
                        }}
                        className="inline-flex items-center px-8 py-4 bg-[#1c4040] hover:bg-[#143030] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <FontAwesomeIcon icon={faPlus} className="w-5 h-5 mr-3 text-[#c2ef03]" />
                        Nueva Sucursal
                    </button>
                </div>

                {/* Lista de Sucursales */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Sucursales</h3>
                            <p className="text-gray-500 mt-1">Ubicaciones disponibles en Elíseos Box & Fitness</p>
                        </div>
                        <div className="bg-[#1c4040] p-3 rounded-xl">
                            <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c4040]"></div>
                        </div>
                    ) : filteredSucursales.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-[#f4f8f8] rounded-full flex items-center justify-center mx-auto mb-4">
                                {searchTerm ? (
                                    <FontAwesomeIcon icon={faSearch} className="w-10 h-10 text-gray-400" />
                                ) : (
                                    <FontAwesomeIcon icon={faBuilding} className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">
                                {searchTerm ? 'No se encontraron coincidencias' : 'No hay sucursales registradas'}
                            </h4>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                                {searchTerm
                                    ? `No se encontraron sucursales que coincidan con "${searchTerm}". Intenta con otro término de búsqueda.`
                                    : 'Utiliza el botón "Nueva Sucursal" para agregar ubicaciones.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {filteredSucursales.length} sucursal{filteredSucursales.length === 1 ? '' : 'es'}
                                {searchTerm ? ' encontrada' : ' registrada'}{filteredSucursales.length === 1 ? '' : 's'}
                                {searchTerm && ` para "${searchTerm}"`}
                            </p>
                            {/* Grid de Sucursales */}
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredSucursales.map((sucursal) => (
                                        <div key={sucursal.id} className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-2 border-cyan-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-cyan-300 relative">
                                            
                                            {/* Información principal */}
                                            <div className="flex items-center mb-4">
                                                <div className="flex-shrink-0 mr-4">
                                                    <div className="w-16 h-16 bg-[#1c4040] rounded-xl flex items-center justify-center shadow-lg">
                                                        <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>

                                                {/* Información básica */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg font-bold text-gray-800">
                                                        {sucursal.name}
                                                    </h4>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        sucursal.status === 'active' ? 'bg-[#1c4040] text-[#c2ef03]' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {sucursal.status === 'active' ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Información de contacto */}
                                            <div className="space-y-2 text-sm">
                                                {sucursal.address && (
                                                    <div className="flex items-start text-gray-600">
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5 mr-2 text-[#1c4040] mt-0.5 flex-shrink-0" />
                                                        <span className="break-words">{sucursal.address}</span>
                                                    </div>
                                                )}

                                                {sucursal.phone && (
                                                    <div className="flex items-center text-gray-600">
                                                        <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 mr-2 text-[#1c4040]" />
                                                        <span>{sucursal.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Estado y tipo 
                                            <div className="mt-4 pt-3 border-t border-cyan-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        Sucursal {sucursal.status === 'active' ? 'Operativa' : 'Cerrada'}
                                                    </span>
                                                </div>
                                            </div>*/}

                                            {/* Botones de Acción */}
                                            <div className="mt-4 flex gap-2">
                                                {/* Botón Editar */}
                                                <div className="relative group flex-1">
                                                    <button
                                                        onClick={() => handleEdit(sucursal)}
                                                        className="w-full flex items-center justify-center p-3 bg-[#1c4040] hover:bg-[#143030] text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                                                    </button>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                                        Editar
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>

                                                {/* Botón Eliminar */}
                                                <div className="relative group flex-1">
                                                    <button
                                                        onClick={() => handleDelete(sucursal)}
                                                        className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                                                    </button>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                                        Eliminar
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Vista de Tabla HTML
                                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 bg-white">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Sucursal
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Dirección
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Teléfono
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredSucursales.map((sucursal) => (
                                                <tr key={sucursal.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    {/* Columna: Sucursal (icono + nombre) */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {sucursal.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Columna: Dirección */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start gap-2">
                                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm text-gray-700">
                                                                {sucursal.address || 'No especificada'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Columna: Teléfono */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-cyan-500" />
                                                            <span className="text-sm text-gray-700">
                                                                {sucursal.phone || 'No especificado'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Columna: Estado */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            sucursal.status === 'active' ? 'bg-lime-600 text-lime-50' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {sucursal.status === 'active' ? 'Activa' : 'Inactiva'}
                                                        </span>
                                                    </td>

                                                    {/* Columna: Acciones */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {/* Botón Editar */}
                                                            <div className="relative group">
                                                                <button
                                                                    onClick={() => handleEdit(sucursal)}
                                                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-sm hover:scale-105"
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                                                                </button>
                                                                {/* Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                                                    Editar
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            </div>

                                                            {/* Botón Eliminar */}
                                                            <div className="relative group">
                                                                <button
                                                                    onClick={() => handleDelete(sucursal)}
                                                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm hover:scale-105"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                                                                </button>
                                                                {/* Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                                                    Eliminar
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <SucursalFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchSucursales}
                sucursalToEdit={sucursalToEdit}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Sucursal"
                message={`¿Estás seguro que deseas eliminar la sucursal "${sucursalToDelete?.name}"? Esta acción no se puede deshacer.`}
                isDeleting={isDeleting}
            />
        </>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {
            title: "Gestión de Sucursales - Elíseos Box & Fitness",
            requireAuth: true,
            allowedRoles: ['admin']
        }
    };
}
