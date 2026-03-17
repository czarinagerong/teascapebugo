import { Link } from 'react-router';
import { MapPin, Clock, Phone, Facebook, Instagram } from 'lucide-react';
import logoImg from '@/assets/25bad855a6e16ed5f99dc7fed8e107dee7cee23d.png';

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a0e05' }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <img src={logoImg} alt="Teascape Bugo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="text-white tracking-[0] text-sm"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                >
                  TEASCAPE
                </span>
                <span
                  className="tracking-[0.28em] text-[9px] uppercase mt-0.5"
                  style={{ color: '#ffffff', fontFamily: 'var(--font-body)' }}
                >
                  BUGO
                </span>
              </div>
            </div>
            <p className="text-white/70 text-sm italic mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              "Escape the Reality"
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Your cozy escape in the heart of Bugo, CDO — where every sip takes you somewhere peaceful.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-white/50 mb-4">Find Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/80">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#b88917' }} />
                <span>Bugo Highway, Beside Diesto Clinic, CDO</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80">
                <Phone className="w-4 h-4 shrink-0" style={{ color: '#b88917' }} />
                <span>09053957046</span>
              </li>
            </ul>
          </div>

          {/* Hours + Social */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-white/50 mb-4">Hours &amp; Social</h3>
            <ul className="space-y-2 mb-5">
              <li className="flex items-start gap-3 text-sm text-white/80">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b88917' }} />
                <div>
                  <div>Mon – Sat: 7:00 AM – 9:00 PM</div>
                  <div>Sun: 1:00 PM – 7:00 PM</div>
                </div>
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/teascapebugobranch/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/teascape_cafe?utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">© 2026 Teascape Bugo. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link to="/about" className="hover:text-white/70 transition-colors">About</Link>
            <Link to="/menu" className="hover:text-white/70 transition-colors">Menu</Link>
            <Link to="/staff/login" className="hover:text-white/70 transition-colors">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}