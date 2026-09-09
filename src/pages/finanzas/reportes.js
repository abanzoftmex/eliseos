import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/reportes";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Reportes">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
