// src/pages/clientes/[id]/pasaporte/index.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Award,
  Trophy,
  Flame,
  HeartPulse,
  CupSoda,
  Share2,
  Users,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Calendar,
  Sparkles,
  Scale,
  Gift,
  Camera,
  Trash2,
  Plus,
  Info,
  Check,
  X,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import useAuthStore from '@/store/authStore';
import {
  PASSPORT_MONTHS,
  PASSPORT_QUARTERS,
  CONSTANCY_STAMP_TYPES,
  EXPERIENCE_STAMP_TYPES,
  MAX_ANNUAL_STAMPS,
  BODY_COMPOSITION_FIELDS,
  BODY_COMPOSITION_PERIODS
} from '@/domain/passportConstants';

const ICON_MAP = {
  Flame,
  HeartPulse,
  CupSoda,
  Share2,
  Trophy,
  Users
};

function ImageDropzone({ label, value, onChange, placeholder = "Arrastra tu foto o haz clic para seleccionar", clientUserId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar los 10MB.');
      return;
    }

    try {
      setUploading(true);
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `pasaportes/${clientUserId || 'general'}/transformacion_${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onChange(downloadURL);
    } catch (err) {
      console.error('Error al subir imagen a Storage:', err);
      alert('Error al subir la imagen. Por favor intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-slate-700 font-bold text-xs">{label}</label>
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-900 group shadow-sm">
          <img src={value} alt="Vista previa" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 shadow-md"
            >
              Cambiar Foto
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="py-1.5 px-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-700 shadow-md"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all aspect-[4/3] flex flex-col items-center justify-center
            ${isDragging ? 'border-amber-500 bg-amber-50/50 scale-[1.01]' : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'}
            ${uploading ? 'opacity-60 pointer-events-none' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Subiendo imagen a la nube...</span>
            </div>
          ) : (
            <div className="space-y-2 text-slate-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-1">
                <UploadCloud size={22} />
              </div>
              <p className="text-xs font-bold text-slate-700">{placeholder}</p>
              <p className="text-[10px] text-slate-400">PNG, JPG o WEBP hasta 10MB</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}

export default function AdminPasaporteClientePage() {
  const router = useRouter();
  const { id } = router.query;
  const currentUser = useAuthStore((s) => s.currentUser);
  const userRole = useAuthStore((s) => s.userRole);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeQuarterId, setActiveQuarterId] = useState('Q1');
  const [activeTab, setActiveTab] = useState('sellos'); // 'sellos' | 'composicion' | 'fotos'

  // Modales
  const [stampModal, setStampModal] = useState({ isOpen: false, data: null });
  const [revokeModal, setRevokeModal] = useState({ isOpen: false, stampDocId: null, label: '' });
  const [bodyCompModal, setBodyCompModal] = useState({ isOpen: false, periodo: 'enero', existing: null });
  const [rewardDeliverModal, setRewardDeliverModal] = useState({ isOpen: false, reward: null });
  const [photosModal, setPhotosModal] = useState({ isOpen: false });

  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/pasaporte/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error al cargar pasaporte');
        return;
      }
      setData(json);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeQuarter = useMemo(() => {
    if (!data?.trimestres) return null;
    return data.trimestres.find(q => q.id === activeQuarterId) || data.trimestres[0];
  }, [data, activeQuarterId]);

  const activeMonths = useMemo(() => {
    if (!data?.meses || !activeQuarter) return [];
    return data.meses.filter(m => activeQuarter.meses.includes(m.id));
  }, [data, activeQuarter]);

  // Handler para otorgar sello
  async function handleAssignStamp(payload) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pasaporte/${id}/sello`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          adminName: currentUser?.displayName || currentUser?.email || userRole || 'Administrador',
          adminId: currentUser?.uid || 'admin'
        })
      });
      const json = await res.json();
      if (res.ok) {
        setStampModal({ isOpen: false, data: null });
        await loadData();
      } else {
        alert(json.error || 'Error al otorgar sello');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler para revocar sello
  async function handleRevokeStamp() {
    if (!revokeModal.stampDocId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pasaporte/${id}/sello`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stampDocId: revokeModal.stampDocId
        })
      });
      const json = await res.json();
      if (res.ok) {
        setRevokeModal({ isOpen: false, stampDocId: null, label: '' });
        await loadData();
      } else {
        alert(json.error || 'Error al revocar sello');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler para guardar composición corporal
  async function handleSaveBodyComp(formData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pasaporte/${id}/composicion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          adminName: currentUser?.displayName || currentUser?.email || 'Coach',
          adminId: currentUser?.uid || 'coach'
        })
      });
      const json = await res.json();
      if (res.ok) {
        setBodyCompModal({ isOpen: false, periodo: 'enero', existing: null });
        await loadData();
      } else {
        alert(json.error || 'Error al guardar medición');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler para marcar recompensa como entregada
  async function handleDeliverReward(notas) {
    if (!rewardDeliverModal.reward) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pasaporte/${id}/recompensa/marcar-entrega`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardDocId: rewardDeliverModal.reward.docId,
          notas,
          adminName: currentUser?.displayName || currentUser?.email || 'Staff',
          adminId: currentUser?.uid || 'staff'
        })
      });
      const json = await res.json();
      if (res.ok) {
        setRewardDeliverModal({ isOpen: false, reward: null });
        await loadData();
      } else {
        alert(json.error || 'Error al marcar entrega');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler para fotos
  async function handleSavePhotos(photoData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pasaporte/${id}/foto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData)
      });
      const json = await res.json();
      if (res.ok) {
        setPhotosModal({ isOpen: false });
        await loadData();
      } else {
        alert(json.error || 'Error al guardar fotos');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Cargando Pasaporte Administrativo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-red-100 text-center shadow-lg">
        <p className="text-red-500 font-bold mb-4">{error || 'No se pudo cargar el pasaporte'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          Volver
        </button>
      </div>
    );
  }

  const { passport, user, sugerencias } = data;
  const currentMonthObj = PASSPORT_MONTHS.find(m => m.numero === sugerencias?.mesActual) || PASSPORT_MONTHS[0];
  const currentMonthData = data.meses?.find(m => m.id === currentMonthObj?.id);
  const asistenciaYaSellada = Boolean(currentMonthData?.sellos?.asistencia?.obtenido);
  const mostrarBannerAsistencia = Boolean(sugerencias?.asistencia?.cumpleRequisito && !asistenciaYaSellada && !sugerencias?.asistencia?.yaOtorgado);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 pb-20">
      <Head>
        <title>Gestión de Pasaporte | {user.name} | Elíseos Box & Fitness</title>
      </Head>

      {/* ── HEADER DE NAVEGACIÓN Y PERFIL ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => router.push(`/clientes/${id}`)}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Volver al Perfil del Alumno
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Pasaporte Rewards · {user.name}
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Edición Oficial 2026 · {user.type === 'atleta' ? 'Atleta Elite' : 'Cliente / Miembro'}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen numérico */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Sellos Totales</span>
            <span className="text-2xl font-black text-amber-500">{passport.totalSellos} <span className="text-xs text-slate-400 font-bold">/ 56</span></span>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Constancia</span>
            <span className="text-sm font-black text-cyan-600">{passport.sellosConstancia} / 48</span>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Experiencia</span>
            <span className="text-sm font-black text-pink-600">{passport.sellosExperiencia} / 8</span>
          </div>
        </div>
      </div>

      {/* ── BANNER DE ASISTENCIA INTELIGENTE ── */}
      {mostrarBannerAsistencia && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950">Asistencia Inteligente Detectada</h4>
              <p className="text-xs text-emerald-700 font-medium">
                El sistema detectó <strong>{sugerencias.asistencia.totalCalculado} entrenamientos</strong> en el mes {sugerencias.mesActual} (Meta cumplida: 12 entrenamientos).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const currentMonthObj = PASSPORT_MONTHS.find(m => m.numero === sugerencias.mesActual) || PASSPORT_MONTHS[0];
              setStampModal({
                isOpen: true,
                data: {
                  categoria: 'constancia',
                  tipo: 'asistencia',
                  tipoNombre: 'Asistencia',
                  periodo: currentMonthObj.id,
                  periodoNombre: currentMonthObj.nombre,
                  trimestre: currentMonthObj.trimestre,
                  evidencia: `${sugerencias.asistencia.totalCalculado} asistencias registradas en sistema`,
                  origen: 'asistido_sistema'
                }
              });
            }}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/20 shrink-0"
          >
            Otorgar Sello de Asistencia
          </button>
        </div>
      )}

      {/* ── TABS NAVEGACIÓN ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
          {[
            { id: 'sellos', label: 'Matriz de Sellos & Recompensas', icon: Award },
            { id: 'composicion', label: 'Composición Corporal (InBody)', icon: Scale },
            { id: 'fotos', label: 'Fotos Inicio & Cierre', icon: Camera }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                  ${isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'sellos' && (
          <div className="flex items-center gap-2">
            {PASSPORT_QUARTERS.map(q => {
              const isActive = activeQuarterId === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuarterId(q.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border
                    ${isActive 
                      ? 'bg-slate-900 text-white border-transparent shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}
                  `}
                >
                  {q.id} ({q.meses.map(m => m.slice(0, 3)).join('-')})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── TAB 1: MATRIZ DE SELLOS Y MESES ── */}
      {activeTab === 'sellos' && activeQuarter && (
        <div className="space-y-10">
          
          {/* Tarjetas de Meses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {activeMonths.map(month => (
              <div 
                key={month.id}
                className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{month.nombre}</h3>
                      <p className="text-[11px] font-bold text-amber-500 uppercase">{month.tituloEditorial}</p>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {month.sellosObtenidosCount} / 4 sellos
                    </span>
                  </div>

                  {/* 4 Sellos Mensuales */}
                  <div className="space-y-3 mt-4">
                    {Object.keys(month.sellos).map(k => {
                      const stamp = month.sellos[k];
                      const IconComp = ICON_MAP[stamp.icono] || Award;
                      return (
                        <div 
                          key={k}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4
                            ${stamp.obtenido 
                              ? 'bg-amber-50/60 border-amber-200' 
                              : 'bg-slate-50/70 border-slate-100'}
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stamp.obtenido ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-400'}`}>
                              <IconComp size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{stamp.nombre}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {stamp.obtenido 
                                  ? `Asignado por: ${stamp.detalles?.asignadoPorNombre || 'Admin'}` 
                                  : stamp.requisito}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {stamp.obtenido ? (
                              <button
                                onClick={() => setRevokeModal({
                                  isOpen: true,
                                  stampDocId: stamp.docId,
                                  label: `${stamp.nombre} - ${month.nombre}`
                                })}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Revocar Sello"
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setStampModal({
                                  isOpen: true,
                                  data: {
                                    categoria: 'constancia',
                                    tipo: stamp.id,
                                    tipoNombre: stamp.nombre,
                                    periodo: month.id,
                                    periodoNombre: month.nombre,
                                    trimestre: month.trimestre,
                                    evidencia: '',
                                    origen: 'manual'
                                  }
                                })}
                                className="py-1.5 px-3 bg-slate-900 hover:bg-[#0ea5e9] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                              >
                                Otorgar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recompensa Mensual */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>Recompensa Mensual</span>
                    {month.recompensaMensual.desbloqueada ? (
                      <span className="text-emerald-600 font-black text-[10px] uppercase">Desbloqueada</span>
                    ) : (
                      <span className="text-slate-400 text-[10px] uppercase">Requiere 4 sellos</span>
                    )}
                  </div>

                  {month.recompensaMensual.seleccionada ? (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {month.recompensaMensual.seleccionada.opcionTitulo}
                        </p>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1
                          ${month.recompensaMensual.seleccionada.estado === 'entregada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                          {month.recompensaMensual.seleccionada.estado === 'entregada' ? 'Entregada en Sede' : 'Solicitada por Alumno'}
                        </span>
                      </div>
                      {month.recompensaMensual.seleccionada.estado !== 'entregada' && (
                        <button
                          onClick={() => setRewardDeliverModal({
                            isOpen: true,
                            reward: month.recompensaMensual
                          })}
                          className="py-1.5 px-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shrink-0"
                        >
                          Entregar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      Sin elección de recompensa registrada
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Sellos de Experiencia Trimestrales */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">Trimestre {activeQuarter.id}</span>
                <h3 className="text-2xl font-black text-white">Sellos de Experiencia</h3>
              </div>
              <span className="text-xs text-slate-400 font-bold">
                {activeQuarter.sellosExperienciaCount} / 2 sellos obtenidos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(activeQuarter.sellosExperiencia).map(k => {
                const stamp = activeQuarter.sellosExperiencia[k];
                const IconComp = ICON_MAP[stamp.icono] || Award;
                return (
                  <div 
                    key={k}
                    className={`p-6 rounded-2xl border transition-all flex items-center justify-between gap-4
                      ${stamp.obtenido ? 'bg-pink-950/30 border-pink-500/40' : 'bg-slate-800/40 border-slate-800'}
                    `}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stamp.obtenido ? 'bg-pink-500 text-white font-black' : 'bg-slate-800 text-slate-400'}`}>
                        <IconComp size={22} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white">{stamp.nombre}</h4>
                        <p className="text-xs text-slate-400 truncate">{stamp.requisito}</p>
                        {stamp.obtenido && (
                          <p className="text-[10px] text-pink-400 font-bold mt-1">
                            Asignado por: {stamp.detalles?.asignadoPorNombre || 'Admin'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {stamp.obtenido ? (
                        <button
                          onClick={() => setRevokeModal({
                            isOpen: true,
                            stampDocId: stamp.docId,
                            label: `${stamp.nombre} - ${activeQuarter.id}`
                          })}
                          className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Revocar Sello"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setStampModal({
                            isOpen: true,
                            data: {
                              categoria: 'experiencia',
                              tipo: stamp.id,
                              tipoNombre: stamp.nombre,
                              periodo: activeQuarter.id,
                              periodoNombre: activeQuarter.nombre,
                              trimestre: activeQuarter.id,
                              evidencia: '',
                              origen: 'manual'
                            }
                          })}
                          className="py-2.5 px-5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-600/20"
                        >
                          Otorgar Sello
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recompensa Trimestral Card */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Recompensa Trimestral</span>
                <h4 className="text-lg font-black text-white">Meta {activeQuarter.mesFinal.toUpperCase()}: {activeQuarter.metaAcumulada} Sellos</h4>
                <p className="text-xs text-slate-400">
                  Progreso actual del atleta: <strong>{passport.totalSellos}</strong> / {activeQuarter.metaAcumulada} sellos
                </p>
              </div>

              {activeQuarter.recompensaTrimestral.seleccionada ? (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-black text-white">{activeQuarter.recompensaTrimestral.seleccionada.opcionTitulo}</p>
                    <span className="text-[9px] font-black uppercase text-amber-400">
                      {activeQuarter.recompensaTrimestral.seleccionada.estado === 'entregada' ? 'Entregada' : 'Solicitada'}
                    </span>
                  </div>
                  {activeQuarter.recompensaTrimestral.seleccionada.estado !== 'entregada' && (
                    <button
                      onClick={() => setRewardDeliverModal({
                        isOpen: true,
                        reward: activeQuarter.recompensaTrimestral
                      })}
                      className="py-2 px-4 bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase"
                    >
                      Marcar Entrega
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-400">
                  {activeQuarter.metaAlcanzada ? 'Meta alcanzada · Pendiente elección del alumno' : `Faltan ${activeQuarter.metaAcumulada - passport.totalSellos} sellos`}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 2: COMPOSICIÓN CORPORAL (INBODY) ── */}
      {activeTab === 'composicion' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500">Evaluaciones Oficiales</span>
              <h3 className="text-xl font-black text-slate-900">Registro de InBody / Antropometría</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium max-w-sm">
              Captura las 7 variables oficiales en los 5 periodos del año.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {BODY_COMPOSITION_PERIODS.map(periodo => {
              const rec = data.composiciones[periodo];
              return (
                <div key={periodo} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-lg font-black text-slate-900 capitalize">{periodo}</h4>
                      {rec ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Registrado</span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Pendiente</span>
                      )}
                    </div>

                    {rec ? (
                      <div className="space-y-2 mt-4 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Peso:</span> <strong className="text-slate-900">{rec.peso} kg</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">IMC:</span> <strong className="text-slate-900">{rec.imc}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">% Grasa:</span> <strong className="text-slate-900">{rec.grasaCorporal}%</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">% Músculo:</span> <strong className="text-slate-900">{rec.musculoEsqueletico}%</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Grasa Visc.:</span> <strong className="text-slate-900">{rec.grasaVisceral}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Met. Basal:</span> <strong className="text-slate-900">{rec.metabolismoBasal} kcal</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Edad Corp.:</span> <strong className="text-slate-900">{rec.edadCorporal} años</strong></div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        Sin medición guardada
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setBodyCompModal({ isOpen: true, periodo, existing: rec || null })}
                    className="w-full py-2.5 bg-slate-900 hover:bg-[#0ea5e9] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    {rec ? 'Editar Medición' : 'Capturar Medición'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: FOTOS INICIO Y CIERRE ── */}
      {activeTab === 'fotos' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Fotografías del Reto</span>
              <h3 className="text-2xl font-black text-slate-900">Inicio y Cierre de Año</h3>
            </div>
            <button
              onClick={() => setPhotosModal({ isOpen: true })}
              className="py-2.5 px-5 bg-slate-900 hover:bg-[#0ea5e9] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              Actualizar URLs de Fotos
            </button>
          </div>

          {/* Grid de 3 fotografías: Frente, Lado y Espalda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Frente */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">Ángulo 1</span>
                <span className="text-[10px] text-slate-400 font-bold">{passport.fechaInicio || 'Inicio Reto'}</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">De Frente</h4>
              <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                {(passport.fotosPostura?.frenteUrl || passport.fotoInicioUrl) ? (
                  <img
                    src={passport.fotosPostura?.frenteUrl || passport.fotoInicioUrl}
                    alt="Frente"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <Camera size={24} className="mx-auto text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400">Sin foto de frente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lado */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">Ángulo 2</span>
                <span className="text-[10px] text-slate-400 font-bold">{passport.fechaInicio || 'Inicio Reto'}</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">De Lado / Perfil</h4>
              <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                {passport.fotosPostura?.ladoUrl ? (
                  <img
                    src={passport.fotosPostura.ladoUrl}
                    alt="Lado"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <Camera size={24} className="mx-auto text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400">Sin foto de lado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Espalda */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">Ángulo 3</span>
                <span className="text-[10px] text-slate-400 font-bold">{passport.fechaInicio || 'Inicio Reto'}</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">De Espalda</h4>
              <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                {passport.fotosPostura?.espaldaUrl ? (
                  <img
                    src={passport.fotosPostura.espaldaUrl}
                    alt="Espalda"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <Camera size={24} className="mx-auto text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400">Sin foto de espaldas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cierre de año: 3 fotografías (Frente, Lado y Espalda) */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Resultado Construido</span>
                <h4 className="font-black text-slate-900 text-sm">Fotos de Cierre ({passport.fechaFin || 'Diciembre'})</h4>
              </div>
              <span className="text-xs text-slate-400 font-bold">
                {passport.fotosCierre?.updatedAt ? `Actualizado: ${passport.fotosCierre.updatedAt.split('T')[0]}` : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Frente Cierre */}
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">Frente</span>
                  <span className="text-[10px] text-slate-400 font-bold">{passport.fechaFin || 'Cierre'}</span>
                </div>
                <h4 className="font-black text-slate-900 text-sm">Cierre: De Frente</h4>
                <div className="w-full aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
                  {(passport.fotosCierre?.frenteUrl || passport.fotoFinUrl) ? (
                    <img
                      src={passport.fotosCierre?.frenteUrl || passport.fotoFinUrl}
                      alt="Cierre Frente"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-slate-400 space-y-1 text-center">
                      <Trophy size={28} className="mx-auto text-amber-300" />
                      <p className="text-[11px] font-bold">Sin foto frontal</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lado Cierre */}
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">Lado</span>
                  <span className="text-[10px] text-slate-400 font-bold">{passport.fechaFin || 'Cierre'}</span>
                </div>
                <h4 className="font-black text-slate-900 text-sm">Cierre: De Lado</h4>
                <div className="w-full aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
                  {passport.fotosCierre?.ladoUrl ? (
                    <img
                      src={passport.fotosCierre.ladoUrl}
                      alt="Cierre Lado"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-slate-400 space-y-1 text-center">
                      <Trophy size={28} className="mx-auto text-amber-300" />
                      <p className="text-[11px] font-bold">Sin foto de lado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Espalda Cierre */}
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">Espalda</span>
                  <span className="text-[10px] text-slate-400 font-bold">{passport.fechaFin || 'Cierre'}</span>
                </div>
                <h4 className="font-black text-slate-900 text-sm">Cierre: De Espalda</h4>
                <div className="w-full aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
                  {passport.fotosCierre?.espaldaUrl ? (
                    <img
                      src={passport.fotosCierre.espaldaUrl}
                      alt="Cierre Espalda"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-slate-400 space-y-1 text-center">
                      <Trophy size={28} className="mx-auto text-amber-300" />
                      <p className="text-[11px] font-bold">Sin foto de espalda</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ASIGNAR SELLO ── */}
      {stampModal.isOpen && stampModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                <Award size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Confirmación de Sello</span>
                <h3 className="text-xl font-black text-slate-900">{stampModal.data.tipoNombre}</h3>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600 font-medium">
              <p>Periodo: <strong className="text-slate-900 capitalize">{stampModal.data.periodoNombre}</strong></p>
              <p>Categoría: <strong className="text-slate-900 capitalize">{stampModal.data.categoria}</strong></p>
              <p>Responsable: <strong className="text-slate-900">{currentUser?.displayName || currentUser?.email || 'Admin'}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Notas / Evidencia (Opcional)
              </label>
              <textarea
                id="stamp-evidence-input"
                defaultValue={stampModal.data.evidencia || ''}
                placeholder="Ej. 14 entrenamientos validados, comprobante HYROX, etc."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0ea5e9] outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStampModal({ isOpen: false, data: null })}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={() => {
                  const ev = document.getElementById('stamp-evidence-input')?.value || '';
                  handleAssignStamp({
                    categoria: stampModal.data.categoria,
                    tipo: stampModal.data.tipo,
                    periodo: stampModal.data.periodo,
                    trimestre: stampModal.data.trimestre,
                    evidencia: ev,
                    origen: stampModal.data.origen || 'manual'
                  });
                }}
                className="flex-1 py-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
              >
                {submitting ? 'Asignando...' : 'Confirmar Sello'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REVOCAR SELLO ── */}
      {revokeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">¿Revocar este sello?</h3>
              <p className="text-xs text-slate-500 mt-1">{revokeModal.label}</p>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              El sello se eliminará y el progreso anual del atleta se recalculará automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeModal({ isOpen: false, stampDocId: null, label: '' })}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={handleRevokeStamp}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
              >
                {submitting ? 'Revocando...' : 'Sí, Revocar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: COMPOSICIÓN CORPORAL ── */}
      {bodyCompModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500">InBody · Antropometría</span>
                <h3 className="text-xl font-black text-slate-900 capitalize">Medición: {bodyCompModal.periodo}</h3>
              </div>
              <button onClick={() => setBodyCompModal({ isOpen: false, periodo: 'enero', existing: null })} className="text-slate-400 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                handleSaveBodyComp({
                  periodo: bodyCompModal.periodo,
                  peso: fd.get('peso'),
                  altura: fd.get('altura'),
                  imc: fd.get('imc'),
                  grasaCorporal: fd.get('grasaCorporal'),
                  musculoEsqueletico: fd.get('musculoEsqueletico'),
                  grasaVisceral: fd.get('grasaVisceral'),
                  metabolismoBasal: fd.get('metabolismoBasal'),
                  edadCorporal: fd.get('edadCorporal'),
                  notas: fd.get('notas'),
                  fechaMedicion: fd.get('fechaMedicion')
                });
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    name="fechaMedicion"
                    defaultValue={bodyCompModal.existing?.fechaMedicion || new Date().toISOString().slice(0, 10)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="peso"
                    required
                    defaultValue={bodyCompModal.existing?.peso || ''}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Altura (cm o m)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="altura"
                    defaultValue={bodyCompModal.existing?.altura || ''}
                    placeholder="Ej. 175"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">IMC (kg/m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="imc"
                    defaultValue={bodyCompModal.existing?.imc || ''}
                    placeholder="Auto o manual"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">% Grasa Corporal</label>
                  <input
                    type="number"
                    step="0.1"
                    name="grasaCorporal"
                    defaultValue={bodyCompModal.existing?.grasaCorporal || ''}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">% Músculo Esquelético</label>
                  <input
                    type="number"
                    step="0.1"
                    name="musculoEsqueletico"
                    defaultValue={bodyCompModal.existing?.musculoEsqueletico || ''}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Grasa Visceral (Nivel)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="grasaVisceral"
                    defaultValue={bodyCompModal.existing?.grasaVisceral || ''}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Metabolismo Basal (kcal)</label>
                  <input
                    type="number"
                    step="1"
                    name="metabolismoBasal"
                    defaultValue={bodyCompModal.existing?.metabolismoBasal || ''}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Edad Corporal (años)</label>
                  <input
                    type="number"
                    step="1"
                    name="edadCorporal"
                    defaultValue={bodyCompModal.existing?.edadCorporal || ''}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Notas / Observaciones</label>
                  <textarea
                    name="notas"
                    rows={2}
                    defaultValue={bodyCompModal.existing?.notas || ''}
                    placeholder="Comentarios del coach..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setBodyCompModal({ isOpen: false, periodo: 'enero', existing: null })}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-[#0ea5e9] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  {submitting ? 'Guardando...' : 'Guardar Medición'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MARCAR RECOMPENSA ENTREGADA ── */}
      {rewardDeliverModal.isOpen && rewardDeliverModal.reward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Gift size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Validar Entrega</span>
                <h3 className="text-lg font-black text-slate-900">
                  {rewardDeliverModal.reward.seleccionada?.opcionTitulo}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Confirma que el alumno ha recibido su recompensa en físico o que el descuento ha sido aplicado a su cuenta.
            </p>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Notas de Entrega</label>
              <input
                id="delivery-notes-input"
                type="text"
                placeholder="Ej. Entregada chamarra talla M en recepción"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRewardDeliverModal({ isOpen: false, reward: null })}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={() => {
                  const notas = document.getElementById('delivery-notes-input')?.value || '';
                  handleDeliverReward(notas);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
              >
                {submitting ? 'Guardando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FOTOS INICIO Y FIN (DRAG & DROP) ── */}
      {photosModal.isOpen && (
        <PhotosModalComponent
          isOpen={photosModal.isOpen}
          onClose={() => setPhotosModal({ isOpen: false })}
          initialData={passport}
          clientUserId={id}
          onSave={handleSavePhotos}
          submitting={submitting}
        />
      )}

    </div>
  );
}

function PhotosModalComponent({ isOpen, onClose, initialData, clientUserId, onSave, submitting }) {
  const [frenteUrl, setFrenteUrl] = useState(initialData?.fotosPostura?.frenteUrl || initialData?.fotoInicioUrl || '');
  const [ladoUrl, setLadoUrl] = useState(initialData?.fotosPostura?.ladoUrl || '');
  const [espaldaUrl, setEspaldaUrl] = useState(initialData?.fotosPostura?.espaldaUrl || '');
  const [fechaInicio, setFechaInicio] = useState(initialData?.fechaInicio || '2026-01-01');

  const [cierreFrenteUrl, setCierreFrenteUrl] = useState(initialData?.fotosCierre?.frenteUrl || initialData?.fotoFinUrl || '');
  const [cierreLadoUrl, setCierreLadoUrl] = useState(initialData?.fotosCierre?.ladoUrl || '');
  const [cierreEspaldaUrl, setCierreEspaldaUrl] = useState(initialData?.fotosCierre?.espaldaUrl || '');
  const [fechaFin, setFechaFin] = useState(initialData?.fechaFin || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Transformación del Reto</span>
            <h3 className="text-xl font-black text-slate-900">Fotografías del Atleta</h3>
            <p className="text-xs text-slate-500 font-medium">Registro de postura inicial y de cierre en 3 ángulos (frente, lado y espalda)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              frenteUrl,
              ladoUrl,
              espaldaUrl,
              fotoInicioUrl: frenteUrl,
              fechaInicio,
              cierreFrenteUrl,
              cierreLadoUrl,
              cierreEspaldaUrl,
              fotoFinUrl: cierreFrenteUrl,
              fechaFin
            });
          }}
          className="space-y-6"
        >
          {/* 1. Sección Fotos de Postura Inicial */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Camera size={15} className="text-cyan-500" /> 1. Fotos de Postura Inicial (Así Empecé)
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-500">Fecha Inicio:</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Frente */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block text-center">Frente</span>
                <ImageDropzone
                  label="Foto Frente"
                  value={frenteUrl}
                  onChange={setFrenteUrl}
                  placeholder="Arrastra o selecciona foto frontal"
                  clientUserId={clientUserId}
                />
              </div>

              {/* Lado */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block text-center">Lado / Perfil</span>
                <ImageDropzone
                  label="Foto Lado"
                  value={ladoUrl}
                  onChange={setLadoUrl}
                  placeholder="Arrastra o selecciona foto de perfil"
                  clientUserId={clientUserId}
                />
              </div>

              {/* Espalda */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block text-center">Espalda</span>
                <ImageDropzone
                  label="Foto Espalda"
                  value={espaldaUrl}
                  onChange={setEspaldaUrl}
                  placeholder="Arrastra o selecciona foto de espalda"
                  clientUserId={clientUserId}
                />
              </div>
            </div>
          </div>

          {/* 2. Sección Fotos de Cierre */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Trophy size={15} className="text-amber-500" /> 2. Fotos de Cierre (Así Terminé)
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-500">Fecha Cierre:</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Frente */}
              <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block text-center">Frente</span>
                <ImageDropzone
                  label="Foto Frente"
                  value={cierreFrenteUrl}
                  onChange={setCierreFrenteUrl}
                  placeholder="Arrastra o selecciona foto frontal"
                  clientUserId={clientUserId}
                />
              </div>

              {/* Lado */}
              <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block text-center">Lado / Perfil</span>
                <ImageDropzone
                  label="Foto Lado"
                  value={cierreLadoUrl}
                  onChange={setCierreLadoUrl}
                  placeholder="Arrastra o selecciona foto de perfil"
                  clientUserId={clientUserId}
                />
              </div>

              {/* Espalda */}
              <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block text-center">Espalda</span>
                <ImageDropzone
                  label="Foto Espalda"
                  value={cierreEspaldaUrl}
                  onChange={setCierreEspaldaUrl}
                  placeholder="Arrastra o selecciona foto de espalda"
                  clientUserId={clientUserId}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-slate-900 hover:bg-[#0ea5e9] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
            >
              {submitting ? 'Guardando...' : 'Guardar Fotos y Fechas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
