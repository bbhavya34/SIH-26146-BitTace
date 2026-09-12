import React from 'react';
import {
  ShieldAlert,
  ArrowLeftRight,
  Wallet,
  AlertTriangle,
  Briefcase,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { DashboardStats, PipelineState, Lead, Transaction } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  pipelineState: PipelineState | null;
  leads: Lead[];
  onOpenEntity: (type: 'TRANSACTION' | 'WALLET' | 'LEAD', item: any) => void;
  onNavigatePage: (page: string) => void;
  onGenerateDemo: () => void;
  isGenerating: boolean;
}

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  pipelineState,
  leads,
  onOpenEntity,
  onNavigatePage,
  onGenerateDemo,
  isGenerating,
}) => {
  const pipelineSteps = [
    { key: 'INGESTING', label: 'Ingestion' },
    { key: 'FEATURE_ENGINEERING', label: 'Features' },
    { key: 'ANOMALY_DETECTION', label: 'Isolation Forest' },
    { key: 'GRAPH_BUILDING', label: 'NetworkX' },
    { key: 'CLUSTERING', label: 'DBSCAN' },
    { key: 'RISK_SCORING', label: 'Risk Fusion' },
    { key: 'COMPLETE', label: 'Complete' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!pipelineState) return 'pending';
    const order = ['IDLE', 'INGESTING', 'FEATURE_ENGINEERING', 'ANOMALY_DETECTION', 'GRAPH_BUILDING', 'CLUSTERING', 'RISK_SCORING', 'COMPLETE'];
    const currentIdx = order.indexOf(pipelineState.current_stage);
    const stepIdx = order.indexOf(stepKey);

    if (currentIdx > stepIdx || pipelineState.current_stage === 'COMPLETE') return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  const riskPieData = stats
    ? [
        { name: 'Critical', value: stats.risk_distribution.CRITICAL, color: RISK_COLORS.CRITICAL },
        { name: 'High', value: stats.risk_distribution.HIGH, color: RISK_COLORS.HIGH },
        { name: 'Medium', value: stats.risk_distribution.MEDIUM, color: RISK_COLORS.MEDIUM },
        { name: 'Low', value: stats.risk_distribution.LOW, color: RISK_COLORS.LOW },
      ]
    : [];

  const typologyData = stats
    ? Object.entries(stats.typology_distribution).map(([key, val]) => ({
        name: key.replace(/_/g, ' '),
        count: val,
      }))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">


      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume & Transactions */}
        <div className="soc-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-400 text-xs">
            <span>Processed Transactions</span>
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.total_transactions.toLocaleString() ?? '—'}
          </div>
          <div className="text-[11px] text-soc-400 font-mono flex items-center justify-between">
            <span>Total Volume:</span>
            <span className="text-cyan-300 font-semibold">{stats?.total_volume_btc.toFixed(2) ?? 0} BTC</span>
          </div>
        </div>

        {/* Card 2: High Threat Alerts */}
        <div className="soc-card p-4 space-y-2 relative overflow-hidden border-red-900/30">
          <div className="flex items-center justify-between text-soc-400 text-xs">
            <span>Critical / High Threat Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {stats?.critical_alerts.toLocaleString() ?? '—'}
          </div>
          <div className="text-[11px] text-soc-400 font-mono flex items-center justify-between">
            <span>Flagged Wallets:</span>
            <span className="text-orange-400 font-semibold">{stats?.flagged_wallets ?? 0}</span>
          </div>
        </div>

        {/* Card 3: Active Intelligence Leads */}
        <div className="soc-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-400 text-xs">
            <span>Active Leads</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {stats?.active_leads.toLocaleString() ?? '—'}
          </div>
          <div className="text-[11px] text-soc-400 font-mono flex items-center justify-between">
            <span>Typologies Flagged:</span>
            <span className="text-amber-300 font-semibold">{Object.keys(stats?.typology_distribution || {}).length}</span>
          </div>
        </div>

        {/* Card 4: Open Cases */}
        <div className="soc-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-400 text-xs">
            <span>Investigation Dockets</span>
            <Briefcase className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-300 font-mono">
            {stats?.active_cases.toLocaleString() ?? '—'}
          </div>
          <div className="text-[11px] text-soc-400 font-mono flex items-center justify-between">
            <span>Case Management:</span>
            <button
              onClick={() => onNavigatePage('cases')}
              className="text-cyan-400 hover:underline flex items-center space-x-0.5"
            >
              <span>View Cases</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Time-Series Volume & Avg Threat */}
        <div className="soc-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Temporal Volume & Threat Progression</h3>
              <p className="text-[11px] text-soc-400 font-mono">Hourly aggregated transaction volume (BTC) vs Risk score</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                <span>Volume (BTC)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats?.timeline && stats.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#volGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-soc-500">
                Awaiting transaction time telemetry...
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Threat Level Distribution Donut */}
        <div className="soc-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Risk Level Distribution</h3>
            <p className="text-[11px] text-soc-400 font-mono">Multi-factor weighted risk classification</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {riskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-mono text-soc-500">No data available</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {riskPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-soc-950 border border-soc-800/60">
                <span className="flex items-center space-x-1.5 text-soc-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Leads & Typology Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Intelligence Leads */}
        <div className="soc-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Urgent Forensic Leads</h3>
            </div>
            <button
              onClick={() => onNavigatePage('leads')}
              className="text-xs text-cyan-400 hover:underline flex items-center space-x-1 font-mono"
            >
              <span>View All Leads</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                onClick={() => onOpenEntity('LEAD', lead)}
                className="p-3 rounded-lg bg-soc-950 hover:bg-soc-800/80 border border-soc-800 hover:border-amber-500/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                      {lead.rule_triggered}
                    </span>
                    <span className="text-[10px] font-mono text-soc-400">
                      Confidence: {lead.confidence}%
                    </span>
                  </div>
                  <div className="text-xs text-soc-200 font-medium line-clamp-1">
                    {lead.summary}
                  </div>
                  <div className="text-[10px] font-mono text-soc-500 truncate">
                    Target: {lead.entity_id}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    lead.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
                  }`}>
                    {lead.severity}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-soc-500 group-hover:text-cyan-400" />
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <div className="text-center py-6 text-xs text-soc-500 font-mono">
                No active suspicious leads flagged.
              </div>
            )}
          </div>
        </div>

        {/* Typology Counts Bar Chart */}
        <div className="soc-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Detected Laundering Typologies</h3>
            <p className="text-[11px] text-soc-400 font-mono">Ground-truth and pipeline detections</p>
          </div>

          <div className="h-56 w-full">
            {typologyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typologyData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-soc-500">
                No typologies computed yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
