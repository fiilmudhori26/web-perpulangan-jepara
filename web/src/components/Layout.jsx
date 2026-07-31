import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { logout as apiLogout } from '../api/auth';

// Heroicons outline
import {
  HomeIcon,
  UsersIcon,
  TruckIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/students', label: 'Santri', icon: UsersIcon },
  { to: '/homecoming', label: 'Pulang', icon: TruckIcon },
  { to: '/payments', label: 'Pembayaran', icon: CreditCardIcon },
  { to: '/finance', label: 'Keuangan', icon: BanknotesIcon },
  { to: '/reports', label: 'Laporan', icon: DocumentChartBarIcon },
];

const adminMenus = [
  { to: '/periods', label: 'Kelola Periode', icon: CalendarDaysIcon },
  { to: '/settings', label: 'Pengaturan', icon: Cog6ToothIcon },
];

export default function Layout() {
  const { admin, setAdmin, isLoggedIn } = useAuth();
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = brand?.name || 'SantriFlow';
  const displayShort = brand?.shortName || 'SantriFlow';

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAdmin(null);
    navigate('/');
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-neo-bg">
      <Outlet />
    </div>
  );

  return (
    <div className="min-h-screen bg-neo-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-neo-sidebar flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        shadow-xl shadow-black/20
      `}>
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-emerald-800/50">
          <img src="/logo.jpg" alt={displayShort} className="h-10 w-10 rounded-xl object-cover ring-2 ring-emerald-500/30 shadow-lg" onError={(e) => { e.target.style.display = 'none' }} />
          <div>
            <div className="text-[9px] font-bold text-emerald-400/80 tracking-[0.2em] uppercase">Admin Panel</div>
            <div className="text-base font-bold text-white leading-tight">{displayName}</div>
          </div>
          <button className="lg:hidden ml-auto p-1 text-emerald-300/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-1">
          <div className="px-3 py-2 text-[9px] font-bold text-emerald-400/40 tracking-[0.15em] uppercase">
            Menu Utama
          </div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'active bg-emerald-600/30 text-white font-semibold shadow-sm'
                  : 'text-emerald-100/70 hover:bg-neo-sidebar-hover hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-3 border-t border-emerald-800/40">
            <div className="px-3 py-2 text-[9px] font-bold text-emerald-400/40 tracking-[0.15em] uppercase">
              Administrasi
            </div>
            {adminMenus.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'active bg-emerald-600/30 text-white font-semibold shadow-sm'
                    : 'text-emerald-100/70 hover:bg-neo-sidebar-hover hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-emerald-800/40">
          <button onClick={handleLogout}
            className="sidebar-item flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200 transition-all duration-200">
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
          {admin && (
            <div className="px-3 py-2 mt-1 text-[10px] font-medium text-emerald-300/50 truncate">
              {admin.name || admin.email}
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header (mobile only) */}
        <header className="lg:hidden bg-white border-b border-neo-border shadow-sm px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-stone-100 transition">
            <Bars3Icon className="w-6 h-6 text-neo-text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt={displayShort} className="h-7 w-7 rounded-lg object-cover ring-1 ring-emerald-500/30 shadow" onError={(e) => { e.target.style.display = 'none' }} />
            <span className="text-sm font-bold text-neo-text-primary">{displayName}</span>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
