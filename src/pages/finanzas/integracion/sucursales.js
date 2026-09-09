import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/integracion/sucursales";

export default function FinanzasIntegracionSucursalesPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Integración - Sucursales">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
