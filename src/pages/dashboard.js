import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuthStore from '../store/authStore';
import { hasPermission } from '../utils/permissionsUtils';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  Users, 
  Activity, 
  UserCircle, 
  ChevronRight, 
  ArrowUpRight, 
  Calendar, 
  Box, 
  ClipboardList, 
  TrendingUp,
  LayoutDashboard,
  Clock,
  CheckCircle2
} from 'lucide-react';

function DashboardPage({ initialData }) {
  const router = useRouter();
  const { userRole } = useAuthStore();
  const [totalClientes, setTotalClientes] = useState(initialData?.totalClientes || 0);
  const [patientsWithForms, setPatientsWithForms] = useState(initialData?.patientsWithForms || 0);
  const [totalProfessionals, setTotalProfessionals] = useState(initialData?.totalProfessionals || 0);
  const [weeklyActivities, setWeeklyActivities] = useState(0);
  const [monthlyActivities, setMonthlyActivities] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);

        const clientesRef = collection(db, 'clientes');
        const allClientesSnapshot = await getDocs(clientesRef);
        setTotalClientes(allClientesSnapshot.size);

        const consultasRef = collection(db, 'consultas');
        const completedQuery = query(consultasRef, where('status', '==', 'completed'));
        const completedSnapshot = await getDocs(completedQuery);

        const clientsWithConsultations = new Set();
        completedSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.clienteId) {
            clientsWithConsultations.add(data.clienteId);
          }
        });

        setPatientsWithForms(clientsWithConsultations.size);

        const directorioRef = collection(db, 'directorio');
        const allProfessionalsSnapshot = await getDocs(directorioRef);
        setTotalProfessionals(allProfessionalsSnapshot.size);

        const clasesRef = collection(db, 'clases');
        const allClassesSnapshot = await getDocs(clasesRef);
        const allClasses = allClassesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const getWeekStart = (date) => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = day === 0 ? -6 : -(day - 1);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() + diff);
          weekStart.setHours(0, 0, 0, 0);
          return weekStart;
        };

        const now = new Date();
        const startOfWeek = getWeekStart(now);

        let weeklyCount = 0;
        const diasSemanaMap = {
          'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
          'jueves': 4, 'viernes': 5, 'sabado': 6
        };

        for (let i = 0; i < 7; i++) {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          const dayOfWeek = day.getDay();
          const currentDayString = day.toISOString().split('T')[0];

          allClasses.forEach(clase => {
            if (clase.diasSemana && clase.diasSemana.length > 0) {
              const hasThisDay = clase.diasSemana.some(dia => diasSemanaMap[dia.toLowerCase()] === dayOfWeek);
              if (hasThisDay) weeklyCount++;
            }
            if (clase.fechaEspecifica && clase.fechaEspecifica.split('T')[0] === currentDayString) weeklyCount++;
          });
        }
        setWeeklyActivities(weeklyCount);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let monthlyCount = 0;
        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay();
          const currentDayString = date.toISOString().split('T')[0];

          allClasses.forEach(clase => {
            if (clase.diasSemana && clase.diasSemana.length > 0) {
              const hasThisDay = clase.diasSemana.some(dia => diasSemanaMap[dia.toLowerCase()] === dayOfWeek);
              if (hasThisDay) monthlyCount++;
            }
            if (clase.fechaEspecifica && clase.fechaEspecifica.split('T')[0] === currentDayString) monthlyCount++;
          });
        }
        setMonthlyActivities(monthlyCount);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  const statistics = [
    {
      title: 'Miembros Registrados',
      value: loading ? '...' : totalClientes,
      icon: Users,
      color: 'text-[#1c4040]',
      bgColor: 'bg-[#e8f2f2]',
      borderColor: 'border-[#c6dfdf]',
      href: '/clientes',
      permission: 'clientes'
    },
    {
      title: 'Miembros Activos',
      value: loading ? '...' : patientsWithForms,
      icon: Activity,
      color: 'text-[#1c4040]',
      bgColor: 'bg-[#f4f8f8]',
      borderColor: 'border-[#e8f2f2]',
      href: '/clientes',
      permission: 'clientes'
    },
    {
      title: 'Personal Interno',
      value: loading ? '...' : totalProfessionals,
      icon: UserCircle,
      color: 'text-[#1c4040]',
      bgColor: 'bg-[#e8f2f2]',
      borderColor: 'border-[#c6dfdf]',
      href: '/directorio',
      permission: 'directorio'
    }
  ];

  const quickActions = [
    {
      title: 'Personal Interno',
      description: 'Coaches, staff y entrenadores',
      icon: ClipboardList,
      color: 'bg-[#1c4040]',
      href: '/directorio',
      permission: 'directorio'
    },
    {
      title: 'Miembros',
      description: 'Registro y control de miembros',
      icon: Users,
      color: 'bg-[#265555]',
      href: '/clientes',
      permission: 'clientes'
    },
    {
      title: 'Paquetes',
      description: 'Planes y membresías',
      icon: Box,
      color: 'bg-[#1c4040]',
      href: '/paquetes',
      permission: 'paquetes'
    },
    {
      title: 'Actividades',
      description: 'Control de agenda y clases',
      icon: TrendingUp,
      color: 'bg-[#265555]',
      href: '/clases',
      permission: 'clases'
    }
  ];

  const visibleStatistics = statistics.filter(stat => hasPermission(userRole, stat.permission));
  const visibleQuickActions = quickActions.filter(action => hasPermission(userRole, action.permission));

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-science-900 tracking-tight">Panel de Control</h1>
          <p className="text-science-500 font-medium mt-1 flex items-center gap-2">
            Resumen operativo de <span className="text-primary-dark font-bold">Elíseos Box & Fitness</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-science-100 shadow-sm">
          <Calendar size={18} className="text-primary" />
          <span className="text-sm font-bold text-science-700">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleStatistics.map((stat, index) => (
          <Link key={index} href={stat.href} className="group">
            <div className={`bg-white rounded-[2rem] p-8 border ${stat.borderColor} shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group-hover:-translate-y-1`}>
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-700">
                <stat.icon size={160} />
              </div>
              <div className="relative z-10">
                <div className={`${stat.bgColor} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                  <stat.icon size={28} />
                </div>
                <p className="text-science-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-science-900 tracking-tighter">{stat.value}</h3>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-science-400 group-hover:text-primary transition-colors uppercase tracking-widest">
                  Gestionar <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content: Actions & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-science-900 tracking-tight flex items-center gap-3">
              Módulos Críticos
              <span className="text-[10px] font-black bg-science-100 text-science-600 px-2 py-0.5 rounded-md uppercase tracking-widest">Accesos Rápidos</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleQuickActions.map((action, index) => (
              <Link key={index} href={action.href} className="group">
                <div className="bg-white hover:border-primary/30 p-6 rounded-[1.5rem] border border-science-100 shadow-sm transition-all duration-300 flex items-center gap-6 group-hover:shadow-lg">
                  <div className={`${action.color} text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <action.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-science-900 text-lg leading-tight mb-0.5 group-hover:text-primary transition-colors">{action.title}</h4>
                    <p className="text-science-400 text-sm font-medium leading-snug">{action.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-science-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ArrowUpRight size={18} className="text-science-300 group-hover:text-primary transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Calendar Summary */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-2xl font-black text-science-900 tracking-tight flex items-center gap-3">
            Agenda
            <Clock size={20} className="text-accent" />
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/clases/calendar?view=week" className="block group">
              <div className="bg-science-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group-hover:shadow-primary/20 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 text-white/5 -rotate-12">
                  <Calendar size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10">
                      <Calendar size={22} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full">
                      <CheckCircle2 size={12} />
                      Semanal
                    </div>
                  </div>
                  <h3 className="text-5xl font-black mb-2 tracking-tighter">{loading ? '...' : weeklyActivities}</h3>
                  <p className="text-science-400 font-bold text-xs uppercase tracking-[0.2em]">Sesiones programadas</p>
                </div>
              </div>
            </Link>

            <Link href="/clases/calendar?view=month" className="block group">
              <div className="bg-white p-8 rounded-[2rem] border border-science-100 shadow-lg hover:shadow-xl transition-all duration-500 flex items-center justify-between">
                <div>
                  <p className="text-science-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total Mensual</p>
                  <h3 className="text-4xl font-black text-science-900 tracking-tighter">{loading ? '...' : monthlyActivities}</h3>
                </div>
                <div className="bg-accent/10 p-4 rounded-2xl group-hover:bg-accent group-hover:text-white transition-all duration-500">
                  <TrendingUp size={28} className="text-accent group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      title: "Panel de Control",
      showBreadcrumbs: true,
      requireAuth: true,
      initialData: { totalClientes: 0, patientsWithForms: 0, totalProfessionals: 0 }
    }
  };
}

export default DashboardPage;
