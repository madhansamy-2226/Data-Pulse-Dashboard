import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { FileUploadModal } from '../components/FileUploadModal';
import { ErrorLogModal } from '../components/ErrorLogModal';
import { analyticsApi } from '../api/analytics';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertTriangle,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

export const ImportHistoryPage = () => {
  const [jobs, setJobs] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedErrorLogs, setSelectedErrorLogs] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [jobsRes, datasetsRes] = await Promise.all([
        analyticsApi.getJobHistory(),
        analyticsApi.getDatasets(),
      ]);
      setJobs(jobsRes.results || jobsRes || []);
      setDatasets(datasetsRes.results || datasetsRes || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteDataset = async (datasetId) => {
    if (window.confirm('Are you sure you want to delete this dataset and all associated sales records?')) {
      try {
        await analyticsApi.deleteDataset(datasetId);
        fetchHistory();
      } catch (err) {
        alert('Failed to delete dataset.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-500" /> Ingestion Task History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs for background Celery worker CSV bulk insertion jobs
          </p>
        </div>

        {/* Jobs Table */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-white mb-3">Celery Import Jobs</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3 text-right">Processed Rows</th>
                  <th className="py-2.5 px-3 text-right">Corrupted Rows</th>
                  <th className="py-2.5 px-3">Triggered At</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan="7" className="py-4 px-3">
                        <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No CSV import tasks have been queued yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                        <span>{job.file_name}</span>
                      </td>
                      <td className="py-3 px-3">{getStatusBadge(job.status)}</td>
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${job.progress_percentage}%` }}
                            ></div>
                          </div>
                          <span>{job.progress_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {job.processed_rows.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {job.failed_rows > 0 ? (
                          <span className="text-amber-400 font-bold">{job.failed_rows}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {job.error_logs && job.error_logs.length > 0 && (
                          <button
                            onClick={() => setSelectedErrorLogs(job.error_logs)}
                            className="text-amber-400 hover:text-amber-300 underline font-semibold text-xs inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Errors
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registered Datasets Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-white mb-3">Persisted Datasets in PostgreSQL</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((d) => (
              <div key={d.id} className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{d.name}</h4>
                    <p className="text-xs text-slate-400">{d.original_filename}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDataset(d.id)}
                    title="Delete Dataset"
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Rows</span>
                    <span className="font-mono font-bold text-white">{d.total_rows.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Revenue</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${parseFloat(d.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={fetchHistory}
      />

      {selectedErrorLogs && (
        <ErrorLogModal
          errorLogs={selectedErrorLogs}
          onClose={() => setSelectedErrorLogs(null)}
        />
      )}
    </div>
  );
};
