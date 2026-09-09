import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { User, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AuthDebug() {
  const { currentUser, userRole, isAuthenticated, getPermissions } = useAuthStore();
  const [localStorageData, setLocalStorageData] = useState(null);

  useEffect(() => {
    // Leer del localStorage
    try {
      const data = localStorage.getItem('auth-storage');
      setLocalStorageData(data ? JSON.parse(data) : null);
    } catch (error) {
      setLocalStorageData({ error: 'No se pudo leer localStorage' });
    }
  }, [isAuthenticated, userRole]);

  const permissions = getPermissions();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden">
        <summary className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center gap-2 font-semibold text-sm">
          <Shield className="w-4 h-4 text-emerald-600" />
          Debug Auth
        </summary>
        
        <div className="p-4 max-w-md max-h-96 overflow-y-auto text-xs space-y-4">
          {/* Estado de Autenticación */}
          <div className="border-b pb-3">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              {isAuthenticated ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              Estado de Autenticación
            </h3>
            <div className="space-y-1">
              <p className={`${isAuthenticated ? 'text-green-700' : 'text-red-700'} font-medium`}>
                {isAuthenticated ? '✅ Autenticado' : '❌ No autenticado'}
              </p>
            </div>
          </div>

          {/* Usuario Actual */}
          <div className="border-b pb-3">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Usuario Actual
            </h3>
            {currentUser ? (
              <div className="space-y-1 font-mono text-xs bg-gray-50 p-2 rounded">
                <p><strong>Email:</strong> {currentUser.email || 'N/A'}</p>
                <p><strong>UID:</strong> {currentUser.uid?.substring(0, 12)}...</p>
                <p><strong>Nombre:</strong> {currentUser.displayName || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Sin usuario</p>
            )}
          </div>

          {/* Rol y Permisos */}
          <div className="border-b pb-3">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Rol y Permisos
            </h3>
            {userRole ? (
              <div className="space-y-2">
                <p className="font-semibold">
                  Rol: <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                    {userRole.toUpperCase()}
                  </span>
                </p>
                <div>
                  <p className="font-semibold mb-1">Permisos:</p>
                  <ul className="space-y-1">
                    {permissions.length > 0 ? (
                      permissions.map(perm => (
                        <li key={perm} className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          {perm}
                        </li>
                      ))
                    ) : (
                      <li className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Sin permisos
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Sin rol asignado
              </p>
            )}
          </div>

          {/* LocalStorage Raw */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">LocalStorage (auth-storage)</h3>
            {localStorageData ? (
              <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto max-h-40">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 italic">Sin datos en localStorage</p>
            )}
          </div>

          {/* Acciones */}
          <div className="border-t pt-3 space-y-2">
            <button
              onClick={() => {
                localStorage.removeItem('auth-storage');
                window.location.reload();
              }}
              className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium"
            >
              🗑️ Limpiar Auth y Recargar
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(localStorageData, null, 2));
                alert('Datos copiados al portapapeles');
              }}
              className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium"
            >
              📋 Copiar Datos
            </button>
          </div>

          {/* Diagnóstico */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h3 className="font-bold text-yellow-900 mb-2 text-xs">🔍 Diagnóstico</h3>
            <ul className="space-y-1 text-xs">
              {!isAuthenticated && (
                <li className="text-yellow-800">
                  ⚠️ No estás autenticado. Ve a la <a href="/" className="underline font-bold">página de login</a>
                </li>
              )}
              {isAuthenticated && !userRole && (
                <li className="text-yellow-800">
                  ⚠️ Autenticado pero sin rol. Verifica Firestore collection 'users'
                </li>
              )}
              {isAuthenticated && userRole && permissions.length === 0 && (
                <li className="text-yellow-800">
                  ⚠️ Rol sin permisos. Verifica permissionsUtils.js
                </li>
              )}
              {isAuthenticated && userRole && permissions.length > 0 && (
                <li className="text-green-700 font-medium">
                  ✅ Todo configurado correctamente
                </li>
              )}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
