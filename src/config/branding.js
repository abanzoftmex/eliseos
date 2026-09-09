/**
 * Configuración centralizada de Marca y Terminología — ELISEOS BOX & FITNESS
 * Fuente oficial: Brand Book ELISEOS (MANUAL BASICO ELISEOS BOX & FITNESS)
 */

export const BRAND = {
  name: 'Elíseos Box & Fitness',
  shortName: 'ELISEOS',
  tagline: 'Box & Fitness',
  subtitle: 'Sistema de gestión de entrenamiento, miembros y rendimiento',
  copyright: `© ${new Date().getFullYear()} Elíseos Box & Fitness. Todos los derechos reservados.`,
  
  // Colores Oficiales del Brand Book
  colors: {
    primary: '#c2ef03',      // Pantone 389 C (RGB 194, 239, 3) - Electric Lime
    primaryDark: '#1c4040',  // Pantone 4168 C (RGB 28, 64, 64) - Dark Slate/Forest
    complementary: '#d1d1d1',// Cool Gray 2 C (RGB 209, 209, 209)
    slate: '#1c4040',
    lime: '#c2ef03',
    gray: '#d1d1d1',
    darkBg: '#0e2323',
    cardDark: '#143131',
  },

  // Terminología Oficial
  terms: {
    member: 'Miembro',
    members: 'Miembros',
    memberLower: 'miembro',
    membersLower: 'miembros',
    staff: 'Coaches/Staff',
    staffInternal: 'Personal Interno',
    activity: 'Actividad',
    activities: 'Actividades',
    session: 'Actividad',
    sessions: 'Actividades',
    myActivities: 'Mis Actividades',
    myHealth: 'Mi Salud',
    clinicalNotes: 'Notas Clínicas',
    passport: 'Pasaporte',
    packages: 'Paquetes / Planes',
    products: 'Productos',
  },

  // Rutas de Assets
  assets: {
    logoLight: '/img/logo_light.png',
    logoDark: '/img/logo_dark.png',
    imagotipo: '/img/imagotipo.png',
    posterLogin: '/img/poster_login.webp',
    textures: {
      campo: '/img/eliseos/TEXTURA CAMPO.png',
      laurel: '/img/eliseos/TEXTURA LAUREL.png',
      salud: '/img/eliseos/TEXTURA SALUD.png',
    }
  }
};

export default BRAND;
