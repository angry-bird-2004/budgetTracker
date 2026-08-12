import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold tracking-wide cursor-pointer" onClick={() => navigate('/')}>
        Envelope Budget
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-300">Welcome, {user.username}</span>
        <button onClick={() => { logout(); navigate('/login'); }} className="bg-rose-600 hover:bg-rose-700 px-4 py-1.5 rounded text-sm font-medium transition">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;