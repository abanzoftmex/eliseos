import React from 'react';
import { useRouter } from 'next/router';
import ClienteFormulario from '../../components/ClienteFormulario';

export default function NuevoCliente() {
  const router = useRouter();

  const handleSuccess = (clienteId, clienteData) => {
    console.log('Cliente creado exitosamente:', clienteId);
    router.push('/clientes');
  };

  const handleCancel = () => {
    router.push('/clientes');
  };

  return (
    <ClienteFormulario 
      mode="create"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      showHeader={true}
    />
  );
}

// Server-side props para autenticación
export async function getServerSideProps(context) {
  return {
    props: {
      title: "Nuevo Miembro - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Miembros', href: '/clientes' },
        { label: 'Nuevo Miembro', href: '/clientes/nuevo', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico', 'secretario'],
    }
  };
}
