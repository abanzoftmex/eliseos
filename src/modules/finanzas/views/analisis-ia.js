import AdminLayout from "@finanzas/components/layout/AdminLayout";
import FinancialChatbot from "@finanzas/components/dashboard/FinancialChatbotV2";
import RoleProtectedRoute from "@finanzas/components/auth/RoleProtectedRoute";

const AnalisisIA = () => {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "viewer"]}>
      <AdminLayout
        title="Chatbot Financiero IA"
        breadcrumbs={[
          { name: "Dashboard", href: "/finanzas/dashboard" },
          { name: "Chatbot Financiero IA" },
        ]}
      >





        {/* Financial Chatbot Component */}
        <FinancialChatbot />



      </AdminLayout>
    </RoleProtectedRoute>
  );
};

export default AnalisisIA;
