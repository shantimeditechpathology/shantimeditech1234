import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Microscope, User, LogOut, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LAB_CONFIG } from '../constants';

export default function Navbar() {
  const { user, profile, logout, isAdmin, isDelivery } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.tests'), path: '/tests' },
    { name: t('nav.packages'), path: '/packages' },
    { name: t('nav.reports'), path: '/reports' },
    { name: t('nav.referral'), path: '/referral' },
  ];

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Microscope className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-neutral-900 tracking-tight">{LAB_CONFIG.name}</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <button className="flex items-center space-x-1 text-neutral-600 hover:text-blue-600 font-medium transition-colors">
                <Globe className="h-4 w-4" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${language === 'en' ? 'text-blue-600 bg-blue-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage('hi')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${language === 'hi' ? 'text-blue-600 bg-blue-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
                >
                  Hindi (हिंदी)
                </button>
              </div>
            </div>
            
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-neutral-600 hover:text-blue-600 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-4">
                {isDelivery && (
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider">
                      Partner
                    </span>
                    <Link
                      to="/delivery"
                      className="text-green-600 font-semibold hover:text-green-700"
                    >
                      Delivery Panel
                    </Link>
                  </div>
                )}
                <Link to="/dashboard" className="flex items-center space-x-1 text-neutral-700 hover:text-blue-600">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{profile?.displayName?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-neutral-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-neutral-600 font-semibold hover:text-blue-600 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-sm"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-neutral-600 hover:text-neutral-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-neutral-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-blue-600 hover:bg-neutral-50"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-blue-600 hover:bg-neutral-50"
                  >
                    Dashboard
                  </Link>
                  {isDelivery && (
                    <Link
                      to="/delivery"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-neutral-50"
                    >
                      Delivery Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-neutral-50"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
