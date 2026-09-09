import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/recurrentes/nuevo";

export default function FinanzasNuevoRecurrentePage(props) {
  return (
    <FinanzasModuleWrapper pageName="Nuevo Gasto Recurrente">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
