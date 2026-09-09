import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Search,
  Filter,
  Copy,
  Check,
  Share2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radio,
  Activity
} from 'lucide-react';
import { fetchWallets, fetchWalletDetail } from '../services/api';
import { Wallet as WalletType, RiskLevel } from '../types';

interface WalletsPageProps {
  onSelectWallet: (wallet: WalletType) => void;
  onInspectInGraph: (address: string) => void;
  onCreateCase: (address: string, title: string) => void;
}

export const WalletsPage: React.FC<WalletsPageProps> = ({
  onSelectWallet,
  onInspectInGraph,
  onCreateCase,
}) => {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const data = await fetchWallets({
        page,
        limit: 20,
        risk_level: riskLevel !== 'ALL' ? riskLevel : undefined,
        search: search.trim() || undefined,
      });
      setWallets(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, [page, riskLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWallets();
  };

  const handleCopy = (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Wallet Entity Explorer</h2>
          <p className="text-xs text-soc-400 font-mono mt-0.5">
            Indexed Bitcoin wallet nodes with aggregate velocity, counterparty degree, and IP correlation confidence.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="soc-card p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallet address (e.g., bc1q...)"
              className="soc-input w-full pl-8 text-xs font-mono"
            />
            <Search className="w-3.5 h-3.5 text-soc-400 absolute left-2.5 top-3" />
          </div>

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
        </form>
      </div>

      {/* Wallet Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-soc-950/80 border-b border-soc-800 text-soc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Wallet Address</th>
                <th className="py-3 px-4">Sent / Received (BTC)</th>
                <th className="py-3 px-4">Transactions</th>
                <th className="py-3 px-4">Velocity</th>
                <th className="py-3 px-4">Counterparties</th>
                <th className="py-3 px-4">Risk Threat</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-soc-400 font-mono text-xs">
                    Querying wallet directory...
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-soc-500 font-mono text-xs">
                    No wallet nodes found matching criteria.
                  </td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <tr
                    key={w.address}
                    onClick={() => onSelectWallet(w)}
                    className="hover:bg-soc-850/60 cursor-pointer transition-colors group"
                  >
                    {/* Address */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-amber-400 group-hover:text-amber-300 font-medium">
                          {w.address.slice(0, 14)}...{w.address.slice(-6)}
                        </span>
                        <button
                          onClick={(e) => handleCopy(w.address, e)}
                          className="p-1 rounded hover:bg-soc-800 text-soc-500 hover:text-soc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy Full Address"
                        >
                          {copiedAddress === w.address ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-soc-500 font-mono">
                        {w.unique_ips} associated IP{w.unique_ips === 1 ? '' : 's'}
                      </div>
                    </td>

                    {/* Sent / Recv */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <div className="text-soc-200">{w.total_sent.toFixed(3)} Sent</div>
                      <div className="text-soc-400 text-[10px]">{w.total_received.toFixed(3)} Recv</div>
                    </td>

                    {/* Tx Count */}
                    <td className="py-3 px-4 font-mono text-white">
                      {w.tx_count}
                    </td>

                    {/* Velocity */}
                    <td className="py-3 px-4 font-mono text-soc-300">
                      {w.velocity} <span className="text-[10px] text-soc-500">TX/hr</span>
                    </td>

                    {/* Counterparties */}
                    <td className="py-3 px-4 font-mono text-soc-300">
                      {w.counterparties_count} addresses
                    </td>

                    {/* Risk Threat */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          w.risk_level === 'CRITICAL'
                            ? 'bg-red-950/80 text-red-400 border-red-800'
                            : w.risk_level === 'HIGH'
                            ? 'bg-orange-950/80 text-orange-400 border-orange-800'
                            : w.risk_level === 'MEDIUM'
                            ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800'
                            : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        {w.risk_score} • {w.risk_level}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onInspectInGraph(w.address)}
                          className="p-1.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 hover:text-white transition-colors"
                          title="View In Graph"
                        >
                          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => onCreateCase(w.address, `Investigation: ${w.address.slice(0, 16)}...`)}
                          className="p-1.5 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 hover:text-white transition-colors"
                          title="Open Investigation Case"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                        </button>
                      </div>
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
            Page {page} of {pages} ({total} wallets)
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
