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

  return (
    <aside className="w-64 bg-[#0d121d] border-r border-[#1a2234] flex flex-col justify-between shrink-0 h-screen sticky top-0 p-5 select-none">
      {/* Brand Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 py-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">
            D
          </div>
          <span className="text-xl font-bold text-white tracking-tight">DataPulse</span>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1e293b]/90 text-[#38bdf8] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#131926]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 border-t border-[#1a2234] flex items-center justify-between px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
            {user?.role === 'ADMIN' ? 'A' : user?.role === 'ANALYST' ? 'AN' : 'V'}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-slate-300 truncate">
              Signed in as <span className="font-semibold text-white capitalize">{user?.role?.toLowerCase() || 'Admin'}</span>
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Log out"
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
