import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { PieChart } from 'lucide-react';

const COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f43f5e', // rose
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold text-white mb-1">{data.category}</p>
        <p className="text-sm font-bold text-blue-400">
          ${data.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-slate-300">
          Units: {data.total_quantity.toLocaleString()} ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export const CategoryChart = ({ data = [], loading }) => {
  const formatYAxis = (val) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" /> Category Breakdown
          </h3>
          <p className="text-xs text-slate-400">Revenue split across merchandise lines</p>
        </div>
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-900/40 rounded-lg">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
            No category distribution available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
