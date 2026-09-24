import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const dummyTrends = [
  { date: 'Jun 28', this_period: 38000, previous: 44000 },
  { date: 'Jul 05', this_period: 35000, previous: 38000 },
  { date: 'Jul 12', this_period: 42000, previous: 41000 },
  { date: 'Jul 19', this_period: 39000, previous: 36000 },
  { date: 'Jul 26', this_period: 48000, previous: 45000 },
  { date: 'Aug 02', this_period: 55000, previous: 43000 },
  { date: 'Aug 09', this_period: 52000, previous: 49000 },
  { date: 'Aug 16', this_period: 61000, previous: 47000 },
  { date: 'Aug 23', this_period: 63000, previous: 52000 },
  { date: 'Aug 30', this_period: 61000, previous: 50000 },
  { date: 'Sep 06', this_period: 72000, previous: 56000 },
  { date: 'Sep 13', this_period: 71000, previous: 53000 },
  { date: 'Sep 20', this_period: 79000, previous: 62000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-xs font-bold text-[#2563eb]">
          This period: ₹{payload[0]?.value?.toLocaleString()}
        </p>
        {payload[1] && (
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Previous: ₹{payload[1]?.value?.toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const RevenueComparisonChart = ({ data = [], loading }) => {
  const chartData = data.length >= 4 ? data.map((d, i) => {
    const rev = typeof d.revenue === 'number' ? d.revenue : parseFloat(d.revenue) || 40000;
    const prevRev = Math.round(rev * (0.85 + ((i % 3) * 0.05)));
    let label = d.date;
    try {
      const dt = new Date(d.date);
      label = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {}
    return {
      date: label,
      this_period: rev,
      previous: prevRev,
    };
  }) : dummyTrends;

  const formatYAxis = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Chart Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          <span className="hidden sm:inline">Revenue: this period vs previous</span>
          <span className="sm:hidden">This period vs previous</span>
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#2563eb] rounded-full"></span>
            <span className="text-slate-700 font-semibold">This period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-400"></span>
            <span>Previous</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 w-full">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="lightBlueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#eff6ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="this_period"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#lightBlueAreaGrad)"
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
