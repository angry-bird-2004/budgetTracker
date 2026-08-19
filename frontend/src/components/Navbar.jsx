import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-emerald-500/60 hover:text-emerald-300"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-indigo-500/60 hover:text-indigo-300"
          >
            Analytics
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs text-slate-300 sm:text-sm">Welcome, {user.username}</span>
        <button onClick={() => { logout(); navigate('/login'); }} className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-medium text-white sm:px-4 sm:text-sm">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;