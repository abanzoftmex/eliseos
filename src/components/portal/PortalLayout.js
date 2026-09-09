import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Dumbbell, 
  ClipboardList, 
  ShoppingBag, 
  QrCode, 
  Award,
  DoorOpen, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  CircleDollarSign,
  History
} from 'lucide-react';

export const PortalContext = createContext(null);
export function usePortal() { return useContext(PortalContext); }

const NAV = [
  { href: '/portal/dashboard',  icon: LayoutDashboard, label: 'Dashboard'       },
  { href: '/portal/mi-science', icon: Dumbbell,        label: 'Mis Actividades' },
  { href: '/portal/pasaporte',  icon: Award,           label: 'Pasaporte'       },
  { href: '/portal/clinica',    icon: ClipboardList,   label: 'Mi Salud'        },
  { href: '/portal/historial',  icon: History,         label: 'Historial'       },
  { href: '/portal/productos',  icon: ShoppingBag,     label: 'Mis Compras'     },
  { href: '/portal/mi-qr',      icon: QrCode,          label: 'Mi QR'           },
  { href: '/portal/estado-de-cuenta', icon: CircleDollarSign, label: 'Edo. Cuenta' },
  { href: '/portal/accesos',    icon: DoorOpen,        label: 'Mis Accesos'     },
  { href: '/portal/perfil',     icon: UserIcon,        label: 'Mi Perfil'       },
];

const BOTTOM_NAV = NAV.filter(i => 
  ['Dashboard', 'Mis Actividades', 'Historial', 'Mi QR', 'Edo. Cuenta'].includes(i.label)
);

export default function PortalLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [data, setData]                 = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portal-usuarios/me');
        if (!res.ok) { router.replace('/portal/login'); return; }
        setData(await res.json());
      } catch { router.replace('/portal/login'); }
      finally  { setLoading(false); }
    }
    load();
  }, [router]);

  async function handleLogout() {
    try { await fetch('/api/portal-usuarios/logout', { method: 'POST' }); } catch {}
    router.replace('/portal/login');
  }

  const user      = data?.user;
  const firstName = user?.name?.split(' ')[0] || 'Usuario';
  const initial   = firstName.charAt(0).toUpperCase();
  const active    = router.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-science-50">
        <div className="relative">
          <img src="/img/logo_dark.png" alt="Elíseos Box & Fitness" className="w-24 opacity-25 mb-8" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-science-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Iniciando sesión segura
        </p>
      </div>
    );
  }

  return (
    <PortalContext.Provider value={data}>
      <Head>
        <title>Portal | Elíseos Box & Fitness</title>
      </Head>

      <div className="min-h-screen bg-science-50/50 flex flex-col lg:flex-row">
        
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-64 bg-science-900 border-r border-science-800 sticky top-0 h-screen z-50 transition-all duration-300">
          <div className="p-8">
            <img src="/img/logo_dark.png" alt="Logo" className="w-32 mb-10" />
            
            <nav className="space-y-1">
              {NAV.map(item => {
                const Icon = item.icon;
                const isActive = active === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-science-400 hover:text-white hover:bg-science-800'}
                    `}
                  >
                    <Icon size={20} className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    <span className="font-bold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-science-800 bg-science-950/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden border-2 border-primary/30 shadow-lg">
                {user?.foto 
                  ? <img src={user.foto} alt={user.name} className="w-full h-full object-cover" />
                  : <span className="text-white font-black">{initial}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm truncate">{firstName}</p>
                <p className="text-science-500 text-[10px] font-bold uppercase tracking-wider">{user?.type || 'Miembro'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-red-500/20"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* ── MOBILE TOP BAR ── */}
        <header className="lg:hidden glass border-b border-science-200/50 h-16 px-6 flex items-center justify-between sticky top-0 z-50">
          <img src="/img/logo_dark.png" alt="Elíseos Box & Fitness" className="h-8" />
          
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-science-900 border-2 border-primary shadow-lg overflow-hidden flex items-center justify-center"
            >
              {user?.foto 
                ? <img src={user.foto} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold">{initial}</span>
              }
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 bg-transparent" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-3 w-56 glass shadow-2xl rounded-2xl border border-science-200/50 p-2 animate-fade-in overflow-hidden">
                  <div className="p-4 border-b border-science-100 mb-2">
                    <p className="text-science-900 font-black text-sm">{user?.name || firstName}</p>
                    <p className="text-science-500 text-[10px] font-bold uppercase tracking-wider">{user?.type || 'Miembro'}</p>
                  </div>
                  <Link 
                    href="/portal/perfil" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-science-600 hover:bg-science-50 rounded-xl transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon size={18} /> Mi Perfil
                  </Link>
                  <Link 
                    href="/portal/clinica" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-science-600 hover:bg-science-50 rounded-xl transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <ClipboardList size={18} /> Mi Clínica
                  </Link>
                  <Link 
                    href="/portal/estado-de-cuenta" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-science-600 hover:bg-science-50 rounded-xl transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <CircleDollarSign size={18} /> Estado de Cuenta
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all border-t border-science-100 mt-1"
                  >
                    <LogOut size={18} /> Salir
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-x-hidden p-6 lg:p-10 pb-24 lg:pb-10 animate-fade-in">
          {children}
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden glass border-t border-science-200/50 h-16 fixed bottom-0 left-0 right-0 z-50 px-4 flex items-center justify-around">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 h-12 rounded-xl ${isActive ? 'text-primary' : 'text-science-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 shadow-inner' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label.split(' ')[1] || item.label}
                </span>
              </Link>
            );
          })}
        </nav>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </PortalContext.Provider>
  );
}
