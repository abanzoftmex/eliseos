import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/entradas";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Entradas">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
