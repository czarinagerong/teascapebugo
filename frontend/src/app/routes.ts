// src/routes.ts
// ─────────────────────────────────────────────────────────────────────────────
// Changes from original:
//  - requireStaffAuth now checks the staffToken stored in AppContext (in memory)
//    NOT localStorage. localStorage was insecure — anyone could set it in DevTools.
//  - There is NO link to /staff anywhere in the public routes.
//  - The /staff path is not advertised or referenced in any public page.
//  - Staff access requires knowing the URL AND having a valid JWT.
//
// NOTE: React Router loaders run outside React context, so we can't read
// AppContext here directly. Instead we use a module-level token store
// (sessionStorage, cleared on tab close) as a bridge. The real check
// is done server-side — the frontend just decides whether to redirect.
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserRouter, redirect } from 'react-router';
import { PublicLayout } from './components/PublicLayout';
import { StaffLayout } from './components/StaffLayout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentGcash from './pages/PaymentGcash';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import About from './pages/About';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import OnlineOrders from './pages/OnlineOrders';
import Inventory from './pages/Inventory';
import MenuManager from './pages/MenuManager';

// ── Token bridge ──────────────────────────────────────────────────────────────
// We store the JWT in sessionStorage ONLY as a bridge for the loader.
// The actual JWT for API calls lives in AppContext (React state).
// sessionStorage is cleared when the browser tab is closed — much safer
// than localStorage which persists forever.
const SESSION_TOKEN_KEY = 'teascape_staff_session';

export function saveStaffSession(token: string) {
  try { sessionStorage.setItem(SESSION_TOKEN_KEY, token); } catch {}
}

export function clearStaffSession() {
  try { sessionStorage.removeItem(SESSION_TOKEN_KEY); } catch {}
}

export function getStaffSession(): string | null {
  try { return sessionStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}

// ── Route guard ───────────────────────────────────────────────────────────────
function requireStaffAuth() {
  const token = getStaffSession();
  if (!token) {
    return redirect('/staff/login');
  }
  return null;
}

export const router = createBrowserRouter([
  // ── Public customer routes ─────────────────────────────────────────────────
  // NO reference to /staff anywhere here. Not in links, not in comments visible
  // to users, not anywhere the customer can discover it.
  {
    path: '/',
    Component: PublicLayout,
    children: [
      { index: true, Component: Home },
      { path: 'menu', Component: Menu },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'payment', Component: PaymentGcash },
      { path: 'confirmation', Component: OrderConfirmation },
      { path: 'track', Component: OrderTracking },
      { path: 'about', Component: About },
    ],
  },

  // ── Staff login — standalone (no layout) ──────────────────────────────────
  // This route exists but is NOT linked from anywhere on the customer site.
  // The only way to reach it is to know the URL.
  {
    path: '/staff/login',
    Component: StaffLogin,
  },

  // ── Staff portal — protected ───────────────────────────────────────────────
  {
    path: '/staff',
    Component: StaffLayout,
    loader: requireStaffAuth,
    children: [
      { index: true, loader: () => redirect('/staff/dashboard') },
      { path: 'dashboard', Component: StaffDashboard },
      { path: 'orders', Component: OnlineOrders },
      { path: 'inventory', Component: Inventory },
      { path: 'menu', Component: MenuManager },
    ],
  },
]);
