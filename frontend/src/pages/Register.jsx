import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await register({ username, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>
        {error && <div className="bg-rose-500/10 border border-rose-500 text-rose-400 p-3 rounded mb-4 text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block text-slate-400 text-sm mb-2">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" required />
        </div>
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
          {isSubmitting ? 'Creating Account...' : 'Register'}
        </button>
        <p className="text-slate-400 text-sm text-center mt-4">Already have an account? <Link to="/login" className="text-indigo-400 hover:underline">Sign In</Link></p>
      </form>
    </div>
  );
};

export default Register;