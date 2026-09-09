import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Printer,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { fetchCases, getCaseReportPdfUrl, getCaseReportCsvUrl, getAllTransactionsCsvUrl } from '../services/api';
import { Case } from '../types';

export const ReportsPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">Forensic Intelligence Report Studio</h2>
        <p className="text-xs text-soc-400 font-mono mt-0.5">
          Generate official NTRO-compliant PDF case reports and CSV evidentiary ledgers rendered via the native ReportLab engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Configuration */}
        <div className="space-y-6">
          <div className="soc-card p-5 space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400">
              <FileText className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white tracking-wide">Case Dossier Export</h3>
            </div>

            <div>
              <label className="block text-soc-300 font-medium text-xs mb-1.5">
                Select Active Case Docket
              </label>
              {loading ? (
                <div className="text-xs font-mono text-soc-500">Loading cases...</div>
              ) : cases.length === 0 ? (
                <div className="text-xs font-mono text-soc-500">No cases available to export.</div>
              ) : (
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="soc-input w-full text-xs font-mono"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.title.slice(0, 30)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCase && (
              <div className="space-y-3 pt-2">
                <a
                  href={getCaseReportPdfUrl(selectedCase.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Dossier</span>
                </a>

                <a
                  href={getCaseReportCsvUrl(selectedCase.id)}
                  download
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-200 text-xs font-semibold border border-soc-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Download Case Ledger CSV</span>
                </a>
              </div>
            )}
          </div>

          {/* Master Ingestion Export */}
          <div className="soc-card p-5 space-y-3">
            <div className="flex items-center space-x-2 text-soc-300">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold tracking-wide">Master Dataset Export</h3>
            </div>
            <p className="text-xs text-soc-400">
              Export all enriched transactions with computed Isolation Forest anomalies, graph degrees, and fused risk classifications.
            </p>
            <a
              href={getAllTransactionsCsvUrl()}
              download
              className="w-full flex items-center justify-center space-x-2 py-2 rounded bg-soc-950 hover:bg-soc-800 text-soc-300 text-xs font-mono border border-soc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full bittrace_all_transactions.csv</span>
            </a>
          </div>
        </div>

        {/* Right Column: Interactive PDF Preview Mockup */}
        <div className="lg:col-span-2">
          <div className="soc-card p-6 bg-soc-900/90 border-soc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-soc-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Official Dossier Preview Specification
                </span>
              </div>
              <span className="text-[10px] font-mono text-soc-400 bg-soc-950 px-2 py-0.5 rounded border border-soc-800">
                NTRO PS-26146 FORMAT
              </span>
            </div>

            {selectedCase ? (
              <div className="bg-soc-950 p-6 rounded-lg border border-soc-800 space-y-5 text-xs font-sans shadow-inner">
                {/* PDF Header Mockup */}
                <div className="border-b border-soc-800 pb-4 flex justify-between items-start">
                  <div>
                    <div className="font-bold text-white text-sm">
                      NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
                    </div>
                    <div className="text-[10px] text-soc-400 font-mono">
                      BLOCKCHAIN CYBER INTELLIGENCE DIVISION | PS 26146
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                      RESTRICTED ACCESS
                    </span>
                  </div>
                </div>

                {/* Case Details Box */}
                <div className="space-y-2">
                  <div className="text-base font-bold text-cyan-300 font-mono">
                    Forensic Case Dossier: {selectedCase.id}
                  </div>
                  <div className="text-xs text-soc-300">
                    <span className="font-semibold text-white">Subject:</span> {selectedCase.title}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-soc-900/80 p-3 rounded border border-soc-800 text-[11px] font-mono">
                  <div>
                    <div className="text-soc-500 text-[10px]">Target Entity</div>
                    <div className="text-amber-300 font-bold truncate">{selectedCase.target_entity}</div>
                  </div>
                  <div>
                    <div className="text-soc-500 text-[10px]">Priority Level</div>
                    <div className="text-white font-bold">{selectedCase.priority}</div>
                  </div>
                  <div>
                    <div className="text-soc-500 text-[10px]">Case Status</div>
                    <div className="text-cyan-400 font-bold">{selectedCase.status}</div>
                  </div>
                  <div>
                    <div className="text-soc-500 text-[10px]">Linked Lead</div>
                    <div className="text-soc-300 font-bold">{selectedCase.lead_id || 'Direct Docket'}</div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-1">
                  <div className="font-bold text-soc-200 text-xs uppercase tracking-wide">
                    1. Executive Investigative Summary
                  </div>
                  <p className="text-soc-300 leading-relaxed bg-soc-900/40 p-3 rounded border border-soc-850">
                    {selectedCase.description || 'Forensic investigation docket established.'}
                  </p>
                </div>

                {/* Investigator Notes */}
                <div className="space-y-1">
                  <div className="font-bold text-soc-200 text-xs uppercase tracking-wide">
                    2. Investigator Notes & Chain of Custody
                  </div>
                  <p className="text-soc-300 leading-relaxed bg-soc-900/40 p-3 rounded border border-soc-850 font-mono text-[11px]">
                    {selectedCase.investigator_notes || 'Standard forensic extraction conducted.'}
                  </p>
                </div>

                {/* Sign-off Mockup */}
                <div className="pt-4 border-t border-soc-800 flex justify-between text-[10px] font-mono text-soc-500">
                  <div>Analyst Signature: INV-0492 / NTRO</div>
                  <div>Forensic Directorate Clearance: APPROVED</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-xs font-mono text-soc-500">
                Select or establish a case to view report dossier preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
