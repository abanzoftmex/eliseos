import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/catalogos/descripciones";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Descripciones">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
