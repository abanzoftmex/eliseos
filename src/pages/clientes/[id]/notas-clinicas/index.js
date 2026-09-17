import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  User,
  FileText,
  Plus,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  getNotasClinicas,
  createNotaClinica,
  updateNotaClinica,
  deleteNotaClinica
} from '../../../../../lib/firebase/notasClinicasService';
import { generarHojaClinicaEliseosPDF } from '../../../../utils/eliseosHojaClinicaPdfGenerator';
import { generateNotaPDF } from '../../../../utils/pdfGenerator';
import NotaCard from '../../../../components/notas-clinicas/NotaCard';
import HojaClinicaModal from '../../../../components/notas-clinicas/HojaClinicaModal';
import HojaClinicaViewerModal from '../../../../components/notas-clinicas/HojaClinicaViewerModal';

export default function NotasClinicasPage({ initialUser, initialNotas, rawCliente }) {
  const router = useRouter();
  const { id } = router.query;

  const [user] = useState(initialUser);
  const [cliente] = useState(rawCliente || initialUser);
  const [notas, setNotas] = useState(initialNotas || []);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNota, setCurrentNota] = useState(null);
  const [viewerNota, setViewerNota] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isSubmittingRef = useRef(false);

  const loadNotas = useCallback(async () => {
    try {
      const result = await getNotasClinicas(id);
      if (result.success) {
        setNotas(result.notas || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al cargar hojas clínicas' });
      }
    } catch (error) {
      console.error('Error loading notas:', error);
      setMessage({ type: 'error', text: 'Error al cargar hojas clínicas' });
    }
  }, [id]);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleOpenCreate = () => {
    setCurrentNota(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (nota) => {
    setCurrentNota(nota);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveNota = async (payload) => {
    if (isSubmittingRef.current || isSaving) return;

    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      let result;
      if (isEditing && currentNota) {
        result = await updateNotaClinica(id, currentNota.id, payload);
      } else {
        result = await createNotaClinica(id, payload);
      }

      if (result.success) {
        showNotification(
          'success',
          isEditing ? 'Hoja clínica actualizada exitosamente' : 'Hoja clínica creada exitosamente'
        );
        setShowModal(false);
        await loadNotas();
      } else {
        showNotification('error', result.error || 'Error al guardar la hoja clínica');
      }
    } catch (error) {
      console.error('Error saving nota:', error);
      showNotification('error', 'Error al guardar la hoja clínica');
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleDeleteNota = async (notaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta hoja clínica?')) return;

    try {
      const result = await deleteNotaClinica(id, notaId);
      if (result.success) {
        showNotification('success', 'Hoja clínica eliminada exitosamente');
        await loadNotas();
      } else {
        showNotification('error', result.error || 'Error al eliminar la hoja clínica');
      }
    } catch (error) {
      console.error('Error deleting nota:', error);
      showNotification('error', 'Error al eliminar la hoja clínica');
    }
  };

  const handleDownloadNota = async (nota) => {
    try {
      setIsDownloading(true);
      const isEliseos =
        nota.tipoNota === 'hoja_clinica_eliseos' ||
        Boolean(nota.paquete || nota.datosSocio || nota.datosClinicos);

      if (isEliseos) {
        await generarHojaClinicaEliseosPDF(nota, cliente);
      } else {
        generateNotaPDF(nota, user);
      }
      showNotification('success', 'Documento PDF descargado exitosamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showNotification('error', 'Error al generar el archivo PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-700 mb-2">Usuario no encontrado</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Botón Volver */}
      <div>
        <button
          onClick={() => router.push(`/clientes/${id}`)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={15} />
          Volver al Perfil del Socio
        </button>
      </div>

      {/* Banner de Mensaje */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:opacity-75">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header con información del Socio */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user.foto ? (
              <img
                src={user.foto}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-900 text-lime-400 flex items-center justify-center text-3xl font-black shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
              <span className="bg-lime-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Socio
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {user.email} • {user.telefono}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-lime-400 font-black px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all text-xs uppercase tracking-wider border border-slate-800"
        >
          <Plus size={16} />
          Nueva Hoja Clínica
        </button>
      </div>

      {/* Listado de Hojas Clínicas */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-400/20 text-slate-900 rounded-xl flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                Hojas Clínicas y Contratos
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {notas.length} {notas.length === 1 ? 'documento registrado' : 'documentos registrados'}
              </p>
            </div>
          </div>
        </div>

        {notas.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
              <FileText size={36} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Aún no hay hojas clínicas registradas
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Genera la primera Hoja Clínica Socios de Eliseos Box & Fitness con contrato de membresía y firmas digitales.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-slate-900 text-lime-400 font-black px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus size={15} />
              Crear Primera Hoja
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notas.map((nota) => (
              <NotaCard
                key={nota.id}
                nota={nota}
                cliente={cliente}
                onView={(n) => setViewerNota(n)}
                onDownload={handleDownloadNota}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteNota}
                isDownloading={isDownloading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Captura / Edición */}
      <HojaClinicaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveNota}
        isEditing={isEditing}
        initialData={currentNota}
        cliente={cliente}
        isSaving={isSaving}
      />

      {/* Modal Visor de Documento Oficial */}
      <HojaClinicaViewerModal
        isOpen={Boolean(viewerNota)}
        onClose={() => setViewerNota(null)}
        nota={viewerNota}
        cliente={cliente}
      />
    </div>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const host = context.req.headers.host;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const userResponse = await fetch(`${baseUrl}/api/clientes/${id}`);
    if (!userResponse.ok) {
      return { notFound: true };
    }

    const userData = await userResponse.json();
    if (!userData.success || !userData.data) {
      return { notFound: true };
    }

    const cliente = userData.data;
    const user = {
      id: cliente.id,
      name: `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim(),
      email: cliente.email || 'Sin email',
      telefono: cliente.telefonoContacto || cliente.telefono || 'Sin teléfono',
      ocupacion: cliente.ocupacion || 'Sin especificar',
      foto: cliente.foto || null,
      type: 'cliente'
    };

    const notasResponse = await fetch(`${baseUrl}/api/clientes/${id}/notas-clinicas`);
    let initialNotas = [];

    if (notasResponse.ok) {
      const notasData = await notasResponse.json();
      initialNotas = notasData.notas || [];
    }

    return {
      props: {
        initialUser: user,
        rawCliente: cliente,
        initialNotas
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    return { notFound: true };
  }
}
