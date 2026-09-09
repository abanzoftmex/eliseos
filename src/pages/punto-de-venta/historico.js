import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { getVentas, deleteVenta } from '../../../lib/firebase/salesService';
import { deleteTransactionInScienceChago } from '../../../lib/scienceChago';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint, faCalendar, faSearch, faTrash, faTimes, faShoppingCart, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { jsPDF } from "jspdf";
import toast from 'react-hot-toast';
import useSucursalStore from '../../store/sucursalStore';

export default function HistorialVentasPage() {
    const router = useRouter();
    const selectedSucursal = useSucursalStore((state) => state.selectedSucursal);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estado para modal de doble confirmación
    const [deleteModal, setDeleteModal] = useState({ open: false, venta: null, step: 1 });
    const [selectedVenta, setSelectedVenta] = useState(null);

    useEffect(() => {
        const fetchVentas = async () => {
            setLoading(true);
            const res = await getVentas(selectedSucursal, 100);
            if (res.success) {
                setVentas(res.ventas);
            }
            setLoading(false);
        };
        fetchVentas();
    }, [selectedSucursal]);

    const filteredVentas = ventas.filter(v => {
        const term = searchTerm.toLowerCase();
        const clientName = v.client ? `${v.client.nombre} ${v.client.apellidoPaterno}`.toLowerCase() : 'venta de mostrador';
        const idMatch = v.id.toLowerCase().includes(term);
        // Filtrar por nombre cliente o ID
        return clientName.includes(term) || idMatch;
    });

    const handleReprint = (saleData) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 210]
        });

        let y = 5;
        const lineHeight = 4;

        doc.setFontSize(10);
        doc.text("Elíseos Box & Fitness", 29, y, { align: 'center' });
        y += lineHeight + 2;

        doc.setFontSize(8);
        doc.text("REIMPRESION", 29, y, { align: 'center' });
        y += lineHeight + 2;

        const dateStr = saleData.date instanceof Date ? saleData.date.toLocaleString() : new Date(saleData.date).toLocaleString();
        doc.text(dateStr, 29, y, { align: 'center' });
        y += lineHeight + 2;

        if (saleData.client) {
            doc.text(`Cte: ${saleData.client.nombre} ${saleData.client.apellidoPaterno || ''}`, 2, y);
            y += lineHeight;
        }

        doc.text("-".repeat(32), 2, y);
        y += lineHeight;

        saleData.items.forEach(item => {
            const title = item.name.substring(0, 15);
            const qty = item.quantity;
            const totalItem = item.price * qty;

            doc.text(`${qty}x ${title}`, 2, y);
            doc.text(`$${totalItem.toFixed(2)}`, 56, y, { align: 'right' });
            y += lineHeight;
        });

        doc.text("-".repeat(32), 2, y);
        y += lineHeight;

        doc.setFontSize(10);
        doc.text(`TOTAL: $${saleData.total.toFixed(2)}`, 56, y, { align: 'right' });
        y += lineHeight * 2;

        doc.setFontSize(8);
        doc.text("¡Gracias por su compra!", 29, y, { align: 'center' });

        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDelete = async (venta) => {
        // Abrir modal de doble confirmación
        setDeleteModal({ open: true, venta, step: 1 });
    };

    const confirmDelete = async () => {
        const venta = deleteModal.venta;
        if (!venta) return;

        setDeleteModal(prev => ({ ...prev, loading: true }));

        const res = await deleteVenta(venta.id);
        if (res.success) {
            // Eliminar transacción en Science Chago si existe el externalId
            if (venta.transactionExternalId) {
                try {
                    await deleteTransactionInScienceChago(
                        venta.transactionExternalId,
                        `Venta eliminada del historial`
                    );
                } catch (syncError) {
                    console.warn('Error deleting transaction in Science Chago:', syncError);
                }
            }
            
            toast.success('Venta eliminada');
            // Recargar lista localmente
            setVentas(ventas.filter(v => v.id !== venta.id));
            setDeleteModal({ open: false, venta: null, step: 1 });
        } else {
            toast.error('Error al eliminar venta');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeDeleteModal = () => {
        setDeleteModal({ open: false, venta: null, step: 1 });
    };

    // Renderizar modal de doble confirmación
    const renderDeleteModal = () => {
        if (!deleteModal.open || !deleteModal.venta) return null;
        
        const venta = deleteModal.venta;
        const clientName = venta.client 
            ? `${venta.client.nombre} ${venta.client.apellidoPaterno || ''}` 
            : 'Venta de Mostrador';
        const dateStr = venta.date instanceof Date 
            ? venta.date.toLocaleString() 
            : new Date(venta.date).toLocaleString();

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    {deleteModal.step === 1 ? (
                        <>
                            {/* Paso 1: Primera confirmación */}
                            <div className="p-6">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
                                    <FontAwesomeIcon icon={faTrash} className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                                    ¿Eliminar esta venta?
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-600"><strong>Cliente:</strong> {clientName}</p>
                                    <p className="text-sm text-gray-600"><strong>Fecha:</strong> {dateStr}</p>
                                    <p className="text-sm text-gray-600"><strong>Total:</strong> ${venta.total.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600"><strong>Productos:</strong> {venta.totalItems}</p>
                                </div>
                                <p className="text-sm text-gray-500 text-center">
                                    Esta acción eliminará permanentemente la venta del sistema.
                                </p>
                            </div>
                            <div className="flex border-t border-gray-200">
                                <button
                                    onClick={closeDeleteModal}
                                    className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setDeleteModal(prev => ({ ...prev, step: 2 }))}
                                    className="flex-1 px-4 py-3 text-yellow-600 hover:bg-yellow-50 font-medium transition-colors border-l border-gray-200"
                                >
                                    Continuar
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Paso 2: Segunda confirmación (doble check) */}
                            <div className="p-6">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                                    <FontAwesomeIcon icon={faTrash} className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-center text-red-600 mb-2">
                                    ⚠️ Confirmación Final
                                </h3>
                                <p className="text-center text-gray-600 mb-4">
                                    ¿Estás <strong>completamente seguro</strong> de que deseas eliminar esta venta?
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-700 font-semibold text-center">
                                        Esta acción NO se puede deshacer
                                    </p>
                                    <p className="text-xs text-red-600 text-center mt-1">
                                        Se eliminará el registro de la venta y la transacción asociada
                                    </p>
                                </div>
                            </div>
                            <div className="flex border-t border-gray-200">
                                <button
                                    onClick={closeDeleteModal}
                                    disabled={deleteModal.loading}
                                    className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteModal.loading}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white hover:bg-red-700 font-medium transition-colors border-l border-gray-200 disabled:opacity-50"
                                >
                                    {deleteModal.loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Eliminando...
                                        </span>
                                    ) : (
                                        'Sí, Eliminar'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Layout title="Historial de Ventas" activeSection="productos" showBreadcrumbs={false} hideSidebar={true}>
            <div className="flex flex-col h-screen bg-gray-50 p-6 gap-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/punto-de-venta')}
                            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
                            <p className="text-sm text-gray-500">Últimas transacciones realizadas</p>
                        </div>
                    </div>

                    <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                    <div className="overflow-x-auto h-full">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ítems</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ticket</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex justify-center mb-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                                            </div>
                                            Cargando historial...
                                        </td>
                                    </tr>
                                ) : filteredVentas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            No se encontraron ventas
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVentas.map((venta) => (
                                        <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faCalendar} className="text-gray-300" />
                                                    {venta.date instanceof Date ? venta.date.toLocaleString() : 'Fecha inválida'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                                {venta.client ? (
                                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                                                        {venta.client.nombre} {venta.client.apellidoPaterno}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Venta de Mostrador</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => setSelectedVenta(venta)}
                                                    className="text-left hover:bg-cyan-50 p-2 rounded-lg transition-colors w-full"
                                                >
                                                    <div className="text-cyan-600 font-semibold flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faReceipt} className="text-xs" />
                                                        {venta.totalItems} productos
                                                    </div>
                                                    <div className="text-xs text-gray-400 max-w-[200px] truncate">
                                                        {venta.items.map(i => i.name).join(', ')}
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-right">
                                                ${venta.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                                                <button
                                                    onClick={() => handleReprint(venta)}
                                                    className="text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 p-2 rounded transition-colors"
                                                    title="Reimprimir Ticket"
                                                >
                                                    <FontAwesomeIcon icon={faPrint} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(venta)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                                    title="Eliminar Venta"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal de Detalle de Venta - Ticket */}
                {selectedVenta && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedVenta(null)}>
                        <div 
                            className="bg-yellow-50 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] border-2 border-yellow-300 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del Ticket */}
                            <div className="p-4 bg-yellow-100 border-b border-yellow-200 flex justify-between items-center">
                                <h2 className="font-bold text-yellow-900 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faShoppingCart} />
                                    Detalle de Venta
                                </h2>
                                <button
                                    onClick={() => setSelectedVenta(null)}
                                    className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-200 rounded-lg transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Información del Cliente y Fecha */}
                            <div className="p-4 bg-yellow-100 border-b border-yellow-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-yellow-700 font-medium">Fecha:</span>
                                    <span className="text-yellow-900 font-semibold">
                                        {selectedVenta.date instanceof Date ? selectedVenta.date.toLocaleString() : new Date(selectedVenta.date).toLocaleString()}
                                    </span>
                                </div>
                                {selectedVenta.client && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-yellow-700 font-medium">Cliente:</span>
                                        <span className="text-yellow-900 font-semibold">
                                            {selectedVenta.client.nombre} {selectedVenta.client.apellidoPaterno}
                                        </span>
                                    </div>
                                )}
                                {!selectedVenta.client && (
                                    <div className="text-sm text-yellow-700 text-center italic">
                                        Venta de Mostrador
                                    </div>
                                )}
                            </div>

                            {/* Lista de Productos */}
                            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                {selectedVenta.items.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-800">{item.name}</h4>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    ${item.price.toFixed(2)} × {item.quantity}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-cyan-600">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer con Total */}
                            <div className="p-4 bg-yellow-100 border-t border-yellow-200">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-yellow-900 font-semibold text-lg">Total Pagado</span>
                                    <span className="text-3xl font-bold text-yellow-900">
                                        ${selectedVenta.total.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleReprint(selectedVenta)}
                                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faPrint} />
                                    <span>Reimprimir Ticket</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de doble confirmación para eliminar */}
                {renderDeleteModal()}
            </div>
        </Layout>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {
            requireAuth: true,
            allowedRoles: ['admin', 'medico', 'recepcion'],
        }
    };
}
