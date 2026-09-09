import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/integracion/clientes";

export default function FinanzasIntegracionClientesPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Integración - Clientes">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
