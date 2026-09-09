import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ClipboardList, 
  Stethoscope, 
  Dumbbell, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Hash, 
  HeartPulse, 
  Scale, 
  ArrowRight,
  Activity as ActivityIcon,
  User as UserIcon,
  History as HistoryIcon,
  AlertCircle
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

const TABS = [
  { key: 'medicas',    label: 'Fichas Médicas',    icon: Stethoscope,  tipo: 'medica'    },
  { key: 'deportivas', label: 'Fichas Deportivas',  icon: Dumbbell,     tipo: 'deportiva' },
  { key: 'rapidas',    label: 'Consultas Rápidas',  icon: Zap,          tipo: 'rapida'    },
];

function formatDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function motivosTexto(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const map = { enfermedad: 'Enfermedad', accidente: 'Accidente', urgencia: 'Urgencia', segundaOpinion: 'Segunda opinión' };
  const items = Object.entries(obj).filter(([, v]) => v === true).map(([k]) => map[k] || k);
  return items.length ? items.join(', ') : null;
}

function padecimientoTexto(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const map = { congenito: 'Congénito', adquirido: 'Adquirido', agudo: 'Agudo', cronico: 'Crónico' };
  const items = Object.entries(obj).filter(([k, v]) => v === true && map[k]).map(([k]) => map[k]);
  return items.length ? items.join(', ') : null;
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon size={14} className="text-primary" />}
      <p className="text-[10px] font-black uppercase tracking-widest text-science-400">{children}</p>
    </div>
  );
}

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

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-science-100 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="text-primary mb-1">
        <Icon size={14} />
      </div>
      <div className="text-sm font-black text-science-900 tracking-tighter">{value}</div>
      <div className="text-[8px] font-black text-science-300 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

