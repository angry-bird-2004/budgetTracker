import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/auth-session.jsx';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (typeof login !== 'function') {
        setError('Auth is not ready. Refresh the page and try again.');
        return;
      }
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const networkMessage =
        err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot reach the API. Confirm the backend is running on port 5001.'
          : err.message;
      setError(apiMessage || networkMessage || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
        {error && <div className="bg-rose-500/10 border border-rose-500 text-rose-400 p-3 rounded mb-4 text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block text-slate-400 text-sm mb-2">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" required />
        </div>
        <div className="mb-6">
          <label className="block text-slate-400 text-sm mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" required />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 disabled:cursor-not-allowed text-white font-medium py-2 rounded transition-all duration-200 active:scale-[0.98] shadow-sm disabled:shadow-none"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
        <p className="text-slate-400 text-sm text-center mt-4">Don't have an account? <Link to="/register" className="text-indigo-400 hover:underline">Register</Link></p>
      </form>
    </div>
  );
};

export default Login;