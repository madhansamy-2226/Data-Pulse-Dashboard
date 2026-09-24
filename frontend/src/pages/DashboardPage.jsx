import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { HeaderBar } from '../components/HeaderBar';
import { KpiCards } from '../components/KpiCards';
import { RevenueComparisonChart } from '../components/RevenueComparisonChart';
import { TopCategoriesWidget } from '../components/TopCategoriesWidget';
import { RecentImportsWidget } from '../components/RecentImportsWidget';
import { ScheduledReportsWidget } from '../components/ScheduledReportsWidget';
import { FileUploadModal } from '../components/FileUploadModal';
import { analyticsApi } from '../api/analytics';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    preset: '90',
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
  const [filterOptions, setFilterOptions] = useState({ categories: [], regions: [] });
  const [importJobs, setImportJobs] = useState([]);

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

      const [summaryRes, trendsRes, catRes, optRes, jobsRes] = await Promise.all([
        analyticsApi.getSummary(queryParams),
        analyticsApi.getTrends(queryParams),
        analyticsApi.getCategories(queryParams),
        analyticsApi.getFilters(),
        analyticsApi.getJobHistory(),
      ]);

      setSummary(summaryRes);
      setTrends(trendsRes);
      setCategories(catRes);
      setFilterOptions(optRes);
      setImportJobs(jobsRes.results || jobsRes || []);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const res = await analyticsApi.exportPDF({
        dataset_id: filters.dataset_id || undefined,
        filters: {
          category: filters.category !== 'all' ? filters.category : undefined,
          region: filters.region !== 'all' ? filters.region : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });

      const reportId = res.report.id;

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await analyticsApi.getReportStatus(reportId);
          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsExporting(false);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 4000);
            await analyticsApi.downloadPDF(reportId, statusRes.file_name);
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsExporting(false);
            alert(`PDF Generation failed: ${statusRes.error_message}`);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsExporting(false);
        }
      }, 1500);
    } catch (err) {
      setIsExporting(false);
      alert('Failed to initiate PDF export.');
    }
  };

  const handleDownloadLatestReport = async () => {
    try {
      setIsExporting(true);
      // Trigger a fresh PDF compilation and download
      await handleExportPDF();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'imports') setIsUploadOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          {/* Top Header Bar with Filter Pills & Action Buttons */}
          <HeaderBar
            title={activeTab === 'overview' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            filters={filters}
            onFilterChange={setFilters}
            filterOptions={filterOptions}
            onOpenUpload={() => setIsUploadOpen(true)}
            onExportPDF={handleExportPDF}
            isExporting={isExporting}
            exportSuccess={exportSuccess}
          />

          {/* 4 KPI Summary Cards */}
          <KpiCards
            summary={summary}
            loading={loading}
            importJobs={importJobs}
          />

          {/* Middle Row: Revenue Comparison Chart & Top Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <RevenueComparisonChart data={trends} loading={loading} />
            </div>
            <div className="lg:col-span-5">
              <TopCategoriesWidget categories={categories} loading={loading} />
            </div>
          </div>

          {/* Bottom Row: Recent Imports & Scheduled Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <RecentImportsWidget
                importJobs={importJobs}
                onViewAll={() => setIsUploadOpen(true)}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-5">
              <ScheduledReportsWidget
                onDownloadLatest={handleDownloadLatestReport}
                isDownloading={isExporting}
              />
            </div>
          </div>
        </div>

        {/* Subtle Footer Note */}
        <div className="pt-4 border-t border-[#1a2234] flex items-center justify-between text-[11px] text-slate-500">
          <span>SalesPulse Analytics Engine v1.0.0</span>
          <span>Sample data for illustration</span>
        </div>
      </main>

      {/* CSV File Upload Modal */}
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
