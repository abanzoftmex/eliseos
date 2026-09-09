import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  ClipboardList, 
  Stethoscope, 
  Dumbbell, 
  Zap, 
  Calendar, 
  Hash, 
  Activity as ActivityIcon,
  FileText,
  User as UserIcon,
  AlertCircle,
  Clock
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';
import ConsultaReadView from '@/components/ConsultaReadView';
import FichaDeportivaForm from '@/components/forms/FichaDeportivaForm';
import FichaMedicaForm from '@/components/forms/FichaMedicaForm';

function formatDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function checkboxText(obj, map) {
  if (!obj || typeof obj !== 'object') return null;
  const items = Object.entries(obj).filter(([, v]) => v === true).map(([k]) => map[k] || k);
  return items.length ? items.join(', ') : null;
}

const MOTIVOS_MAP   = { enfermedad: 'Enfermedad', accidente: 'Accidente', urgencia: 'Urgencia', segundaOpinion: 'Segunda opinión' };
const TIPO_PAD_MAP  = { congenito: 'Congénito', adquirido: 'Adquirido', agudo: 'Agudo', cronico: 'Crónico' };

function Campo({ label, value }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-science-300 block">
        {label}
      </span>
      <p className="text-sm font-bold text-science-800 leading-relaxed">{value}</p>
    </div>
  );
}

function SeccionRapida({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-[2rem] border border-science-100 overflow-hidden shadow-sm mb-6">
      <div className="p-6 border-b border-science-50 bg-science-50/30 flex items-center gap-3">
        {Icon && <Icon size={16} className="text-primary" />}
        <h2 className="text-[11px] font-black text-science-900 uppercase tracking-[0.2em]">{title}</h2>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">{children}</div>
    </div>
  );
}

function ConsultaRapidaView({ record }) {
  const dp = record.datosPersonales || {};
  const motivos = checkboxText(record.motivoConsulta, MOTIVOS_MAP);
  const tipo    = checkboxText(record.tipoPadecimiento, TIPO_PAD_MAP);

  return (
    <div className="animate-fade-in space-y-6">
      <SeccionRapida title="Datos de la Consulta" icon={User}>
        <Campo label="Fecha de Evaluación" value={formatDate(record.fechaEvaluacion)} />
        <Campo label="Número de Expediente" value={record.numeroExpediente} />
        <Campo label="Nombre del Paciente" value={[dp.nombre, dp.apellidoPaterno, dp.apellidoMaterno].filter(Boolean).join(' ') || null} />
        <Campo label="Edad" value={dp.edad ? `${dp.edad} años` : null} />
        <Campo label="Género" value={dp.genero} />
        <Campo label="Ocupación" value={dp.ocupacion} />
        <Campo label="Lado Dominante" value={dp.ladoDominante} />
      </SeccionRapida>

      {(motivos || tipo) && (
        <SeccionRapida title="Motivo y Tipo" icon={Activity}>
          <Campo label="Motivo de Consulta" value={motivos} />
          <Campo label="Tipo de Padecimiento" value={tipo} />
          {record.tipoPadecimiento?.fechaPadecimiento && (
            <Campo label="Fecha de Inicio" value={formatDate(record.tipoPadecimiento.fechaPadecimiento)} />
          )}
          {record.tipoPadecimiento?.fechaDx && (
            <Campo label="Fecha de Diagnóstico" value={formatDate(record.tipoPadecimiento.fechaDx)} />
          )}
        </SeccionRapida>
      )}

      {(record.descripcion || record.antecedentes) && (
        <SeccionRapida title="Antecedentes" icon={History}>
          <Campo label="Descripción Clínica" value={record.descripcion} />
          <Campo label="Antecedentes Relevantes" value={record.antecedentes} />
        </SeccionRapida>
      )}

      {record.exploracionFisica && (
        <SeccionRapida title="Exploración Física" icon={Stethoscope}>
          <Campo label="Hallazgos y Observaciones" value={record.exploracionFisica} />
        </SeccionRapida>
      )}

      {record.diagnosticoMedico && (
        <SeccionRapida title="Diagnóstico Final" icon={FileText}>
          <Campo label="Juicio Clínico" value={record.diagnosticoMedico} />
        </SeccionRapida>
      )}
    </div>
  );
}

function ClinicaDetalleContent() {
  const router = useRouter();
  const { id, tipo } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res  = await fetch(`/api/portal-usuarios/clinica/${id}?tipo=${tipo || ''}`);
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al cargar'); return; }
        setRecord(json.record);
      } catch { setError('Error de conexión'); }
      finally { setLoading(false); }
    }
    load();
  }, [id, tipo]);

  const tipoLabel = tipo === 'rapida' ? 'Consulta Rápida' : tipo === 'deportiva' ? 'Ficha Deportiva' : 'Ficha Médica';
  const Icon = tipo === 'rapida' ? Zap : tipo === 'deportiva' ? Dumbbell : Stethoscope;

  const dateStr = record ? formatDate(record.answers?.fechaEvaluacion || record.fechaEvaluacion || record.createdAt) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      
      {/* Back Navigation */}
      <button
        onClick={() => router.push('/portal/clinica')}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-science-400 hover:text-primary transition-colors animate-fade-in"
      >
        <ArrowLeft size={14} />
        Regresar al Historial
      </button>

      {/* Header Section */}
      <div className="flex items-center gap-6 animate-fade-in [animation-delay:0.1s]">
        <div className="w-16 h-16 rounded-[1.5rem] bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
          <Icon size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-science-900 tracking-tight">{tipoLabel}</h1>
          <div className="flex items-center gap-4 mt-1.5">
            {dateStr && dateStr !== '—' && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-science-400 uppercase tracking-widest">
                <Calendar size={12} className="text-primary" />
                {dateStr}
              </span>
            )}
            <span className="w-1 h-1 rounded-full bg-science-200" />
            <span className="text-[10px] font-black text-science-400 uppercase tracking-widest">
              ID: {id?.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="animate-fade-in [animation-delay:0.2s]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-science-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-science-400 font-black text-[10px] uppercase tracking-[0.3em]">Cargando expediente técnico...</p>
          </div>
        ) : error ? (
          <div className="p-10 rounded-[2.5rem] bg-red-50 border border-red-100 flex items-center gap-6 text-red-700 shadow-sm">
            <AlertCircle size={32} />
            <div>
               <p className="font-black text-lg leading-tight">Error de Acceso</p>
               <p className="font-bold opacity-80">{error}</p>
            </div>
          </div>
        ) : record && (
          <div className="space-y-8">
            {tipo === 'rapida' && <ConsultaRapidaView record={record} />}

            {tipo === 'deportiva' && (
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-science-100 shadow-sm p-4 sm:p-6 lg:p-10 overflow-x-auto">
                <FichaDeportivaForm formData={record.answers || {}} readOnly={true} />
              </div>
            )}

            {tipo === 'medica' && (
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-science-100 shadow-sm p-4 sm:p-6 lg:p-10 overflow-x-auto">
                <FichaMedicaForm formData={record.answers || {}} readOnly={true} />
              </div>
            )}

            {tipo !== 'rapida' && tipo !== 'deportiva' && tipo !== 'medica' && (
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-science-100 shadow-sm p-4 sm:p-6 lg:p-10 overflow-x-auto">
                <ConsultaReadView consulta={record} hideHeader />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClinicaDetallePage() {
  return (
    <PortalLayout>
      <ClinicaDetalleContent />
    </PortalLayout>
  );
}
