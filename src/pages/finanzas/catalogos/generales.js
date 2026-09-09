import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/catalogos/generales";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Generales">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
