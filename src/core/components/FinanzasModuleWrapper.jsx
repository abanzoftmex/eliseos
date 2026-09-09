import React from 'react';
import ModuleErrorBoundary from '../errors/ModuleErrorBoundary';
import { AuthProvider as FinanzasAuthProvider } from '../../modules/finanzas/context/AuthContext';
import { ToastProvider } from '../../modules/finanzas/components/ui/Toast';

export default function FinanzasModuleWrapper({ children, pageName = 'Finanzas' }) {
  return (
    <ModuleErrorBoundary moduleName={`Finanzas - ${pageName}`}>
      <FinanzasAuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </FinanzasAuthProvider>
    </ModuleErrorBoundary>
  );
}
