import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const authenticatedUser = user?.role === 'admin' || user?.role === 'customer' ? user : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  const publicLinks = (
    <>
      <Link to="/" className="text-gray-200 hover:text-white" onClick={closeMenu}>
        Home
      </Link>
      <a href="/#services" className="text-gray-200 hover:text-white" onClick={closeMenu}>
        Services
      </a>
      <a href="/#work" className="text-gray-200 hover:text-white" onClick={closeMenu}>
        Work
      </a>
      <a href="/#contact" className="text-gray-200 hover:text-white" onClick={closeMenu}>
        Contact
      </a>
      <Link to="/login" className="text-gray-200 hover:text-white" onClick={closeMenu}>
        Login
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-gray-950 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="brand-font text-3xl font-extrabold uppercase tracking-normal text-white">
            Terry's <span className="text-red-500">Auto</span> Service
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold uppercase tracking-wide">
            {!authenticatedUser ? (
              publicLinks
            ) : authenticatedUser.role === 'admin' ? (
              <>
                <Link to="/dashboard" className="text-gray-200 hover:text-white">
                  Dashboard
                </Link>
                <Link to="/invoices" className="text-gray-200 hover:text-white">
                  Invoices
                </Link>
                <Link to="/expenses" className="text-gray-200 hover:text-white">
                  Expenses
                </Link>
                <Link to="/customers" className="text-gray-200 hover:text-white">
                  Customers
                </Link>
                <Link to="/gallery" className="text-gray-200 hover:text-white">
                  Gallery
                </Link>
                <Link to="/messages" className="text-gray-200 hover:text-white">
                  Messages
                </Link>
                <Link to="/profile" className="text-gray-200 hover:text-white">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-200 hover:text-white">
                  Home
                </Link>
                <a href="/#services" className="text-gray-200 hover:text-white">
                  Services
                </a>
                <a href="/#work" className="text-gray-200 hover:text-white">
                  Work
                </a>
                <a href="/#contact" className="text-gray-200 hover:text-white">
                  Contact
                </a>
                <Link to="/bookings" className="text-gray-200 hover:text-white">
                  Book Appointment
                </Link>
                <Link to="/profile" className="text-gray-200 hover:text-white">
                  Profile
                </Link>
              </>
            )}
            {authenticatedUser && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-200 hover:text-red-400"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>

          <button
            className="rounded border border-white/15 p-2 text-white md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 md:hidden">
            {!authenticatedUser ? (
              <div className="flex flex-col space-y-2">
                {publicLinks}
              </div>
            ) : authenticatedUser.role === 'admin' ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/invoices"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Invoices
                </Link>
                <Link
                  to="/expenses"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Expenses
                </Link>
                <Link
                  to="/customers"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Customers
                </Link>
                <Link
                  to="/gallery"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  to="/messages"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to="/profile"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <a
                  href="/#services"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Services
                </a>
                <a
                  href="/#work"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Work
                </a>
                <a
                  href="/#contact"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </a>
                <Link
                  to="/bookings"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Book Appointment
                </Link>
                <Link
                  to="/profile"
                  className="block text-gray-200 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
            {authenticatedUser && (
              <button
                onClick={handleLogout}
                className="w-full text-left text-gray-200 hover:text-red-400"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
