import React from 'react';
import { Package, Calendar } from 'lucide-react';
import { ELISEOS_INFO } from '../constants/legalTexts';

export default function ContratacionSection({
  paquete = '',
  fechaContratacion = '',
  fechaPago = '',
  onChange,
  readOnly = false
}) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
        <p className="font-semibold text-slate-900 mb-1">Términos del Establecimiento</p>
        <p>{ELISEOS_INFO.encabezadoTerminos(paquete)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Package size={14} className="text-lime-600" />
            Paquete <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="paquete"
            value={paquete}
            onChange={(e) => onChange('paquete', e.target.value)}
            disabled={readOnly}
            placeholder="Ej: Mensualidad Box, Trimestral..."
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Calendar size={14} className="text-lime-600" />
            Fecha Contratación <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="fechaContratacion"
            value={fechaContratacion}
            onChange={(e) => onChange('fechaContratacion', e.target.value)}
            disabled={readOnly}
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Calendar size={14} className="text-lime-600" />
            Fecha Pago <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="fechaPago"
            value={fechaPago}
            onChange={(e) => onChange('fechaPago', e.target.value)}
            disabled={readOnly}
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
            required
          />
        </div>
      </div>
    </div>
  );
}
