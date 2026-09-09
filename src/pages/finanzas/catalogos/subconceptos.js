import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/catalogos/subconceptos";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Subconceptos">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
