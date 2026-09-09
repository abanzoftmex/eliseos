import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/editar/[id]";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Editar Transacción">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
