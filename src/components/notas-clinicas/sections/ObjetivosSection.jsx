import React from 'react';
import { Target, Trophy } from 'lucide-react';

export default function ObjetivosSection({
  objetivoAsistir = '',
  equipoCompetencia = '',
  onChange,
  readOnly = false
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <Target size={16} className="text-lime-600" />
          Objetivos
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Aquí especifica que te gustaría obtener en ELISEOS al entrenar con nosotros
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 block">
            ¿Cuál es tu objetivo de asistir? <span className="text-red-500">*</span>
          </label>
          <textarea
            name="objetivoAsistir"
            value={objetivoAsistir}
            onChange={(e) => onChange('objetivoAsistir', e.target.value)}
            disabled={readOnly}
            rows={2}
            placeholder="Ej: Acondicionamiento físico, aprender boxeo, pérdida de peso, salud..."
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 resize-none disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Trophy size={13} className="text-lime-600" />
            ¿Te gustaría formar parte del equipo de competencia?
          </label>
          <input
            type="text"
            name="equipoCompetencia"
            value={equipoCompetencia}
            onChange={(e) => onChange('equipoCompetencia', e.target.value)}
            disabled={readOnly}
            placeholder="Ej: Sí / No / Más adelante"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}
