export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TypologyType = 'PEEL_CHAIN' | 'FAN_IN_STRUCTURING' | 'FAN_OUT_LAYERING' | 'RAPID_BURST' | 'NORMAL' | 'UNCLASSIFIED';
export type CaseStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'ESCALATED' | 'CLOSED';
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NavigationPage = 
  | 'dashboard'
  | 'ingestion'
  | 'transactions'
  | 'wallets'
  | 'graph'
  | 'leads'
  | 'cases'
  | 'reports';

export interface RiskFactors {
  isolation_forest_anomaly?: number;
  velocity_burst_score?: number;
  structuring_probability?: number;
  peel_chain_indicator?: number;
  graph_centrality_score?: number;
  triggers?: string[];
  total_sent?: number;
  total_received?: number;
  unique_counterparties?: number;
  associated_ips_count?: number;
  max_incident_risk?: number;
}

export interface Transaction {
  txid: string;
  wallet_from: string;
  wallet_to: string;
  amount: number;
  timestamp: string;
  ip: string;
  port: number;
  anomaly_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: RiskFactors;
  cluster_id: number;
  graph_degree: number;
  betweenness?: number;
  is_peel_chain: boolean;
  typology: TypologyType;
  associated_ips?: Array<{ ip: string; correlation_confidence: number; tx_count: number }>;
}

export interface Wallet {
  address: string;
  total_sent: number;
  total_received: number;
  tx_count: number;
  velocity: number;
  unique_ips: number;
  counterparties_count: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors?: string | RiskFactors;
  associated_ips?: Array<{ ip: string; correlation_confidence: number; tx_count: number; last_seen: string }>;
  recent_transactions?: Transaction[];
}

export interface Lead {
  id: string;
  entity_type: 'WALLET' | 'TRANSACTION' | 'CLUSTER';
  entity_id: string;
  severity: RiskLevel;
  confidence: number;
  rule_triggered: string;
  summary: string;
  status: 'ACTIVE' | 'ESCALATED' | 'DISMISSED';
  created_at: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  status: CaseStatus;
  target_entity: string;
  lead_id?: string;
  investigator_notes: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineState {
  current_stage: string;
  progress_pct: number;
  is_running: boolean;
  message: string;
  updated_at: string;
}

export interface DashboardStats {
  total_transactions: number;
  total_volume_btc: number;
  critical_alerts: number;
  total_wallets: number;
  flagged_wallets: number;
  active_leads: number;
  active_cases: number;
  risk_distribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  typology_distribution: Record<string, number>;
  timeline: Array<{ hour: string; count: number; volume: number; avg_risk: number }>;
}

export interface GraphNode {
  id: string;
  label: string;
  full_id: string;
  type: 'WALLET' | 'IP' | 'TRANSACTION';
  risk_score: number;
  risk_level: RiskLevel;
  cluster_id: number;
  degree: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'TRANSFER' | 'IP_OBSERVATION';
  label: string;
  txid?: string;
  amount?: number;
  risk_score: number;
  risk_level?: RiskLevel;
  typology?: TypologyType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}
