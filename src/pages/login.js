import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import useAuthStore from '../store/authStore';
import { setCookie, getCookie, hasCookie } from '../utils/cookieUtils';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle, 
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setCurrentUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Debug: verificar cookies al cargar
  useEffect(() => {
    console.log('=== DEBUG LOGIN PAGE ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('Todas las cookies:', document.cookie);
    console.log('Cookie auth-token:', getCookie('auth-token'));
    console.log('Tiene cookie auth-token:', hasCookie('auth-token'));
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Si estamos en desarrollo y Firebase aún tiene placeholders, permitir acceso directo
      const isDummyFirebase = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('tu_api_key');
      if (process.env.NODE_ENV === 'development' && isDummyFirebase) {
        const mockUser = {
          uid: 'dev-admin-eliseos-001',
          email: email || 'admin@eliseos.mx',
          displayName: 'Administrador Elíseos',
        };
        setCurrentUser(mockUser, 'admin');
        setCookie('auth-token', mockUser.uid, 7);
        setCookie('auth-role', 'admin', 7);
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = '/dashboard';
        return;
      }

      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Obtener datos del usuario de Firestore
      let userData = {
        uid: user.uid,
        nombre: 'Administrador Eliseos',
        email: user.email,
        rol: 'admin',
        activo: true
      };

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Si es el admin inicial y no existe en Firestore, intentar inicializarlo
          if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@eliseos.mx') {
            try {
              await setDoc(userDocRef, {
                ...userData,
                fechaCreacion: new Date().toISOString()
              });
            } catch (writeErr) {
              console.warn('Advertencia al escribir en Firestore (verificar reglas):', writeErr);
            }
          } else {
            throw new Error('Usuario no encontrado en la base de datos. Contacta al administrador.');
          }
        } else {
          userData = userDoc.data();
        }
      } catch (firestoreError) {
        console.warn('Aviso al consultar Firestore:', firestoreError);
        // Si el usuario es el admin y Firestore tiene reglas restrictivas aún, permitir acceso como admin
        if (!email.toLowerCase().includes('admin') && email.toLowerCase() !== 'admin@eliseos.mx') {
          throw firestoreError;
        }
      }
      
      // Verificar que el usuario esté activo
      if (userData.activo === false) {
        throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador.');
      }
      
      // 3. Establecer usuario y rol en el store
      setCurrentUser(user, userData.rol || 'admin');
      
      // 4. Establecer cookie de autenticación para el middleware
      setCookie('auth-token', user.uid, 7); // 7 días
      setCookie('auth-role', userData.rol || 'admin', 7);
      
      // Pequeño delay para asegurar que la cookie se establezca
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 5. Redirigir al dashboard (forzar recarga para que el middleware detecte la cookie)
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      // Manejar errores específicos
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos');
      } else if (error.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else if (error.code === 'auth/invalid-email') {
        setError('El formato del email es inválido');
      } else {
        setError(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para acceso temporal (SOLO PARA DESARROLLO)
  const loginAsAdmin = async () => {
    setEmail('admin@eliseos.mx');
    setPassword('Admin123456');
    setLoading(true);
    const mockUser = {
      uid: 'dev-admin-eliseos-001',
      email: 'admin@eliseos.mx',
      displayName: 'Administrador Elíseos',
    };
    setCurrentUser(mockUser, 'admin');
    setCookie('auth-token', mockUser.uid, 7);
    setCookie('auth-role', 'admin', 7);
    await new Promise(resolve => setTimeout(resolve, 100));
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Panel izquierdo - Formulario */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Logo y Header */}
          <div className="mb-10">
            <div className="mb-6">
              <img 
                src="/img/logo_light.png" 
                alt="Elíseos Box & Fitness" 
                className="w-72 max-w-full h-auto object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3 font-serif">Bienvenido</h1>
            <p className="text-gray-600 text-lg">Inicia sesión en tu cuenta de staff</p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Error de autenticación</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c4040] focus:bg-white transition-all duration-200 text-gray-900"
                  placeholder="coach@eliseos.mx"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c4040] focus:bg-white transition-all duration-200 text-gray-900"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1c4040] hover:bg-[#255252] text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-[#1c4040]/20 mt-8"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#c2ef03]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn size={20} className="text-[#c2ef03]" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Ayuda de desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3 text-center">Modo desarrollo - Acceso rápido:</p>
              <button
                onClick={loginAsAdmin}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
              >
                Acceder como Admin (desarrollo)
              </button>
            </div>
          )}

          {/* Footer info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">
              ¿No tienes cuenta? Contacta a la administración de Elíseos
            </p>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Elíseos Box & Fitness. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Imagen */}
      <div className="hidden lg:flex lg:flex-1 relative">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("/img/poster_login.webp")`
          }}
        />
        
        {/* Overlay con gradiente Forest Slate (#1c4040) */}
        <div className="absolute inset-0 bg-[#1c4040]/90"></div>
          
        {/* Contenido del panel derecho */}
        <div className="relative z-10 flex flex-col justify-center items-start h-full p-16 text-white">

          <div className="mb-8">
            <img src="/img/logo_dark.png" alt="Logo" className="w-80 max-w-full h-auto object-contain" />
          </div>

          <h2 className="text-3xl font-bold mb-3 font-serif">Elíseos Box & Fitness</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-md">
            Sistema de control operativo y rendimiento atlético
          </p>

          {/* Características destacadas */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              'Control y seguimiento de miembros',
              'Notas clínicas y evolución física',
              'Gestión de clases y reservaciones',
              'Control de paquetes y membresías'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-200">
                <div className="w-2 h-2 bg-[#c2ef03] rounded-full"></div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
