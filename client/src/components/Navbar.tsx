import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const adminLinks = [
  ['/dashboard', 'Dashboard'], ['/invoices', 'Invoices'], ['/expenses', 'Expenses'],
  ['/customers', 'Customers'], ['/gallery', 'Gallery'], ['/messages', 'Messages'], ['/profile', 'Profile'],
] as const;
const publicLinks = [['/#services', 'Services'], ['/#work', 'Recent work'], ['/#contact', 'Contact']] as const;

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  React.useEffect(() => setIsOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navLinkClass = ({ isActive }: { isActive: boolean }) => `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`;
  const mobileLinks = isAdmin ? adminLinks : isCustomer
    ? [['/portal', 'Overview'], ['/bookings', 'Appointments'], ['/profile', 'Profile']] as const
    : publicLinks;

  return (
    <header className={`app-header ${isAdmin ? 'app-header-admin' : ''}`}>
      <div className="app-header-inner">
        <Link to="/" className="app-logo" aria-label="Terry's Auto Service home">
          <img src="/terrysautoservice.png" alt="Terry's Auto Service" />
        </Link>
        <nav className="app-desktop-nav" aria-label="Primary navigation">
          {isAdmin ? adminLinks.map(([to, label]) => <NavLink key={to} to={to} className={navLinkClass}>{label}</NavLink>)
            : isCustomer ? <>
              <NavLink to="/portal" className={navLinkClass}>Overview</NavLink>
              <NavLink to="/bookings" className={navLinkClass}>Appointments</NavLink>
              <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
            </> : <>
              {publicLinks.map(([to, label]) => <a key={to} href={to} className="app-nav-link">{label}</a>)}
              <Link to="/login" className="app-nav-link">Client login</Link>
            </>}
          {user ? <button type="button" onClick={handleLogout} className="app-logout"><LogOut size={17} /> Log out</button>
            : <Link to="/login" className="app-header-cta">Request service</Link>}
        </nav>
        <button type="button" className="app-menu-button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? 'Close navigation' : 'Open navigation'}>
          {isOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
      {isOpen && <nav className="app-mobile-nav" aria-label="Mobile navigation">
        {mobileLinks.map(([to, label]) => to.startsWith('/#') ? <a key={to} href={to}>{label}</a> : <NavLink key={to} to={to}>{label}</NavLink>)}
        {user ? <button type="button" onClick={handleLogout}><LogOut size={17} /> Log out</button>
          : <Link to="/login"><ExternalLink size={17} /> Client login</Link>}
      </nav>}
    </header>
  );
};

export default Navbar;
