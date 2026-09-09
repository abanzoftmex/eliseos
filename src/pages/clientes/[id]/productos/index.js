import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingBag, 
  faTrash, 
  faPlus, 
  faGrip, 
  faList 
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../../../components/layout/Layout';
import { 
  assignProductoToUser, 
  deleteAssignedProducto, 
  getProductos,
  getProductoInventario,
  formatPrice 
} from '../../../../../lib/firebase/productosService';
import { getUserType } from '../../../../../lib/firebase/packagesService';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

function UserProductosPage({ initialUser, initialUserType, initialUserProductos, initialAvailableProductos }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [user] = useState(initialUser);
  const [userType] = useState(initialUserType);
  const [userProductos, setUserProductos] = useState(initialUserProductos);
  const [availableProductos] = useState(initialAvailableProductos);
  const [assigningProducto, setAssigningProducto] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState('');
  const [selectedProductoData, setSelectedProductoData] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isTableView, setIsTableView] = useState(false);

  const loadUserProductos = useCallback(async () => {
    try {
      const response = await fetch(`/api/clientes/${id}/productos`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.productos)) {
        console.log('Productos cargados:', result.productos);
        setUserProductos(result.productos);
      } else {
        setUserProductos([]);
        if (!result.success) {
          setMessage({ type: 'error', text: result.error || 'Error al cargar productos' });
        }
      }
    } catch (error) {
      console.error('Error loading user productos:', error);
      setUserProductos([]);
      setMessage({ type: 'error', text: 'Error al cargar productos del usuario' });
    }
  }, [id]);

  const handleProductoSelection = (productoId) => {
    setSelectedProducto(productoId);
    
    const productoData = availableProductos.find(prod => prod.id === productoId);
    setSelectedProductoData(productoData || null);
  };

  const handleAssignProducto = async () => {
    if (!selectedProducto) {
      setMessage({ type: 'error', text: 'Selecciona un producto' });
      return;
    }

    setAssigningProducto(true);
    
    try {
      // Verificar inventario disponible antes de asignar
      const inventarioResult = await getProductoInventario(selectedProducto);
      
      if (!inventarioResult.success) {
        setMessage({ type: 'error', text: 'Error al verificar inventario del producto' });
        return;
      }

      if (inventarioResult.inventario.disponible <= 0) {
        setMessage({ 
          type: 'error', 
          text: `No hay inventario disponible para "${selectedProductoData?.name}". Quedan ${inventarioResult.inventario.disponible} unidades.` 
        });
        return;
      }

      const result = await assignProductoToUser(id, userType, selectedProductoData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Producto asignado exitosamente' });
        setShowAssignModal(false);
        setSelectedProducto('');
        setSelectedProductoData(null);
        await loadUserProductos();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error assigning producto:', error);
      setMessage({ type: 'error', text: 'Error al asignar producto' });
    } finally {
      setAssigningProducto(false);
    }
  };

  const handleRemoveProducto = async (productoId) => {
    if (!confirm('¿Estás seguro de que quieres remover este producto?')) return;

    try {
      const result = await deleteAssignedProducto(id, userType, productoId);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Producto removido exitosamente' });
        await loadUserProductos();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error removing producto:', error);
      setMessage({ type: 'error', text: 'Error al remover producto' });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    // Si es un objeto Timestamp de Firebase
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Si es un string o cualquier otro formato válido para Date
    try {
      const date = new Date(timestamp);
      // Verificar si la fecha es válida
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return 'Fecha no disponible';
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha no disponible';
    }
  };

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center ml-16 lg:ml-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <FontAwesomeIcon icon={faShoppingBag} className="w-8 h-8 text-cyan-600" />
                Productos Únicos - {user?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona los productos únicos asignados al usuario
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTableView(!isTableView)}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title={isTableView ? 'Vista de cuadrícula' : 'Vista de tabla'}
            >
              <FontAwesomeIcon icon={isTableView ? faGrip : faList} className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
              Asignar producto
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="container mx-auto">
          {/* Mensaje de estado */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              {message.text}
            </div>
          )}

          {/* Productos asignados */}
          {userProductos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FontAwesomeIcon icon={faShoppingBag} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No hay productos asignados
              </h3>
              <p className="text-gray-400 mb-6">
                Asigna productos únicos a este usuario
              </p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                Asignar primer producto
              </button>
            </div>
          ) : (
            <>
              {isTableView ? (
                /* Vista de tabla */
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Fecha de Asignación
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {userProductos.map(producto => (
                        <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {producto.imageUrl && (
                                <img 
                                  src={producto.imageUrl} 
                                  alt={producto.nombre}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{producto.nombre}</div>
                                {producto.descripcion && (
                                  <div className="text-xs text-gray-600 line-clamp-1">{producto.descripcion}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(producto.precio)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(producto.fechaAsignacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              producto.status === 'activo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {producto.status === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleRemoveProducto(producto.id)}
                              className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200"
                              title="Eliminar"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Vista de grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProductos.map(producto => (
                    <div key={producto.id} className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-2 border-cyan-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      {producto.imageUrl && (
                        <div className="w-full h-40 mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={producto.imageUrl} 
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-700 mb-2">{producto.nombre}</h3>
                          {producto.descripcion && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{producto.descripcion}</p>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" />
                              <span className="text-sm font-bold text-cyan-700">{formatPrice(producto.precio)}</span>
                            </div>
                            {producto.fechaAsignacion && (
                              <div className="text-sm text-gray-600">
                                <strong>Asignado:</strong> {formatDate(producto.fechaAsignacion)}
                              </div>
                            )}
                            <div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                producto.status === 'activo'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {producto.status === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <button
                            onClick={() => handleRemoveProducto(producto.id)}
                            className="p-3 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                            title="Eliminar producto"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de Asignar Producto */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} className="w-7 h-7" />
                Asignar Producto Único
              </h3>
              <p className="text-cyan-50 mt-2">
                Selecciona un producto para asignar a {user?.name}
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto *
                  </label>
                  <select
                    value={selectedProducto}
                    onChange={(e) => handleProductoSelection(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Selecciona un producto...</option>
                    {availableProductos.map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.name} - {formatPrice(producto.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProductoData && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <h4 className="font-semibold text-cyan-900 mb-2">Detalles del Producto</h4>
                    {selectedProductoData.imageUrl && (
                      <img 
                        src={selectedProductoData.imageUrl} 
                        alt={selectedProductoData.name}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="space-y-1 text-sm text-cyan-800">
                      <p><strong>Nombre:</strong> {selectedProductoData.name}</p>
                      {selectedProductoData.description && (
                        <p><strong>Descripción:</strong> {selectedProductoData.description}</p>
                      )}
                      <p><strong>Precio:</strong> {formatPrice(selectedProductoData.price)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProducto('');
                  setSelectedProductoData(null);
                }}
                disabled={assigningProducto}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignProducto}
                disabled={!selectedProducto || assigningProducto}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigningProducto ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Asignando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Asignar producto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    // Obtener tipo de usuario
    const userType = await getUserType(id);
    if (!userType) {
      return { notFound: true };
    }

    // Obtener datos del usuario
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const { db } = await import('../../../../../lib/firebase');
    const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
    
    const userRef = doc(db, userCollection, id);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { notFound: true };
    }

    const userData = userDoc.data();
    const user = {
      id,
      name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim(),
      email: userData.email || 'Sin email',
      type: userType
    };

    // Obtener productos asignados
    const productosRef = collection(db, userCollection, id, 'productosAsignados');
    const productosSnapshot = await getDocs(productosRef);
    const userProductos = productosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convertir timestamps a ISO strings para serialización
        fechaAsignacion: data.fechaAsignacion?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Obtener productos disponibles
    const { getProductos } = await import('../../../../../lib/firebase/productosService');
    const productosResult = await getProductos();
    const availableProductos = productosResult.success ? productosResult.productos : [];

    return {
      props: {
        title: `Productos - ${user.name} - Elíseos Box & Fitness`,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Miembros', href: '/clientes' },
          { label: user.name, href: `/clientes/${id}` },
          { label: 'Productos', href: `/clientes/${id}/productos`, isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        activeSection: "clientes",
        initialUser: user,
        initialUserType: userType,
        initialUserProductos: JSON.parse(JSON.stringify(userProductos)),
        initialAvailableProductos: JSON.parse(JSON.stringify(availableProductos))
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { notFound: true };
  }
}

export default UserProductosPage;
