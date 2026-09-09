import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  Eye,
  ArrowRight,
  Download,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { fetchTransactions, getAllTransactionsCsvUrl } from '../services/api';
import { Transaction, RiskLevel, TypologyType } from '../types';

interface TransactionsPageProps {
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onSelectTransaction,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [typology, setTypology] = useState('ALL');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTransactions({
        page,
        limit: 20,
        risk_level: riskLevel !== 'ALL' ? riskLevel : undefined,
        typology: typology !== 'ALL' ? typology : undefined,
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTransactions(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, riskLevel, typology, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Transaction Forensic Ledger</h2>
          <p className="text-xs text-soc-400 font-mono mt-0.5">
            Showing {transactions.length} of {total} indexed Bitcoin transactions. Click any row for deep explainability breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={getAllTransactionsCsvUrl()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-soc-900 hover:bg-soc-800 text-soc-200 text-xs font-mono border border-soc-700 transition-colors"
            download
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="soc-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TXID, wallet, IP..."
              className="soc-input w-full pl-8 text-xs font-mono"
            />
            <Search className="w-3.5 h-3.5 text-soc-400 absolute left-2.5 top-3" />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
              className="soc-input w-full text-xs font-mono"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Typology Filter */}
          <div>
            <select
              value={typology}
              onChange={(e) => { setTypology(e.target.value); setPage(1); }}
              className="soc-input w-full text-xs font-mono"
            >
              <option value="ALL">All Typologies</option>
              <option value="PEEL_CHAIN">Peel Chain</option>
              <option value="FAN_IN_STRUCTURING">Fan-In Structuring</option>
              <option value="FAN_OUT_LAYERING">Fan-Out Layering</option>
              <option value="RAPID_BURST">Rapid Burst</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>

          {/* Sort Field */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortBy(f);
                setSortOrder(o);
                setPage(1);
              }}
              className="soc-input w-full text-xs font-mono"
            >
              <option value="timestamp-desc">Time: Newest First</option>
              <option value="timestamp-asc">Time: Oldest First</option>
              <option value="risk_score-desc">Risk: Highest First</option>
              <option value="amount-desc">Amount: Largest First</option>
              <option value="anomaly_score-desc">Anomaly: Highest First</option>
            </select>
          </div>
        </form>
      </div>

      {/* Transaction Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-soc-950/80 border-b border-soc-800 text-soc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">TXID</th>
                <th className="py-3 px-4">Source & Target</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Observed IP</th>
                <th className="py-3 px-4">ML Anomaly</th>
                <th className="py-3 px-4">Risk Threat</th>
                <th className="py-3 px-4">Typology</th>
                <th className="py-3 px-4 text-right">Quick View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-soc-400 font-mono text-xs">
                    Loading forensic ledger records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-soc-500 font-mono text-xs">
                    No transactions match the selected filter parameters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.txid}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-soc-850/60 cursor-pointer transition-colors group"
                  >
                    {/* TXID */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-cyan-400 group-hover:text-cyan-300 font-medium">
                          {tx.txid.slice(0, 10)}...
                        </span>
                        <button
                          onClick={(e) => handleCopy(tx.txid, e)}
                          className="p-1 rounded hover:bg-soc-800 text-soc-500 hover:text-soc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy Full TXID"
                        >
                          {copiedId === tx.txid ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-soc-500 font-mono">
                        {tx.timestamp.slice(0, 16).replace('T', ' ')}
                      </div>
                    </td>

                    {/* Source & Target */}
                    <td className="py-3 px-4 font-mono text-[11px] max-w-[200px]">
                      <div className="text-soc-300 truncate" title={tx.wallet_from}>
                        From: {tx.wallet_from.slice(0, 12)}...
                      </div>
                      <div className="text-soc-400 truncate flex items-center space-x-1" title={tx.wallet_to}>
                        <span>To:</span>
                        <span className="text-soc-300">{tx.wallet_to.slice(0, 12)}...</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {tx.amount.toFixed(4)} <span className="text-[10px] font-normal text-soc-400">BTC</span>
                    </td>

                    {/* Observed IP */}
                    <td className="py-3 px-4 font-mono text-soc-300 whitespace-nowrap">
                      <div>{tx.ip}</div>
                      <div className="text-[10px] text-soc-500">Port: {tx.port}</div>
                    </td>

                    {/* ML Isolation Forest Anomaly */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-soc-950 rounded-full h-1.5 overflow-hidden border border-soc-800">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, tx.anomaly_score)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-soc-200">{tx.anomaly_score}%</span>
                      </div>
                    </td>

                    {/* Risk Threat Score & Badge */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tx.risk_level === 'CRITICAL'
                            ? 'bg-red-950/80 text-red-400 border-red-800'
                            : tx.risk_level === 'HIGH'
                            ? 'bg-orange-950/80 text-orange-400 border-orange-800'
                            : tx.risk_level === 'MEDIUM'
                            ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800'
                            : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        {tx.risk_score} • {tx.risk_level}
                      </span>
                    </td>

                    {/* Typology */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-soc-950 text-soc-300 border border-soc-800">
                        {tx.typology.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx);
                        }}
                        className="p-1.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 hover:text-white transition-colors"
                        title="Open Quick View Drawer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-soc-950/60 border-t border-soc-800 flex items-center justify-between text-xs font-mono text-soc-400">
          <div>
            Page {page} of {pages} ({total} items)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-soc-900 border border-soc-800 hover:bg-soc-800 disabled:opacity-40 disabled:cursor-not-allowed text-soc-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="p-1.5 rounded bg-soc-900 border border-soc-800 hover:bg-soc-800 disabled:opacity-40 disabled:cursor-not-allowed text-soc-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
