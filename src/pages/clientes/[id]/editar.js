import React from 'react';
import { useRouter } from 'next/router';
import ClienteFormulario from '../../../components/ClienteFormulario';
import { showSuccessToast } from '../../../utils/toast';

export default function EditarCliente() {
  const router = useRouter();
  const { id } = router.query;

  const handleSuccess = (clienteId, clienteData) => {
    console.log('Cliente actualizado exitosamente:', clienteId);
    // Mostrar confirmación sin redirigir
    showSuccessToast('Los cambios se guardaron correctamente');
  };

  const handleCancel = () => {
    // Redirigir a la lista de clientes
    router.push('/clientes');
  };

  return (
    <ClienteFormulario 
      mode="edit"
      clienteId={id}
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
      title: "Editar Miembro - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Miembros', href: '/clientes' },
        { label: 'Editar Miembro', href: '#', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico', 'secretario'],
    }
  };
}
