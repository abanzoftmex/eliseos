import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/transacciones/nueva-salida";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Nueva Salida">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
