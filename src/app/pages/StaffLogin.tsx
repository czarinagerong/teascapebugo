import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Lock, User, ArrowLeft } from 'lucide-react';
import logoImg from '@/assets/25bad855a6e16ed5f99dc7fed8e107dee7cee23d.png';

const HERO_IMG = 'https://images.unsplash.com/photo-1771002469947-794293ccc9e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1000';

export default function StaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (username === 'staff' && password === 'teascape123') {
      localStorage.setItem('teascape_staff_auth', 'true');
      navigate('/staff/dashboard');
    } else {
      setError('Invalid username or password. Try: staff / teascape123');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden md:flex flex-1 relative overflow-hidden" style={{ maxWidth: '50%' }}>
        <img src={HERO_IMG} alt="Teascape" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(42,18,8,0.88) 0%, rgba(61,32,16,0.80) 100%)' }} />
        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <img src={logoImg} alt="Teascape Bugo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white tracking-[0.04em] text-base" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>TEASCAPE</p>
              <p className="tracking-[0.28em] text-[10px] uppercase" style={{ color: '#fff', fontFamily: 'var(--font-body)' }}>BUGO</p>
            </div>
          </div>
          <h2
            className="text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2 }}
          >
            Welcome to the<br />
            <em style={{ color: '#b88917', fontWeight: 700 }}>Staff Portal</em>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs" style={{ fontFamily: 'var(--font-body)' }}>
            Manage orders, inventory, and menu items —<br />
            all from one place. Designed for the Teascape Bugo team.
          </p>
          <div className="mt-10 space-y-3">
            {['Online Order Management', 'Real-Time Inventory Tracker', 'Menu Manager', 'Sales Dashboard'].map(feat => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#556419' }}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-body)' }}>{feat}</span>
              </div>
            ))}
          </div>
          {/* Back to website */}
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customer Website
          </Link>
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
              <img src={logoImg} alt="Teascape Bugo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="tracking-[0.04em] text-sm" style={{ color: '#2e210e', fontFamily: 'var(--font-display)', fontWeight: 700 }}>TEASCAPE</p>
              <p className="tracking-[0.28em] text-[9px] uppercase" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>BUGO</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.8rem', fontWeight: 700 }}>
              Staff Login
            </h1>
            <p className="text-sm mt-1" style={{ color: '#5C2A0A' }}>Teascape Bugo Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2e210e' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    borderColor: 'rgba(107,63,30,0.2)',
                    backgroundColor: '#FAFAFA',
                    color: '#6B3F1E',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2e210e' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    borderColor: 'rgba(107,63,30,0.2)',
                    backgroundColor: '#FAFAFA',
                    color: '#6B3F1E',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#5A9B42' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#fff0f0', color: '#e53e3e', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 mt-2 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#b88917', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Back to website - mobile */}
          <p className="text-center text-xs mt-4">
            <Link to="/" className="inline-flex items-center gap-1" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>
              <ArrowLeft className="w-3 h-3" /> Back to Customer Website
            </Link>
          </p>
          <p className="text-center text-xs mt-2" style={{ color: 'rgba(61,32,16,0.5)', fontFamily: 'var(--font-body)' }}>
            Demo credentials: <strong>staff</strong> / <strong>teascape123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}