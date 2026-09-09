import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/historial";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Historial">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
