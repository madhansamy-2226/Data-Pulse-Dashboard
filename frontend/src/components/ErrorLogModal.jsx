import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

export const ErrorLogModal = ({ errorLogs = [], onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Row-Level Ingestion Error Log</h3>
              <p className="text-xs text-slate-400">
                {errorLogs.length} invalid records were identified and isolated
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table list */}
        <div className="overflow-y-auto p-6 flex-1 space-y-3">
          {errorLogs.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No errors reported.</p>
          ) : (
            errorLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">
                    Row #{log.row}
                  </span>
                  <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Validation Failure
                  </span>
                </div>

                <p className="text-rose-300 font-mono bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  {log.error}
                </p>

                {log.raw_data && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-500">Raw fields:</span> {JSON.stringify(log.raw_data)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 bg-slate-900/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
