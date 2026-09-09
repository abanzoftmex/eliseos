import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/catalogos/proveedores";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Proveedores">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
