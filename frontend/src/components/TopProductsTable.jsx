import React, { useState } from 'react';
import { Award, Search, ArrowUpDown } from 'lucide-react';

export const TopProductsTable = ({ products = [], loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxRevenue = Math.max(...products.map((p) => p.total_revenue), 1);

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Top Performing Products
          </h3>
          <p className="text-xs text-slate-400">Ranked by total gross revenue contribution</p>
        </div>

        {/* Search filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/40">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Product Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Units</th>
              <th className="py-2.5 px-3 text-right">Avg Price</th>
              <th className="py-2.5 px-3 text-right">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan="6" className="py-3 px-3">
                    <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No matching products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod, idx) => {
                const sharePct = ((prod.total_revenue / maxRevenue) * 100).toFixed(0);
                return (
                  <tr key={idx} className="hover:bg-slate-800/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {prod.product_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {prod.total_quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      ${prod.avg_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      <div>${prod.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="w-20 bg-slate-700 h-1 rounded-full mt-1 ml-auto overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${sharePct}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
