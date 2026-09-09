
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  Menu, 
  X, 
  FileText, 
  UserPlus, 
  Package, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Building2, 
  MapPin, 
  ShoppingBag, 
  CircleDollarSign, 
  ExternalLink,
  Users
} from 'lucide-react';
import useSidebarStore from '../../store/sidebarStore';
import useAuthStore from '../../store/authStore';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const setSucursales = useSucursalStore((state) => state.setSucursales);
  const router = useRouter();

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const q = query(collection(db, 'sucursales'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const sucursalesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSucursales(sucursalesData);
      } catch (error) {
        console.error('Error fetching sucursales for sidebar:', error);
      }
    };

    fetchSucursales();
  }, [setSucursales]);

  const pathname = router.pathname;
  const { hasAccess, isAuthenticated, logout } = useAuthStore();

  const allMenuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      active: pathname === '/dashboard',
      permission: 'dashboard'
    },
    {
      id: 'directorio',
      name: 'Personal Interno',
      icon: Users,
      href: '/directorio',
      active: pathname === '/directorio',
      permission: 'directorio'
    },
    {
      id: 'clientes',
      name: 'Miembros',
      icon: UserPlus,
      href: '/clientes',
      active: pathname === '/clientes',
      permission: 'clientes'
    },
    {
      id: 'paquetes',
      name: 'Paquetes / Planes',
      icon: Package,
      href: '/paquetes',
      active: pathname.startsWith('/paquetes'),
      permission: 'paquetes'
    },
    {
      id: 'productos',
      name: 'Productos Únicos',
      icon: ShoppingBag,
      href: '/productos',
      active: pathname.startsWith('/productos'),
      permission: 'productos'
    },
    {
      id: 'punto-de-venta',
      name: 'Punto de Venta',
      icon: CircleDollarSign,
      href: '/punto-de-venta',
      active: pathname.startsWith('/punto-de-venta'),
      permission: 'productos'
    },
    {
      id: 'clases',
      name: 'Actividades',
      icon: Calendar,
      href: '/clases',
      active: pathname.includes('/clases') && !pathname.includes('/calendar'),
      permission: 'clases'
    },
    {
      id: 'calendario',
      name: 'Calendario',
      icon: Calendar,
      href: '/clases/calendar',
      active: pathname.includes('/calendar'),
      permission: 'calendario'
    },
    {
      id: 'configuracion',
      name: 'Configuración',
      icon: Settings,
      href: '/configuracion',
      active: pathname === '/configuracion',
      permission: 'configuracion'
    },
    {
      id: 'sucursales',
      name: 'Sucursales',
      icon: Building2,
      href: '/sucursales',
      active: pathname === '/sucursales',
      permission: 'sucursales'
    },
    {
      id: 'finanzas',
      name: 'Finanzas',
      icon: CircleDollarSign,
      href: '/finanzas/dashboard',
      active: pathname.startsWith('/finanzas'),
      permission: 'finanzas'
    }
  ];

  const menuItems = isAuthenticated
    ? allMenuItems.filter(item => hasAccess(item.permission))
    : allMenuItems;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      setSidebarOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      logout();
      router.push('/');
    }
  };

  const MenuItem = ({ item }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const Icon = item.icon;

    return (
      <li
        className="relative mb-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Link
          href={item.href}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5 gap-3'}
            ${item.active
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-science-400 hover:text-white hover:bg-science-800'
            }
          `}
        >
          <Icon
            size={20}
            className={`transition-transform duration-200 ${!isCollapsed && item.active ? '' : 'group-hover:scale-110'}`}
          />
          {!isCollapsed && (
            <span className="font-medium text-sm tracking-tight">{item.name}</span>
          )}
        </Link>

        {isCollapsed && showTooltip && (
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-science-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-md shadow-2xl whitespace-nowrap z-50 animate-fade-in border border-science-700">
            {item.name}
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl text-science-600 bg-white shadow-xl border border-science-100 transition-all active:scale-95"
      >
        <Menu size={22} />
      </button>

      <aside className={`
        hidden lg:block fixed inset-y-0 left-0 z-40 bg-science-900 border-r border-science-800 shadow-2xl
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        <div className="relative h-full flex flex-col">
          <div className={`flex items-center transition-all duration-300 relative ${isCollapsed ? 'justify-center py-8 px-2' : 'gap-3 p-8'}`}>
            <img
              src="/img/logo_dark.png"
              alt="Logo"
              className={`transition-all duration-500 ${isCollapsed ? 'w-10' : 'w-32'}`}
            />

            <button
              onClick={toggleSidebar}
              className="absolute -right-3 top-10 bg-science-800 hover:bg-primary text-white p-1 rounded-full border border-science-700 shadow-lg transition-all z-50 group"
            >
              {isCollapsed ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
            </button>
          </div>

          <div className={`px-4 mb-6 ${isCollapsed ? 'hidden' : 'block'}`}>
            <div className="bg-science-800/50 rounded-xl p-3 border border-science-700/50">
              <label className="text-[10px] text-science-400 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" />
                Sucursal Activa
              </label>
              <select
                value={useSucursalStore((state) => state.selectedSucursal)}
                onChange={(e) => useSucursalStore.getState().setSucursal(e.target.value)}
                className="w-full bg-science-900 text-white text-xs rounded-lg border border-science-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none py-2 px-2 transition-all cursor-pointer hover:bg-science-800"
              >
                <option value={ALL_SUCURSALES_ID}>Todas las sedes</option>
                {useSucursalStore((state) => state.sucursales).map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.name}</option>
                ))}
              </select>
            </div>
          </div>

          <nav className={`flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'px-3' : 'px-4'}`}>
            {!isCollapsed && (
              <p className="text-[10px] font-black text-science-500 uppercase tracking-[0.2em] mb-4 px-2">
                Menú Principal
              </p>
            )}
            <ul>
              {menuItems.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </ul>
          </nav>

          <div className="mt-auto p-4 space-y-2">

            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center rounded-xl transition-all duration-200 group text-red-400 hover:text-white hover:bg-red-500/20
                ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5 gap-3'}
              `}
            >
              <LogOut size={20} />
              {!isCollapsed && <span className="font-medium text-sm">Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`
        lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-science-900 border-r border-science-800 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col
        ${sidebarOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-5 border-b border-science-800">
          <img src="/img/logo_dark.png" alt="Logo" className="h-9 w-auto" />
          <button onClick={() => setSidebarOpen(false)} className="text-science-400 hover:text-white transition-colors p-1.5 rounded-lg">
            <X size={22} />
          </button>
        </div>

        {/* Selector de Sucursal en Móvil */}
        <div className="p-4 border-b border-science-800/80">
          <div className="bg-science-800/60 rounded-xl p-3 border border-science-700/50">
            <label className="text-[10px] text-science-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              Sucursal Activa
            </label>
            <select
              value={useSucursalStore((state) => state.selectedSucursal)}
              onChange={(e) => useSucursalStore.getState().setSucursal(e.target.value)}
              className="w-full bg-science-900 text-white text-xs rounded-lg border border-science-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none py-2 px-2 transition-all cursor-pointer"
            >
              <option value={ALL_SUCURSALES_ID}>Todas las sedes</option>
              {useSucursalStore((state) => state.sucursales).map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>{sucursal.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navegación Scrollable */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center p-3 rounded-xl transition-all gap-3
                    ${item.active ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' : 'text-science-400 hover:bg-science-800 font-medium'}
                  `}
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer móvil: Salir */}
        <div className="p-4 border-t border-science-800 space-y-2 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-science-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-500" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;