import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Terry's Auto Service
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {user?.role === 'admin' ? (
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
              </>
            ) : (
              <>
                <Link to="/portal" className="text-gray-600 hover:text-gray-900">
                  My Invoices
                </Link>
                <Link to="/bookings" className="text-gray-600 hover:text-gray-900">
                  Book Appointment
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
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
            {user?.role === 'admin' ? (
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
              </>
            ) : (
              <>
                <Link
                  to="/portal"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  My Invoices
                </Link>
                <Link
                  to="/bookings"
                  className="block text-gray-600 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  Book Appointment
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left text-gray-600 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
