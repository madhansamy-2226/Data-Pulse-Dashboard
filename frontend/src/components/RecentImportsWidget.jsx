import React from 'react';

const fallbackImports = [
  {
    name: 'sales_q3.csv',
    rows: '100,000 rows',
    progress: 100,
    status: 'Done',
    statusShort: 'Done',
    statusType: 'success',
  },
  {
    name: 'orders_aug.csv',
    rows: '64,200 rows',
    progress: 42,
    status: 'Processing 42%',
    statusShort: 'Processing',
    statusType: 'processing',
  },
  {
    name: 'returns.csv',
    rows: '8,100 rows',
    progress: 100,
    status: 'Failed · 12 bad rows',
    statusShort: 'Failed',
    statusType: 'failed',
  },
  {
    name: 'inventory.csv',
    rows: '22,750 rows',
    progress: 100,
    status: 'Done',
    statusShort: 'Done',
    statusType: 'success',
  },
];

export const RecentImportsWidget = ({ importJobs = [], onViewAll, loading }) => {
  const formatRows = (num) => `${(num || 0).toLocaleString()} rows`;

  const list = importJobs.length > 0
    ? importJobs.slice(0, 4).map((j) => {
        let statusText = 'Done';
        let statusShort = 'Done';
        let statusType = 'success';
        let prog = j.progress_percentage || 100;

        if (j.status === 'PROCESSING') {
          statusText = `Processing ${prog}%`;
          statusShort = 'Processing';
          statusType = 'processing';
        } else if (j.status === 'FAILED') {
          statusText = j.failed_rows > 0 ? `Failed · ${j.failed_rows} bad rows` : 'Failed';
          statusShort = 'Failed';
          statusType = 'failed';
        } else if (j.failed_rows > 0) {
          statusText = `Done · ${j.failed_rows} skipped`;
          statusShort = 'Done';
          statusType = 'warning';
        }

        return {
          name: j.file_name,
          rows: formatRows(j.total_rows || j.processed_rows),
          progress: prog,
          status: statusText,
          statusShort,
          statusType,
        };
      })
    : fallbackImports;

  const renderBadge = (item, isMobile = false) => {
    const text = isMobile ? item.statusShort : item.status;
    switch (item.statusType) {
      case 'success':
        return (
          <span className="px-3 py-1 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] rounded-full text-xs font-semibold">
            {text}
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 bg-[#fffbeb] text-[#d97706] border border-[#fde68a] rounded-full text-xs font-semibold">
            {text}
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] rounded-full text-xs font-semibold">
            {text}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] rounded-full text-xs font-semibold">
            {text}
          </span>
        );
    }
  };

  const getProgressBarColor = (statusType) => {
    switch (statusType) {
      case 'success':
        return 'bg-[#059669]';
      case 'processing':
        return 'bg-[#2563eb]';
      case 'failed':
        return 'bg-[#e11d48]';
      default:
        return 'bg-[#059669]';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Recent imports</h3>
        <button
          onClick={onViewAll}
          className="hidden sm:inline text-xs font-semibold text-[#2563eb] hover:underline"
        >
          View all
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
          ))
        ) : (
          list.map((item, idx) => (
            <div key={idx} className="py-1">
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-12 items-center gap-4 text-xs">
                <div className="col-span-4 truncate">
                  <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.rows}</p>
                </div>

                <div className="col-span-5">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${getProgressBarColor(item.statusType)} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="col-span-3 text-right">
                  {renderBadge(item, false)}
                </div>
              </div>

              {/* Mobile simplified row */}
              <div className="flex sm:hidden items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800 text-xs truncate mr-2">{item.name}</span>
                {renderBadge(item, true)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
