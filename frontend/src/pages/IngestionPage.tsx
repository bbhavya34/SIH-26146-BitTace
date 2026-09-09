import React, { useState } from 'react';
import {
  UploadCloud,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Database,
  Terminal,
  Clock,
  ArrowRight
} from 'lucide-react';
import { uploadDataset, triggerGenerateDemo } from '../services/api';
import { PipelineState } from '../types';

interface IngestionPageProps {
  pipelineState: PipelineState | null;
  onPipelineCompleted: () => void;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({
  pipelineState,
  onPipelineCompleted,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [logMessages, setLogMessages] = useState<string[]>([
    '[SYSTEM INIT] BitTrace forensic pipeline engine initialized.',
    '[STANDBY] Offline SQLite storage ready at bittrace.db.',
  ]);

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    addLog(`Ingesting file ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)...`);

    try {
      const result = await uploadDataset(selectedFile);
      setUploadResult(result);
      addLog(`Validation passed: ${result.validation_report?.total_rows_parsed} transaction records standard-mapped.`);
      addLog(`Isolation Forest & Graph calculations completed in ${result.pipeline_result?.duration_seconds}s.`);
      onPipelineCompleted();
    } catch (err: any) {
      setError(err.message || 'Dataset upload and pipeline failed.');
      addLog(`ERROR: ${err.message || 'Ingestion failure'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDemoGenerate = async () => {
    setUploading(true);
    setError('');
    addLog('Generating ground-truth dataset with Peel Chains, Smurfing, and Burst typologies...');
    try {
      const res = await triggerGenerateDemo();
      setUploadResult({
        validation_report: { total_rows_parsed: res.stats?.transactions_processed || 150, schema_valid: true },
        pipeline_result: res.stats,
      });
      addLog(`Deterministic dataset generated. Processed ${res.stats?.transactions_processed} transactions.`);
      addLog(`Indexed ${res.stats?.wallets_indexed} unique wallet nodes with ${res.stats?.high_risk_count} high-risk alerts.`);
      onPipelineCompleted();
    } catch (err: any) {
      setError(err.message || 'Demo generation failed.');
      addLog(`ERROR: ${err.message || 'Demo generation error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">Data Ingestion & Processing Controller</h2>
        <p className="text-xs text-soc-400 font-mono mt-1">
          Ingest raw Bitcoin transaction datasets or generate calibrated forensic scenarios. All processing occurs locally in SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Seed Options */}
        <div className="space-y-6">
          {/* File Upload Box */}
          <div className="soc-card p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Upload Custom Transaction Dataset</h3>
            </div>
            <p className="text-xs text-soc-400">
              Upload raw transaction dumps in CSV or JSON format. The parser automatically executes column-mapping to the standard schema:
            </p>

            <div className="p-2.5 bg-soc-950 rounded border border-soc-800 text-[11px] font-mono text-cyan-300">
              txid, wallet_from, wallet_to, amount, timestamp, ip, port
            </div>

            <div className="border-2 border-dashed border-soc-700 hover:border-cyan-500/60 rounded-lg p-6 text-center transition-colors bg-soc-950/50">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                <FileCode className="w-8 h-8 text-soc-400 mx-auto" />
                <div className="text-xs text-soc-200 font-medium">
                  {selectedFile ? selectedFile.name : 'Click to browse or drop CSV/JSON file here'}
                </div>
                <div className="text-[10px] text-soc-500 font-mono">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports standard Bitcoin dump schemas'}
                </div>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-md bg-soc-800 hover:bg-soc-700 text-white text-xs font-semibold border border-soc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>{uploading ? 'Processing Dataset...' : 'Parse & Execute Pipeline'}</span>
            </button>
          </div>

          {/* Synthetic Ground-Truth Generator */}
          <div className="soc-card p-5 space-y-4 border-cyan-900/30">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Generate Ground-Truth Forensic Scenario</h3>
            </div>
            <p className="text-xs text-soc-400">
              Instantly seed a calibrated synthetic Bitcoin transaction graph with known typologies:
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-soc-950 border border-soc-800/80 text-soc-300">
                <span className="text-amber-400 font-bold">•</span> Peel Chain (7 Hops)
              </div>
              <div className="p-2 rounded bg-soc-950 border border-soc-800/80 text-soc-300">
                <span className="text-amber-400 font-bold">•</span> Sub-Threshold Smurfing
              </div>
              <div className="p-2 rounded bg-soc-950 border border-soc-800/80 text-soc-300">
                <span className="text-amber-400 font-bold">•</span> High Fan-Out Layering
              </div>
              <div className="p-2 rounded bg-soc-950 border border-soc-800/80 text-soc-300">
                <span className="text-amber-400 font-bold">•</span> Rapid Mixer Bursts
              </div>
            </div>

            <button
              onClick={handleDemoGenerate}
              disabled={uploading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{uploading ? 'Generating & Computing...' : 'Generate & Run BitTrace Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Execution Console & Validation Report */}
        <div className="space-y-6">
          {/* Validation & Ingestion Report */}
          {uploadResult && (
            <div className="soc-card p-5 space-y-3 border-emerald-800/50 bg-soc-900/90 animate-in fade-in">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-bold tracking-wide">Schema Validation & Pipeline Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                <div className="p-2 rounded bg-soc-950 border border-soc-800">
                  <div className="text-soc-400 text-[10px]">Records Validated</div>
                  <div className="text-base font-bold text-white">
                    {uploadResult.validation_report?.total_rows_parsed}
                  </div>
                </div>
                <div className="p-2 rounded bg-soc-950 border border-soc-800">
                  <div className="text-soc-400 text-[10px]">High Threat Flags</div>
                  <div className="text-base font-bold text-red-400">
                    {uploadResult.pipeline_result?.high_risk_count ?? 'Computed'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="soc-card p-4 border-red-800 bg-red-950/60 text-red-300 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pipeline Activity Console */}
          <div className="soc-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-soc-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold tracking-wide">Pipeline Execution Logs</h3>
              </div>
              <span className="text-[10px] font-mono text-soc-500">OFFLINE ENGINE</span>
            </div>

            <div className="h-72 bg-soc-950 p-3 rounded-md border border-soc-800 font-mono text-[11px] text-soc-300 overflow-y-auto space-y-1">
              {logMessages.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.includes('ERROR') ? (
                    <span className="text-red-400">{log}</span>
                  ) : log.includes('passed') || log.includes('Indexed') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes('Isolation Forest') || log.includes('Generating') ? (
                    <span className="text-cyan-300">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
