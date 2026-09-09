import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/analisis-ia";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Análisis IA">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
