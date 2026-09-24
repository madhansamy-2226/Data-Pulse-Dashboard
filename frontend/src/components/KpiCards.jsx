import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const dummySparklineGreen = [
  { val: 20 }, { val: 25 }, { val: 22 }, { val: 35 }, { val: 30 }, { val: 45 }, { val: 40 }, { val: 55 }
];

const dummySparklineRed = [
  { val: 55 }, { val: 50 }, { val: 52 }, { val: 42 }, { val: 45 }, { val: 38 }, { val: 35 }, { val: 32 }
];

export const KpiCards = ({ summary, loading, importJobs = [] }) => {
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
  };

  const totalImports = importJobs.length || 128;
  const successfulImports = importJobs.filter(j => j.status === 'COMPLETED').length || 125;
  const successRate = totalImports > 0 ? ((successfulImports / totalImports) * 100).toFixed(1) : '97.7';

  const cards = [
    {
      titleDesktop: 'Total revenue',
      titleMobile: 'Revenue',
      value: summary ? formatCurrency(summary.total_revenue) : '₹8.6L',
      badge: '+12%',
      badgeType: 'positive',
      sparklineData: dummySparklineGreen,
      strokeColor: '#10b981',
      fillColor: '#10b981',
    },
    {
      titleDesktop: 'Total orders',
      titleMobile: 'Orders',
      value: summary?.total_orders ? summary.total_orders.toLocaleString() : '2,940',
      badge: '+8%',
      badgeType: 'positive',
      sparklineData: dummySparklineGreen,
      strokeColor: '#10b981',
      fillColor: '#10b981',
    },
    {
      titleDesktop: 'Avg order value',
      titleMobile: 'Avg order',
      value: summary?.average_order_value ? `₹${Math.round(parseFloat(summary.average_order_value))}` : '₹293',
      badge: '-3%',
      badgeType: 'negative',
      sparklineData: dummySparklineRed,
      strokeColor: '#f43f5e',
      fillColor: '#f43f5e',
    },
    {
      titleDesktop: 'Import success',
      titleMobile: 'Import success',
      value: `${successRate}%`,
      badge: `${successfulImports} of ${totalImports}`,
      badgeType: 'neutral-green',
      sparklineData: dummySparklineGreen,
      strokeColor: '#10b981',
      fillColor: '#10b981',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm hover:shadow transition-all"
        >
          <div>
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-1">
              <span className="sm:hidden">{card.titleMobile}</span>
              <span className="hidden sm:inline">{card.titleDesktop}</span>
            </span>

            {loading ? (
              <div className="h-6 w-16 bg-slate-100 rounded animate-pulse mb-1.5"></div>
            ) : (
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {card.value}
              </h3>
            )}

            <div>
              {card.badgeType === 'positive' ? (
                <span className="text-[11px] sm:text-xs font-semibold text-[#10b981]">
                  {card.badge}
                </span>
              ) : card.badgeType === 'negative' ? (
                <span className="text-[11px] sm:text-xs font-semibold text-[#f43f5e]">
                  {card.badge}
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs font-semibold text-[#10b981]">
                  {card.badge}
                </span>
              )}
            </div>
          </div>

          {/* Sparkline chart (Hidden on very compact mobile or displayed neatly) */}
          <div className="hidden sm:block w-20 sm:w-24 h-10 sm:h-12 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`lightGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.fillColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={card.fillColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={card.strokeColor}
                  strokeWidth={2}
                  fill={`url(#lightGrad-${idx})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
};
