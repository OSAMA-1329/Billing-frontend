import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

const navGroups: { label: string; items: { to: string; label: string; roles: Role[] }[] }[] = [
  { label: 'Workspace', items: [
    { to: '/', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { to: '/sales', label: 'Sales & billing', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { to: '/purchase', label: 'Purchases', roles: ['ADMIN', 'MANAGER'] },
  ] },
  { label: 'Inventory', items: [
    { to: '/products', label: 'Products', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { to: '/suppliers', label: 'Suppliers', roles: ['ADMIN', 'MANAGER'] },
    { to: '/customers', label: 'Customers', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { to: '/stock', label: 'Stock', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  ] },
  { label: 'Manage', items: [
    { to: '/reports', label: 'Reports', roles: ['ADMIN', 'MANAGER'] },
    // { to: '/users', label: 'Users', roles: ['ADMIN'] },
    { to: '/settings', label: 'Settings', roles: ['ADMIN', 'MANAGER'] },
  ] },
];

export function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = navGroups.flatMap((group) => group.items).find((item) => item.to === location.pathname);

  return (
    <div className="app-shell min-h-screen lg:flex">
      <aside className="app-sidebar no-print">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span><strong>Shop POS</strong><small>Billing workspace</small></span>
        </div>
        <nav className="app-navigation" aria-label="Main navigation">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => hasRole(...item.roles));
            if (!visibleItems.length) return null;
            return <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              {visibleItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>
                <span className="nav-indicator" aria-hidden="true" />{item.label}
              </NavLink>)}
            </div>;
          })}
        </nav>
        <div className="sidebar-account">
          <span className="account-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? 'U'}</span>
          <span className="account-copy"><strong>{user?.name}</strong><small>{user?.role}</small></span>
          <button
            type="button"
            className="btn-secondary logout-button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-topbar no-print">
          <div><span className="topbar-kicker">SHOP OPERATIONS</span><strong>{activeItem?.label ?? 'Workspace'}</strong></div>
          <span className="topbar-date">{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span>
        </div>
        <div className="app-content"><Outlet /></div>
      </main>
    </div>
  );
}
