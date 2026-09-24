import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const revenue = payload[0].value;
    const orders = payload[0].payload.orders;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-400">
          Revenue: ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-slate-300 mt-0.5">
          Orders: {orders}
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueTrendChart = ({ data = [], loading }) => {
  const formatYAxis = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Revenue & Sales Velocity
          </h3>
          <p className="text-xs text-slate-400">Daily sales performance over time</p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
          {data.length} data points
        </span>
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-900/40 rounded-lg">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
            No sales trend records available for selected filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => {
                  try {
                    const d = new Date(val);
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  } catch {
                    return val;
                  }
                }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
