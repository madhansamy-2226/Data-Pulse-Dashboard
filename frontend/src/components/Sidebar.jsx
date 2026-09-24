import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'imports', label: 'Imports', icon: UploadCloud },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getInitials = (role, email) => {
    if (role === 'ADMIN') return 'AD';
    if (role === 'ANALYST') return 'AN';
    if (email) return email.slice(0, 2).toUpperCase();
    return 'US';
  };

  return (
    <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-screen sticky top-0 p-5 select-none shadow-sm">
      {/* Brand Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 py-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center font-bold text-white text-base shadow-sm">
            D
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">DataPulse</span>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#eff6ff] text-[#2563eb]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-700 shrink-0">
            {getInitials(user?.role, user?.email)}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-slate-600 truncate">
              Signed in as <span className="font-semibold text-slate-900 capitalize">{user?.role?.toLowerCase() || 'Admin'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
