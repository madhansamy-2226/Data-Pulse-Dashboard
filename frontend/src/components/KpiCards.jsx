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
      title: 'Total revenue',
      value: summary ? formatCurrency(summary.total_revenue) : '₹8.6L',
      badge: '+12%',
      badgeType: 'positive',
      sparklineData: dummySparklineGreen,
      strokeColor: '#10b981',
      fillColor: '#10b981',
    },
    {
      title: 'Total orders',
      value: summary?.total_orders ? summary.total_orders.toLocaleString() : '2,940',
      badge: '+8%',
      badgeType: 'positive',
      sparklineData: dummySparklineGreen,
      strokeColor: '#10b981',
      fillColor: '#10b981',
    },
    {
      title: 'Avg order value',
      value: summary?.average_order_value ? `₹${Math.round(parseFloat(summary.average_order_value))}` : '₹293',
      badge: '-3%',
      badgeType: 'negative',
      sparklineData: dummySparklineRed,
      strokeColor: '#f43f5e',
      fillColor: '#f43f5e',
    },
    {
      title: 'Import success',
      value: `${successRate}%`,
      badge: `${successfulImports} of ${totalImports}`,
      badgeType: 'neutral-green',
      sparklineData: dummySparklineGreen,
      strokeColor: '#10b981',
      fillColor: '#10b981',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-[#131926] border border-[#1e2638] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm hover:border-[#2a364f] transition-all"
        >
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1.5">{card.title}</span>
            {loading ? (
              <div className="h-7 w-20 bg-slate-800 rounded animate-pulse mb-2"></div>
            ) : (
              <h3 className="text-2xl font-bold text-white tracking-tight mb-1.5">{card.value}</h3>
            )}

            <div>
              {card.badgeType === 'positive' ? (
                <span className="text-xs font-semibold text-[#10b981]">{card.badge}</span>
              ) : card.badgeType === 'negative' ? (
                <span className="text-xs font-semibold text-[#f43f5e]">{card.badge}</span>
              ) : (
                <span className="text-xs font-medium text-[#10b981]">{card.badge}</span>
              )}
            </div>
          </div>

          {/* Sparkline chart */}
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.fillColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={card.fillColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={card.strokeColor}
                  strokeWidth={2}
                  fill={`url(#grad-${idx})`}
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
