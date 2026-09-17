import React from 'react';
import { PenTool, Calendar, UserCheck } from 'lucide-react';
import SignaturePad from '../SignaturePad';

export default function FirmasSection({
  prestadorNombre = '',
  prestadorFirma = '',
  prestadorFecha = '',
  socioNombre = '',
  socioFirma = '',
  socioFecha = '',
  onChange,
  readOnly = false
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <PenTool size={16} className="text-lime-600" />
          Firmas de Conformidad
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Firma digital en duplicado para constancia legal entre ambas partes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOQUE 1: PRESTADOR / RECEPCIONISTA */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-3.5">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
            <UserCheck size={15} className="text-gray-600" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-800">
              EL PRESTADOR / RECEPCIONISTA
            </span>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 block">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="prestadorNombre"
              value={prestadorNombre}
              onChange={(e) => onChange('prestadorNombre', e.target.value)}
              disabled={readOnly}
              placeholder="Nombre de quien recibe"
              className="w-full px-3.5 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 font-medium disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <SignaturePad
              label="Firma de Recepción"
              value={prestadorFirma}
              onChange={(dataUrl) => onChange('prestadorFirma', dataUrl)}
              readOnly={readOnly}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-gray-400" />
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="prestadorFecha"
              value={prestadorFecha}
              onChange={(e) => onChange('prestadorFecha', e.target.value)}
              disabled={readOnly}
              className="w-full px-3.5 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 font-medium disabled:bg-gray-100"
              required
            />
          </div>
        </div>

        {/* BLOQUE 2: EL SOCIO */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-3.5">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
            <UserCheck size={15} className="text-lime-600" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-800">
              EL SOCIO
            </span>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 block">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="socioNombre"
              value={socioNombre}
              onChange={(e) => onChange('socioNombre', e.target.value)}
              disabled={readOnly}
              placeholder="Nombre completo del socio"
              className="w-full px-3.5 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 font-medium disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <SignaturePad
              label="Firma del Socio"
              value={socioFirma}
              onChange={(dataUrl) => onChange('socioFirma', dataUrl)}
              readOnly={readOnly}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-gray-400" />
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="socioFecha"
              value={socioFecha}
              onChange={(e) => onChange('socioFecha', e.target.value)}
              disabled={readOnly}
              className="w-full px-3.5 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 font-medium disabled:bg-gray-100"
              required
            />
          </div>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Atentamente: <span className="text-gray-900 font-black">ELISEOS BOX & FITNESS</span>
        </p>
      </div>
    </div>
  );
}
