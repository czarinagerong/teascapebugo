import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, ShoppingBag, Package, UtensilsCrossed, LogOut } from 'lucide-react';
import teascapeLogoImg from '@/assets/25bad855a6e16ed5f99dc7fed8e107dee7cee23d.png';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getStaffOrders } from '../lib/api';

const navItems = [
  { label: 'Dashboard',     path: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Online Orders', path: '/staff/orders',    icon: ShoppingBag },
  { label: 'Inventory',     path: '/staff/inventory', icon: Package },
  { label: 'Menu Manager',  path: '/staff/menu',      icon: UtensilsCrossed },
];

export function StaffLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { staffToken } = useApp();
  const token = staffToken || sessionStorage.getItem('teascape_staff_session');

  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const prevTotalRef  = useRef<number | null>(null);
  const audioCtxRef   = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!token) return;

    if (Notification.permission === 'default') Notification.requestPermission();

    const checkUpdates = async () => {
      try {
        const orders = await getStaffOrders(token);
        const activeOrders = orders.filter(o => o.status !== 'Delivered').length;
        setActiveOrderCount(activeOrders);

        const currentTotal = orders.length;
        if (prevTotalRef.current !== null && currentTotal > prevTotalRef.current) {
          if (Notification.permission === 'granted') {
            new Notification('Teascape Management', {
              body: '🔔 New Order Received!',
              icon: teascapeLogoImg,
            });
          }
          try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(); osc.stop(ctx.currentTime + 0.4);
          } catch (_) {}
        }
        prevTotalRef.current = currentTotal;
      } catch (err) {
        console.error('Layout Sync Error', err);
      }
    };

    const interval = setInterval(checkUpdates, 3000);
    checkUpdates();
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    sessionStorage.removeItem('teascape_staff_session');
    navigate('/staff/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-screen" style={{ backgroundColor: '#4A2810' }}>
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

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => {
            const Icon     = item.icon;
            const active   = isActive(item.path);
            const isOrders = item.label === 'Online Orders';
            return (
              <Link key={item.path} to={item.path}
                className="relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: active ? 'rgba(184,137,23,0.18)' : 'transparent',
                  color: active ? '#b88917' : 'rgba(255,255,255,0.75)',
                }}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </div>
                {isOrders && activeOrderCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                    {activeOrderCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all text-white/60 hover:text-white/90 hover:bg-white/5">
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ↓ min-w-0 is the critical fix — prevents flex child from exceeding parent width */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0 overflow-x-hidden">
        <Outlet />
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t"
        style={{ backgroundColor: '#4A2810', borderColor: 'rgba(255,255,255,0.1)' }}>
        {navItems.map(item => {
          const Icon     = item.icon;
          const active   = isActive(item.path);
          const isOrders = item.label === 'Online Orders';
          return (
            <Link key={item.path} to={item.path}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-xs transition-colors"
              style={{ color: active ? '#b88917' : 'rgba(255,255,255,0.6)' }}>
              <Icon className="w-5 h-5" />
              <span className="truncate w-full text-center">{item.label.split(' ')[0]}</span>
              {isOrders && activeOrderCount > 0 && (
                <span className="absolute top-1 right-1/4 flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-red-600 text-white text-[8px] font-bold">
                  {activeOrderCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}