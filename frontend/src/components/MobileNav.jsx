import React from 'react';
import { Home, UploadCloud, FileText, User } from 'lucide-react';

export const MobileNav = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'imports', label: 'Files', icon: UploadCloud },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex items-center justify-around z-40 shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-[#2563eb]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xs font-medium">{tab.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 bg-[#2563eb] rounded-full"></span>
            )}
          </button>
        );
      })}
    </div>
  );
};
