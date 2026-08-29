import React, { useContext } from 'react';
import { AuthContext } from '../context/auth-session.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const navButtonClass = (active, hoverClass) =>
  `rounded-lg border px-3 py-1.5 text-[11px] font-medium transition active:scale-[0.98] ${
    active
      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
      : `border-slate-700 bg-slate-800/80 text-slate-200 ${hoverClass}`
  }`;

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="bg-slate-900/90 text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 shadow-[0_12px_30px_rgba(15,23,42,0.35)] rounded-2xl border border-slate-800/80 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <h1 className="text-lg font-bold tracking-wide cursor-pointer sm:text-xl" onClick={() => navigate('/')}>
          Envelope Budget
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={navButtonClass(location.pathname === '/', 'hover:border-emerald-500/60 hover:text-emerald-300')}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className={navButtonClass(location.pathname === '/analytics', 'hover:border-indigo-500/60 hover:text-indigo-300')}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className={navButtonClass(location.pathname === '/settings', 'hover:border-amber-500/60 hover:text-amber-300')}
          >
            Settings
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs text-slate-300 sm:text-sm">Welcome, {user.username}</span>
        <button
          type="button"
          onClick={() => { logout(); navigate('/login'); }}
          className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-medium text-white sm:px-4 sm:text-sm active:scale-[0.98] transition-transform"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;