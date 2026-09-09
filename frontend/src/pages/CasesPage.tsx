import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  FileText,
  Download,
  Trash2,
  Save,
  Check,
  Clock,
  ShieldAlert,
  User,
  Filter
} from 'lucide-react';
import { fetchCases, updateCase, deleteCase, getCaseReportPdfUrl, getCaseReportCsvUrl } from '../services/api';
import { Case, CaseStatus, PriorityLevel } from '../types';

interface CasesPageProps {
  onOpenCreateModal: () => void;
  onSelectTarget: (address: string) => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({
  onOpenCreateModal,
  onSelectTarget,
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});
  const [savedNotes, setSavedNotes] = useState<{ [id: string]: boolean }>({});

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await fetchCases(statusFilter !== 'ALL' ? statusFilter : undefined);
      setCases(data);
      const notesMap: { [id: string]: string } = {};
      data.forEach((c) => {
        notesMap[c.id] = c.investigator_notes;
      });
      setEditingNotes(notesMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: CaseStatus) => {
    try {
      await updateCase(id, { status: newStatus });
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      await updateCase(id, { investigator_notes: editingNotes[id] });
      setSavedNotes((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setSavedNotes((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Confirm deletion of case docket ${id}?`)) {
      try {
        await deleteCase(id);
        setCases((prev) => prev.filter((c) => c.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Forensic Case Management</h2>
          <p className="text-xs text-soc-400 font-mono mt-0.5">
            Active law enforcement investigative dockets with evidence logs, analyst notes, and official ReportLab PDF dossiers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="soc-input text-xs font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Open Case Docket</span>
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-xs font-mono text-soc-400">
            Querying case registry...
          </div>
        ) : cases.length === 0 ? (
          <div className="soc-card p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-soc-600 mx-auto" />
            <h3 className="text-sm font-bold text-soc-200">No Forensic Case Dockets Active</h3>
            <p className="text-xs text-soc-400 max-w-sm mx-auto">
              Create a new investigation case or promote any suspicious intelligence lead to generate a forensic docket.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
            >
              Establish First Case
            </button>
          </div>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="soc-card p-5 space-y-4 border-soc-800">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soc-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{c.id}</span>
                    <span className="text-soc-500">•</span>
                    <h3 className="text-sm font-bold text-white">{c.title}</h3>
                  </div>
                  <div className="text-[11px] font-mono text-soc-400 flex items-center space-x-3">
                    <span>Target: <span className="text-amber-300">{c.target_entity}</span></span>
                    <span>•</span>
                    <span>Created: {c.created_at.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 self-end sm:self-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      c.priority === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : c.priority === 'HIGH'
                        ? 'bg-orange-950 text-orange-400 border border-orange-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {c.priority} PRIORITY
                  </span>

                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value as CaseStatus)}
                    className="soc-input text-xs font-mono py-1 px-2 text-soc-200"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-soc-300 leading-relaxed">
                {c.description}
              </div>

              {/* Investigator Working Notes with Inline Save */}
              <div className="bg-soc-950 p-3.5 rounded-lg border border-soc-850 space-y-2">
                <div className="flex items-center justify-between text-xs text-soc-400">
                  <span className="font-mono text-[10px] uppercase flex items-center space-x-1.5">
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>Investigator Working Notes & Chain of Custody</span>
                  </span>
                  <button
                    onClick={() => handleSaveNotes(c.id)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-800 hover:bg-soc-700 text-soc-200 text-[11px] font-mono border border-soc-700 transition-colors"
                  >
                    {savedNotes[c.id] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 text-cyan-400" />
                        <span>Save Notes</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={editingNotes[c.id] !== undefined ? editingNotes[c.id] : c.investigator_notes}
                  onChange={(e) =>
                    setEditingNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-transparent text-xs text-soc-200 focus:outline-none resize-y font-sans placeholder:text-soc-600"
                  placeholder="Record formal investigative findings, subpoena references, and counterparty tracking..."
                />
              </div>

              {/* Footer Actions: PDF & CSV Export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => onSelectTarget(c.target_entity)}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Inspect Target Entity Profile</span>
                </button>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <a
                    href={getCaseReportPdfUrl(c.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-mono font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF Dossier</span>
                  </a>

                  <a
                    href={getCaseReportCsvUrl(c.id)}
                    download
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 text-xs font-mono transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </a>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded hover:bg-red-950/60 text-soc-500 hover:text-red-400 transition-colors"
                    title="Delete Case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
