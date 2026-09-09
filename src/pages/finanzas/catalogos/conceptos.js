import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/catalogos/conceptos";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Conceptos">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
