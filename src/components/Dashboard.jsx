'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faMagnifyingGlass,
  faBars,
  faTimes,
  faFileText,
  faUserPlus,
  faChartLine,
  faPlus,
  faCalendar,
  faEnvelope,
  faBuilding,
  faCheck,
  faSave,
  faChevronLeft,
  faChevronRight,
  faHeart,
  faStethoscope,
  faClipboard,
  faExclamationTriangle,
  faUser,
  faUserCheck,
  faBox
} from '@fortawesome/free-solid-svg-icons';
import DirectorioFormModal from './DirectorioFormModal';
import ClienteRegistroModal from './ClienteRegistroModal';
import Breadcrumbs from './common/Breadcrumbs';
import Layout from './layout/Layout';

const Dashboard = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPatients, setTotalPatients] = useState(0);
  const [athletePatients, setAthletePatients] = useState(0);
  const [totalProfessionals, setTotalProfessionals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('directorio');
  
  // Nuevos estados para clientes y consulta
  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalesLoading, setProfesionalesLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para manejar drafts
  const [clienteDrafts, setClienteDrafts] = useState({}); // {clienteId: {consultaId, data}}
  const [atletaDrafts, setAtletaDrafts] = useState({});     // {clienteId: {consultaId, data}}
  const [loadingDraft, setLoadingDraft] = useState(false);

  // Sincronizar activeSection con URL query params
  useEffect(() => {
    const section = router.query.section;
    if (section === 'registro') {
      setActiveSection('registro');
    } else {
      setActiveSection('directorio');
    }
  }, [router.query.section]);

  // Fetch patient data from Firestore
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        // Get total patients count
        const clientesRef = collection(db, 'clientes');
        const allPatientsSnapshot = await getDocs(clientesRef);
        setTotalPatients(allPatientsSnapshot.size);

        // Get athlete patients count
        const athleteQuery = query(clientesRef, where('ocupacion', '==', 'Atleta'));
        const athletePatientsSnapshot = await getDocs(athleteQuery);
        setAthletePatients(athletePatientsSnapshot.size);

        // Get total professionals count
        const directorioRef = collection(db, 'directorio');
        const allProfessionalsSnapshot = await getDocs(directorioRef);
        setTotalProfessionals(allProfessionalsSnapshot.size);
        
      } catch (error) {
        console.error('Error fetching patient data:', error);
        // Set default values on error
        setTotalPatients(0);
        setAthletePatients(0);
        setTotalProfessionals(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  // Obtener lista de clientes cuando se activa la sección registro
  useEffect(() => {
    if (activeSection === 'registro') {
      fetchClientes();
    } else if (activeSection === 'directorio') {
      fetchProfesionales();
    }
  }, [activeSection]);

  const fetchClientes = async () => {
    try {
      console.log('🔄 Iniciando fetchClientes...');
      setClientesLoading(true);
      const clientesRef = collection(db, 'clientes');
      const clientesSnapshot = await getDocs(clientesRef);
      const clientesData = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(clientesData);
      console.log('👥 Clientes cargados:', clientesData.length);
      
      // Cargar drafts para cada cliente
      console.log('🔍 Cargando drafts de clientes...');
      await loadClienteDrafts(clientesData);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setClientes([]);
    } finally {
      setClientesLoading(false);
    }
  };

  // Función para cargar drafts de consultas de atletas incompletas


  // Función para cargar profesionales del directorio
  const fetchProfesionales = async () => {
    try {
      setProfesionalesLoading(true);
      const directorioRef = collection(db, 'directorio');
      const directorioSnapshot = await getDocs(directorioRef);
      const profesionalesData = directorioSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProfesionales(profesionalesData);
    } catch (error) {
      console.error('Error fetching profesionales:', error);
      setProfesionales([]);
    } finally {
      setProfesionalesLoading(false);
    }
  };

  // Función para cargar drafts de consultas incompletas (normales y atletas)
  const loadClienteDrafts = async (clientesData) => {
    try {
      const consultasRef = collection(db, 'consultas');
      const draftsQuery = query(consultasRef, where('status', '==', 'draft'));
      const draftsSnapshot = await getDocs(draftsQuery);
      
      const normalDraftsMap = {};
      const atletaDraftsMap = {};
      
      console.log('🔍 Total drafts found:', draftsSnapshot.docs.length);
      
      draftsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('🔍 Processing draft:', { 
          docId: doc.id, 
          type: data.type, 
          clienteId: data.clienteId,
          fullData: data 
        });
        
        if (data.clienteId) {
          const draft = {
            id: doc.id,
            answers: data.answers || {},
            currentStep: data.currentStep || 1,
            createdAt: data.createdAt,
            status: data.status,
            type: data.type // Agregamos el tipo para debug
          };
          
          // IMPORTANTE: Verificar si es draft de atleta por ID también
          const isAtletaById = doc.id.includes('draft_atleta_');
          console.log('🔍 Draft classification:', { 
            docId: doc.id,
            typeField: data.type,
            isAtletaById,
            willClassifyAs: (data.type === 'atleta' || isAtletaById) ? 'atleta' : 'normal'
          });
          
          if (data.type === 'atleta' || isAtletaById) {
            console.log('🏃 Adding atleta draft for client:', data.clienteId);
            atletaDraftsMap[data.clienteId] = draft;
          } else {
            console.log('👨‍⚕️ Adding normal draft for client:', data.clienteId);
            normalDraftsMap[data.clienteId] = draft;
          }
        }
      });
      
      console.log('🔍 Final draft maps:', { normalDraftsMap, atletaDraftsMap });
      
      setClienteDrafts(normalDraftsMap);
      setAtletaDrafts(atletaDraftsMap);
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  // Handle modal events
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleClientSuccess = async () => {
    // Refresh the patient count when a new client is added by re-fetching data
    try {
      const clientesRef = collection(db, 'clientes');
      const allPatientsSnapshot = await getDocs(clientesRef);
      setTotalPatients(allPatientsSnapshot.size);

      // Update athlete count as well
      const athleteQuery = query(clientesRef, where('ocupacion', '==', 'Atleta'));
      const athletePatientsSnapshot = await getDocs(athleteQuery);
      setAthletePatients(athletePatientsSnapshot.size);
      
      // Actualizar la lista de clientes
      await fetchClientes();
      
      // Refresh clients list if we're in the registro section
      if (activeSection === 'registro') {
        await fetchClientes();
      }
    } catch (error) {
      console.error('Error refreshing patient data:', error);
    }
  };

  const handleDirectorSuccess = async () => {
    // Refresh the professional count when a new professional is added
    try {
      const directorioRef = collection(db, 'directorio');
      const allProfessionalsSnapshot = await getDocs(directorioRef);
      setTotalProfessionals(allProfessionalsSnapshot.size);
      
      // Actualizar la lista de profesionales
      await fetchProfesionales();
    } catch (error) {
      console.error('Error refreshing professional data:', error);
    }
  };

  // Handle cliente registration modal
  const handleOpenClienteModal = () => {
    setIsClienteModalOpen(true);
  };

  const handleCloseClienteModal = () => {
    setIsClienteModalOpen(false);
  };

  // Handle sidebar navigation
  const handleSidebarClick = (sectionId) => {
    const sidebarItem = sidebarItems.find(item => item.id === sectionId);
    
    if (sidebarItem && sidebarItem.href) {
      // Si el item tiene href, navegar a esa página
      router.push(sidebarItem.href);
    } else {
      // Si no, cambiar la sección activa
      setActiveSection(sectionId);
    }
    
    // Cerrar sidebar en mobile después de navegar
    setSidebarOpen(false);
  };

  // Función específica para buscar consulta incompleta de un cliente
  const findIncompleteConsulta = async (clienteId) => {
    try {
      const consultasRef = collection(db, 'consultas');
      const incompleteQuery = query(
        consultasRef, 
        where('uidCliente', '==', clienteId),
        where('status', '==', 'incompleto')
      );
      const querySnapshot = await getDocs(incompleteQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]; // Tomar la primera consulta incompleta
        return {
          consultaId: doc.id,
          data: doc.data().respuestas || {},
          currentStep: doc.data().currentStep || 0,
          createdAt: doc.data().createdAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding incomplete consulta:', error);
      return null;
    }
  };

  // Función para eliminar drafts anteriores
  const deleteIncompleteDrafts = async (clienteId) => {
    try {
      const consultasRef = collection(db, 'consultas');
      const incompleteQuery = query(
        consultasRef, 
        where('uidCliente', '==', clienteId),
        where('status', '==', 'incompleto')
      );
      const querySnapshot = await getDocs(incompleteQuery);
      
      // Eliminar todos los drafts encontrados
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'consultas', docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      
      // Limpiar drafts del estado local también
      setClienteDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[clienteId];
        return newDrafts;
      });
      
      console.log(`Eliminados ${querySnapshot.docs.length} drafts para el cliente ${clienteId}`);
    } catch (error) {
      console.error('Error deleting incomplete drafts:', error);
    }
  };

  // Funciones para wizard de historia clínica - navegar a página
  const handleOpenConsultaModal = async (cliente, continueDraft = false) => {
    console.log('🔍 Dashboard handleOpenConsultaModal called', { clienteId: cliente.id, continueDraft });
    console.log('🔍 Dashboard drafts state:', { 
      normalDraft: clienteDrafts[cliente.id], 
      atletaDraft: atletaDrafts[cliente.id],
      allClienteDrafts: clienteDrafts,
      allAtletaDrafts: atletaDrafts
    });
    
    if (continueDraft) {
      // Verificar si hay draft normal o de atleta
      const normalDraft = clienteDrafts[cliente.id];
      const atletaDraft = atletaDrafts[cliente.id];
      
      console.log('🔍 Dashboard draft check:', { normalDraft, atletaDraft });
      
      if (atletaDraft) {
        // Navegar a consulta de atleta
        const url = `/clientes/${cliente.id}/citas-deportivas?draftId=${atletaDraft.id}`;
        console.log('📍 Dashboard navigating to atleta draft:', url);
        window.location.href = url;
      } else if (normalDraft) {
        // Navegar a consulta normal
        const url = `/clientes/${cliente.id}/citas?draftId=${normalDraft.id}`;
        console.log('📍 Dashboard navigating to normal draft:', url);
        window.location.href = url;
      } else {
        // No hay draft, crear nueva consulta normal
        const url = `/clientes/${cliente.id}/citas`;
        console.log('📍 Dashboard no draft found, navigating to new consultation:', url);
        window.location.href = url;
      }
    } else {
      // Nueva consulta normal
      const url = `/clientes/${cliente.id}/citas`;
      console.log('📍 Dashboard navigating to new consultation:', url);
      window.location.href = url;
    }
  };



  const handleHistoriaClinicaChange = (field, value) => {
    setHistoriaClinica(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // Validar el paso actual antes de avanzar
    if (!validateStep(currentStep)) {
      const missingFields = getMissingFields(currentStep);
      alert(`Por favor completa los siguientes campos obligatorios:\n\n${missingFields.join('\n')}`);
      return;
    }
    
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(getNextValidStep(currentStep + 1));
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(getPrevValidStep(currentStep - 1));
    }
  };

  const saveConsulta = async (status) => {
    // Validación básica
    if (!historiaClinica.motivoConsulta.trim() && status === 'finalizado') {
      alert('Por favor completa el motivo de consulta antes de finalizar');
      return;
    }

    try {
      setConsultaLoading(true);
      
      const consultaData = {
        uidCliente: selectedCliente.id,
        uidTrabajador: 'admin-temp', // Por ahora usamos un ID temporal
        respuestas: historiaClinica,
        currentStep: currentStep, // Guardar el paso actual
        status: status, // 'incompleto' o 'finalizado'
        updatedAt: serverTimestamp()
      };
      
      let finalConsultaId = editingConsultaId;
      
      if (editingConsultaId) {
        // Actualizar consulta existente
        await updateDoc(doc(db, 'consultas', editingConsultaId), consultaData);
      } else {
        // Crear nueva consulta
        consultaData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'consultas'), consultaData);
        finalConsultaId = docRef.id;
        setEditingConsultaId(finalConsultaId);
      }
      
      setSuccessMessage('Consulta registrada exitosamente ✅');
      
      // Actualizar drafts si es incompleto
      if (status === 'incompleto') {
        setClienteDrafts(prev => ({
          ...prev,
          [selectedCliente.id]: {
            consultaId: finalConsultaId,
            data: historiaClinica,
            currentStep: currentStep,
            createdAt: new Date()
          }
        }));
      } else {
        // Remover draft si se finaliza
        setClienteDrafts(prev => {
          const newDrafts = { ...prev };
          delete newDrafts[selectedCliente.id];
          return newDrafts;
        });
      }
      
      // Cerrar modal después de un delay
      setTimeout(() => {
        handleCloseConsultaModal();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving consulta:', error);
      alert(`Error al guardar la consulta: ${error.message}`);
    } finally {
      setConsultaLoading(false);
    }
  };

  // Función para determinar si debe mostrar el paso gineco-obstétrico
  const shouldShowGinecoStep = () => {
    return historiaClinica.genero === 'femenino' || historiaClinica.genero === 'mujer';
  };
  
  // Función helper para validar paso gineco con datos específicos
  const shouldShowGinecoStepForData = (data) => {
    return data.genero === 'femenino' || data.genero === 'mujer';
  };

  // Funciones para manejar consultas de atleta - navegar a página
  const handleOpenAtletaModal = async (cliente, continueDraft = false) => {
    if (continueDraft && atletaDrafts[cliente.id]) {
      // Navegar con el draftId existente
      window.location.href = `/clientes/${cliente.id}/citas-deportivas?draftId=${atletaDrafts[cliente.id].id}`;
    } else {
      // Nueva consulta
      window.location.href = `/clientes/${cliente.id}/citas-deportivas`;
    }
  };



  // Función para buscar consulta incompleta de atleta
  const findIncompleteAtletaConsulta = async (clienteId) => {
    try {
      const consultasRef = collection(db, 'consultasAtleta');
      const incompleteQuery = query(
        consultasRef, 
        where('uidCliente', '==', clienteId),
        where('status', '==', 'incompleto')
      );
      const querySnapshot = await getDocs(incompleteQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          consultaId: doc.id,
          data: doc.data().respuestas || {},
          currentStep: doc.data().currentStep || 0,
          createdAt: doc.data().createdAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding incomplete atleta consulta:', error);
      return null;
    }
  };

  // Función para eliminar drafts anteriores de atletas
  const deleteIncompleteAtletaDrafts = async (clienteId) => {
    try {
      const consultasRef = collection(db, 'consultasAtleta');
      const incompleteQuery = query(
        consultasRef, 
        where('uidCliente', '==', clienteId),
        where('status', '==', 'incompleto')
      );
      const querySnapshot = await getDocs(incompleteQuery);
      
      // Eliminar todos los drafts encontrados
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'consultasAtleta', docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      
      // Limpiar drafts del estado local también
      setAtletaDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[clienteId];
        return newDrafts;
      });
      
      console.log(`Eliminados ${querySnapshot.docs.length} drafts de atleta para el cliente ${clienteId}`);
    } catch (error) {
      console.error('Error deleting incomplete atleta drafts:', error);
    }
  };

  // Función para validar campos obligatorios de cada paso
  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Datos Generales
        return !!historiaClinica.tipoPadecimiento && 
               !!historiaClinica.fechaInicioPadecimiento &&
               !!historiaClinica.descripcionGeneral.trim();
      
      case 1: // Antecedentes Familiares
        return !!historiaClinica.actividadFisica.trim();
      
      case 2: // Antecedentes Gineco-Obstétricos
        if (!shouldShowGinecoStep()) return true; // Si no aplica, pasa validación
        return !!historiaClinica.genero;
      
      case 3: // Alergias
        return true; // No hay campos obligatorios
      
      case 4: // Cirugías y Estudios
        return true; // No hay campos obligatorios
      
      case 5: // Escala de Dolor
        return !!historiaClinica.dolorLocalizacion.trim();
      
      case 6: // Signos Vitales
        return !!historiaClinica.peso && !!historiaClinica.talla;
      
      case 7: // Diagnóstico y Control
        return !!historiaClinica.motivoConsulta.trim();
      
      default:
        return true;
    }
  };

  // Función para obtener los campos faltantes de un paso
  const getMissingFields = (stepIndex) => {
    const missing = [];
    
    switch (stepIndex) {
      case 0:
        if (!historiaClinica.tipoPadecimiento) missing.push('Tipo de Padecimiento');
        if (!historiaClinica.fechaInicioPadecimiento) missing.push('Fecha de Inicio del Padecimiento');
        if (!historiaClinica.descripcionGeneral.trim()) missing.push('Descripción General');
        break;
      case 1:
        if (!historiaClinica.actividadFisica.trim()) missing.push('Actividad Física');
        break;
      case 2:
        if (shouldShowGinecoStep() && !historiaClinica.genero) missing.push('Género');
        break;
      case 5:
        if (!historiaClinica.dolorLocalizacion.trim()) missing.push('Localización del Dolor');
        break;
      case 6:
        if (!historiaClinica.peso) missing.push('Peso');
        if (!historiaClinica.talla) missing.push('Talla');
        break;
      case 7:
        if (!historiaClinica.motivoConsulta.trim()) missing.push('Motivo de Consulta');
        break;
    }
    
    return missing;
  };

  // Función para obtener el siguiente paso válido
  const getNextValidStep = (step) => {
    if (step === 2 && !shouldShowGinecoStep()) { // Saltar gineco-obstétrico si no es mujer
      return 3;
    }
    return step;
  };

  const getPrevValidStep = (step) => {
    if (step === 3 && !shouldShowGinecoStep()) { // Saltar gineco-obstétrico si no es mujer
      return 1;
    }
    return step;
  };

  // Filtrar clientes según término de búsqueda
  const filteredClientes = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(searchLower) ||
      cliente.apellidoPaterno?.toLowerCase().includes(searchLower) ||
      cliente.apellidoMaterno?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.ocupacion?.toLowerCase().includes(searchLower)
    );
  });

  // Función para renderizar cada paso del formulario
  const renderWizardStep = () => {
    const step = currentStep;
    
    switch (step) {
      case 0: // Datos Generales
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Padecimiento <span className="text-red-500">*</span>
              </label>
              <select 
                value={historiaClinica.tipoPadecimiento} 
                onChange={(e) => handleHistoriaClinicaChange('tipoPadecimiento', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800 ${
                  !historiaClinica.tipoPadecimiento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar...</option>
                <option value="neurologico">Neurológico</option>
                <option value="musculoesqueletico">Musculoesquelético</option>
                <option value="respiratorio">Respiratorio</option>
                <option value="cardiovascular">Cardiovascular</option>
                <option value="deportivo">Deportivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio del Padecimiento <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={historiaClinica.fechaInicioPadecimiento} 
                onChange={(e) => handleHistoriaClinicaChange('fechaInicioPadecimiento', e.target.value)} 
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800 ${
                  !historiaClinica.fechaInicioPadecimiento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Diagnóstico</label>
              <input type="date" value={historiaClinica.fechaDiagnostico} onChange={(e) => handleHistoriaClinicaChange('fechaDiagnostico', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción General <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={historiaClinica.descripcionGeneral} 
                onChange={(e) => handleHistoriaClinicaChange('descripcionGeneral', e.target.value)} 
                rows={4} 
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none text-gray-800 ${
                  !historiaClinica.descripcionGeneral.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`} 
                placeholder="Describe el padecimiento en detalle..." 
              />
            </div>
          </div>
        );

      case 1: // Antecedentes Familiares
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enfermedades Hereditarias</label>
              <select value={historiaClinica.enfermedadesHereditarias} onChange={(e) => handleHistoriaClinicaChange('enfermedadesHereditarias', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800">
                <option value="">Ninguna</option>
                <option value="diabetes">Diabetes</option>
                <option value="hipertension">Hipertensión</option>
                <option value="cardiopatias">Cardiopatías</option>
                <option value="cancer">Cáncer</option>
                <option value="artritis">Artritis</option>
                <option value="otras">Otras</option>
              </select>
            </div>
            {historiaClinica.enfermedadesHereditarias === 'otras' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especificar otras enfermedades</label>
                <input type="text" value={historiaClinica.otrasEnfermedadesHereditarias} onChange={(e) => handleHistoriaClinicaChange('otrasEnfermedadesHereditarias', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Antecedentes Patológicos - Enfermedad</label>
              <input type="text" value={historiaClinica.antecedentesPato_enfermedad} onChange={(e) => handleHistoriaClinicaChange('antecedentesPato_enfermedad', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" placeholder="Enfermedades previas..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actividad Física <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={historiaClinica.actividadFisica} 
                onChange={(e) => handleHistoriaClinicaChange('actividadFisica', e.target.value)} 
                rows={3} 
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none text-gray-800 ${
                  !historiaClinica.actividadFisica.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`} 
                placeholder="Describe la actividad física habitual..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tabaquismo</label>
              <select value={historiaClinica.tabaquismo} onChange={(e) => handleHistoriaClinicaChange('tabaquismo', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800">
                <option value="">Seleccionar...</option>
                <option value="nunca">Nunca</option>
                <option value="ocasional">Ocasional</option>
                <option value="diario">Diario</option>
                <option value="exfumador">Ex-fumador</option>
              </select>
            </div>
          </div>
        );

      case 2: // Antecedentes Gineco-Obstétricos
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género <span className="text-red-500">*</span>
              </label>
              <select 
                value={historiaClinica.genero} 
                onChange={(e) => handleHistoriaClinicaChange('genero', e.target.value)} 
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800 ${
                  !historiaClinica.genero ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </div>
            {shouldShowGinecoStep() && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Partos</label>
                  <input type="number" min="0" value={historiaClinica.partos} onChange={(e) => handleHistoriaClinicaChange('partos', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Cesáreas</label>
                  <input type="number" min="0" value={historiaClinica.cesareas} onChange={(e) => handleHistoriaClinicaChange('cesareas', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Abortos</label>
                  <input type="number" min="0" value={historiaClinica.abortos} onChange={(e) => handleHistoriaClinicaChange('abortos', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tratamiento Hormonal</label>
                  <textarea value={historiaClinica.tratamientoHormonal} onChange={(e) => handleHistoriaClinicaChange('tratamientoHormonal', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none text-gray-800" placeholder="Especificar tratamientos hormonales actuales o pasados..." />
                </div>
              </>
            )}
          </div>
        );

      case 3: // Alergias
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
              <textarea value={historiaClinica.alergias} onChange={(e) => handleHistoriaClinicaChange('alergias', e.target.value)} rows={6} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none text-gray-800" placeholder="Describe cualquier alergia conocida a medicamentos, alimentos, sustancias, etc." />
            </div>
          </div>
        );

      case 4: // Cirugías y Estudios
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-3">Cirugías Previas</h4>
              <p className="text-sm text-gray-600 mb-3">Registra las cirugías más relevantes</p>
              <textarea value={historiaClinica.cirugias.join('\\n')} onChange={(e) => handleHistoriaClinicaChange('cirugias', e.target.value.split('\\n'))} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none text-gray-800" placeholder="Ej: Apendicectomía 2020 - Sin complicaciones" />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-3">Estudios de Gabinete</h4>
              <p className="text-sm text-gray-600 mb-3">Registra radiografías, resonancias, etc.</p>
              <textarea value={historiaClinica.estudios.join('\\n')} onChange={(e) => handleHistoriaClinicaChange('estudios', e.target.value.split('\\n'))} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none text-gray-800" placeholder="Ej: Resonancia lumbar 15/09/2025 - Hernia discal L4-L5" />
            </div>
          </div>
        );

      case 5: // Escala de Dolor
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localización del Dolor <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={historiaClinica.dolorLocalizacion} 
                onChange={(e) => handleHistoriaClinicaChange('dolorLocalizacion', e.target.value)} 
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800 ${
                  !historiaClinica.dolorLocalizacion.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`} 
                placeholder="Ej: Región lumbar, hombro derecho..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intensidad del Dolor (0-10)</label>
              <select value={historiaClinica.dolorIntensidad} onChange={(e) => handleHistoriaClinicaChange('dolorIntensidad', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800">
                <option value="">Seleccionar...</option>
                {[...Array(11)].map((_, i) => <option key={i} value={i}>{i} - {i === 0 ? 'Sin dolor' : i <= 3 ? 'Leve' : i <= 6 ? 'Moderado' : 'Severo'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Carácter del Dolor</label>
              <select value={historiaClinica.dolorCaracter} onChange={(e) => handleHistoriaClinicaChange('dolorCaracter', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800">
                <option value="">Seleccionar...</option>
                <option value="punzante">Punzante</option>
                <option value="quemante">Quemante</option>
                <option value="sordo">Sordo</option>
                <option value="pulsante">Pulsante</option>
                <option value="opresivo">Opresivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Irradiación</label>
              <input type="text" value={historiaClinica.dolorIrradiacion} onChange={(e) => handleHistoriaClinicaChange('dolorIrradiacion', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-800" placeholder="¿Hacia dónde se extiende el dolor?" />
            </div>
          </div>
        );

      case 6: // Signos Vitales
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia Cardíaca (bpm)</label>
                <input type="number" value={historiaClinica.frecuenciaCardiaca} onChange={(e) => handleHistoriaClinicaChange('frecuenciaCardiaca', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tensión Arterial (mmHg)</label>
                <input type="text" value={historiaClinica.tensionArterial} onChange={(e) => handleHistoriaClinicaChange('tensionArterial', e.target.value)} placeholder="120/80" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={historiaClinica.peso} 
                  onChange={(e) => handleHistoriaClinicaChange('peso', e.target.value)} 
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all ${
                    !historiaClinica.peso ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talla (cm) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={historiaClinica.talla} 
                  onChange={(e) => handleHistoriaClinicaChange('talla', e.target.value)} 
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all ${
                    !historiaClinica.talla ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inspección Física</label>
              <textarea value={historiaClinica.inspeccion} onChange={(e) => handleHistoriaClinicaChange('inspeccion', e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none" placeholder="Observaciones de la exploración física..." />
            </div>
          </div>
        );

      case 7: // Diagnóstico y Control
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de Consulta <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={historiaClinica.motivoConsulta} 
                onChange={(e) => handleHistoriaClinicaChange('motivoConsulta', e.target.value)} 
                rows={3} 
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none ${
                  !historiaClinica.motivoConsulta.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`} 
                placeholder="Razón principal de la consulta..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo del Paciente</label>
              <textarea value={historiaClinica.objetivoPaciente} onChange={(e) => handleHistoriaClinicaChange('objetivoPaciente', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none" placeholder="¿Qué espera lograr el paciente?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico Fisioterapéutico</label>
              <textarea value={historiaClinica.diagnosticoFisioterapeutico} onChange={(e) => handleHistoriaClinicaChange('diagnosticoFisioterapeutico', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none" placeholder="Diagnóstico desde perspectiva fisioterapéutica..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intervención Fisioterapéutica</label>
              <textarea value={historiaClinica.intervencionFisioterapeutica} onChange={(e) => handleHistoriaClinicaChange('intervencionFisioterapeutica', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none" placeholder="Plan de tratamiento propuesto..." />
            </div>
          </div>
        );

      default:
        return <div>Paso no encontrado</div>;
    }
  };

  const sidebarItems = [
    {
      id: 'directorio',
      label: 'Directorio interno',
      icon: FileText,
      active: activeSection === 'directorio'
    },
    {
      id: 'registro',
      label: 'Registro de Clientes', 
      icon: UserPlus,
      active: activeSection === 'registro'
    },
    {
      id: 'paquetes',
      label: 'Gestión de Paquetes',
      icon: Package,
      active: activeSection === 'paquetes',
      href: '/paquetes'
    }
  ];

  const statistics = [
    {
      title: 'Pacientes actuales',
      value: loading ? '...' : totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pacientes atletas',
      value: loading ? '...' : athletePatients,
      icon: Activity,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <Layout
      title="Dashboard - Elíseos Box & Fitness"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard', isLast: true }
      ]}
      showBreadcrumbs={false}
    >
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-teal-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeSection === 'directorio' ? 'Gestión del personal médico' : 'Registro de pacientes'}
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 text-teal-500" />
            </div>
            <input
              type="text"
              placeholder={activeSection === 'directorio' ? 'Buscar personal...' : 'Buscar clientes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {statistics.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{stat.title}</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">{stat.value}</p>
                    </div>
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-xl shadow-lg">
                      <IconComponent size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
                </div>
              );
            })}
          </div>

          {/* Directorio Interno Section */}
          {activeSection === 'directorio' && (
            <>
              {/* Action Buttons */}
              <div className="mb-8">
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-5.5 h-5.5 mr-3" />
                  Dar de alta nuevo profesional
                </button>
              </div>

              {/* Lista de Profesionales */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Directorio Interno</h3>
                    <p className="text-gray-500 mt-1">Personal médico del centro de rehabilitación</p>
                  </div>
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-xl">
                    <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-white" />
                  </div>
                </div>

                {profesionalesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <span className="ml-3 text-gray-600">Cargando profesionales...</span>
                  </div>
                ) : profesionales.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">No hay profesionales registrados</h4>
                    <p className="text-gray-600 mb-6">
                      Utiliza el botón "Dar de alta nuevo profesional" para agregar personal médico.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {profesionales.length} profesional{profesionales.length === 1 ? '' : 'es'} registrado{profesionales.length === 1 ? '' : 's'} en el centro.
                    </p>
                    
                    {/* Grid de Profesionales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profesionales.map((profesional) => (
                        <div key={profesional.id} className="bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                          
                          {/* Foto del profesional */}
                          <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 mr-4">
                              {profesional.foto ? (
                                <img 
                                  src={profesional.foto} 
                                  alt={`${profesional.nombre} ${profesional.apellidoPaterno}`}
                                  className="w-16 h-16 rounded-xl object-cover shadow-lg border-2 border-teal-300"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <FontAwesomeIcon icon={faUserPlus} className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Información básica */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-gray-800 truncate">
                                {profesional.nombre} {profesional.apellidoPaterno}
                              </h4>
                              <div className="flex items-center mt-1 text-sm text-gray-600">
                                <FontAwesomeIcon icon={faBuilding} className="w-3.5 h-3.5 mr-1 text-teal-600" />
                                <span className="truncate">{profesional.puesto || profesional.ocupacion || 'Profesional médico'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Información de contacto */}
                          <div className="space-y-2 text-sm">
                            {profesional.email && (
                              <div className="flex items-center text-gray-600">
                                <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 mr-2 text-teal-600" />
                                <span className="truncate">{profesional.email}</span>
                              </div>
                            )}
                            
                            {profesional.telefonoContacto && (
                              <div className="flex items-center text-gray-600">
                                <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5 mr-2 text-teal-600" />
                                <span>{profesional.telefonoContacto}</span>
                              </div>
                            )}
                            
                            {profesional.especialidad && (
                              <div className="flex items-center text-gray-600">
                                <FontAwesomeIcon icon={faFileText} className="w-3.5 h-3.5 mr-2 text-teal-600" />
                                <span className="truncate">{profesional.especialidad}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Estado */}
                          <div className="mt-4 pt-3 border-t border-teal-300">
                            <div className="flex items-center justify-between">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                profesional.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {profesional.status === 'active' ? 'Activo' : 'Inactivo'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {profesional.tipo || 'Médico'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Registro de Clientes Section */}
          {activeSection === 'registro' && (
            <>
              {/* Action Buttons */}
              <div className="mb-8">
                <button
                  onClick={handleOpenClienteModal}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-5.5 h-5.5 mr-3" />
                  Registrar nuevo cliente
                </button>
              </div>

              {/* Lista de Clientes */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Lista de Clientes</h3>
                    <p className="text-gray-500 mt-1">Pacientes registrados para consultas</p>
                  </div>
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-xl">
                    <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {clientesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                  </div>
                ) : filteredClientes.length === 0 ? (
                  <div className="text-center py-12">
                    <FontAwesomeIcon icon={faUsers} className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      {clientes.length === 0 ? 'No hay clientes registrados' : 'No se encontraron clientes'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {clientes.length === 0 
                        ? 'Utiliza el botón "Registrar nuevo cliente" para comenzar'
                        : 'Intenta con otros términos de búsqueda'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClientes.map((cliente) => (
                      <div key={cliente.id} className={`bg-gradient-to-r from-gray-50 to-teal-50 border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 relative ${
                        clienteDrafts[cliente.id] 
                          ? 'border-orange-200 hover:border-orange-300' 
                          : 'border-teal-100 hover:border-teal-300'
                      }`}>
                        {/* Indicador de Draft */}
                        {clienteDrafts[cliente.id] && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center">
                              <FontAwesomeIcon icon={faFileText} className="w-3 h-3 mr-1" />
                              Draft
                            </div>
                          </div>
                        )}
                        <div className="flex items-start space-x-4">
                          {/* Foto del cliente */}
                          <div className="flex-shrink-0">
                            {cliente.foto ? (
                              <img 
                                src={cliente.foto} 
                                alt={`${cliente.nombre} ${cliente.apellidoPaterno}`}
                                className="w-16 h-16 rounded-xl object-cover shadow-lg border-2 border-teal-200"
                                onError={(e) => {
                                  // Si la imagen falla, mostrar el ícono
                                  e.target.style.display = 'none';
                                  const iconDiv = e.target.parentNode.querySelector('.fallback-icon');
                                  if (iconDiv) iconDiv.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`fallback-icon w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg ${cliente.foto ? 'hidden' : 'flex'}`}>
                              <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Información del cliente */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-800 truncate">
                              {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                            </h4>
                            
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <FontAwesomeIcon icon={faBuilding} className="w-3.5 h-3.5 mr-1 text-teal-500" />
                              <span className="truncate">{cliente.ocupacion || 'Sin especificar'}</span>
                            </div>
                            
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 mr-1 text-teal-500" />
                              <span className="truncate">{cliente.email || 'Sin email'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botones de consulta */}
                        <div className="mt-4 pt-4 border-t border-teal-200 space-y-2">
                          {(clienteDrafts[cliente.id] || atletaDrafts[cliente.id]) ? (
                            <>
                              <button
                                onClick={() => handleOpenConsultaModal(cliente, true)}
                                disabled={loadingDraft}
                                className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingDraft ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                  <FontAwesomeIcon icon={faFileText} className="w-4 h-4 mr-2" />
                                )}
                                {loadingDraft ? 'Cargando...' : 'Continuar consulta'}
                              </button>
                              <p className="text-xs text-orange-600 text-center font-medium">
                                Paso {((clienteDrafts[cliente.id] || atletaDrafts[cliente.id])?.currentStep || 0) + 1} de {atletaDrafts[cliente.id] ? 31 : wizardSteps.length}
                              </p>
                            </>
                          ) : (
                            <div className="text-center py-2">
                              <p className="text-xs text-gray-500 mb-2">No hay consultas pendientes</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleOpenConsultaModal(cliente, false)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 mr-2" />
                            {clienteDrafts[cliente.id] ? 'Nueva consulta' : 'Registrar consulta'}
                          </button>

                          {/* Botón para consulta de atleta */}
                          <button
                            onClick={() => handleOpenAtletaModal(cliente, false)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg mt-2"
                          >
                            <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 mr-2" />
                            Registrar consulta Atleta
                          </button>

                          {/* Mostrar draft de atleta si existe */}
                          {atletaDrafts[cliente.id] && (
                            <button
                              onClick={() => handleOpenAtletaModal(cliente, true)}
                              disabled={loadingDraft}
                              className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                            >
                              {loadingDraft ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 mr-2" />
                              )}
                              {loadingDraft ? 'Cargando...' : 'Continuar consulta Atleta'}
                            </button>
                          )}

                          {/* Botón para gestionar paquetes */}
                          <button
                            onClick={() => router.push(`/clientes/${cliente.id}`)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg mt-2"
                          >
                            <FontAwesomeIcon icon={faBox} className="w-4 h-4 mr-2" />
                            Gestionar Paquetes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Modals restantes */}
        <DirectorioFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleDirectorSuccess}
        />
        
        <ClienteRegistroModal
          isOpen={isClienteModalOpen}
          onClose={handleCloseClienteModal}
          onSuccess={handleClientSuccess}
        />
    </Layout>
  );
};

export default Dashboard;