import React from 'react';
import { AlertCircle, UserCheck, PhoneCall } from 'lucide-react';

export default function EmergenciaSection({
  contactoEmergencia = '',
  telefonoDireccion = '',
  onChange,
  readOnly = false
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" />
          En Caso de Emergencia
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          En este apartado favor de colocar algún contacto familiar o amistad cercana
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <UserCheck size={13} className="text-gray-400" />
            Contacto en caso de emergencia <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contactoEmergencia"
            value={contactoEmergencia}
            onChange={(e) => onChange('contactoEmergencia', e.target.value)}
            disabled={readOnly}
            placeholder="Nombre completo del contacto"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <PhoneCall size={13} className="text-gray-400" />
            Teléfono y Dirección <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="telefonoDireccion"
            value={telefonoDireccion}
            onChange={(e) => onChange('telefonoDireccion', e.target.value)}
            disabled={readOnly}
            placeholder="Teléfono y dirección del contacto"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>
      </div>
    </div>
  );
}
