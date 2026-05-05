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
      <Link to="/" className="text-gray-600 hover:text-gray-900" onClick={closeMenu}>
        Home
      </Link>
      <a href="/#services" className="text-gray-600 hover:text-gray-900" onClick={closeMenu}>
        Services
      </a>
      <a href="/#work" className="text-gray-600 hover:text-gray-900" onClick={closeMenu}>
        Work
      </a>
      <a href="/#contact" className="text-gray-600 hover:text-gray-900" onClick={closeMenu}>
        Contact
      </a>
      <Link to="/login" className="text-gray-600 hover:text-gray-900" onClick={closeMenu}>
        Login
      </Link>
    </>
  );

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Terry's Auto Service
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {!authenticatedUser ? (
              publicLinks
            ) : authenticatedUser.role === 'admin' ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/invoices" className="text-gray-600 hover:text-gray-900">
                  Invoices
                </Link>
                <Link to="/expenses" className="text-gray-600 hover:text-gray-900">
                  Expenses
                </Link>
                <Link to="/customers" className="text-gray-600 hover:text-gray-900">
                  Customers
                </Link>
                <Link to="/gallery" className="text-gray-600 hover:text-gray-900">
                  Gallery
                </Link>
                <Link to="/messages" className="text-gray-600 hover:text-gray-900">
                  Messages
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                <a href="/#services" className="text-gray-600 hover:text-gray-900">
                  Services
                </a>
                <a href="/#work" className="text-gray-600 hover:text-gray-900">
                  Work
                </a>
                <a href="/#contact" className="text-gray-600 hover:text-gray-900">
                  Contact
                </a>
                <Link to="/bookings" className="text-gray-600 hover:text-gray-900">
                  Book Appointment
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
              </>
            )}
            {authenticatedUser && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 space-y-2">
            {!authenticatedUser ? (
              <div className="flex flex-col space-y-2">
                {publicLinks}
              </div>
            ) : authenticatedUser.role === 'admin' ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/invoices"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Invoices
                </Link>
                <Link
                  to="/expenses"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Expenses
                </Link>
                <Link
                  to="/customers"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Customers
                </Link>
                <Link
                  to="/gallery"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  to="/messages"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to="/profile"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <a
                  href="/#services"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Services
                </a>
                <a
                  href="/#work"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Work
                </a>
                <a
                  href="/#contact"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </a>
                <Link
                  to="/bookings"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Book Appointment
                </Link>
                <Link
                  to="/profile"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
            {authenticatedUser && (
              <button
                onClick={handleLogout}
                className="w-full text-left text-gray-600 hover:text-red-600"
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
