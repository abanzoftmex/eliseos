import React from 'react';
import DirectorioForm from '../../components/DirectorioForm';

export default function NuevoContactoPage() {
  return <DirectorioForm mode="create" />;
}

// Server-side props para protección de ruta
export async function getServerSideProps(context) {
  return {
    props: {
      title: "Nuevo Coach / Staff - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Coaches/Staff', href: '/directorio' },
        { label: 'Nuevo Registro', href: '/directorio/nuevo', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico']
    }
  };
}
