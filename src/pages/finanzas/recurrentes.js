import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/recurrentes";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Recurrentes">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
