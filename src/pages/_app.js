import "@/styles/globals.css";
import Layout from '../components/layout/Layout';
import AuthProvider from '../components/AuthProvider';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import ModuleErrorBoundary from '@/core/errors/ModuleErrorBoundary';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Páginas que no necesitan el Layout operativo de ELISEOS
  const pagesWithoutLayout = ['/', '/login', '/punto-de-venta'];
  const isUserPortalRoute = router.pathname === '/portal' || router.pathname.startsWith('/portal/');
  const isFinanzasRoute = router.pathname === '/finanzas' || router.pathname.startsWith('/finanzas/');
  const isPublicFichaRoute = router.pathname.startsWith('/f/');

  // Identificación del dominio para contención de errores
  const domainName = isUserPortalRoute
    ? 'Portal del Miembro'
    : isFinanzasRoute
    ? 'Administración Financiera'
    : 'Administrador Operativo';

  const shouldRenderWithoutMainLayout =
    pagesWithoutLayout.includes(router.pathname) ||
    isPublicFichaRoute ||
    isUserPortalRoute ||
    isFinanzasRoute;

  return (
    <AuthProvider pageProps={pageProps}>
      <Toaster position="top-right" reverseOrder={false} />
      <ModuleErrorBoundary moduleName={domainName} key={domainName}>
        {shouldRenderWithoutMainLayout ? (
          <Component {...pageProps} />
        ) : (
          <Layout
            title={pageProps.title || 'Elíseos Box & Fitness'}
            breadcrumbs={pageProps.breadcrumbs || null}
            showBreadcrumbs={pageProps.showBreadcrumbs !== false}
          >
            <Component {...pageProps} />
          </Layout>
        )}
      </ModuleErrorBoundary>
    </AuthProvider>
  );
}
