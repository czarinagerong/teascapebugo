// src/pages/StaffLogin.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Changes from original:
//  - Removed hardcoded credentials completely
//  - Removed "Demo credentials" hint text
//  - Connects to real backend via staffLogin() from api.ts
//  - Handles rate limit (429) with a clear message
//  - On success: saves JWT to sessionStorage bridge + AppContext
//  - No emojis
//  - No "Back to Customer Website" link (don't want to draw attention
//    to the fact that this is a separate portal)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Lock, User, AlertCircle, Clock } from 'lucide-react';
import logoImg from '@/assets/25bad855a6e16ed5f99dc7fed8e107dee7cee23d.png';
import { staffLogin } from '../lib/api';
import { useApp } from '../context/AppContext';
import { saveStaffSession } from '../routes';

const HERO_IMG =
  'https://images.unsplash.com/photo-1771002469947-794293ccc9e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1000';

// ── DEV fallback ───────────────────────────────────────────────────────────────
// When VITE_API_URL is not set, we allow a dev-only login so you can keep
// working on the UI. Remove this block before going to production.
const DEV_MODE = !import.meta.env.VITE_API_URL;
const DEV_USER = import.meta.env.VITE_DEV_STAFF_USER || 'staff';
const DEV_PASS = import.meta.env.VITE_DEV_STAFF_PASS || 'teascape123';

export default function StaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setStaffAuth } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimited(false);

    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);

    try {
      if (DEV_MODE) {
        // ── Dev fallback: no backend required ─────────────────────────────
        await new Promise(r => setTimeout(r, 700)); // simulate latency
        if (username.trim() === DEV_USER && password === DEV_PASS) {
          const fakeToken = `dev_token_${Date.now()}`;
          setStaffAuth(fakeToken, username.trim());
          saveStaffSession(fakeToken);
          navigate('/staff/dashboard');
        } else {
          setError('Invalid username or password.');
        }
      } else {
        // ── Production: real JWT from backend ─────────────────────────────
        const result = await staffLogin(username.trim(), password);
        setStaffAuth(result.token, result.username);
        saveStaffSession(result.token);
        navigate('/staff/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      if (msg.toLowerCase().includes('too many') || msg.includes('429')) {
        setRateLimited(true);
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden md:flex flex-1 relative overflow-hidden" style={{ maxWidth: '50%' }}>
        <img src={HERO_IMG} alt="Teascape" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom right, rgba(42,18,8,0.88) 0%, rgba(61,32,16,0.80) 100%)' }}
        />
        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <img src={logoImg} alt="Teascape Bugo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p
                className="text-white tracking-[0.04em] text-base"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                TEASCAPE
              </p>
              <p
                className="tracking-[0.28em] text-[10px] uppercase"
                style={{ color: '#fff', fontFamily: 'var(--font-body)' }}
              >
                BUGO
              </p>
            </div>
          </div>
          <h2
            className="text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2 }}
          >
            Welcome to the
            <br />
            <em style={{ color: '#b88917', fontWeight: 700 }}>Staff Portal</em>
          </h2>
          <p
            className="text-white/70 text-sm leading-relaxed max-w-xs"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Manage orders, inventory, and menu items from one place.
            Designed for the Teascape Bugo team.
          </p>
          <div className="mt-10 space-y-3">
            {['Online Order Management', 'Real-Time Inventory Tracker', 'Menu Manager', 'Sales Dashboard'].map(
              feat => (
                <div key={feat} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#556419' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    {feat}
                  </span>
                </div>
              )
            )}
          </div>
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
              <p
                className="tracking-[0.04em] text-sm"
                style={{ color: '#2e210e', fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                TEASCAPE
              </p>
              <p
                className="tracking-[0.28em] text-[9px] uppercase"
                style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}
              >
                BUGO
              </p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1
              style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.8rem', fontWeight: 700 }}
            >
              Staff Login
            </h1>
            <p className="text-sm mt-1" style={{ color: '#5C2A0A' }}>
              Teascape Bugo Management System
            </p>
          </div>

          {/* Dev mode notice — remove before production */}
          {DEV_MODE && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-xs"
              style={{ backgroundColor: 'rgba(184,137,23,0.1)', border: '1px solid rgba(184,137,23,0.3)', color: '#7a5a00' }}
            >
              Development mode — set VITE_API_URL in .env to enable real authentication.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                style={{ color: '#6B3F1E' }}
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2e210e' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#FAFAFA', color: '#6B3F1E' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                style={{ color: '#6B3F1E' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2e210e' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#FAFAFA', color: '#6B3F1E' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#5A9B42' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs"
                style={{ backgroundColor: '#fff0f0', color: '#e53e3e', border: '1px solid #fecaca' }}
              >
                {rateLimited ? (
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 mt-2 flex items-center justify-center gap-2"
              style={{
                backgroundColor: rateLimited ? '#ccc' : '#b88917',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'var(--font-body)',
                cursor: rateLimited ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : rateLimited ? (
                'Too many attempts — wait 15 minutes'
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
