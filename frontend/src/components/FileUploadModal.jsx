import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { ErrorLogModal } from './ErrorLogModal';

export const FileUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        if (!datasetName) setDatasetName(droppedFile.name.replace('.csv', '').replace(/_/g, ' '));
      } else {
        setErrorMsg('Please select a valid .csv spreadsheet file.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        if (!datasetName) setDatasetName(selectedFile.name.replace('.csv', '').replace(/_/g, ' '));
        setErrorMsg('');
      } else {
        setErrorMsg('Please select a valid .csv file.');
      }
    }
  };

  const startUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_name', datasetName);
      formData.append('description', description);

      const res = await analyticsApi.uploadCSV(formData);
      const jobId = res.job.id;
      setJobStatus(res.job);

      // Poll Celery Worker job status every 1 second
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusData = await analyticsApi.getJobStatus(jobId);
          setJobStatus(statusData);

          if (statusData.status === 'COMPLETED') {
            clearInterval(pollTimerRef.current);
            setUploading(false);
            if (statusData.error_logs && statusData.error_logs.length > 0) {
              setErrorLogs(statusData.error_logs);
            }
            if (onUploadComplete) onUploadComplete();
          } else if (statusData.status === 'FAILED') {
            clearInterval(pollTimerRef.current);
            setUploading(false);
            setErrorMsg(statusData.error_message || 'Background CSV processing failed.');
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 1000);

    } catch (err) {
      setUploading(false);
      setErrorMsg(err.response?.data?.file?.[0] || 'Upload failed. Please check network.');
    }
  };

  const resetState = () => {
    setFile(null);
    setDatasetName('');
    setDescription('');
    setUploading(false);
    setJobStatus(null);
    setErrorLogs([]);
    setErrorMsg('');
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Sales CSV</h3>
              <p className="text-xs text-slate-400">Asynchronous Celery ETL Ingestion Pipeline</p>
            </div>
          </div>
          <button
            onClick={resetState}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {jobStatus?.status === 'COMPLETED' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Ingestion Complete!</h4>
              <p className="text-xs text-slate-300 mb-4">
                Successfully processed <span className="font-semibold text-white">{jobStatus.processed_rows.toLocaleString()}</span> rows into PostgreSQL.
              </p>

              {jobStatus.failed_rows > 0 && (
                <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{jobStatus.failed_rows} corrupted rows were flagged & skipped.</span>
                  </div>
                  <button
                    onClick={() => setShowErrorsModal(true)}
                    className="font-bold underline hover:text-amber-200"
                  >
                    View Error Log
                  </button>
                </div>
              )}

              <button
                onClick={resetState}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
              >
                Close & View Analytics Dashboard
              </button>
            </div>
          ) : uploading || jobStatus?.status === 'PROCESSING' ? (
            <div className="py-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Celery Worker Streaming & Ingesting...
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {jobStatus?.progress_percentage || 5}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${jobStatus?.progress_percentage || 5}%` }}
                ></div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 text-xs text-slate-400 space-y-1 font-mono">
                <p>• File: <span className="text-slate-200">{file?.name}</span></p>
                <p>• Rows Parsed: <span className="text-slate-200">{jobStatus?.processed_rows || 0} / {jobStatus?.total_rows || 'Calculating...'}</span></p>
                <p>• Bulk Insertion Batch Size: <span className="text-slate-200">2,000 rows/batch</span></p>
              </div>
            </div>
          ) : (
            <form onSubmit={startUpload} className="space-y-4">
              {/* Drag Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  {file ? <FileSpreadsheet className="w-6 h-6 text-blue-400" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Click to upload or drag & drop CSV
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Supports UTF-8 CSVs up to 100MB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dataset Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Q1 Global Retail Sales"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quarterly sales data with discount and category dimensions..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Start Background Processing Task
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showErrorsModal && (
        <ErrorLogModal
          errorLogs={errorLogs}
          onClose={() => setShowErrorsModal(false)}
        />
      )}
    </div>
  );
};
