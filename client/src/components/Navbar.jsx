import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name = '') {
  const colors = ['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-indigo-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchCount = () => {
      api.get('/notifications')
        .then(({ data }) => setUnreadCount(data.unreadCount ?? 0))
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCount(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  const navLinks = user ? (
    <>
      <NavLink to="/">Browse</NavLink>
      {user.role === 'provider' && (
        <>
          <NavLink to="/my-gigs">My Gigs</NavLink>
          <NavLink to="/create-gig">Create Gig</NavLink>
          <NavLink to="/dashboard/provider">Orders</NavLink>
        </>
      )}
      {user.role === 'client' && <NavLink to="/dashboard/client">My Orders</NavLink>}
      {isAdmin && <NavLink to="/dashboard/admin">Admin</NavLink>}
    </>
  ) : (
    <NavLink to="/">Browse</NavLink>
  );

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-brand-500 mb-0.5" />
          <span className="text-lg font-bold text-gray-900 tracking-tight">GigMarket</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Avatar + logout */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-xs font-bold cursor-default`}>
                  {getInitials(user.name)}
                </div>
                <button onClick={handleLogout} className="hidden md:block btn-secondary text-xs px-3 py-1.5">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs px-3 py-1.5">Login</Link>
              <Link to="/register" className="btn-primary text-xs px-3 py-1.5">Register</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navLinks}
          {user ? (
            <button onClick={handleLogout} className="btn-secondary text-sm mt-2 w-full">Logout</button>
          ) : (
            <div className="flex gap-2 mt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-sm">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-sm">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
