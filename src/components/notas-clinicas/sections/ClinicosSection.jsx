import React from 'react';
import { Activity, Scale, Heart, HelpCircle } from 'lucide-react';

export default function ClinicosSection({
  peso = '',
  lesiones = '',
  problemasCardiacos = '',
  comoSeEntero = '',
  onChange,
  readOnly = false
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <Activity size={16} className="text-lime-600" />
          Datos Clínicos
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Información de salud requerida para la práctica deportiva segura
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Scale size={13} className="text-gray-400" />
            Peso <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="peso"
            value={peso}
            onChange={(e) => onChange('peso', e.target.value)}
            disabled={readOnly}
            placeholder="Ej: 72 kg"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <HelpCircle size={13} className="text-gray-400" />
            ¿Cómo se enteró de nosotros?
          </label>
          <input
            type="text"
            name="comoSeEntero"
            value={comoSeEntero}
            onChange={(e) => onChange('comoSeEntero', e.target.value)}
            disabled={readOnly}
            placeholder="Ej: Redes sociales, recomendación, pasaba por aquí..."
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Activity size={13} className="text-gray-400" />
            Lesiones <span className="text-red-500">*</span>
          </label>
          <textarea
            name="lesiones"
            value={lesiones}
            onChange={(e) => onChange('lesiones', e.target.value)}
            disabled={readOnly}
            rows={2}
            placeholder="Indica si tienes o has tenido alguna lesión previa, cirugía o limitación física (o escribe 'Ninguna')..."
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 resize-none disabled:bg-gray-100"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Heart size={13} className="text-red-500" />
            ¿Sufre problemas cardíacos? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="problemasCardiacos"
            value={problemasCardiacos}
            onChange={(e) => onChange('problemasCardiacos', e.target.value)}
            disabled={readOnly}
            placeholder="Ej: No / Hipertensión controlada / Especifique..."
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>
      </div>
    </div>
  );
}
