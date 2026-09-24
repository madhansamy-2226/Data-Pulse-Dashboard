import React, { useState } from 'react';
import { Filter, Calendar, FileDown, Layers, CheckCircle2 } from 'lucide-react';
import { analyticsApi } from '../api/analytics';

export const FilterBar = ({
  filters,
  onFilterChange,
  filterOptions = { categories: [], regions: [] },
  datasets = [],
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleDatePreset = (days) => {
    if (days === 'all') {
      onFilterChange({ ...filters, start_date: '', end_date: '', preset: 'all' });
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days, 10));

    onFilterChange({
      ...filters,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      preset: days,
    });
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      // Trigger Celery background PDF generation task
      const res = await analyticsApi.exportPDF({
        dataset_id: filters.dataset_id || undefined,
        filters: {
          category: filters.category !== 'all' ? filters.category : undefined,
          region: filters.region !== 'all' ? filters.region : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });

      const reportId = res.report.id;

      // Poll ReportJob status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await analyticsApi.getReportStatus(reportId);
          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsExporting(false);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 4000);
            
            // Download PDF
            await analyticsApi.downloadPDF(reportId, statusRes.file_name);
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsExporting(false);
            alert(`PDF Generation failed: ${statusRes.error_message}`);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsExporting(false);
          console.error('Error polling PDF report:', err);
        }
      }, 1500);

    } catch (err) {
      setIsExporting(false);
      alert('Failed to initiate PDF export.');
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      {/* Filters group */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Dataset Selector */}
        {datasets.length > 0 && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={filters.dataset_id || 'all'}
              onChange={(e) => onFilterChange({ ...filters, dataset_id: e.target.value === 'all' ? '' : e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Datasets Combined</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.total_rows} rows)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date presets */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
          {[
            { label: 'All Time', val: 'all' },
            { label: '7D', val: '7' },
            { label: '30D', val: '30' },
            { label: '90D', val: '90' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => handleDatePreset(item.val)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                (filters.preset || 'all') === item.val
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {filterOptions.categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Region filter */}
        {filterOptions.regions?.length > 0 && (
          <select
            value={filters.region || 'all'}
            onChange={(e) => onFilterChange({ ...filters, region: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Regions</option>
            {filterOptions.regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Export PDF Button */}
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 ${
          exportSuccess
            ? 'bg-emerald-600 text-white'
            : isExporting
            ? 'bg-slate-700 text-slate-300 cursor-wait'
            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/20'
        }`}
      >
        {exportSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
            <span>PDF Ready & Downloaded!</span>
          </>
        ) : isExporting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Generating PDF in Celery...</span>
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            <span>Export PDF Report</span>
          </>
        )}
      </button>
    </div>
  );
};
