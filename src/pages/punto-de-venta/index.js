import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShoppingCart,
    faSearch,
    faPlus,
    faMinus,
    faTrash,
    faPrint,
    faMoneyBillWave,
    faUser,
    faBarcode,
    faArrowLeft,
    faHistory,
    faTimes,
    faReceipt,
    faThLarge,
    faTh,
    faList,
    faMapMarkerAlt,
    faBox,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import usePosStore from '../../store/posStore';
import { getProductos, getAllProductosInventario, updateProducto } from '../../../lib/firebase/productosService';
import { createVenta } from '../../../lib/firebase/salesService';
import { createCargo } from '../../../lib/firebase/cargosService';
import { createIngresoInScienceChago, generateTransactionExternalId, inicializarCategorias } from '../../../lib/scienceChago';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';
import toast from 'react-hot-toast';
import { jsPDF } from "jspdf";

export default function PuntoDeVentaPage() {
    const router = useRouter();
    const selectedSucursal = useSucursalStore((state) => state.selectedSucursal);
    const sucursales = useSucursalStore((state) => state.sucursales);
    const setSucursal = useSucursalStore((state) => state.setSucursal);
    const setSucursales = useSucursalStore((state) => state.setSucursales);
    const [productos, setProductos] = useState([]);
    const [inventarios, setInventarios] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [clients, setClients] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedType, setSelectedType] = useState('Todos');
    const [showCart, setShowCart] = useState(true);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const { viewMode, setViewMode } = usePosStore();

    // Obtener tipos únicos de productos
    const productTypes = ['Todos', ...new Set(productos.map(p => p.tipo).filter(Boolean))];

    // Cargar Sucursales (Ya que POS no usa el Layout/Sidebar que normalmente las carga)
    useEffect(() => {
        const fetchSucursales = async () => {
            try {
                const q = query(collection(db, 'sucursales'), orderBy('name'));
                const querySnapshot = await getDocs(q);
                const sucursalesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (sucursalesData.length > 0) {
                    setSucursales(sucursalesData);
                }
            } catch (error) {
                console.error('Error fetching sucursales:', error);
                toast.error('Error al cargar sucursales');
            }
        };

        fetchSucursales();
    }, [setSucursales]);

    // Forzar selección de sucursal si está en "Todas"
    useEffect(() => {
        if (selectedSucursal === ALL_SUCURSALES_ID) {
            setShowBranchModal(true);
        } else {
            setShowBranchModal(false);
        }
    }, [selectedSucursal]);

    // Cargar productos e inventarios
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Inicializar categorías de Science Chago (no bloqueante)
                try {
                    await inicializarCategorias();
                } catch (error) {
                    // Silenciar error - no debe bloquear la carga del POS
                    console.warn('Categorías no inicializadas:', error.message);
                }
                
                const [productosRes, inventariosRes] = await Promise.all([
                    getProductos(),
                    getAllProductosInventario()
                ]);

                if (productosRes.success) {
                    setProductos(productosRes.productos);
                }
                if (inventariosRes.success) {
                    setInventarios(inventariosRes.inventarios);
                }
            } catch (error) {
                toast.error('Error al cargar datos');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Buscar clientes
    useEffect(() => {
        if (clientSearchTerm.trim().length < 3) {
            setClients([]);
            return;
        }

        const normalizeText = (value = '') =>
            value
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();

        const searchClients = async () => {
            try {
                const response = await fetch('/api/clientes?simple=true');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();
                const clientes = Array.isArray(result.data) ? result.data : [];
                const searchWords = normalizeText(clientSearchTerm).split(/\s+/).filter(Boolean);

                const matches = clientes.filter((cliente) => {
                    const fullName = normalizeText(
                        `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`
                    );
                    const email = normalizeText(cliente.email || '');
                    const telefono = normalizeText(cliente.telefono || '');

                    return searchWords.every((word) =>
                        fullName.includes(word) ||
                        email.includes(word) ||
                        telefono.includes(word)
                    );
                });

                setClients(
                    matches.slice(0, 20).map((cliente) => ({
                        ...cliente,
                        type: cliente.esAtleta || cliente.deporte ? 'Atleta' : 'Cliente'
                    }))
                );
            } catch (error) {
                console.error('Error buscando clientes', error);
                setClients([]);
            }
        };

        const timeoutId = setTimeout(searchClients, 300);
        return () => clearTimeout(timeoutId);

    }, [clientSearchTerm]);


    // Filtrar productos
    const filteredProducts = productos.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSucursal = selectedSucursal === ALL_SUCURSALES_ID ||
            !p.sucursales ||
            p.sucursales.length === 0 ||
            p.sucursales.includes(selectedSucursal);
        const matchesType = selectedType === 'Todos' || p.tipo === selectedType;

        return matchesSearch && matchesSucursal && matchesType && p.isActive;
    });

    const addToCart = (product) => {
        const stock = inventarios[product.id]?.disponible || 0;
        const existingItem = cart.find(item => item.id === product.id);
        const currentQty = existingItem ? existingItem.quantity : 0;

        if (currentQty + 1 > stock) {
            toast('Stock bajo o agotado', { icon: '⚠️' });
        }

        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }

        // Abrir carrito automáticamente al agregar
        if (!showCart) setShowCart(true);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        const item = cart.find(i => i.id === productId);
        if (!item) return;

        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(i => i.id === productId ? { ...i, quantity: newQty } : i));
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handlePrintTicket = (saleData) => {
        // Generar PDF para impresora térmica (58mm o 80mm)
        // 58mm es aprox 2.28 pulgadas. 
        // Usaremos unidades mm. Ancho 58mm.
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 210] // Ancho 58mm, alto variable (se ajusta al contenido)
        });

        let y = 5;
        const lineHeight = 4;

        doc.setFontSize(10);
        doc.text("Elíseos Box & Fitness", 29, y, { align: 'center' });
        y += lineHeight + 2;

        const sucursalName = sucursales.find(s => s.id === saleData.sucursalId)?.name || 'General';
        doc.setFontSize(8);
        doc.text(sucursalName, 29, y, { align: 'center' });
        y += lineHeight + 2;

        // Fecha
        doc.text(new Date().toLocaleString(), 29, y, { align: 'center' });
        y += lineHeight + 2;

        if (saleData.client) {
            doc.text(`Cte: ${saleData.client.nombre} ${saleData.client.apellidoPaterno || ''}`, 2, y);
            y += lineHeight;
        }

        doc.text("-".repeat(32), 2, y);
        y += lineHeight;

        // Items
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
        if (saleData.metodoPago === 'paga_despues') {
            doc.text('*** PAGO PENDIENTE ***', 29, y, { align: 'center' });
            y += lineHeight;
        }
        doc.text("¡Gracias por su compra!", 29, y, { align: 'center' });

        // En un entorno real, esto abriría el diálogo de impresión
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const handlePayLater = async () => {
        if (cart.length === 0) return;
        if (!selectedClient) {
            toast.error('Debes seleccionar un cliente para usar "Paga Después"');
            return;
        }
        setIsProcessing(true);
        try {
            // 1. Reducir inventario
            const actualizacionPromesas = cart.map(async (item) => {
                const currentInv = inventarios[item.id];
                const newTotal = Math.max(0, (currentInv?.inicial || 0) - item.quantity);
                await updateProducto(item.id, { inventarioInicial: newTotal });
            });
            await Promise.all(actualizacionPromesas);

            // 2. Crear venta con metodoPago 'paga_despues'
            const saleData = {
                items: cart,
                total,
                client: selectedClient,
                date: new Date(),
                sucursalId: selectedSucursal,
                totalItems: cart.reduce((acc, item) => acc + item.quantity, 0),
                metodoPago: 'paga_despues',
            };
            const ventaResult = await createVenta(saleData);

            // 3. Crear cargo en subcollección del cliente
            const userType = selectedClient.esAtleta || selectedClient.deporte ? 'atleta' : 'cliente';
            const descripcion = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
            await createCargo(selectedClient.id, userType, {
                tipo: 'venta_pos',
                descripcion,
                items: cart.map(item => ({
                    productoId: item.id,
                    nombre: item.name,
                    cantidad: item.quantity,
                    precioUnitario: item.price,
                    subtotal: item.price * item.quantity,
                })),
                monto: total,
                ventaId: ventaResult.ventaId || null,
                sucursalId: selectedSucursal,
            });

            // 4. Imprimir ticket con nota de pendiente
            handlePrintTicket({ ...saleData, metodoPago: 'paga_despues' });
            toast.success(`Cargo registrado para ${selectedClient.nombre}. Pago pendiente.`);
            setCart([]);
            setSelectedClient(null);

            // Recargar inventarios
            const invRes = await getAllProductosInventario();
            if (invRes.success) setInventarios(invRes.inventarios);
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar el cargo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        try {
            // 1. Actualizar inventario (restar)
            // Nota: En una app real, esto debería ser una transacción atómica
            // Aquí lo haremos uno por uno por simplicidad del servicio actual

            // Simulación de venta
            // Aquí idealmente guardaríamos una colección "ventas"

            // Actualizar inventarios locales y remotos
            const actualizacionPromesas = cart.map(async (item) => {
                // Necesitamos el inventario actual para restar
                // Como no tenemos un endpoint "restarInventario", 
                // y la función updateProducto pisa datos, 
                // deberíamos ser cuidadosos.
                // PERO: el servicio `updateProducto` actualiza lo que le pases. 
                // El problema es que `getProductoInventario` calcula basado en ASIGNACIONES.
                // Si el POS es para venta directa (cafetería, merch), ¿se asigna a alguien?
                // El usuario dijo: "poder asignarlos a un cliente (o no)"

                // Si NO se asigna a un cliente (venta anónima), el sistema de inventario actual 
                // que cuenta "asignaciones" NO funcionará porque no hay asignación.
                // REQUERIMIENTOS CHECK: "asignarlos a un cliente (o no)"

                // SOLUCIÓN:
                // Si se asigna a cliente -> Crear asignación (Inventory baja solo)
                // Si NO se asigna a cliente -> 
                //    Opción A: Crear un "Cliente Genérico / Venta de Mostrador" y asignarle todo.
                //    Opción B: Modificar inventarioInicial restándole lo vendido (quick fix).

                // Vamos con Opción B para ventas anónimas: Disminuir el `inventarioInicial` del producto
                // Para ventas con cliente: Crear asignación.

                if (selectedClient) {
                    // Asignar a cliente (esto reduce el "disponible" automáticamente según la lógica actual)
                    // Necesitamos importar assignProductoToUser
                    // Como no lo tengo importado arriba, asumiré que existe O 
                    // para este MVP, simplemente reduciremos el inventarioInicial también,
                    // ya que si asigno productos tipo "cafetería", ¿realmente quiero verlos en el perfil del atleta para siempre?
                    // Probablemente NO. Cafetería se consume. Merch se lleva.
                    // La lógica de "asignaciones" parece más para Planes/Membresías/Equipos prestados.

                    // DECISIÓN: Para POS (Venta real), lo mejor es reducir el stock físico (Inventario Inicial)
                    // independientemente de si se registró el cliente o no.
                    // El registro de cliente es para historial de compra.

                    const currentInv = inventarios[item.id];
                    const newTotal = Math.max(0, currentInv.inicial - item.quantity);

                    await updateProducto(item.id, { inventarioInicial: newTotal });
                } else {
                    // Venta anónima: Reducir inventario total
                    const currentInv = inventarios[item.id];
                    const newTotal = Math.max(0, currentInv.inicial - item.quantity);
                    await updateProducto(item.id, { inventarioInicial: newTotal });
                }
            });

            await Promise.all(actualizacionPromesas);

            // Generar ID único para la transacción en Science Chago
            const transactionExternalId = generateTransactionExternalId();

            const saleData = {
                items: cart,
                total: total,
                client: selectedClient,
                date: new Date(),
                sucursalId: selectedSucursal,
                totalItems: cart.reduce((acc, item) => acc + item.quantity, 0),
                transactionExternalId: transactionExternalId // Guardar para poder eliminar después
            };

            // Guardar historial de venta
            const ventaResult = await createVenta(saleData);
            console.log('✅ Venta guardada en Firebase:', ventaResult);

            // Si hay cliente seleccionado, registrar cargo pagado en su perfil
            if (selectedClient?.id) {
                try {
                    const userType = selectedClient.esAtleta || selectedClient.deporte ? 'atleta' : 'cliente';
                    const descripcion = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
                    await createCargo(selectedClient.id, userType, {
                        tipo: 'venta_pos',
                        descripcion,
                        items: cart.map(item => ({
                            productoId: item.id,
                            nombre: item.name,
                            cantidad: item.quantity,
                            precioUnitario: item.price,
                            subtotal: item.price * item.quantity,
                        })),
                        monto: total,
                        isPaid: true,
                        estatus: 'pagado',
                        totalReportado: total,
                        totalValidado: total,
                        metodoPago: saleData.metodoPago || 'efectivo',
                        ventaId: ventaResult.ventaId || null,
                        sucursalId: selectedSucursal,
                    });
                } catch (cargoErr) {
                    console.warn('Error registrando cargo de venta para cliente:', cargoErr);
                }
            }

            // Crear ingreso en Science Chago
            console.log('🔄 Iniciando sincronización con Science Chago...');
            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const transactionDate = `${year}-${month}-${day}`;

                // Generar concepto con los nombres de productos
                const concepto = cart.map(item => item.name).join(', ');

                const ingresoData = {
                    externalId: transactionExternalId,
                    sucursalId: selectedSucursal,
                    clienteId: selectedClient?.id || 'venta-mostrador',
                    amount: total,
                    date: transactionDate,
                    concepto: concepto,
                    description: `Venta POS - ${cart.map(item => `${item.name} x${item.quantity}`).join(', ')}${selectedClient ? ` - Cliente: ${selectedClient.nombre}` : ''}`
                };
                console.log('📤 Enviando ingreso a Science Chago:', ingresoData);
                await createIngresoInScienceChago(ingresoData);
            } catch (syncError) {
                console.warn('Error syncing sale to Science Chago:', syncError);
                // No bloquear el flujo principal
            }

            handlePrintTicket(saleData);
            toast.success('Venta realizada correctamente');
            setCart([]);
            setSelectedClient(null);

            // Recargar inventarios
            const invRes = await getAllProductosInventario();
            if (invRes.success) setInventarios(invRes.inventarios);

        } catch (error) {
            console.error(error);
            toast.error('Error al procesar la venta');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] gap-6 p-5">
            {/* Header POS */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Volver al Dashboard"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Punto de Venta</h1>
                        <p className="text-sm text-gray-500">Terminal de ventas</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Selector de Sucursal */}
                    <div className="hidden md:flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 text-sm" />
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSucursal(e.target.value)}
                            className="bg-transparent text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
                        >
                            {/* <option value={ALL_SUCURSALES_ID}>Todas las Sucursales</option> - Deshabilitado en POS */}
                            {sucursales.map((sucursal) => (
                                <option key={sucursal.id} value={sucursal.id}>
                                    {sucursal.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => router.push('/punto-de-venta/historico')}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faHistory} />
                        <span className="hidden md:inline">Historial</span>
                    </button>

                    <button
                        onClick={() => setShowCart(!showCart)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium ${showCart
                            ? 'bg-cyan-600 text-white border border-cyan-600'
                            : 'bg-white text-cyan-600 border border-cyan-100 hover:bg-cyan-50'
                            }`}
                    >
                        <FontAwesomeIcon icon={faReceipt} />
                        <span className="hidden md:inline">{showCart ? 'Ocultar Ticket' : 'Ver Ticket'}</span>
                        {cart.length > 0 && (
                            <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Header con Buscador y Cliente */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-full md:w-1/2 relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos (nombre, código)..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="w-full md:w-1/2 relative z-20">
                    {selectedClient ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                <span className="font-semibold">{selectedClient.nombre} {selectedClient.apellidoPaterno}</span>
                            </div>
                            <button onClick={() => setSelectedClient(null)} className="text-blue-400 hover:text-blue-600">
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Asignar a Cliente (Opcional)..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                value={clientSearchTerm}
                                onChange={(e) => {
                                    setClientSearchTerm(e.target.value);
                                    setShowClientSearch(true);
                                }}
                                onFocus={() => setShowClientSearch(true)}
                            />
                            {showClientSearch && clients.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-auto">
                                    {clients.map(client => (
                                        <button
                                            key={client.id}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center"
                                            onClick={() => {
                                                setSelectedClient(client);
                                                setClientSearchTerm('');
                                                setShowClientSearch(false);
                                            }}
                                        >
                                            <span className="font-medium text-gray-700">{client.nombre} {client.apellidoPaterno}</span>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{client.type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden relative">
                {/* Grid de Productos - Izquierda */}
                <div className={`flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0 transition-all duration-300 ${showCart ? 'lg:mr-0' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        {/* Filtros de Categoría */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar max-w-[70%]">
                            {productTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedType === type
                                        ? 'bg-cyan-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Selector de Vista */}
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Vista Cuadrícula"
                            >
                                <FontAwesomeIcon icon={faThLarge} />
                            </button>
                            <button
                                onClick={() => setViewMode('dense')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'dense' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Vista Compacta (8)"
                            >
                                <FontAwesomeIcon icon={faTh} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Vista Lista"
                            >
                                <FontAwesomeIcon icon={faList} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'table' ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Producto</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Precio</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Stock</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredProducts.map(product => {
                                                const stock = inventarios[product.id]?.disponible || 0;
                                                const hasStock = stock > 0;
                                                return (
                                                    <tr key={product.id} className="hover:bg-gray-50 group">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                                    {product.imageUrl ? (
                                                                        <img src={product.imageUrl} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                            <FontAwesomeIcon icon={faBarcode} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-gray-800 line-clamp-1">{product.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{product.tipo || '-'}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-cyan-600 text-right">${product.price.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {stock}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => addToCart(product)}
                                                                className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-cyan-100"
                                                            >
                                                                <FontAwesomeIcon icon={faPlus} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={`grid gap-3 transition-all duration-300 ${viewMode === 'dense'
                                    ? (showCart
                                        ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                        : 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8')
                                    : (showCart
                                        ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                                        : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6')
                                    }`}>
                                    {filteredProducts.map(product => {
                                        const stock = inventarios[product.id]?.disponible || 0;
                                        const hasStock = stock > 0;
                                        const isDense = viewMode === 'dense';

                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className={`flex flex-col items-start rounded-xl border bg-white border-gray-200 hover:border-cyan-400 hover:shadow-md transition-all text-left group relative overflow-hidden h-full ${isDense ? 'p-2' : 'p-3'}`}
                                            >
                                                <div className={`w-full aspect-square bg-gray-100 rounded-lg overflow-hidden relative ${isDense ? 'mb-1' : 'mb-2'}`}>
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <FontAwesomeIcon icon={faBarcode} className={isDense ? "w-6 h-6" : "w-8 h-8"} />
                                                        </div>
                                                    )}

                                                    <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full font-bold shadow-md ${isDense ? 'text-xs' : 'text-sm'} ${hasStock ? 'bg-green-700 text-white' : 'bg-red-50 text-red-600 border border-red-200'
                                                        }`}>
                                                        {stock}
                                                    </div>
                                                </div>

                                                <div className="w-full flex flex-col justify-between flex-1">
                                                    <h3 className={`text-gray-800 leading-snug mb-1 group-hover:text-cyan-600 transition-colors ${isDense ? 'font-semibold text-sm' : 'font-bold text-base'}`}>
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex justify-between items-end mt-auto w-full gap-2">
                                                        <p className={`text-cyan-600 font-bold ${isDense ? 'text-sm' : 'text-lg'}`}>
                                                            ${product.price.toFixed(2)}
                                                        </p>
                                                        {!hasStock && (
                                                            <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-semibold border border-red-200 whitespace-nowrap">
                                                                Sin stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Carrito / Ticket - Sidebar Colapsable */}
                <div
                    className={`
                        fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-yellow-50 shadow-2xl transform transition-transform duration-300 ease-in-out
                        lg:relative lg:shadow-none lg:border-2 lg:border-yellow-300 lg:rounded-xl lg:overflow-hidden lg:h-full lg:z-0
                        ${showCart ? 'translate-x-0' : 'translate-x-full lg:hidden lg:translate-x-0'}
                    `}
                >
                    <div className="flex flex-col h-full bg-yellow-50">
                        <div className="p-4 bg-yellow-100 border-b border-yellow-200 flex justify-between items-center">
                            <h2 className="font-bold text-yellow-900 flex items-center gap-2">
                                <FontAwesomeIcon icon={faShoppingCart} />
                                Ticket de Venta
                            </h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className="lg:hidden p-2 text-yellow-600 hover:text-yellow-800"
                            >
                                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                            </button>
                            <span className="hidden lg:inline bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                                {cart.length} Ítems
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-yellow-600 opacity-50">
                                    <FontAwesomeIcon icon={faShoppingCart} className="w-16 h-16 mb-4" />
                                    <p>Ticket vacío</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-3 items-start group bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <FontAwesomeIcon icon={faBox} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                                            <div className="text-xs text-cyan-600 font-bold mt-1">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faMinus} className="w-2.5 h-2.5" />
                                            </button>
                                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-500 transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-yellow-100 border-t border-yellow-200 space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-yellow-900 font-semibold">Total a Pagar</span>
                                <span className="text-3xl font-bold text-yellow-900">${total.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handlePayLater}
                                disabled={cart.length === 0 || isProcessing || !selectedClient}
                                title={!selectedClient ? 'Selecciona un cliente primero' : 'Registrar cargo pendiente de pago'}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faClock} />
                                <span>Paga Después</span>
                            </button>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPrint} />
                                        <span>Cobrar e Imprimir</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overlay móvil para el carrito */}
                {showCart && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => setShowCart(false)}
                    />
                )}
            </div>

            {/* Modal de Selección Forzosa de Sucursal */}
            {showBranchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800">Selecciona una Sucursal</h2>
                            <p className="text-gray-500">
                                Para operar el Punto de Venta, es necesario identificar la sucursal actual.
                            </p>

                            <div className="grid gap-3 mt-6">
                                {sucursales.length === 0 ? (
                                    <div className="py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                                        <p className="text-sm text-gray-400 mt-2">Cargando sucursales...</p>
                                    </div>
                                ) : (
                                    sucursales.map(sucursal => (
                                        <button
                                            key={sucursal.id}
                                            onClick={() => setSucursal(sucursal.id)}
                                            className="w-full p-4 text-left border rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center justify-between group"
                                        >
                                            <span className="font-semibold text-gray-700 group-hover:text-cyan-700">{sucursal.name}</span>
                                            <FontAwesomeIcon icon={faArrowLeft} className="transform rotate-180 text-gray-300 group-hover:text-cyan-500" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 text-center">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancelar y volver al Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
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
