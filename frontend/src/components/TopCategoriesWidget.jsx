import React from 'react';

const fallbackCategories = [
  { category: 'Electronics', revenue: '₹3.3L', percentage: 38 },
  { category: 'Fashion', revenue: '₹2.3L', percentage: 27 },
  { category: 'Home', revenue: '₹1.5L', percentage: 18 },
  { category: 'Beauty', revenue: '₹0.9L', percentage: 10 },
  { category: 'Sports', revenue: '₹0.6L', percentage: 7 },
];

export const TopCategoriesWidget = ({ categories = [], loading }) => {
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
  };

  const list = categories.length > 0
    ? categories.slice(0, 5).map((c) => ({
        category: c.category,
        revenue: formatCurrency(c.total_revenue),
        percentage: Math.round(c.percentage || 15),
      }))
    : fallbackCategories;

  return (
    <div className="bg-[#131926] border border-[#1e2638] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <h3 className="text-base font-bold text-white tracking-tight mb-5">
        Top categories
      </h3>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2 animate-pulse">
              <div className="h-3.5 bg-slate-800 rounded w-1/3"></div>
              <div className="h-2.5 bg-slate-800 rounded-full w-full"></div>
            </div>
          ))
        ) : (
          list.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{item.category}</span>
                <span className="text-slate-400 font-medium font-mono">
                  {item.revenue} · {item.percentage}%
                </span>
              </div>

              {/* Blue Bar */}
              <div className="w-full bg-[#0d121d] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#3b82f6] h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
