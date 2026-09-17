import React, { useState } from 'react';
import { X, Download, Printer, CheckCircle, FileText, Calendar, PenTool } from 'lucide-react';
import { generarHojaClinicaEliseosPDF } from '../../utils/eliseosHojaClinicaPdfGenerator';
import { ELISEOS_INFO, TERMINOS_LEGALES } from './constants/legalTexts';

export default function HojaClinicaViewerModal({
  isOpen,
  onClose,
  nota,
  cliente
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !nota) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generarHojaClinicaEliseosPDF(nota, cliente);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const datosSocio = nota.datosSocio || {};
  const nombreSocio = datosSocio.nombreCompleto || nota.nombreCompleto || cliente?.name || '';
  const correoSocio = datosSocio.correo || nota.correo || cliente?.email || '';
  const fechaNacSocio = datosSocio.fechaNacimiento || nota.fechaNacimiento || '';
  const celularSocio = datosSocio.celular || nota.celular || cliente?.telefono || '';

  const objetivos = nota.objetivos || {};
  const datosClinicos = nota.datosClinicos || {};
  const firmas = nota.firmas || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-4 flex flex-col max-h-[94vh] overflow-hidden border border-gray-200">
        {/* Barra superior de control */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-400/20 text-lime-400 flex items-center justify-center border border-lime-400/30">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hoja Clínica Socios — Documento Oficial
              </h3>
              <p className="text-[11px] text-slate-400">
                Paquete: <span className="text-lime-300 font-bold">{nota.paquete || 'General'}</span> • Fecha: {nota.fechaContratacion || nota.fecha}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase"
              title="Imprimir"
            >
              <Printer size={15} />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={14} />
              {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Vista previa del documento formal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 space-y-8 print:p-0 print:bg-white">
          {/* PÁGINA 1 EN FORMATO HOJA BLANCA */}
          <div className="bg-white max-w-3xl mx-auto rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-6">
            {/* Header con logo y título */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 gap-4">
              <img
                src="/img/eliseos/LOGO COLOR.png"
                alt="Eliseos Box & Fitness"
                className="h-16 w-auto object-contain"
              />
              <div className="text-center sm:text-right">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  HOJA CLÍNICA SOCIOS
                </h2>
                <p className="text-xs font-semibold text-lime-700 tracking-wider">
                  ELISEOS BOX & FITNESS
                </p>
              </div>
            </div>

            {/* Domicilio y Términos */}
            <p className="text-xs text-slate-700 leading-relaxed text-justify bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {ELISEOS_INFO.encabezadoTerminos(nota.paquete)}
            </p>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-800 border-b pb-3">
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Fecha Contratación</span>
                {nota.fechaContratacion || nota.fecha || '—'}
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Fecha Pago</span>
                {nota.fechaPago || '—'}
              </div>
            </div>

            {/* Tabla Estructurada */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              {/* DATOS SOCIO */}
              <div className="bg-slate-800 text-white font-black uppercase text-center py-2 tracking-wider text-[11px]">
                DATOS SOCIO
              </div>
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">NOMBRE COMPLETO</span>
                  <span className="col-span-2 text-slate-900 font-medium">{nombreSocio || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">CORREO</span>
                  <span className="col-span-2 text-slate-900 font-medium">{correoSocio || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">FECHA NACIMIENTO</span>
                  <span className="col-span-2 text-slate-900 font-medium">{fechaNacSocio || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">CELULAR</span>
                  <span className="col-span-2 text-slate-900 font-medium">{celularSocio || '—'}</span>
                </div>
              </div>

              {/* EN CASO DE EMERGENCIA */}
              <div className="bg-slate-800 text-white font-black uppercase text-center py-2 tracking-wider text-[11px]">
                EN CASO DE EMERGENCIA
              </div>
              <div className="bg-slate-50 text-[11px] text-slate-500 italic text-center py-1 border-b border-slate-200">
                En este apartado favor de colocar algún contacto familiar o amistad cercana
              </div>
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">Contacto en caso emergencia</span>
                  <span className="col-span-2 text-slate-900 font-medium">{nota.contactoEmergencia || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">Teléfono y dirección</span>
                  <span className="col-span-2 text-slate-900 font-medium">{nota.telefonoDireccion || '—'}</span>
                </div>
              </div>

              {/* OBJETIVOS */}
              <div className="bg-slate-800 text-white font-black uppercase text-center py-2 tracking-wider text-[11px]">
                OBJETIVOS
              </div>
              <div className="bg-slate-50 text-[11px] text-slate-500 italic text-center py-1 border-b border-slate-200">
                Aquí especifica que te gustaría obtener e ELISEOS al entrenar con nosotros
              </div>
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">¿Cuál es tu objetivo de asistir?</span>
                  <span className="col-span-2 text-slate-900 font-medium">{objetivos.objetivoAsistir || nota.objetivoAsistir || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">¿Te gustaría formar parte del equipo de competencia?</span>
                  <span className="col-span-2 text-slate-900 font-medium">{objetivos.equipoCompetencia || nota.equipoCompetencia || '—'}</span>
                </div>
              </div>

              {/* DATOS CLÍNICOS */}
              <div className="bg-slate-800 text-white font-black uppercase text-center py-2 tracking-wider text-[11px]">
                DATOS CLINICOS
              </div>
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">PESO:</span>
                  <span className="col-span-2 text-slate-900 font-medium">{datosClinicos.peso || nota.peso || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">LESIONES:</span>
                  <span className="col-span-2 text-slate-900 font-medium">{datosClinicos.lesiones || nota.lesiones || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">SUFRE PROBLEMAS CARDIACOS?</span>
                  <span className="col-span-2 text-slate-900 font-medium">{datosClinicos.problemasCardiacos || nota.problemasCardiacos || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-700">¿COMO SE ENTERO DE NOSOTROS?</span>
                  <span className="col-span-2 text-slate-900 font-medium">{datosClinicos.comoSeEntero || nota.comoSeEntero || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PÁGINA 2 EN FORMATO HOJA BLANCA */}
          <div className="bg-white max-w-3xl mx-auto rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <img
                src="/img/eliseos/LOGO COLOR.png"
                alt="Eliseos Box & Fitness"
                className="h-12 w-auto object-contain"
              />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                PÁGINA 2 — TÉRMINOS Y FIRMAS
              </span>
            </div>

            <div className="text-xs space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 uppercase">OBLIGACIONES DE LAS PARTES</h4>
                <p className="font-semibold text-slate-800 mt-1">1. Obligaciones de EL PRESTADOR:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                  {TERMINOS_LEGALES.obligacionesPrestador.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
                <p className="font-semibold text-slate-800 mt-2">2. Obligaciones de EL SOCIO:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                  {TERMINOS_LEGALES.obligacionesSocio.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase">POLÍTICA DE CANCELACIÓN Y CONGELACIÓN</h4>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                  {TERMINOS_LEGALES.politicasCancelacion.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase">EXCLUSIÓN DE RESPONSABILIDAD</h4>
                <p className="text-slate-600">{TERMINOS_LEGALES.exclusionResponsabilidad}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase">CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS</h4>
                <p className="text-slate-600">{TERMINOS_LEGALES.confidencialidad}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase">ACEPTACIÓN</h4>
                <p className="text-slate-600 font-medium">{TERMINOS_LEGALES.aceptacion}</p>
              </div>
            </div>

            {/* SECCIÓN DE FIRMAS ESTAMPADAS */}
            <div className="border-t pt-6">
              <h4 className="font-black text-sm uppercase text-slate-900 mb-4">Firmas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* PRESTADOR */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-xs space-y-2">
                  <p className="font-black uppercase tracking-wider text-slate-800">
                    EL PRESTADOR / RECEPCIONISTA
                  </p>
                  <p><span className="font-bold text-slate-600">Nombre:</span> {firmas.prestadorNombre || nota.prestadorNombre || '—'}</p>
                  <div className="h-20 bg-white border rounded-xl flex items-center justify-center p-1">
                    {firmas.prestadorFirma || nota.prestadorFirma ? (
                      <img
                        src={firmas.prestadorFirma || nota.prestadorFirma}
                        alt="Firma Prestador"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Sin firma</span>
                    )}
                  </div>
                  <p><span className="font-bold text-slate-600">Fecha:</span> {firmas.prestadorFecha || nota.prestadorFecha || '—'}</p>
                </div>

                {/* SOCIO */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-xs space-y-2">
                  <p className="font-black uppercase tracking-wider text-slate-800">
                    EL SOCIO
                  </p>
                  <p><span className="font-bold text-slate-600">Nombre:</span> {firmas.socioNombre || nota.socioNombre || nombreSocio || '—'}</p>
                  <div className="h-20 bg-white border rounded-xl flex items-center justify-center p-1">
                    {firmas.socioFirma || nota.socioFirma ? (
                      <img
                        src={firmas.socioFirma || nota.socioFirma}
                        alt="Firma Socio"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Sin firma</span>
                    )}
                  </div>
                  <p><span className="font-bold text-slate-600">Fecha:</span> {firmas.socioFecha || nota.socioFecha || '—'}</p>
                </div>
              </div>

              <div className="text-center pt-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                Atentamente: <span className="text-slate-900 font-black">ELISEOS BOX & FITNESS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
