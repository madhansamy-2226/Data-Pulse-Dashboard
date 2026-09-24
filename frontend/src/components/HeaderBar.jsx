import React from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HeaderBar = ({
  title = 'Overview',
  filters,
  onFilterChange,
  filterOptions = { categories: [], regions: [] },
  onOpenUpload,
  onExportPDF,
  isExporting,
  exportSuccess,
}) => {
  const { user } = useAuth();
  const getAvatarInitials = () => {
    if (user?.role === 'ADMIN') return 'AD';
    if (user?.role === 'ANALYST') return 'AN';
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return 'AD';
  };

  return (
    <div className="space-y-3">
      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center">
          {getAvatarInitials()}
        </div>
      </div>

      {/* Main Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Desktop Title & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="hidden md:block text-2xl font-bold text-slate-900 tracking-tight mr-2">
            {title}
          </h1>

          {/* Date Filter Pill */}
          <div className="relative">
            <select
              value={filters.preset || '90'}
              onChange={(e) => {
                const days = e.target.value;
                if (days === 'all') {
                  onFilterChange({ ...filters, start_date: '', end_date: '', preset: 'all' });
                } else {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - parseInt(days, 10));
                  onFilterChange({
                    ...filters,
                    start_date: start.toISOString().split('T')[0],
                    end_date: end.toISOString().split('T')[0],
                    preset: days,
                  });
                }
              }}
              className="bg-[#eff6ff] text-[#2563eb] font-semibold text-xs rounded-full px-4 py-1.5 border border-blue-200 focus:outline-none cursor-pointer appearance-none pr-7 transition-all shadow-sm"
            >
              <option value="90">Last 90 days</option>
              <option value="30">Last 30 days</option>
              <option value="7">Last 7 days</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#2563eb] absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {/* Category Filter Pill (Desktop & Tablet) */}
          <div className="relative hidden sm:block">
            <select
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="bg-white text-slate-600 hover:text-slate-900 font-medium text-xs rounded-full px-4 py-1.5 border border-slate-200 focus:outline-none cursor-pointer appearance-none pr-7 transition-all shadow-sm"
            >
              <option value="all">All categories</option>
              {filterOptions.categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {/* Region Filter Pill (Desktop & Tablet) */}
          <div className="relative hidden sm:block">
            <select
              value={filters.region || 'all'}
              onChange={(e) => onFilterChange({ ...filters, region: e.target.value })}
              className="bg-white text-slate-600 hover:text-slate-900 font-medium text-xs rounded-full px-4 py-1.5 border border-slate-200 focus:outline-none cursor-pointer appearance-none pr-7 transition-all shadow-sm"
            >
              <option value="all">All regions</option>
              {filterOptions.regions?.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons: Import File & Export File */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={onOpenUpload}
            className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            Import File
          </button>

          <button
            onClick={onExportPDF}
            disabled={isExporting}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 ${
              exportSuccess
                ? 'bg-emerald-600 text-white'
                : isExporting
                ? 'bg-blue-700 text-white cursor-wait'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-blue-500/20'
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Downloaded</span>
              </>
            ) : isExporting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <span>Export File</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
