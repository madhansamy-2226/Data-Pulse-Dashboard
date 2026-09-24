import React from 'react';

const fallbackImports = [
  {
    name: 'sales_q3.csv',
    rows: '100,000 rows',
    progress: 100,
    status: 'Done',
    statusType: 'success',
  },
  {
    name: 'orders_aug.csv',
    rows: '64,200 rows',
    progress: 42,
    status: 'Processing 42%',
    statusType: 'processing',
  },
  {
    name: 'returns.csv',
    rows: '8,100 rows',
    progress: 100,
    status: 'Failed · 12 bad rows',
    statusType: 'failed',
  },
  {
    name: 'inventory.csv',
    rows: '22,750 rows',
    progress: 100,
    status: 'Done',
    statusType: 'success',
  },
];

export const RecentImportsWidget = ({ importJobs = [], onViewAll, loading }) => {
  const formatRows = (num) => `${(num || 0).toLocaleString()} rows`;

  const list = importJobs.length > 0
    ? importJobs.slice(0, 4).map((j) => {
        let statusText = 'Done';
        let statusType = 'success';
        let prog = j.progress_percentage || 100;

        if (j.status === 'PROCESSING') {
          statusText = `Processing ${prog}%`;
          statusType = 'processing';
        } else if (j.status === 'FAILED') {
          statusText = j.failed_rows > 0 ? `Failed · ${j.failed_rows} bad rows` : 'Failed';
          statusType = 'failed';
        } else if (j.failed_rows > 0) {
          statusText = `Done · ${j.failed_rows} skipped`;
          statusType = 'warning';
        }

        return {
          name: j.file_name,
          rows: formatRows(j.total_rows || j.processed_rows),
          progress: prog,
          status: statusText,
          statusType,
        };
      })
    : fallbackImports;

  const renderBadge = (item) => {
    switch (item.statusType) {
      case 'success':
        return (
          <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-full text-xs font-semibold">
            Done
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 bg-[#d97706]/15 text-[#f59e0b] border border-[#d97706]/30 rounded-full text-xs font-semibold">
            {item.status}
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 rounded-full text-xs font-semibold">
            {item.status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-full text-xs font-semibold">
            {item.status}
          </span>
        );
    }
  };

  const getProgressBarColor = (statusType) => {
    switch (statusType) {
      case 'success':
        return 'bg-[#10b981]';
      case 'processing':
        return 'bg-[#3b82f6]';
      case 'failed':
        return 'bg-[#f43f5e]';
      default:
        return 'bg-[#10b981]';
    }
  };

  return (
    <div className="bg-[#131926] border border-[#1e2638] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white tracking-tight">Recent imports</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#38bdf8] hover:underline"
        >
          View all
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-10 bg-slate-800/40 rounded-xl animate-pulse"></div>
          ))
        ) : (
          list.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-4 text-xs py-1">
              {/* File details */}
              <div className="col-span-4 truncate">
                <p className="font-semibold text-white truncate">{item.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.rows}</p>
              </div>

              {/* Progress bar */}
              <div className="col-span-5">
                <div className="w-full bg-[#0d121d] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`${getProgressBarColor(item.statusType)} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="col-span-3 text-right">
                {renderBadge(item)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
