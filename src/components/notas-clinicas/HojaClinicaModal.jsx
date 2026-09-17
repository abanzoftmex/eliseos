import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ArrowRight, ArrowLeft, CheckCircle2, FileText, User, Activity, PenTool } from 'lucide-react';
import ContratacionSection from './sections/ContratacionSection';
import DatosSocioSection from './sections/DatosSocioSection';
import EmergenciaSection from './sections/EmergenciaSection';
import ObjetivosSection from './sections/ObjetivosSection';
import ClinicosSection from './sections/ClinicosSection';
import TerminosSection from './sections/TerminosSection';
import FirmasSection from './sections/FirmasSection';

const TABS = [
  { id: 'socio', label: '1. Contratación y Socio', icon: User },
  { id: 'clinicos', label: '2. Objetivos y Salud', icon: Activity },
  { id: 'firmas', label: '3. Términos y Firmas', icon: PenTool }
];

export default function HojaClinicaModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing = false,
  initialData = null,
  cliente = null,
  isSaving = false
}) {
  const [activeTab, setActiveTab] = useState('socio');
  const [formData, setFormData] = useState(getInitialState(cliente, initialData));
  const [formError, setFormError] = useState('');

  // Helper para armar estado inicial
  function getInitialState(clientData, existingNota) {
    const today = new Date().toISOString().split('T')[0];

    if (existingNota) {
      return {
        tipoNota: 'hoja_clinica_eliseos',
        paquete: existingNota.paquete || existingNota.plan || '',
        fechaContratacion: existingNota.fechaContratacion || existingNota.fecha || today,
        fechaPago: existingNota.fechaPago || today,
        nombreCompleto: existingNota.nombreCompleto || existingNota.datosSocio?.nombreCompleto || '',
        correo: existingNota.correo || existingNota.datosSocio?.correo || '',
        fechaNacimiento: existingNota.fechaNacimiento || existingNota.datosSocio?.fechaNacimiento || '',
        celular: existingNota.celular || existingNota.datosSocio?.celular || '',
        contactoEmergencia: existingNota.contactoEmergencia || existingNota.contactoEnCasoEmergencia || '',
        telefonoDireccion: existingNota.telefonoDireccion || existingNota.telefonoYDireccion || '',
        objetivoAsistir: existingNota.objetivoAsistir || existingNota.objetivos?.objetivoAsistir || '',
        equipoCompetencia: existingNota.equipoCompetencia || existingNota.objetivos?.equipoCompetencia || '',
        peso: existingNota.peso || existingNota.datosClinicos?.peso || '',
        lesiones: existingNota.lesiones || existingNota.datosClinicos?.lesiones || '',
        problemasCardiacos: existingNota.problemasCardiacos || existingNota.datosClinicos?.problemasCardiacos || '',
        comoSeEntero: existingNota.comoSeEntero || existingNota.datosClinicos?.comoSeEntero || '',
        aceptadoTerminos: existingNota.aceptadoTerminos ?? true,
        prestadorNombre: existingNota.prestadorNombre || existingNota.firmas?.prestadorNombre || 'Recepción Eliseos',
        prestadorFirma: existingNota.prestadorFirma || existingNota.firmas?.prestadorFirma || '',
        prestadorFecha: existingNota.prestadorFecha || existingNota.firmas?.prestadorFecha || today,
        socioNombre: existingNota.socioNombre || existingNota.firmas?.socioNombre || '',
        socioFirma: existingNota.socioFirma || existingNota.firmas?.socioFirma || '',
        socioFecha: existingNota.socioFecha || existingNota.firmas?.socioFecha || today
      };
    }

    // Prefill desde cliente
    const nombreCompleto = clientData
      ? `${clientData.nombre || ''} ${clientData.apellidoPaterno || ''} ${clientData.apellidoMaterno || ''}`.trim()
      : '';

    return {
      tipoNota: 'hoja_clinica_eliseos',
      paquete: '',
      fechaContratacion: today,
      fechaPago: today,
      nombreCompleto: nombreCompleto,
      correo: clientData?.email || '',
      fechaNacimiento: clientData?.fechaNacimiento || '',
      celular: clientData?.telefonoContacto || clientData?.telefono || '',
      contactoEmergencia: clientData?.nombreContactoEmergencia || '',
      telefonoDireccion: clientData?.telefonoEmergencia || '',
      objetivoAsistir: '',
      equipoCompetencia: '',
      peso: '',
      lesiones: 'Ninguna',
      problemasCardiacos: 'No',
      comoSeEntero: '',
      aceptadoTerminos: false,
      prestadorNombre: 'Recepción Eliseos',
      prestadorFirma: '',
      prestadorFecha: today,
      socioNombre: nombreCompleto,
      socioFirma: '',
      socioFecha: today
    };
  }

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState(cliente, initialData));
      setActiveTab('socio');
      setFormError('');
    }
  }, [isOpen, initialData, cliente]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Si cambia el nombre del socio, sincronizar automáticamente el nombre en la firma del socio si está vacío o igual al anterior
    if (field === 'nombreCompleto' && (!formData.socioNombre || formData.socioNombre === formData.nombreCompleto)) {
      setFormData((prev) => ({ ...prev, socioNombre: value }));
    }
  };

  const validateStep = (tabId) => {
    if (tabId === 'socio') {
      if (!formData.paquete.trim()) return 'El campo Paquete es obligatorio';
      if (!formData.fechaContratacion) return 'La Fecha de Contratación es obligatoria';
      if (!formData.fechaPago) return 'La Fecha de Pago es obligatoria';
      if (!formData.nombreCompleto.trim()) return 'El Nombre del Socio es obligatorio';
      if (!formData.correo.trim()) return 'El Correo es obligatorio';
      if (!formData.celular.trim()) return 'El Celular es obligatorio';
      if (!formData.contactoEmergencia.trim()) return 'El Contacto de Emergencia es obligatorio';
      if (!formData.telefonoDireccion.trim()) return 'El Teléfono y Dirección de Emergencia es obligatorio';
    }
    if (tabId === 'clinicos') {
      if (!formData.objetivoAsistir.trim()) return 'El Objetivo de Asistir es obligatorio';
      if (!formData.peso.trim()) return 'El Peso es obligatorio';
      if (!formData.lesiones.trim()) return 'El campo Lesiones es obligatorio (escribe "Ninguna" si aplica)';
      if (!formData.problemasCardiacos.trim()) return 'El campo Problemas Cardíacos es obligatorio';
    }
    if (tabId === 'firmas') {
      if (!formData.aceptadoTerminos) return 'Debes marcar la casilla de aceptación de términos y condiciones';
      if (!formData.prestadorNombre.trim()) return 'El Nombre del Prestador / Recepcionista es obligatorio';
      if (!formData.socioNombre.trim()) return 'El Nombre del Socio en firmas es obligatorio';
    }
    return '';
  };

  const handleNextTab = () => {
    const error = validateStep(activeTab);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError('');
    if (activeTab === 'socio') setActiveTab('clinicos');
    else if (activeTab === 'clinicos') setActiveTab('firmas');
  };

  const handlePrevTab = () => {
    setFormError('');
    if (activeTab === 'firmas') setActiveTab('clinicos');
    else if (activeTab === 'clinicos') setActiveTab('socio');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validar todos los pasos
    for (const tab of ['socio', 'clinicos', 'firmas']) {
      const error = validateStep(tab);
      if (error) {
        setActiveTab(tab);
        setFormError(error);
        return;
      }
    }

    // Armar payload estructurado para guardar en Firestore
    const payload = {
      tipoNota: 'hoja_clinica_eliseos',
      paquete: formData.paquete.trim(),
      fecha: formData.fechaContratacion,
      fechaContratacion: formData.fechaContratacion,
      fechaPago: formData.fechaPago,
      // Datos del socio (snapshot)
      datosSocio: {
        nombreCompleto: formData.nombreCompleto.trim(),
        correo: formData.correo.trim(),
        fechaNacimiento: formData.fechaNacimiento || '',
        celular: formData.celular.trim()
      },
      // Emergencia
      contactoEmergencia: formData.contactoEmergencia.trim(),
      telefonoDireccion: formData.telefonoDireccion.trim(),
      // Objetivos
      objetivos: {
        objetivoAsistir: formData.objetivoAsistir.trim(),
        equipoCompetencia: formData.equipoCompetencia.trim()
      },
      // Datos clínicos
      datosClinicos: {
        peso: formData.peso.trim(),
        lesiones: formData.lesiones.trim(),
        problemasCardiacos: formData.problemasCardiacos.trim(),
        comoSeEntero: formData.comoSeEntero.trim()
      },
      // Términos
      aceptadoTerminos: formData.aceptadoTerminos,
      // Firmas
      firmas: {
        prestadorNombre: formData.prestadorNombre.trim(),
        prestadorFirma: formData.prestadorFirma || '',
        prestadorFecha: formData.prestadorFecha,
        socioNombre: formData.socioNombre.trim(),
        socioFirma: formData.socioFirma || '',
        socioFecha: formData.socioFecha
      }
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
        {/* Header con identidad de Eliseos */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-lime-400/20 rounded-2xl flex items-center justify-center border border-lime-400/40">
              <FileText className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white uppercase">
                  Hoja Clínica Socios
                </h3>
                <span className="bg-lime-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ELÍSEOS
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {isEditing ? 'Edición de Hoja Clínica y Contrato' : 'Registro oficial de socio y cuestionario de salud'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-slate-100/80 px-6 py-2.5 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFormError('');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-gray-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-lime-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mensaje de error si falta algún campo */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-between">
            <span>{formError}</span>
            <button type="button" onClick={() => setFormError('')} className="text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'socio' && (
            <div className="space-y-6 animate-fade-in">
              <ContratacionSection
                paquete={formData.paquete}
                fechaContratacion={formData.fechaContratacion}
                fechaPago={formData.fechaPago}
                onChange={handleChange}
              />
              <DatosSocioSection
                nombreCompleto={formData.nombreCompleto}
                correo={formData.correo}
                fechaNacimiento={formData.fechaNacimiento}
                celular={formData.celular}
                onChange={handleChange}
              />
              <EmergenciaSection
                contactoEmergencia={formData.contactoEmergencia}
                telefonoDireccion={formData.telefonoDireccion}
                onChange={handleChange}
              />
            </div>
          )}

          {activeTab === 'clinicos' && (
            <div className="space-y-6 animate-fade-in">
              <ObjetivosSection
                objetivoAsistir={formData.objetivoAsistir}
                equipoCompetencia={formData.equipoCompetencia}
                onChange={handleChange}
              />
              <ClinicosSection
                peso={formData.peso}
                lesiones={formData.lesiones}
                problemasCardiacos={formData.problemasCardiacos}
                comoSeEntero={formData.comoSeEntero}
                onChange={handleChange}
              />
            </div>
          )}

          {activeTab === 'firmas' && (
            <div className="space-y-6 animate-fade-in">
              <TerminosSection
                aceptado={formData.aceptadoTerminos}
                onToggleAceptacion={(val) => handleChange('aceptadoTerminos', val)}
              />
              <FirmasSection
                prestadorNombre={formData.prestadorNombre}
                prestadorFirma={formData.prestadorFirma}
                prestadorFecha={formData.prestadorFecha}
                socioNombre={formData.socioNombre}
                socioFirma={formData.socioFirma}
                socioFecha={formData.socioFecha}
                onChange={handleChange}
              />
            </div>
          )}
        </form>

        {/* Footer con acciones */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <div>
            {activeTab !== 'socio' && (
              <button
                type="button"
                onClick={handlePrevTab}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Anterior
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>

            {activeTab !== 'firmas' ? (
              <button
                type="button"
                onClick={handleNextTab}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 bg-lime-400 hover:bg-lime-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                Siguiente
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 bg-lime-400 hover:bg-lime-500 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    {isEditing ? 'Actualizar Hoja Clínica' : 'Guardar Hoja Clínica'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
