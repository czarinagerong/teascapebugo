import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from '@/assets/a58984f54ad91e81d0092651b39781fd09a3710d.png';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  { label: 'About', path: '/about' },
  { label: 'Track Order', path: '/track' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartCount } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid rgba(107,63,30,0.12)' }} className="sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
              <img src={logoImg} alt="Teascape Bugo Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="tracking-[0.04em] text-[20px]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#2e210e' }}
              >
                TEASCAPE
              </span>
              <span
                className="tracking-[0.28em] text-[9px] uppercase mt-0.5"
                style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}
              >
                BUGO
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="transition-colors text-xs font-semibold uppercase tracking-widest"
                style={{
                  color: isActive(link.path) ? '#b88917' : '#2e210e',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/menu"
              className="px-5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-90"
              style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
            >
              Order Now
            </Link>
            <button
              onClick={() => navigate('/menu', { state: { focusSearch: true } })}
              className="relative p-2 rounded-full transition-colors"
              style={{ color: '#2e210e' }}
              aria-label="Search menu"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-full transition-colors"
              style={{ color: '#2e210e' }}
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#b88917', color: '#fff' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/menu', { state: { focusSearch: true } })}
              className="p-2"
              style={{ color: '#2e210e' }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/cart')} className="relative p-2" style={{ color: '#2e210e' }} aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#b88917', color: '#fff' }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 transition-colors"
              style={{ color: '#2e210e' }}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t pt-3" style={{ borderColor: 'rgba(107,63,30,0.15)' }}>
            <div className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold uppercase tracking-widest"
                  style={{
                    color: isActive(link.path) ? '#b88917' : '#2e210e',
                    backgroundColor: isActive(link.path) ? 'rgba(184,137,23,0.08)' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/menu"
                onClick={() => setMobileOpen(false)}
                className="mt-2 mx-4 py-2.5 rounded-md text-center text-sm font-semibold uppercase tracking-wider"
                style={{ backgroundColor: '#b88917', color: '#fff' }}
              >
                Order Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
