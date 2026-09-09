import { Transaction, Wallet, Lead, Case, DashboardStats, PipelineState, GraphData } from '../types';

const API_BASE = 'http://localhost:8000';

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchPipelineStatus(): Promise<PipelineState> {
  const res = await fetch(`${API_BASE}/pipeline/status`);
  if (!res.ok) throw new Error('Failed to fetch pipeline status');
  return res.json();
}

export async function triggerGenerateDemo(): Promise<{ status: string; stats: any }> {
  const res = await fetch(`${API_BASE}/generate-demo-data`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate demo data');
  return res.json();
}

export async function uploadDataset(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchTransactions(params: {
  page?: number;
  limit?: number;
  risk_level?: string;
  typology?: string;
  search?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_order?: string;
}): Promise<{ items: Transaction[]; total: number; page: number; limit: number; pages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.risk_level) query.append('risk_level', params.risk_level);
  if (params.typology) query.append('typology', params.typology);
  if (params.search) query.append('search', params.search);
  if (params.min_amount !== undefined) query.append('min_amount', params.min_amount.toString());
  if (params.max_amount !== undefined) query.append('max_amount', params.max_amount.toString());
  if (params.sort_by) query.append('sort_by', params.sort_by);
  if (params.sort_order) query.append('sort_order', params.sort_order);

  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchTransactionDetail(txid: string): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${txid}`);
  if (!res.ok) throw new Error('Failed to fetch transaction details');
  return res.json();
}

export async function fetchWallets(params: {
  page?: number;
  limit?: number;
  risk_level?: string;
  search?: string;
}): Promise<{ items: Wallet[]; total: number; page: number; limit: number; pages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.risk_level) query.append('risk_level', params.risk_level);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/wallets?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch wallets');
  return res.json();
}

export async function fetchWalletDetail(address: string): Promise<Wallet> {
  const res = await fetch(`${API_BASE}/wallets/${address}`);
  if (!res.ok) throw new Error('Failed to fetch wallet details');
  return res.json();
}

export async function fetchGraph(params: {
  min_risk?: number;
  max_nodes?: number;
  typology?: string;
}): Promise<GraphData> {
  const query = new URLSearchParams();
  if (params.min_risk !== undefined) query.append('min_risk', params.min_risk.toString());
  if (params.max_nodes) query.append('max_nodes', params.max_nodes.toString());
  if (params.typology) query.append('typology', params.typology);

  const res = await fetch(`${API_BASE}/graph?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch graph data');
  return res.json();
}

export async function fetchLeads(severity?: string): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (severity) query.append('severity', severity);
  const res = await fetch(`${API_BASE}/leads?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch intelligence leads');
  return res.json();
}

export async function fetchCases(status?: string): Promise<Case[]> {
  const query = new URLSearchParams();
  if (status) query.append('status', status);
  const res = await fetch(`${API_BASE}/cases?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function createCase(payload: {
  title: string;
  description: string;
  priority: string;
  status: string;
  target_entity: string;
  lead_id?: string;
  investigator_notes?: string;
}): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create case');
  return res.json();
}

export async function updateCase(id: string, payload: Partial<Case>): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update case');
  return res.json();
}

export async function deleteCase(id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/cases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete case');
  return res.json();
}

export async function globalSearch(q: string): Promise<{
  query: string;
  transactions: any[];
  wallets: any[];
  ips: any[];
  cases: any[];
}> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed to perform global search');
  return res.json();
}

export function getCaseReportPdfUrl(caseId: string): string {
  return `${API_BASE}/reports/${caseId}?format=pdf`;
}

export function getCaseReportCsvUrl(caseId: string): string {
  return `${API_BASE}/reports/${caseId}?format=csv`;
}

export function getAllTransactionsCsvUrl(): string {
  return `${API_BASE}/export/transactions.csv`;
}
