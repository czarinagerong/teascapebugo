import { createBrowserRouter, redirect } from 'react-router';
import { PublicLayout } from './components/PublicLayout';
import { StaffLayout } from './components/StaffLayout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentGcash from './pages/PaymentGcash';
import OrderConfirmation from './pages/OrderConfirmation';
import About from './pages/About';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import OnlineOrders from './pages/OnlineOrders';
import Inventory from './pages/Inventory';
import MenuManager from './pages/MenuManager';

function requireStaffAuth() {
  const auth = localStorage.getItem('teascape_staff_auth');
  if (!auth) {
    return redirect('/staff/login');
  }
  return null;
}

export const router = createBrowserRouter([
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
      { path: 'about', Component: About },
    ],
  },
  {
    path: '/staff/login',
    Component: StaffLogin,
  },
  {
    path: '/staff',
    Component: StaffLayout,
    loader: requireStaffAuth,
    children: [
      { path: 'dashboard', Component: StaffDashboard },
      { path: 'orders', Component: OnlineOrders },
      { path: 'inventory', Component: Inventory },
      { path: 'menu', Component: MenuManager },
    ],
  },
]);
