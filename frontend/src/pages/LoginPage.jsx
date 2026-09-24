import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    let demoEmail = 'admin@salespulse.dev';
    let demoPass = 'Password123!';
    let demoUser = 'adminuser';

    if (role === 'ANALYST') {
      demoEmail = 'analyst@salespulse.dev';
      demoUser = 'testanalyst';
    } else if (role === 'VIEWER') {
      demoEmail = 'viewer@salespulse.dev';
      demoUser = 'viewerdemo';
    }

    try {
      // Attempt login
      await login(demoEmail, demoPass);
      navigate('/');
    } catch {
      // If user does not exist yet, auto-register then login!
      try {
        const { authApi } = await import('../api/auth');
        await authApi.register({
          username: demoUser,
          email: demoEmail,
          password: demoPass,
          confirm_password: demoPass,
          role: role,
          company_name: 'SalesPulse Demo Corp',
        });
        await login(demoEmail, demoPass);
        navigate('/');
      } catch (regErr) {
        setError('Could not auto-provision demo account. Please try manual registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20 mx-auto mb-3">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales<span className="text-blue-500">Pulse</span></h1>
          <p className="text-xs text-slate-400 mt-1">High-Throughput CSV Analytics Platform</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-400 mb-5">Enter your credentials to access the analytics workspace</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@salespulse.dev"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Freshers / Interviewers */}
          <div className="mt-6 pt-5 border-t border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Evaluator Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-semibold text-rose-400 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ANALYST')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-semibold text-blue-400 transition-colors"
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('VIEWER')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-semibold text-emerald-400 transition-colors"
              >
                Viewer
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
