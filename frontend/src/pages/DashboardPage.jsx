import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { KpiCards } from '../components/KpiCards';
import { RevenueTrendChart } from '../components/RevenueTrendChart';
import { CategoryChart } from '../components/CategoryChart';
import { TopProductsTable } from '../components/TopProductsTable';
import { FilterBar } from '../components/FilterBar';
import { FileUploadModal } from '../components/FileUploadModal';
import { analyticsApi } from '../api/analytics';
import { UploadCloud, Sparkles, Database, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { isAnalyst } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    preset: 'all',
    dataset_id: '',
    category: 'all',
    region: 'all',
    start_date: '',
    end_date: '',
  });

  // Analytics Data State
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ categories: [], regions: [] });
  const [datasets, setDatasets] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const queryParams = {
        dataset_id: filters.dataset_id || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        region: filters.region !== 'all' ? filters.region : undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      };

      const [summaryRes, trendsRes, catRes, prodRes, optRes, dataRes] = await Promise.all([
        analyticsApi.getSummary(queryParams),
        analyticsApi.getTrends(queryParams),
        analyticsApi.getCategories(queryParams),
        analyticsApi.getTopProducts(queryParams),
        analyticsApi.getFilters(),
        analyticsApi.getDatasets(),
      ]);

      setSummary(summaryRes);
      setTrends(trendsRes);
      setCategories(catRes);
      setTopProducts(prodRes);
      setFilterOptions(optRes);
      setDatasets(dataRes.results || dataRes || []);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefreshCache = async () => {
    try {
      setIsRefreshing(true);
      await analyticsApi.clearCache();
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasData = summary && parseInt(summary.total_orders, 10) > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onRefreshCache={handleRefreshCache}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Sales Analytics Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time aggregation layer with Redis-cached PostgreSQL backend
            </p>
          </div>
        </div>

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          filterOptions={filterOptions}
          datasets={datasets}
        />

        {!loading && !hasData ? (
          /* Empty state when no CSV dataset has been uploaded yet */
          <div className="bg-slate-800/40 border-2 border-dashed border-slate-700/80 rounded-2xl p-12 text-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Sales Datasets Ingested Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Upload a sales CSV to trigger the asynchronous Celery pipeline (chunk validation, error reporting, and indexed PostgreSQL insertion).
            </p>

            {isAnalyst && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Sample CSV</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <KpiCards summary={summary} loading={loading} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueTrendChart data={trends} loading={loading} />
              <CategoryChart data={categories} loading={loading} />
            </div>

            {/* Top Products Table */}
            <TopProductsTable products={topProducts} loading={loading} />
          </>
        )}
      </main>

      {/* Upload CSV Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};
