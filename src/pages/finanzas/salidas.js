import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/salidas";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Salidas">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
