import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

export const ErrorLogModal = ({ errorLogs = [], onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Row-Level Error Report</h3>
              <p className="text-xs text-slate-500">
                {errorLogs.length} invalid rows were flagged and isolated
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table list */}
        <div className="overflow-y-auto p-6 flex-1 space-y-3">
          {errorLogs.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">No errors reported.</p>
          ) : (
            errorLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-700">
                    Row #{log.row}
                  </span>
                  <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Validation Issue
                  </span>
                </div>

                <p className="text-rose-700 font-mono bg-rose-50 p-2 rounded-lg border border-rose-200 text-xs">
                  {log.error}
                </p>

                {log.raw_data && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    <span className="text-slate-400">Raw fields:</span> {JSON.stringify(log.raw_data)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
