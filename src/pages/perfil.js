import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  updatePassword as firebaseUpdatePassword, 
  updateProfile, 
  sendPasswordResetEmail, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import useAuthStore from '../store/authStore';
import withAuth from '../components/withAuth';
import toast from 'react-hot-toast';
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save, 
  Send, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Check,
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

function PerfilPage() {
  const router = useRouter();
  const { currentUser, userRole, setCurrentUser } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  useEffect(() => {
    const user = auth.currentUser || currentUser;
    if (user) {
      setNombre(user.displayName || currentUser?.nombre || '');
      setEmail(user.email || '');
      setUid(user.uid || '');
    }
  }, [currentUser]);

  // Copiar UID al portapapeles
  const handleCopyUid = () => {
    if (uid) {
      navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      toast.success('ID de usuario copiado');
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  // Actualizar datos del perfil (Nombre)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: nombre });
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            nombre,
            actualizadoEl: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Documento en Firestore no actualizado:', dbErr);
        }
        setCurrentUser({ ...currentUser, displayName: nombre, nombre }, userRole);
        toast.success('Perfil actualizado correctamente');
      } else {
        toast.error('No se detectó usuario activo');
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Cambiar Contraseña directamente
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('La nueva contraseña debe ser distinta a la actual');
      return;
    }

    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Sesión no válida. Inicia sesión nuevamente.');
      }

      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Actualizar la contraseña en Firebase Auth
      await firebaseUpdatePassword(user, newPassword);

      toast.success('¡Contraseña actualizada exitosamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('La contraseña actual es incorrecta');
      } else if (err.code === 'auth/weak-password') {
        toast.error('La nueva contraseña es muy débil');
      } else if (err.code === 'auth/requires-recent-login') {
        toast.error('Por seguridad, por favor vuelve a iniciar sesión antes de realizar este cambio.');
      } else {
        toast.error(err.message || 'Error al actualizar contraseña');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Enviar correo de restablecimiento de contraseña
  const handleSendResetEmail = async () => {
    const userEmail = email || auth.currentUser?.email;
    if (!userEmail) {
      toast.error('No hay correo registrado');
      return;
    }

    setSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      toast.success(`Correo enviado a ${userEmail}. Revisa tu bandeja de entrada.`);
    } catch (err) {
      console.error('Error enviando email de restablecimiento:', err);
      toast.error(`Error al enviar el correo: ${err.message}`);
    } finally {
      setSendingResetEmail(false);
    }
  };

  // Calcular fortaleza de contraseña
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { score, label: 'Débil', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Media', color: 'bg-blue-500' };
    return { score, label: 'Fuerte', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength();

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { label: 'Administrador Master', bg: 'bg-[#1c4040] text-[#c2ef03] border-[#c2ef03]/30' };
      case 'medico':
        return { label: 'Personal Médico', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'coach':
        return { label: 'Coach / Entrenador', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'staff':
        return { label: 'Staff Operativo', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      default:
        return { label: role || 'Usuario Registrado', bg: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const roleInfo = getRoleBadge(userRole);

  return (
    <>
      <Head>
        <title>Mi Perfil | Elíseos Box & Fitness</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Banner de Perfil / Cabecera */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c4040] via-[#163333] to-science-950 p-6 sm:p-8 text-white shadow-2xl border border-science-800">
          {/* Elementos decorativos de fondo */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#c2ef03]/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-science-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar / Iniciales */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#1c4040] to-science-700 p-1 shadow-xl border-2 border-[#c2ef03]/40">
                <div className="w-full h-full rounded-xl bg-science-900 flex items-center justify-center text-4xl font-black text-[#c2ef03] tracking-widest uppercase">
                  {nombre ? nombre.charAt(0) : 'U'}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-science-900 shadow-md">
                <ShieldCheck size={16} />
              </div>
            </div>

            {/* Info Básica */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{nombre || 'Usuario'}</h1>
                <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wider rounded-full border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>

              <p className="text-science-200 text-sm flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} className="text-[#c2ef03]" />
                {email}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-science-300">
                <span className="flex items-center gap-1.5 bg-science-800/80 px-3 py-1 rounded-lg border border-science-700/50">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Cuenta Verificada
                </span>
                <span className="flex items-center gap-1.5 bg-science-800/80 px-3 py-1 rounded-lg border border-science-700/50">
                  <Sparkles size={14} className="text-[#c2ef03]" /> Elíseos Box & Fitness
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Principal de Configuración */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Cambio de Contraseña (Seguridad) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tarjeta: Cambiar Contraseña */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-science-100/80 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="p-3 bg-[#1c4040]/10 text-[#1c4040] rounded-2xl">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h2>
                  <p className="text-xs text-gray-500">Actualiza tu clave de acceso de manera segura</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#1c4040] focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#1c4040] focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Indicador de Fortaleza */}
                  {newPassword && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Fortaleza de contraseña:</span>
                        <span className="font-bold text-gray-800">{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#1c4040] focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle size={14} /> Las contraseñas no coinciden
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                      <CheckCircle2 size={14} /> Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* Botón Guardar Contraseña */}
                <button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full bg-[#1c4040] hover:bg-[#255252] text-white py-4 px-6 rounded-2xl font-bold text-sm shadow-lg shadow-[#1c4040]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Actualizando Contraseña...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} className="text-[#c2ef03]" />
                      <span>Guardar Nueva Contraseña</span>
                    </>
                  )}
                </button>
              </form>

              {/* Opción Alternativa: Restablecer vía Email */}
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-science-50 rounded-2xl p-4 border border-science-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-science-900 uppercase tracking-wider">¿Prefieres recibir un enlace seguro?</h4>
                    <p className="text-xs text-science-600 mt-0.5">Te enviaremos un correo para cambiar tu clave sin necesidad de ingresar la actual.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={sendingResetEmail}
                    className="shrink-0 bg-white hover:bg-science-100 text-science-800 border border-science-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    {sendingResetEmail ? (
                      <div className="w-4 h-4 border-2 border-science-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} className="text-science-600" />
                    )}
                    <span>Enviar Correo</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Información Personal y Datos de Cuenta */}
          <div className="lg:col-span-5 space-y-6">

            {/* Tarjeta: Información de la Cuenta */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-science-100/80 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="p-3 bg-science-50 text-science-700 rounded-2xl">
                  <User size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Datos Personales</h2>
                  <p className="text-xs text-gray-500">Información básica de tu perfil de usuario</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#1c4040] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">El correo está vinculado a tu cuenta y no se puede editar manualmente.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    ID de Usuario (UID)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value={uid}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-xs font-mono text-gray-500 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUid}
                      className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors shrink-0"
                      title="Copiar UID"
                    >
                      {copiedUid ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full mt-2 bg-science-900 hover:bg-science-800 text-white py-3.5 px-5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Guardar Nombre</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Tarjeta: Módulo Financiero / Perfil Finanzas */}
            <div className="bg-gradient-to-br from-science-900 to-science-950 text-white rounded-3xl p-6 shadow-xl border border-science-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <Sparkles size={20} className="text-[#c2ef03]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Perfil en Finanzas</h3>
                    <p className="text-xs text-science-300">Gestión avanzada de permisos financieros</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-science-300 leading-relaxed">
                Si cuentas con rol administrativo o contador, puedes revisar tu perfil financiero y accesos contables específicos.
              </p>
              <Link
                href="/finanzas/mi-perfil"
                className="w-full bg-[#c2ef03] hover:bg-[#b0d802] text-[#1c4040] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>Ir a Mi Perfil Financiero</span>
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default withAuth(PerfilPage);
