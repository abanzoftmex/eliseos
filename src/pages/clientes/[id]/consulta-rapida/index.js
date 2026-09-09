import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FileText, Save, Download, Calendar, User, Stethoscope, AlertCircle, CheckCircle, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { generateConsultaRapidaPDF } from '../../../../utils/pdfGenerator';

export default function ConsultaRapidaPage() {
    const router = useRouter();
    const { id } = router.query;

    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Helper function to get local date in YYYY-MM-DD format
    const getLocalDateString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        fechaEvaluacion: getLocalDateString(),
        numeroExpediente: '',
        datosPersonales: {
            nombre: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            edad: '',
            fechaNacimiento: '',
            genero: '',
            ladoDominante: '',
            ocupacion: '',
            contacto: '',
            contactoEmergencia: '',
        },
        motivoConsulta: {
            enfermedad: false,
            accidente: false,
            urgencia: false,
            segundaOpinion: false,
        },
        tipoPadecimiento: {
            congenito: false,
            adquirido: false,
            agudo: false,
            cronico: false,
            fechaPadecimiento: '',
            fechaDx: '',
        },
        descripcion: '',
        antecedentes: '',
        exploracionFisica: '',
        diagnosticoMedico: '',
    });

    // Cargar datos del cliente y consulta existente (si aplica)
    useEffect(() => {
        const loadData = async () => {
            if (!id) return;

            try {
                // Cargar datos del cliente
                const clienteRef = doc(db, 'clientes', id);
                const clienteSnap = await getDoc(clienteRef);

                if (clienteSnap.exists()) {
                    const clienteData = { id: clienteSnap.id, ...clienteSnap.data() };
                    setCliente(clienteData);

                    // Pre-llenar datos personales del cliente
                    setFormData(prev => ({
                        ...prev,
                        numeroExpediente: clienteData.numeroExpediente || '',
                        datosPersonales: {
                            nombre: clienteData.nombre || '',
                            apellidoPaterno: clienteData.apellidoPaterno || '',
                            apellidoMaterno: clienteData.apellidoMaterno || '',
                            edad: clienteData.edad || '',
                            fechaNacimiento: clienteData.fechaNacimiento || '',
                            genero: clienteData.genero || '',
                            ladoDominante: clienteData.ladoDominante || '',
                            ocupacion: clienteData.ocupacion || '',
                            contacto: clienteData.telefonoContacto || '',
                            contactoEmergencia: clienteData.contactoEmergencia || '',
                        },
                    }));
                }

                // Si hay consultaId en la URL, cargar esa consulta
                const { consultaId } = router.query;
                if (consultaId) {
                    console.log('🔍 Cargando consulta rápida:', consultaId);
                    const response = await fetch(`/api/clientes/${id}/consulta-rapida`);
                    const result = await response.json();

                    if (result.success && result.consultas) {
                        const consulta = result.consultas.find(c => c.id === consultaId);
                        if (consulta) {
                            console.log('✅ Consulta encontrada:', consulta);
                            // Cargar los datos de la consulta en el formulario
                            setFormData({
                                fechaEvaluacion: consulta.fechaEvaluacion || getLocalDateString(),
                                numeroExpediente: consulta.numeroExpediente || '',
                                datosPersonales: consulta.datosPersonales || formData.datosPersonales,
                                motivoConsulta: consulta.motivoConsulta || formData.motivoConsulta,
                                tipoPadecimiento: consulta.tipoPadecimiento || formData.tipoPadecimiento,
                                descripcion: consulta.descripcion || '',
                                antecedentes: consulta.antecedentes || '',
                                exploracionFisica: consulta.exploracionFisica || '',
                                diagnosticoMedico: consulta.diagnosticoMedico || '',
                            });
                            setMessage({ type: 'info', text: 'Consulta rápida cargada. Puedes editarla y guardar los cambios.' });
                        } else {
                            setMessage({ type: 'error', text: 'No se encontró la consulta rápida' });
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setMessage({ type: 'error', text: 'Error al cargar los datos' });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, router.query.consultaId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleNestedInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const handleCheckboxChange = (section, field) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: !prev[section][field],
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { consultaId } = router.query;
            const isEditing = !!consultaId;

            const response = await fetch(`/api/clientes/${id}/consulta-rapida`, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(isEditing ? { consultaId, ...formData } : formData),
            });

            const result = await response.json();

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: isEditing ? 'Consulta rápida actualizada exitosamente' : 'Consulta rápida guardada exitosamente'
                });
                setTimeout(() => {
                    router.push(`/clientes/${id}`);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: result.error || 'Error al guardar la consulta' });
            }
        } catch (error) {
            console.error('Error saving consulta:', error);
            setMessage({ type: 'error', text: 'Error al guardar la consulta' });
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            // Generar PDF con los datos actuales del formulario
            generateConsultaRapidaPDF(formData, cliente);
            setMessage({ type: 'success', text: 'PDF descargado exitosamente' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setMessage({ type: 'error', text: 'Error al generar el PDF' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!cliente) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">Cliente no encontrado</h1>
                    <button
                        onClick={() => router.push('/clientes')}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                    >
                        Volver a Clientes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mensaje de estado */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl shadow-sm border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                        message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-3" />}
                                {message.type === 'error' && <AlertCircle className="w-5 h-5 mr-3" />}
                                <p className="font-medium">{message.text}</p>
                            </div>
                            <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-500 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                    <FileText className="w-8 h-8 text-cyan-600" />
                                </div>
                                <div className="text-white">
                                    <h1 className="text-3xl font-bold mb-1">Historia Clínica</h1>
                                    <p className="text-cyan-100">Consulta Rápida</p>
                                </div>
                            </div>
                            <div className="text-right text-white">
                                <p className="text-sm text-cyan-100">Paciente</p>
                                <p className="text-lg font-semibold">
                                    {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-cyan-600" />
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-700">Fecha de evaluación:</label>
                                    <input
                                        type="date"
                                        value={formData.fechaEvaluacion}
                                        onChange={(e) => handleInputChange(e)}
                                        name="fechaEvaluacion"
                                        className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm font-medium"
                                    />
                                </div>
                            </div>
                            {formData.numeroExpediente && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-violet-500" />
                                    <span className="font-semibold text-gray-700">No. Expediente: {formData.numeroExpediente}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Datos Personales */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-cyan-600" />
                                Datos Personales
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre(s)</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.nombre}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'nombre', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido Paterno</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.apellidoPaterno}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'apellidoPaterno', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido Materno</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.apellidoMaterno}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'apellidoMaterno', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Edad</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.edad}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'edad', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        value={formData.datosPersonales.fechaNacimiento}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'fechaNacimiento', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
                                    <select
                                        value={formData.datosPersonales.genero}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'genero', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lado Dominante</label>
                                    <select
                                        value={formData.datosPersonales.ladoDominante}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'ladoDominante', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Derecho">Derecho</option>
                                        <option value="Izquierdo">Izquierdo</option>
                                        <option value="Ambidiestro">Ambidiestro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ocupación</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.ocupacion}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'ocupacion', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contacto</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.contacto}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'contacto', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contacto de Emergencia</label>
                                    <input
                                        type="text"
                                        value={formData.datosPersonales.contactoEmergencia}
                                        onChange={(e) => handleNestedInputChange('datosPersonales', 'contactoEmergencia', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Motivo de Consulta */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-cyan-600" />
                                Motivo de Consulta
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.motivoConsulta.enfermedad}
                                        onChange={() => handleCheckboxChange('motivoConsulta', 'enfermedad')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Enfermedad</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.motivoConsulta.accidente}
                                        onChange={() => handleCheckboxChange('motivoConsulta', 'accidente')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Accidente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.motivoConsulta.urgencia}
                                        onChange={() => handleCheckboxChange('motivoConsulta', 'urgencia')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Urgencia</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.motivoConsulta.segundaOpinion}
                                        onChange={() => handleCheckboxChange('motivoConsulta', 'segundaOpinion')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Segunda Opinión</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Padecimiento */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Tipo de Padecimiento</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.tipoPadecimiento.congenito}
                                        onChange={() => handleCheckboxChange('tipoPadecimiento', 'congenito')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Congénito</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.tipoPadecimiento.adquirido}
                                        onChange={() => handleCheckboxChange('tipoPadecimiento', 'adquirido')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Adquirido</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.tipoPadecimiento.agudo}
                                        onChange={() => handleCheckboxChange('tipoPadecimiento', 'agudo')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Agudo</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.tipoPadecimiento.cronico}
                                        onChange={() => handleCheckboxChange('tipoPadecimiento', 'cronico')}
                                        className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Crónico</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Padecimiento</label>
                                    <input
                                        type="date"
                                        value={formData.tipoPadecimiento.fechaPadecimiento}
                                        onChange={(e) => handleNestedInputChange('tipoPadecimiento', 'fechaPadecimiento', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Dx.</label>
                                    <input
                                        type="date"
                                        value={formData.tipoPadecimiento.fechaDx}
                                        onChange={(e) => handleNestedInputChange('tipoPadecimiento', 'fechaDx', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Descripción</h2>
                            <p className="text-sm text-gray-600 mt-1">Dolor / limitación / acortamiento / etc. Acontecimientos, signos / síntomas principales</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                name="descripcion"
                                rows="4"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                placeholder="Describa los síntomas, limitaciones y acontecimientos principales..."
                            />
                        </div>
                    </div>

                    {/* Antecedentes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Antecedentes Relacionados</h2>
                            <p className="text-sm text-gray-600 mt-1">Fecha de diagnóstico / evolución / características</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={formData.antecedentes}
                                onChange={handleInputChange}
                                name="antecedentes"
                                rows="4"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                placeholder="Describa los antecedentes relacionados..."
                            />
                        </div>
                    </div>

                    {/* Exploración Física */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Exploración Física</h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={formData.exploracionFisica}
                                onChange={handleInputChange}
                                name="exploracionFisica"
                                rows="4"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                placeholder="Describa la exploración física..."
                            />
                        </div>
                    </div>

                    {/* Diagnóstico Médico */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Diagnóstico Médico / Especialista</h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={formData.diagnosticoMedico}
                                onChange={handleInputChange}
                                name="diagnosticoMedico"
                                rows="3"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                placeholder="Diagnóstico médico o del especialista..."
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.push(`/clientes/${id}`)}
                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPDF}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Descargar PDF
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar Consulta
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {},
    };
}
