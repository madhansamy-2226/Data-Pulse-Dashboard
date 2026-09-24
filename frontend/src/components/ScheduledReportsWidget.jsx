import React from 'react';
import { Download } from 'lucide-react';

export const ScheduledReportsWidget = ({ onDownloadLatest, isDownloading }) => {
  return (
    <div className="bg-[#131926] border border-[#1e2638] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <h3 className="text-base font-bold text-white tracking-tight mb-4">
        Scheduled reports
      </h3>

      <div className="space-y-4">
        {/* Title & Active badge */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-white">Weekly sales report</h4>
            <span className="px-2.5 py-0.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-full text-xs font-semibold">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Every Monday, 9:00 AM · 3 recipients
          </p>
        </div>

        {/* Last report note */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Last report</span>
          <p className="text-xs text-slate-300 font-mono">
            Sep 21, 9:00 AM · sales_report.pdf · 1.2 MB
          </p>
        </div>

        {/* Download latest button */}
        <div className="pt-2">
          <button
            onClick={onDownloadLatest}
            disabled={isDownloading}
            className="w-full sm:w-auto px-4 py-2 bg-[#131926] hover:bg-[#1a2336] text-slate-200 border border-[#222c42] rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm inline-flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download latest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
