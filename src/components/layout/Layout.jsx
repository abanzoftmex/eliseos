import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { User, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';
import Breadcrumbs from '../common/Breadcrumbs';
import BackButton from '../common/BackButton';
import AuthDebug from '../AuthDebug';
import useSidebarStore from '../../store/sidebarStore';

const Layout = ({
  children,
  title = 'Elíseos Box & Fitness',
  breadcrumbs = null,
  showBreadcrumbs = true,
  hideSidebar = false
}) => {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sistema de Gestión — Elíseos Box & Fitness" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-science-50/50">
        {!hideSidebar && <Sidebar />}

        <div className={`transition-all duration-500 ease-in-out ${!hideSidebar ? (isCollapsed ? 'lg:pl-20' : 'lg:pl-64') : ''}`}>
          {/* Top Navigation Bar with Glassmorphism */}
          {showBreadcrumbs && (
            <div className="sticky top-0 z-30 glass border-b border-science-200/50 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 no-print flex items-center justify-between">
              <div className="flex flex-col gap-1 ml-12 lg:ml-0">
                <Breadcrumbs items={breadcrumbs} />
                <div className="flex items-center gap-4">
                  <BackButton />
                  {title && <h2 className="text-xl font-black text-science-900 tracking-tight hidden sm:block">{title.split(' - ')[0]}</h2>}
                </div>
              </div>

              {/* Profile Shortcut Widget */}
              <div className="flex items-center gap-3">
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 bg-white hover:bg-science-50 text-science-900 border border-science-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:border-[#1c4040]/30 hover:shadow-md"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#1c4040] text-[#c2ef03] flex items-center justify-center text-[10px] font-black">
                    <User size={14} />
                  </div>
                  <span className="hidden sm:inline">Mi Perfil</span>
                </Link>

                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-science-200">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-science-500 uppercase tracking-widest">Sistema Activo</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Content with Fade-in animation */}
          <main className="animate-fade-in p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        <AuthDebug />

        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            className: 'glass shadow-2xl border-none text-science-900 font-medium rounded-2xl',
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '16px 24px',
            },
            success: {
              iconTheme: {
                primary: '#0ea5e9',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </>
  );
};

export default Layout;