import React, { useState, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavigationProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive
        ? 'border-blue-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  const getMobileNavLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
      isActive
        ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
    }`;
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon when menu is closed */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon when menu is open */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            <Link to="/" className={getNavLinkClass('/')}>
              Team Overview
            </Link>
            
            <Link to="/morning-overview" className={getNavLinkClass('/morning-overview')}>
              Morning Overview
            </Link>

            <Link to="/team-comparison" className={getNavLinkClass('/team-comparison')}>
              Team Comparison
            </Link>

            <Link to="/pharma-watchlist" className={getNavLinkClass('/pharma-watchlist')}>
              Pharma Interactions
            </Link>
            <Link to="/body-composition" className={getNavLinkClass('/body-composition')}>
              Body Composition
            </Link>
            <Link to="/calendar" className={getNavLinkClass('/calendar')}>
              Calendar
            </Link>
            <Link to="/athlete-notes" className={getNavLinkClass('/athlete-notes')}>
              Athlete Notes
            </Link>
            <Link to="/injuries" className={getNavLinkClass('/injuries')}>
              Injuries
            </Link>
            <Link to="/user-management" className={getNavLinkClass('/user-management')}>
              User Management
            </Link>

            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden mobile-menu`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            onClick={() => handleNavClick('/')}
            className={getMobileNavLinkClass('/')}
          >
            Team Overview
          </Link>
         
          <Link
            to="/morning-overview"
            onClick={() => handleNavClick('/morning-overview')}
            className={getMobileNavLinkClass('/morning-overview')}
          >
            Morning Overview
          </Link>

          <Link
            to="/team-comparison"
            onClick={() => handleNavClick('/team-comparison')}
            className={getMobileNavLinkClass('/team-comparison')}
          >
            Team Comparison
          </Link>

          <Link
            to="/pharma-watchlist"
            onClick={() => handleNavClick('/pharma-watchlist')}
            className={getMobileNavLinkClass('/pharma-watchlist')}
          >
            Pharma Interactions
          </Link>
          <Link
            to="/body-composition"
            onClick={() => handleNavClick('/body-composition')}
            className={getMobileNavLinkClass('/body-composition')}
          >
            Body Composition
          </Link>
          <Link
            to="/calendar"
            onClick={() => handleNavClick('/calendar')}
            className={getMobileNavLinkClass('/calendar')}
          >
            Calendar
          </Link>
          <Link
            to="/athlete-notes"
            onClick={() => handleNavClick('/athlete-notes')}
            className={getMobileNavLinkClass('/athlete-notes')}
          >
            Athlete Notes
          </Link>
          <Link
            to="/injuries"
            onClick={() => handleNavClick('/injuries')}
            className={getMobileNavLinkClass('/injuries')}
          >
            Injuries
          </Link>
          <Link
            to="/user-management"
            onClick={() => handleNavClick('/user-management')}
            className={getMobileNavLinkClass('/user-management')}
          >
            User Management
          </Link>

          <button
            onClick={handleLogout}
            className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default memo(Navigation);