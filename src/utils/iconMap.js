// Mapeo de iconos de Lucide React a Font Awesome
import { 
  faPlus,
  faClock,
  faFilter,
  faMagnifyingGlass,
  faEdit,
  faCopy,
  faEye,
  faTrash,
  faBars,
  faTimes,
  faFileText,
  faUserPlus,
  faBox,
  faCalendar,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faTachometerAlt,
  faCog,
  faSignOutAlt,
  faBuilding,
  faMapMarkerAlt,
  faHome,
  faSave,
  faUpload,
  faArrowLeft,
  faChartLine,
  faUsers,
  faDollarSign,
  faUser,
  faPackage,
  faCreditCard,
  faCalendarDays,
  faTag,
  faList,
  faTh,
  faPrint,
  faDownload,
  faMail,
  faLock,
  faShield,
  faExclamationTriangle,
  faSpinner,
  faCheck,
  faCheckCircle,
  faTimes as faTimesCircle,
  faEnvelope,
  faPhone,
  faHeart,
  faStethoscope,
  faComments,
  faPen,
  faPaperPlane,
  faTarget,
  faSearch,
  faAnglesLeft,
  faAnglesRight,
  faPersonRunning,
  faHeartPulse,
  faNoteSticky,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

import {
  faClock as faClockRegular,
  faFileText as faFileRegular,
  faUser as faUserRegular
} from '@fortawesome/free-regular-svg-icons';

// Mapeo de iconos Lucide -> Font Awesome
export const iconMap = {
  // Navegación y UI
  'Plus': faPlus,
  'Clock': faClock,
  'Filter': faFilter,
  'Search': faMagnifyingGlass,
  'Edit': faEdit,
  'Copy': faCopy,
  'Eye': faEye,
  'Trash': faTrash,
  'Trash2': faTrash,
  'TrashIcon': faTrash,
  'Menu': faBars,
  'X': faTimes,
  'ChevronLeft': faChevronLeft,
  'ChevronRight': faChevronRight,
  'ChevronDown': faChevronDown,
  'ChevronUp': faChevronUp,
  'ChevronsLeft': faAnglesLeft,
  'ChevronsRight': faAnglesRight,
  'Home': faHome,
  'ArrowLeft': faArrowLeft,
  
  // Documentos y archivos
  'FileText': faFileText,
  'NotebookPen': faNoteSticky,
  
  // Usuarios y personas
  'User': faUser,
  'Users': faUsers,
  'UserPlus': faUserPlus,
  
  // Elementos de negocio
  'Package': faBox,
  'Calendar': faCalendar,
  'CalendarDays': faCalendarDays,
  'LayoutDashboard': faTachometerAlt,
  'Settings': faCog,
  'LogOut': faSignOutAlt,
  'Building': faBuilding,
  'MapPin': faMapMarkerAlt,
  'Briefcase': faBuilding,
  
  // Acciones
  'Save': faSave,
  'Upload': faUpload,
  'Download': faDownload,
  'Printer': faPrint,
  
  // Finanzas
  'DollarSign': faDollarSign,
  'CreditCard': faCreditCard,
  'Tag': faTag,
  
  // Comunicación
  'Mail': faEnvelope,
  'MessageSquare': faComments,
  'Send': faPaperPlane,
  'Phone': faPhone,
  
  // Vistas
  'Grid3x3': faTh,
  'List': faList,
  
  // Estados y validación
  'Check': faCheck,
  'CheckCircle': faCheckCircle,
  'XCircle': faTimesCircle,
  'AlertTriangle': faExclamationTriangle,
  'AlertCircle': faExclamationTriangle,
  'Loader2': faSpinner,
  
  // Seguridad
  'Lock': faLock,
  'Shield': faShield,
  
  // Médico/Salud
  'Activity': faChartLine,
  'Heart': faHeart,
  'Stethoscope': faStethoscope,
  'Target': faTarget,
  
  // Edición
  'Edit2': faPen,
  
  // Específicos del proyecto (ya implementados)
  'PersonRunning': faPersonRunning, // Para atletas
  'HeartPulse': faHeartPulse, // Para pacientes
  
  // Items específicos
  'Box': faBox
};

// Función helper para obtener un icono Font Awesome desde un nombre de Lucide
export const getFontAwesomeIcon = (lucideName) => {
  return iconMap[lucideName] || faQuestionCircle; // Icono por defecto si no se encuentra
};

// Función para verificar si un icono existe en el mapeo
export const hasIconMapping = (lucideName) => {
  return lucideName in iconMap;
};