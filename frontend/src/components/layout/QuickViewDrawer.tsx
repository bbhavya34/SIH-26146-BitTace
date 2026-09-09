import React from 'react';
import {
  X,
  ShieldAlert,
  Share2,
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Layers,
  Network,
  Cpu,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Transaction, Wallet, Lead } from '../../types';

interface QuickViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Transaction | Wallet | Lead | null;
  entityType: 'TRANSACTION' | 'WALLET' | 'LEAD';
  onInspectInGraph?: (id: string) => void;
  onCreateCase?: (entityId: string, title: string) => void;
}

export const QuickViewDrawer: React.FC<QuickViewDrawerProps> = ({
  isOpen,
  onClose,
  entity,
  entityType,
  onInspectInGraph,
  onCreateCase,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !entity) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract common metadata
  let title = '';
  let fullId = '';
  let riskScore = 0;
  let riskLevel = 'LOW';
  let riskFactors: any = {};
  let triggers: string[] = [];

  if (entityType === 'TRANSACTION') {
    const tx = entity as Transaction;
    title = 'Transaction Intelligence';
    fullId = tx.txid;
    riskScore = tx.risk_score;
    riskLevel = tx.risk_level;
    riskFactors = tx.risk_factors || {};
    triggers = riskFactors.triggers || [];
  } else if (entityType === 'WALLET') {
    const w = entity as Wallet;
    title = 'Wallet Forensic Profile';
    fullId = w.address;
    riskScore = w.risk_score;
    riskLevel = w.risk_level;
    if (typeof w.risk_factors === 'string') {
      try { riskFactors = JSON.parse(w.risk_factors); } catch (e) { riskFactors = {}; }
    } else {
      riskFactors = w.risk_factors || {};
    }
  } else if (entityType === 'LEAD') {
    const l = entity as Lead;
    title = 'Suspicious Lead Details';
    fullId = l.entity_id;
    riskScore = l.confidence;
    riskLevel = l.severity;
    triggers = [l.rule_triggered, l.summary];
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 border-red-800 bg-red-950/50';
      case 'HIGH': return 'text-orange-400 border-orange-800 bg-orange-950/50';
      case 'MEDIUM': return 'text-yellow-400 border-yellow-800 bg-yellow-950/50';
      default: return 'text-emerald-400 border-emerald-800 bg-emerald-950/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-soc-950 border-l border-soc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          {/* Header */}
          <div className="px-6 py-4 border-b border-soc-800/80 bg-soc-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded bg-soc-800 text-cyan-400 border border-soc-700">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
                <span className="text-[10px] font-mono text-soc-400 uppercase tracking-wider">
                  Quick Forensic View
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-soc-400 hover:text-white hover:bg-soc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Entity ID & Copy */}
            <div className="bg-soc-900 p-4 rounded-lg border border-soc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-soc-400">
                <span className="font-mono uppercase text-[10px] text-soc-500">Entity Identifier</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${getRiskColor(riskLevel)}`}>
                  {riskLevel} RISK
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-300 break-all select-all font-semibold">
                  {fullId}
                </span>
                <button
                  onClick={() => handleCopy(fullId)}
                  className="ml-2 p-1.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 hover:text-white transition-colors flex-shrink-0"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Risk Fusion Score Gauge */}
            <div className="bg-soc-900 p-4 rounded-lg border border-soc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-soc-300 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fused Threat Score</span>
                </span>
                <span className="font-mono font-bold text-base text-white">
                  {riskScore} <span className="text-xs text-soc-400">/ 100</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-soc-950 rounded-full h-2 overflow-hidden border border-soc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    riskScore >= 75 ? 'bg-red-500' : riskScore >= 50 ? 'bg-orange-500' : riskScore >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, riskScore))}%` }}
                />
              </div>

              {/* Contributing Features */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="bg-soc-950 p-2 rounded border border-soc-850">
                  <div className="text-soc-400 text-[10px]">Isolation Forest Anomaly</div>
                  <div className="font-mono font-semibold text-white">
                    {riskFactors.isolation_forest_anomaly !== undefined ? `${riskFactors.isolation_forest_anomaly}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-soc-950 p-2 rounded border border-soc-850">
                  <div className="text-soc-400 text-[10px]">Graph Centrality</div>
                  <div className="font-mono font-semibold text-white">
                    {riskFactors.graph_centrality_score !== undefined ? `${riskFactors.graph_centrality_score}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-soc-950 p-2 rounded border border-soc-850">
                  <div className="text-soc-400 text-[10px]">Structuring Probability</div>
                  <div className="font-mono font-semibold text-white">
                    {riskFactors.structuring_probability !== undefined ? `${riskFactors.structuring_probability}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-soc-950 p-2 rounded border border-soc-850">
                  <div className="text-soc-400 text-[10px]">Velocity Burst Score</div>
                  <div className="font-mono font-semibold text-white">
                    {riskFactors.velocity_burst_score !== undefined ? `${riskFactors.velocity_burst_score}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Triggers / Typology Explainability */}
            <div className="bg-soc-900 p-4 rounded-lg border border-soc-800 space-y-2.5">
              <span className="text-xs font-semibold text-soc-300 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>Explainability Triggers</span>
              </span>

              <div className="space-y-1.5">
                {triggers.length > 0 ? (
                  triggers.map((trigger, idx) => (
                    <div key={idx} className="text-xs bg-soc-950/80 p-2 rounded border border-soc-800/80 text-soc-200 flex items-start space-x-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{trigger}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-soc-400 italic">No anomalies triggered. Transaction within standard bounds.</div>
                )}
              </div>
            </div>

            {/* Transaction Specific Properties */}
            {entityType === 'TRANSACTION' && (
              <div className="bg-soc-900 p-4 rounded-lg border border-soc-800 space-y-2 text-xs">
                <div className="text-xs font-semibold text-soc-300 flex items-center space-x-1.5 pb-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Transfer Parameters</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Amount BTC:</span>
                  <span className="font-mono font-bold text-white">{(entity as Transaction).amount} BTC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-soc-200">{(entity as Transaction).timestamp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Observed IP:</span>
                  <span className="font-mono text-cyan-300">{(entity as Transaction).ip}:{(entity as Transaction).port}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Sender:</span>
                  <span className="font-mono text-soc-300 truncate max-w-[200px]">{(entity as Transaction).wallet_from}</span>
                </div>
                <div className="flex justify-between py-1 text-soc-400">
                  <span>Recipient:</span>
                  <span className="font-mono text-soc-300 truncate max-w-[200px]">{(entity as Transaction).wallet_to}</span>
                </div>
              </div>
            )}

            {/* Wallet Specific Properties */}
            {entityType === 'WALLET' && (
              <div className="bg-soc-900 p-4 rounded-lg border border-soc-800 space-y-2 text-xs">
                <div className="text-xs font-semibold text-soc-300 flex items-center space-x-1.5 pb-1">
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wallet Centrality Ledger</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Total Sent:</span>
                  <span className="font-mono font-bold text-white">{(entity as Wallet).total_sent.toFixed(4)} BTC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Total Received:</span>
                  <span className="font-mono font-bold text-white">{(entity as Wallet).total_received.toFixed(4)} BTC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-soc-800 text-soc-400">
                  <span>Transaction Velocity:</span>
                  <span className="font-mono text-soc-200">{(entity as Wallet).velocity} TX / hr</span>
                </div>
                <div className="flex justify-between py-1 text-soc-400">
                  <span>Counterparties:</span>
                  <span className="font-mono text-soc-200">{(entity as Wallet).counterparties_count} addresses</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 border-t border-soc-800 bg-soc-900/80 flex items-center space-x-3">
            {onInspectInGraph && (
              <button
                onClick={() => {
                  onInspectInGraph(fullId);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-soc-800 hover:bg-soc-700 text-white text-xs font-medium border border-soc-700 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>View in Graph</span>
              </button>
            )}

            {onCreateCase && (
              <button
                onClick={() => {
                  onCreateCase(fullId, `Investigation into ${fullId.slice(0, 16)}...`);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Create Case</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
