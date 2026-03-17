import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, ShoppingBag, Package, UtensilsCrossed, LogOut, Leaf } from 'lucide-react';
import teascapeLogoImg from '@/assets/25bad855a6e16ed5f99dc7fed8e107dee7cee23d.png';

const navItems = [
  { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Online Orders', path: '/staff/orders', icon: ShoppingBag },
  { label: 'Inventory', path: '/staff/inventory', icon: Package },
  { label: 'Menu Manager', path: '/staff/menu', icon: UtensilsCrossed },
];

export function StaffLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('teascape_staff_auth');
    navigate('/staff/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 min-h-screen"
        style={{ backgroundColor: '#4A2810' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/staff/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#5A9B42' }}>
              <img src={teascapeLogoImg} alt="Teascape Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Teascape</p>
              <p className="text-white/50 text-xs">Management</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: active ? 'rgba(184,137,23,0.18)' : 'transparent',
                  color: active ? '#b88917' : 'rgba(255,255,255,0.75)',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all text-white/60 hover:text-white/90 hover:bg-white/5"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <Outlet />
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t"
        style={{ backgroundColor: '#4A2810', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-xs transition-colors"
              style={{ color: active ? '#b88917' : 'rgba(255,255,255,0.6)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate w-full text-center">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-xs"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}