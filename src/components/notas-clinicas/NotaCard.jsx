import React, { useState } from 'react';
import {
  Calendar,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Download,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Activity,
  Heart
} from 'lucide-react';

export default function NotaCard({
  nota,
  cliente,
  onView,
  onDownload,
  onEdit,
  onDelete,
  isDownloading = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isEliseosSheet =
    nota.tipoNota === 'hoja_clinica_eliseos' ||
    Boolean(nota.paquete || nota.datosSocio || nota.datosClinicos || nota.firmas);

  // Firmas status
  const firmas = nota.firmas || {};
  const hasPrestadorFirma = Boolean(firmas.prestadorFirma || nota.prestadorFirma);
  const hasSocioFirma = Boolean(firmas.socioFirma || nota.socioFirma);
  const bothSigned = hasPrestadorFirma && hasSocioFirma;

  const formatDate = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      const d = fecha instanceof Date ? fecha : new Date(fecha);
      if (isNaN(d.getTime())) return fecha;
      return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  const datosSocio = nota.datosSocio || {};
  const datosClinicos = nota.datosClinicos || {};
  const objetivos = nota.objetivos || {};

  return (
    <div className="bg-white border-2 border-gray-100 hover:border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header de la tarjeta */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-4 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
      >
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold">
            <FileText size={18} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">
                {isEliseosSheet
                  ? `Hoja Clínica: ${nota.paquete || 'Membresía Socio'}`
                  : `Nota Clínica #${nota.numeroSesion || '1'}`}
              </span>
              {isEliseosSheet ? (
                <span className="bg-lime-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  ELÍSEOS
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SOAP
                </span>
              )}

              {/* Pill de firmas */}
              {isEliseosSheet && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    bothSigned
                      ? 'bg-emerald-100 text-emerald-800'
                      : hasPrestadorFirma || hasSocioFirma
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {bothSigned ? (
                    <>
                      <CheckCircle2 size={11} /> 2 Firmas
                    </>
                  ) : hasPrestadorFirma || hasSocioFirma ? (
                    <>
                      <AlertCircle size={11} /> 1 Firma
                    </>
                  ) : (
                    <>
                      <AlertCircle size={11} /> Sin firmas
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-gray-400" />
                {formatDate(nota.fechaContratacion || nota.fecha)}
              </span>
              {nota.fechaPago && (
                <span>• Pago: {formatDate(nota.fechaPago)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
          {isEliseosSheet && (
            <button
              type="button"
              onClick={() => onView(nota)}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Ver Documento Oficial"
            >
              <Eye size={17} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDownload(nota)}
            disabled={isDownloading}
            className="p-2 text-lime-700 hover:text-lime-800 hover:bg-lime-50 rounded-xl transition-colors disabled:opacity-50"
            title="Descargar PDF"
          >
            <Download size={17} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(nota)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Editar"
          >
            <Edit2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(nota.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            title="Eliminar"
          >
            <Trash2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="p-5 border-t border-gray-100 bg-white space-y-4 text-xs">
          {isEliseosSheet ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bloque 1: Socio y Emergencia */}
              <div className="bg-gray-50/70 p-3.5 rounded-xl space-y-1.5 border border-gray-100">
                <p className="font-bold text-gray-900 uppercase text-[11px] mb-1 text-slate-700">
                  Socio & Emergencia
                </p>
                <p><span className="text-gray-500">Nombre:</span> {datosSocio.nombreCompleto || nota.nombreCompleto || cliente?.name || '—'}</p>
                <p><span className="text-gray-500">Correo:</span> {datosSocio.correo || nota.correo || '—'}</p>
                <p><span className="text-gray-500">Celular:</span> {datosSocio.celular || nota.celular || '—'}</p>
                <p><span className="text-gray-500">Contacto Emergencia:</span> {nota.contactoEmergencia || '—'}</p>
                <p><span className="text-gray-500">Tel/Dir Emergencia:</span> {nota.telefonoDireccion || '—'}</p>
              </div>

              {/* Bloque 2: Objetivos y Salud */}
              <div className="bg-gray-50/70 p-3.5 rounded-xl space-y-1.5 border border-gray-100">
                <p className="font-bold text-gray-900 uppercase text-[11px] mb-1 text-slate-700">
                  Objetivos & Salud
                </p>
                <p><span className="text-gray-500">Objetivo:</span> {objetivos.objetivoAsistir || nota.objetivoAsistir || '—'}</p>
                <p><span className="text-gray-500">Competencia:</span> {objetivos.equipoCompetencia || nota.equipoCompetencia || '—'}</p>
                <p><span className="text-gray-500">Peso:</span> {datosClinicos.peso || nota.peso || '—'}</p>
                <p><span className="text-gray-500">Lesiones:</span> {datosClinicos.lesiones || nota.lesiones || '—'}</p>
                <p><span className="text-gray-500">Cardíacos:</span> {datosClinicos.problemasCardiacos || nota.problemasCardiacos || '—'}</p>
              </div>

              {/* Bloque 3: Estado de Firmas */}
              <div className="bg-gray-50/70 p-3.5 rounded-xl space-y-2 border border-gray-100 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-gray-900 uppercase text-[11px] mb-1 text-slate-700">
                    Firmas Registradas
                  </p>
                  <p className="flex items-center gap-1.5">
                    {hasPrestadorFirma ? (
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={13} className="text-gray-400" />
                    )}
                    <span className="text-gray-600">Prestador:</span> {firmas.prestadorNombre || nota.prestadorNombre || '—'}
                  </p>
                  <p className="flex items-center gap-1.5 mt-1">
                    {hasSocioFirma ? (
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={13} className="text-gray-400" />
                    )}
                    <span className="text-gray-600">Socio:</span> {firmas.socioNombre || nota.socioNombre || '—'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onView(nota)}
                  className="w-full mt-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye size={13} />
                  Ver Hoja Completa
                </button>
              </div>
            </div>
          ) : (
            // Formato histórico SOAP
            <div className="space-y-3">
              {nota.subjetivo && (
                <div>
                  <p className="font-bold uppercase text-gray-500 text-[10px]">Subjetivo</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{nota.subjetivo}</p>
                </div>
              )}
              {nota.objetivo && (
                <div>
                  <p className="font-bold uppercase text-gray-500 text-[10px]">Objetivo</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{nota.objetivo}</p>
                </div>
              )}
              {nota.evaluacion && (
                <div>
                  <p className="font-bold uppercase text-gray-500 text-[10px]">Evaluación</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{nota.evaluacion}</p>
                </div>
              )}
              {nota.planTerapeutico && (
                <div>
                  <p className="font-bold uppercase text-gray-500 text-[10px]">Plan Terapéutico</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{nota.planTerapeutico}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
