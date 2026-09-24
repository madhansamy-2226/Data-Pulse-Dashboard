import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package, Zap } from 'lucide-react';

export const KpiCards = ({ summary, loading }) => {
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (val) => {
    const num = parseInt(val, 10) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: summary ? formatCurrency(summary.total_revenue) : '$0',
      subtitle: '+14.2% from last cycle',
      icon: DollarSign,
      color: 'from-blue-500/20 to-blue-600/5',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Total Orders',
      value: summary ? formatNumber(summary.total_orders) : '0',
      subtitle: `${summary?.total_units_sold ? formatNumber(summary.total_units_sold) : 0} units dispatched`,
      icon: ShoppingCart,
      color: 'from-indigo-500/20 to-indigo-600/5',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/20',
    },
    {
      title: 'Average Order Value',
      value: summary ? formatCurrency(summary.average_order_value) : '$0',
      subtitle: 'Based on total transactions',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-600/5',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Top Category',
      value: summary?.top_category || 'N/A',
      subtitle: `Region: ${summary?.top_region || 'Global'}`,
      icon: Package,
      color: 'from-amber-500/20 to-amber-600/5',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Executive Summary</h3>
        {summary?.from_cache && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> Redis Cache Hit (~2ms)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-slate-800/60 border ${card.borderColor} rounded-xl p-5 relative overflow-hidden backdrop-blur-sm transition-all hover:translate-y-[-2px]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} ${card.textColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                {loading ? (
                  <div className="h-8 w-28 bg-slate-700/60 rounded animate-pulse"></div>
                ) : (
                  <h4 className="text-2xl font-bold text-white tracking-tight">{card.value}</h4>
                )}
                <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
