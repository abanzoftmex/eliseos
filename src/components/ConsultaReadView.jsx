import { FileText, Calendar, User, Activity, Clock, Heart, Stethoscope } from 'lucide-react';

/**
 * Vista de solo lectura para consultas (fichas médicas y deportivas).
 *
 * Props:
 *   consulta  – documento Firestore completo ({ type, answers?, createdAt, ... })
 *   cliente   – { nombre, email, telefono } opcional
 *   hideHeader – oculta el header con gradiente (útil en portal con su propio header)
 */
export default function ConsultaReadView({ consulta, cliente, hideHeader = false }) {
  if (!consulta) return null;

  // Normaliza: si los datos vienen en `answers` (nuevo esquema) los aplana.
  // Si ya están en la raíz (esquema viejo / shareable link) los usa directo.
  const d = consulta.answers ? consulta.answers : consulta;
  const isAtleta = consulta.type === 'atleta';

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  };

  const formatCheckboxObject = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const labels = {
      enfermedad: 'Enfermedad', accidente: 'Accidente',
      urgencia: 'Urgencia', segundaOpinion: 'Segunda opinión',
      congenito: 'Congénito', adquirido: 'Adquirido',
      agudo: 'Agudo', cronico: 'Crónico',
    };
    return Object.entries(obj)
      .filter(([, v]) => v === true)
      .map(([k]) => labels[k] || k)
      .join(', ') || '';
  };

  const renderField = (label, value, icon = null) => {
    if (!value || value === '') return null;
    return (
      <div className="mb-4 pb-4 border-b border-gray-200 last:border-0">
        <div className="flex items-start gap-2">
          {icon && <div className="mt-1 text-teal-600">{icon}</div>}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">{label}</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title, children, icon = null) => {
    // Si no hay ningún hijo visible, no renderizar la sección
    if (!children || (Array.isArray(children) && children.every(c => !c))) return null;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-teal-500">
          {icon && <div className="text-teal-600">{icon}</div>}
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        {children}
      </div>
    );
  };

  // FMS scores
  const fmsMovimientos = [
    { label: 'Deep Squat',                    value: d.fmsDeepSquat?.puntuacionFinal },
    { label: 'Hurdle Step',                   value: d.fmsHurdleStep?.puntuacionFinal },
    { label: 'In-line Lunge',                 value: d.fmsInlineLunge?.puntuacionFinal },
    { label: 'Shoulder Mobility',             value: d.fmsShoulderMobility?.puntuacionFinal },
    { label: 'Active Straight-Leg Raise',     value: d.fmsActiveStraightLegRaise?.puntuacionFinal },
    { label: 'Trunk Stability Push-up',       value: d.fmsTrunkStabilityPushup?.puntuacionFinal },
    { label: 'Rotary Stability',              value: d.fmsRotaryStability?.puntuacionFinal },
  ].filter(m => m.value != null && m.value !== '');

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header con gradiente (solo si no se oculta) */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {isAtleta ? 'Consulta Deportiva' : 'Historia Clínica'}
              </h1>
              <p className="text-teal-100">Elíseos Box & Fitness</p>
            </div>
          </div>

          {cliente && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={18} />
                <span className="font-semibold">{cliente.nombre}</span>
              </div>
              {cliente.email && (
                <p className="text-sm text-teal-100">📧 {cliente.email}</p>
              )}
              {cliente.telefono && (
                <p className="text-sm text-teal-100">📱 {cliente.telefono}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 text-sm text-teal-100">
            <Calendar size={16} />
            <span>Fecha: {formatDate(consulta.createdAt)}</span>
          </div>
        </div>
      )}

      {/* Datos Personales */}
      {renderSection(
        'Datos Personales',
        <>
          {renderField('Nombre', [d.nombres, d.apellidoPaterno, d.apellidoMaterno].filter(Boolean).join(' ') || null)}
          {renderField('Edad', d.edad)}
          {renderField('Género', d.genero)}
          {renderField('Ocupación', d.ocupacion)}
          {renderField('Lado Dominante', d.ladoDominante)}
          {renderField('Contacto', d.contacto)}
          {renderField('Contacto de Emergencia', d.contactoEmergencia)}
          {renderField('No. Expediente', d.numeroExpediente)}
        </>,
        <User size={24} />
      )}

      {/* Motivo de consulta (ficha médica) */}
      {d.recopilacionHechos && renderSection(
        'Motivo de Consulta',
        <>
          {renderField('Tipo', formatCheckboxObject(d.recopilacionHechos))}
          {renderField('Tipo de Padecimiento', formatCheckboxObject(d.tipoPadecimiento))}
          {renderField('Fecha del Padecimiento', d.fechaPadecimiento)}
          {renderField('Fecha de Diagnóstico', d.fechaDiagnostico)}
          {renderField('Descripción', d.descripcionPadecimiento)}
          {renderField('Antecedentes relacionados', d.antecedentesRelacionados)}
          {renderField('Diagnóstico médico/especialista', d.diagnosticoMedicoEspecialista)}
        </>,
        <Stethoscope size={24} />
      )}

      {/* Antecedentes no patológicos */}
      {renderSection(
        'Antecedentes',
        <>
          {renderField('Alergias', d.alergias)}
          {renderField('Alimentación', d.alimentacionCantidadCalidad || d.alimentacion)}
          {renderField('Plan nutricional', d.planNutricional)}
          {renderField('Hidratación', d.hidratacionCantidad || d.hidratacion)}
          {renderField('Toxicomanías', d.toxicomanias)}
          {renderField('Hábitos de Sueño', d.habitosSuenoHoras || d.habitosSueno)}
          {renderField('Actividad Física', d.actividadFisicaFrecuencia)}
          {renderField('Síntomas Emocionales', d.sintomasEmocionales)}
          {renderField('Gasto Médico Mayor', d.gastoMedicoMayores)}
          {renderField('Pérdida de Peso', d.perdidaPeso)}
        </>,
        <Activity size={24} />
      )}

      {/* Signos Vitales */}
      {(isAtleta
        ? (d.frecuenciaCardiacaReposo || d.tensionArterial || d.frecuenciaCardiaca || d.saturacionOxigeno)
        : (d.signosVitales && Object.values(d.signosVitales).some(v => v))
      ) && renderSection(
        'Signos Vitales',
        isAtleta ? (
          <>
            {renderField('Frecuencia Cardíaca en Reposo', d.frecuenciaCardiacaReposo ? `${d.frecuenciaCardiacaReposo} lpm` : null, <Heart size={20} />)}
            {renderField('Frecuencia Cardíaca Máx.', d.frecuenciaCardiaca ? `${d.frecuenciaCardiaca} lpm` : null)}
            {renderField('Tensión Arterial', d.tensionArterial)}
            {renderField('Saturación de Oxígeno', d.saturacionOxigeno ? `${d.saturacionOxigeno}%` : null)}
          </>
        ) : (
          <>
            {renderField('Frecuencia Cardíaca', d.signosVitales?.frecuenciaCardiaca ? `${d.signosVitales.frecuenciaCardiaca} lpm` : null, <Heart size={20} />)}
            {renderField('Frecuencia Respiratoria', d.signosVitales?.frecuenciaRespiratoria ? `${d.signosVitales.frecuenciaRespiratoria} rpm` : null)}
            {renderField('Tensión Arterial', d.signosVitales?.tensionArterial)}
            {renderField('SpO2', d.signosVitales?.spo2 ? `${d.signosVitales.spo2}%` : null)}
            {renderField('Peso', d.signosVitales?.peso ? `${d.signosVitales.peso} kg` : null)}
            {renderField('Estatura', d.signosVitales?.estatura ? `${d.signosVitales.estatura} cm` : null)}
          </>
        ),
        <Heart size={24} />
      )}

      {/* Medidas Antropométricas */}
      {(d.altura || d.peso) && renderSection(
        'Medidas Antropométricas',
        <>
          {renderField('Objetivo', d.objetivoAntropometrico)}
          {renderField('Altura', d.altura ? `${d.altura} cm` : null)}
          {renderField('Peso', d.peso ? `${d.peso} kg` : null)}
          {renderField('IMC', d.imc)}
          {renderField('Grasa Corporal', d.grasaCorporal ? `${d.grasaCorporal}%` : null)}
          {renderField('Músculo Esquelético', d.musculoEsqueletico ? `${d.musculoEsqueletico}%` : null)}
          {renderField('Metabolismo Basal', d.metabolismoBasal)}
          {renderField('Edad Corporal', d.edadCorporal)}
          {renderField('Grasa Visceral', d.grasaVisceral)}
          {renderField('Comentarios', d.comentarioAntropometrico)}
        </>,
        <Activity size={24} />
      )}

      {/* Objetivos */}
      {(d.objetivoPersonal || d.objetivoAntropometrico) && renderSection(
        'Objetivos',
        <>
          {renderField('Objetivo Personal', d.objetivoPersonal)}
          {renderField('Objetivo Antropométrico', d.objetivoAntropometrico)}
        </>
      )}

      {/* FMS */}
      {fmsMovimientos.length > 0 && renderSection(
        'FMS — Functional Movement Screen',
        <div>
          {fmsMovimientos.map(m => {
            const n = Number(m.value);
            const color = n >= 3 ? 'text-green-600' : n === 2 ? 'text-yellow-600' : 'text-red-600';
            return (
              <div key={m.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{m.label}</span>
                <span className={`text-xl font-bold ${color}`}>{m.value}</span>
              </div>
            );
          })}
          {(d.fmsTotalPuntuacion != null && d.fmsTotalPuntuacion !== '') && (
            <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-teal-100">
              <span className="font-semibold text-gray-900">Total FMS</span>
              <span className="text-2xl font-black text-teal-600">{d.fmsTotalPuntuacion}</span>
            </div>
          )}
        </div>,
        <Activity size={24} />
      )}

      {/* Diagnóstico y Plan de Tratamiento */}
      {renderSection(
        'Diagnóstico y Plan de Tratamiento',
        <>
          {renderField('Diagnóstico Médico', d.diagnosticoMedico)}
          {renderField('Diagnóstico Fisioterapéutico', d.diagnosticoFisioterapeutico)}
          {renderField('Motivo de Consulta', d.motivoConsulta)}
          {renderField('Objetivo del Paciente', d.objetivoPaciente)}
          {renderField('Pronóstico', d.pronosticoFisioterapeutico || d.pronostico)}
          {renderField('Intervención Fisioterapéutica', d.intervencionFisioterapeutica)}
          {renderField('Plan de Tratamiento', d.planTratamiento)}
          {renderField('Control de Sesiones', d.controlSesiones)}
          {renderField('Frecuencia de Tratamiento', d.frecuenciaTratamiento)}
          {renderField('Impresión Diagnóstica', d.impresionDiagnostica)}
          {renderField('Objetivos Funcionales', d.objetivosFuncionales)}
        </>,
        <FileText size={24} />
      )}

      {/* Observaciones */}
      {(d.observaciones || d.notasAdicionales) && renderSection(
        'Observaciones',
        <>
          {renderField('Observaciones', d.observaciones)}
          {renderField('Notas Adicionales', d.notasAdicionales)}
        </>
      )}

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
            <Activity size={24} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Elíseos Box & Fitness</h3>
        </div>
        <p className="text-sm text-gray-600">Box & Fitness · Entrenamiento y Rendimiento Físico</p>
        <p className="text-xs text-gray-500 mt-2">
          Este documento es confidencial y solo debe ser compartido con el miembro y profesionales autorizados.
        </p>
      </div>

    </div>
  );
}
