import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Briefcase,
  Eye,
  Filter,
  ArrowUpRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { fetchLeads } from '../services/api';
import { Lead, RiskLevel } from '../types';

interface LeadsPageProps {
  onOpenEntity: (type: 'LEAD', lead: Lead) => void;
  onPromoteToCase: (entityId: string, leadId: string, title: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  onOpenEntity,
  onPromoteToCase,
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLeads(severityFilter !== 'ALL' ? severityFilter : undefined);
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [severityFilter]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Intelligence Leads & Rule Alerts</h2>
          <p className="text-xs text-soc-400 font-mono mt-0.5">
            Ranked suspicious entities synthesized by the Isolation Forest model and graph topological pattern rules.
          </p>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="soc-input text-xs font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-xs font-mono text-soc-400">
            Synthesizing intelligence alerts...
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 soc-card p-8 text-xs font-mono text-soc-500">
            No active suspicious leads flagged. Run demo data or upload transaction dumps.
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="soc-card p-5 hover:border-amber-500/40 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-soc-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center space-x-2">
                      <span>{lead.id}</span>
                      <span className="text-soc-500">•</span>
                      <span className="text-cyan-400">{lead.rule_triggered}</span>
                    </div>
                    <div className="text-[10px] text-soc-400 font-mono">
                      Generated: {lead.created_at.slice(0, 16).replace('T', ' ')} UTC
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-soc-300">
                    Confidence: <span className="font-bold text-white">{lead.confidence}%</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    lead.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
                  }`}>
                    {lead.severity}
                  </span>
                </div>
              </div>

              {/* Lead Summary */}
              <div className="text-xs text-soc-200 leading-relaxed">
                {lead.summary}
              </div>

              {/* Target Entity & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs font-mono text-soc-400 flex items-center space-x-2 truncate">
                  <span className="text-soc-500 text-[10px] uppercase">Target Entity:</span>
                  <span className="text-amber-300 font-semibold truncate">{lead.entity_id}</span>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => onOpenEntity('LEAD', lead)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 hover:text-white text-xs font-mono border border-soc-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quick View</span>
                  </button>

                  <button
                    onClick={() =>
                      onPromoteToCase(
                        lead.entity_id,
                        lead.id,
                        `Investigation Docket: ${lead.rule_triggered} (${lead.entity_id.slice(0, 12)}...)`
                      )
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Promote to Case</span>
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
