import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/detalle/[id]";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Detalle Transacción">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
