import React from 'react';
import { ShieldCheck, FileCheck, AlertTriangle, Lock } from 'lucide-react';
import { TERMINOS_LEGALES } from '../constants/legalTexts';

export default function TerminosSection({
  aceptado = false,
  onToggleAceptacion,
  readOnly = false
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <ShieldCheck size={16} className="text-lime-600" />
          Obligaciones y Términos Legales
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Términos y condiciones contractuales de ELISEOS BOX & FITNESS
        </p>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200 leading-relaxed">
        {/* Obligaciones del prestador */}
        <div>
          <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <FileCheck size={13} className="text-lime-600" />
            1. Obligaciones de EL PRESTADOR:
          </h5>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {TERMINOS_LEGALES.obligacionesPrestador.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Obligaciones del socio */}
        <div>
          <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <FileCheck size={13} className="text-lime-600" />
            2. Obligaciones de EL SOCIO:
          </h5>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {TERMINOS_LEGALES.obligacionesSocio.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Cancelación y congelación */}
        <div>
          <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500" />
            POLÍTICA DE CANCELACIÓN Y CONGELACIÓN
          </h5>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {TERMINOS_LEGALES.politicasCancelacion.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Exclusión de responsabilidad */}
        <div>
          <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5">
            EXCLUSIÓN DE RESPONSABILIDAD
          </h5>
          <p className="text-gray-600">{TERMINOS_LEGALES.exclusionResponsabilidad}</p>
        </div>

        {/* Confidencialidad */}
        <div>
          <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <Lock size={13} className="text-gray-500" />
            CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
          </h5>
          <p className="text-gray-600">{TERMINOS_LEGALES.confidencialidad}</p>
        </div>

        {/* Aceptación */}
        <div className="pt-1 border-t border-gray-200">
          <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1">
            ACEPTACIÓN
          </h5>
          <p className="text-gray-700 font-medium">{TERMINOS_LEGALES.aceptacion}</p>
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={aceptado}
            onChange={(e) => onToggleAceptacion?.(e.target.checked)}
            disabled={readOnly}
            className="mt-0.5 w-4 h-4 text-lime-600 rounded border-gray-300 focus:ring-lime-500"
            required
          />
          <span className="text-xs font-semibold text-gray-800">
            Declaro haber leído, entendido y aceptado todos los términos, condiciones y obligaciones estipuladas en el presente documento de ELISEOS BOX & FITNESS.
          </span>
        </label>
      </div>
    </div>
  );
}
