import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  UploadCloud, 
  History, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Eye, 
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenUpload, onRefreshCache, isRefreshing }) => {
  const { user, logout, isAnalyst } = useAuth();
  const location = useLocation();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        );
      case 'ANALYST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserCheck className="w-3 h-3" /> Analyst
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Eye className="w-3 h-3" /> Viewer
          </span>
        );
    }
  };

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">Sales<span className="text-blue-500">Pulse</span></span>
                <span className="text-[10px] block text-slate-400 -mt-1 font-mono uppercase tracking-widest">Async Analytics</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-slate-800 text-blue-400'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/history'
                    ? 'bg-slate-800 text-blue-400'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" /> Import History
              </Link>
            </div>
          </div>

          {/* Action Buttons & Profile */}
          <div className="flex items-center gap-3">
            {onRefreshCache && (
              <button
                onClick={onRefreshCache}
                disabled={isRefreshing}
                title="Bust Redis Cache and Refresh Aggregates"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            )}

            {isAnalyst && onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload CSV</span>
              </button>
            )}

            {/* User info dropdown / logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-200">{user?.username || user?.email}</p>
                <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