/* ── Tarjeta expandible ── */
function RecordCard({ record, tipo, renderSummary, renderDetail }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dateStr = formatDate(record.fechaEvaluacion) || formatDate(record.createdAt);

  return (
    <div className={`bg-white rounded-[1.5rem] border border-science-100 overflow-hidden transition-all duration-300 mb-4 ${open ? 'shadow-xl ring-1 ring-primary/20' : 'shadow-sm hover:shadow-lg'}`}>
      {/* Header — click para expandir */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 bg-transparent hover:bg-science-50/50 transition-colors text-left gap-6"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-3">
            {dateStr && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                <Calendar size={12} />
                {dateStr}
              </span>
            )}
            {record.numeroExpediente && (
              <span className="flex items-center gap-1 text-[10px] font-black text-science-300 uppercase tracking-widest">
                <Hash size={12} />
                Exp: {record.numeroExpediente}
              </span>
            )}
          </div>
          {renderSummary(record)}
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-science-50 text-science-300 transition-transform duration-300 ${open ? 'rotate-180 text-primary bg-primary/10' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Detalle colapsable */}
      {open && (
        <div className="border-t border-science-50 bg-science-50/30 animate-fade-in">
          <div className="p-8 space-y-6">
            {renderDetail(record)}
          </div>

          {/* Botón ver ficha completa */}
          <div className="px-8 pb-8">
            <button
              type="button"
              onClick={() => router.push(`/portal/clinica/${record.id}?tipo=${tipo}`)}
              className="flex items-center justify-center gap-2 w-full py-4 bg-science-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-science-900/10"
            >
              Consultar Expediente Completo
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fichas Médicas ── */
function SummaryMedica({ record }) {
  const motivos = motivosTexto(record.recopilacionHechos);
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-black text-science-900 leading-tight">
        {record.diagnosticoMedico || 'Evaluación Médica General'}
      </h3>
      {motivos && <p className="text-xs font-medium text-science-500">Motivo: {motivos}</p>}
    </div>
  );
}

function DetailMedica({ record }) {
  const motivos = motivosTexto(record.recopilacionHechos);
  const tipo = padecimientoTexto(record.tipoPadecimiento);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Campo label="Diagnóstico médico" value={record.diagnosticoMedico} />
        <Campo label="Motivo de consulta" value={motivos} />
        <Campo label="Tipo de padecimiento" value={tipo} />
      </div>
      <div className="space-y-4">
        <Campo label="Descripción" value={record.descripcionPadecimiento} />
        <Campo label="Antecedentes" value={record.antecedentesHeredofamiliares} />
      </div>
    </div>
  );
}

/* ── Fichas Deportivas ── */
function SummaryDeportiva({ record }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-black text-science-900 leading-tight">
        {record.objetivoPersonal || 'Evaluación de Rendimiento'}
      </h3>
      <div className="flex items-center gap-3">
        {record.peso && <span className="text-[10px] font-bold text-science-400 bg-science-100/50 px-2 py-0.5 rounded uppercase tracking-widest">{record.peso} kg</span>}
        {record.imc && <span className="text-[10px] font-bold text-science-400 bg-science-100/50 px-2 py-0.5 rounded uppercase tracking-widest">IMC: {record.imc}</span>}
      </div>
    </div>
  );
}

function DetailDeportiva({ record }) {
  const dolorResp = record.dolorMolestiaActual?.respuesta;
  const dolorCual = record.dolorMolestiaActual?.cual;
  const dolorStr = dolorResp === 'si' && dolorCual ? `Sí — ${dolorCual}` : dolorResp === 'si' ? 'Sí' : dolorResp === 'no' ? 'No' : null;
  
  return (
    <div className="space-y-8">
      {(record.altura || record.peso || record.imc || record.grasaCorporal || record.musculoEsqueletico) && (
        <div className="space-y-4">
          <SectionTitle icon={ActivityIcon}>Composición Corporal</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {record.altura && <Metric icon={Scale} label="Talla" value={`${record.altura} cm`} />}
            {record.peso && <Metric icon={WeightControl} label="Peso" value={`${record.peso} kg`} />}
            {record.imc && <Metric icon={HeartPulse} label="IMC" value={record.imc} />}
            {record.grasaCorporal && <Metric icon={ActivityIcon} label="Grasa %" value={`${record.grasaCorporal}%`} />}
            {record.musculoEsqueletico && <Metric icon={Dumbbell} label="Músculo %" value={`${record.musculoEsqueletico}%`} />}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Campo label="Objetivo personal" value={record.objetivoPersonal} />
        <Campo label="Dolor o molestia actual" value={dolorStr} />
        <Campo label="Alimentación" value={record.alimentacion} />
        <Campo label="Hidratación" value={record.hidratacion} />
      </div>
    </div>
  );
}

// Helper icons internal (some might be missing in lucide-react standard set)
const WeightControl = Scale;

/* ── Consultas Rápidas ── */
function SummaryRapida({ record }) {
  const motivos = motivosTexto(record.motivoConsulta);
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-black text-science-900 leading-tight">
        {record.diagnosticoMedico || 'Consulta de Seguimiento'}
      </h3>
      {motivos && <p className="text-xs font-medium text-science-500">Motivo: {motivos}</p>}
    </div>
  );
}

function DetailRapida({ record }) {
  const motivos = motivosTexto(record.motivoConsulta);
  const tipo = padecimientoTexto(record.tipoPadecimiento);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Campo label="Diagnóstico médico" value={record.diagnosticoMedico} />
        <Campo label="Motivo de consulta" value={motivos} />
        <Campo label="Tipo de padecimiento" value={tipo} />
      </div>
      <div className="space-y-4">
        <Campo label="Descripción" value={record.descripcion} />
        <Campo label="Antecedentes" value={record.antecedentes} />
        <Campo label="Exploración física" value={record.exploracionFisica} />
      </div>
    </div>
  );
}

/* ── Tarjeta Nota Clínica (ELÍSEOS Mi Salud) ── */
function NotaClinicaCard({ nota }) {
  const [open, setOpen] = useState(true);
  const dateStr = formatDate(nota.fecha) || formatDate(nota.createdAt);

  return (
    <div className={`bg-white rounded-[1.5rem] border border-science-100 overflow-hidden transition-all duration-300 mb-4 ${open ? 'shadow-lg ring-1 ring-primary/20' : 'shadow-sm hover:shadow-md'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 bg-transparent hover:bg-science-50/40 transition-colors text-left gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {dateStr && (
              <span className="flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-widest">
                <Calendar size={13} />
                {dateStr}
              </span>
            )}
            {nota.numeroSesion && (
              <span className="px-2.5 py-0.5 rounded-md bg-science-100 text-science-800 text-[10px] font-black uppercase tracking-wider">
                Sesión #{nota.numeroSesion}
              </span>
            )}
            {nota.hora && (
              <span className="text-[11px] font-medium text-science-400">
                {nota.hora}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-science-900 truncate">
            {nota.evaluacion ? `Evaluación: ${nota.evaluacion}` : (nota.subjetivo || 'Nota de seguimiento clínico')}
          </p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-science-50 text-science-400 transition-transform duration-300 ${open ? 'rotate-180 text-primary bg-primary/10' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {open && (
        <div className="border-t border-science-100/60 bg-science-50/20 p-6 space-y-4 animate-fade-in">
          {nota.subjetivo && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Subjetivo</span>
              <p className="text-sm font-medium text-science-800 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-science-100">{nota.subjetivo}</p>
            </div>
          )}
          {nota.objetivo && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Objetivo</span>
              <p className="text-sm font-medium text-science-800 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-science-100">{nota.objetivo}</p>
            </div>
          )}
          {nota.evaluacion && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Evaluación</span>
              <p className="text-sm font-medium text-science-800 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-science-100">{nota.evaluacion}</p>
            </div>
          )}
          {nota.planTerapeutico && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Plan Terapéutico</span>
              <p className="text-sm font-medium text-science-800 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-science-100">{nota.planTerapeutico}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Contenido principal ── */
function ClinicaContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portal-usuarios/clinica');
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al cargar'); return; }
        setData(json);
      } catch { setError('Error de conexión'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const notasList = data?.notasClinicas ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Mi Salud</h1>
            <p className="text-science-500 font-medium mt-1">Historial de notas clínicas</p>
          </div>
        </div>

        {notasList.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-science-100 shadow-sm w-fit">
            <span className="text-xs font-bold text-science-400 uppercase tracking-widest">Total Notas:</span>
            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{notasList.length}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="animate-fade-in [animation-delay:0.1s]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-science-100">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-science-400 font-black text-[10px] uppercase tracking-[0.3em]">Accediendo a tus notas clínicas...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex items-center gap-4 text-red-600">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        ) : notasList.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-science-100 border-dashed">
            <div className="w-20 h-20 bg-science-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <HistoryIcon size={40} className="text-science-100" />
            </div>
            <h3 className="text-xl font-black text-science-900 mb-2">Sin Notas Clínicas</h3>
            <p className="text-science-400 font-medium">Aún no tienes notas clínicas registradas en el sistema.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notasList.map(nota => (
              <NotaClinicaCard key={nota.id} nota={nota} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default function ClinicaPage() {
  return (
    <PortalLayout>
      <ClinicaContent />
    </PortalLayout>
  );
}
