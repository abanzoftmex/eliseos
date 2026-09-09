import FinanzasModuleWrapper from "@/core/components/FinanzasModuleWrapper";
import ViewComponent from "@/modules/finanzas/views/dashboard";

export default function FinanzasPage(props) {
  return (
    <FinanzasModuleWrapper pageName="Dashboard">
      <ViewComponent {...props} />
    </FinanzasModuleWrapper>
  );
}
