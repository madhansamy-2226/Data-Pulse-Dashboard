import React from 'react';
import { UploadCloud, FileDown, CheckCircle2, ChevronDown } from 'lucide-react';

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
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      {/* Title & Filter Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white tracking-tight mr-2">{title}</h1>

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
            className="bg-[#1e293b] text-[#38bdf8] font-semibold text-xs rounded-full px-4 py-2 border border-blue-500/30 focus:outline-none cursor-pointer appearance-none pr-7 transition-all"
          >
            <option value="90">Last 90 days</option>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
            <option value="all">All time</option>
          </select>
          <ChevronDown className="w-3 h-3 text-[#38bdf8] absolute right-2.5 top-3 pointer-events-none" />
        </div>

        {/* Category Filter Pill */}
        <div className="relative">
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="bg-[#131926] text-slate-300 hover:text-white font-medium text-xs rounded-full px-4 py-2 border border-[#222c42] focus:outline-none cursor-pointer appearance-none pr-7 transition-all"
          >
            <option value="all">All categories</option>
            {filterOptions.categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        {/* Region Filter Pill */}
        <div className="relative">
          <select
            value={filters.region || 'all'}
            onChange={(e) => onFilterChange({ ...filters, region: e.target.value })}
            className="bg-[#131926] text-slate-300 hover:text-white font-medium text-xs rounded-full px-4 py-2 border border-[#222c42] focus:outline-none cursor-pointer appearance-none pr-7 transition-all"
          >
            <option value="all">All regions</option>
            {filterOptions.regions?.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Action Buttons: Import CSV & Export PDF */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-[#131926] hover:bg-[#1a2336] text-slate-200 border border-[#222c42] rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          Import CSV
        </button>

        <button
          onClick={onExportPDF}
          disabled={isExporting}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md flex items-center gap-1.5 ${
            exportSuccess
              ? 'bg-emerald-600 text-white'
              : isExporting
              ? 'bg-blue-700 text-slate-200 cursor-wait'
              : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-blue-500/20'
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
            <span>Export PDF</span>
          )}
        </button>
      </div>
    </div>
  );
};
