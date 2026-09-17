import React from 'react';
import { User, Mail, Calendar, Phone } from 'lucide-react';

export default function DatosSocioSection({
  nombreCompleto = '',
  correo = '',
  fechaNacimiento = '',
  celular = '',
  onChange,
  readOnly = false
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <User size={16} className="text-lime-600" />
          Datos del Socio
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Datos cargados desde el perfil del cliente (editables para esta hoja clínica)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <User size={13} className="text-gray-400" />
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nombreCompleto"
            value={nombreCompleto}
            onChange={(e) => onChange('nombreCompleto', e.target.value)}
            disabled={readOnly}
            placeholder="Nombre y apellidos"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Mail size={13} className="text-gray-400" />
            Correo <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="correo"
            value={correo}
            onChange={(e) => onChange('correo', e.target.value)}
            disabled={readOnly}
            placeholder="correo@ejemplo.com"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            Fecha Nacimiento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="fechaNacimiento"
            value={fechaNacimiento}
            onChange={(e) => onChange('fechaNacimiento', e.target.value)}
            disabled={readOnly}
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Phone size={13} className="text-gray-400" />
            Celular <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="celular"
            value={celular}
            onChange={(e) => onChange('celular', e.target.value)}
            disabled={readOnly}
            placeholder="10 dígitos"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all font-medium text-gray-900 disabled:bg-gray-100"
            required
          />
        </div>
      </div>
    </div>
  );
}
