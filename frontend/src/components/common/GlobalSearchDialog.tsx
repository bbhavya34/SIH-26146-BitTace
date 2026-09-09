import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, ArrowLeftRight, Wallet, Radio, Briefcase } from 'lucide-react';
import { globalSearch } from '../../services/api';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (type: 'TRANSACTION' | 'WALLET' | 'CASE', id: string) => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    transactions: any[];
    wallets: any[];
    ips: any[];
    cases: any[];
  }>({
    transactions: [],
    wallets: [],
    ips: [],
    cases: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ transactions: [], wallets: [], ips: [], cases: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults({ transactions: [], wallets: [], ips: [], cases: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(val.trim());
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalResults =
    results.transactions.length +
    results.wallets.length +
    results.ips.length +
    results.cases.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-soc-950 border border-soc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-soc-800 bg-soc-900/60">
          <Search className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search TXID, wallet address, IP node, case..."
            className="w-full bg-transparent py-3.5 text-sm text-soc-100 placeholder:text-soc-500 focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="p-1 text-soc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs font-mono text-soc-400 animate-pulse">
              Querying BitTrace offline index...
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8 text-xs text-soc-500 font-mono">
              Type at least 1 character to search transactions, wallets, and cases.
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="text-center py-8 text-xs text-soc-400 font-mono">
              No matching records found for "{query}".
            </div>
          )}

          {/* Transactions */}
          {!loading && results.transactions.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-soc-400 uppercase tracking-wider px-2 py-1 flex items-center space-x-1.5">
                <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                <span>Transactions</span>
              </div>
              {results.transactions.map((tx) => (
                <div
                  key={tx.txid}
                  onClick={() => {
                    onSelectEntity('TRANSACTION', tx.txid);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-soc-900/70 hover:bg-soc-800/80 border border-soc-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-cyan-300 truncate">
                      {tx.txid}
                    </div>
                    <div className="text-[11px] text-soc-400 flex items-center space-x-2 mt-0.5">
                      <span>{tx.amount} BTC</span>
                      <span>•</span>
                      <span>{tx.timestamp.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        tx.risk_level === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : tx.risk_level === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {tx.risk_score} RISK
                    </span>
                    <ArrowRight className="w-4 h-4 text-soc-500 group-hover:text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wallets */}
          {!loading && results.wallets.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-soc-400 uppercase tracking-wider px-2 py-1 flex items-center space-x-1.5">
                <Wallet className="w-3 h-3 text-amber-400" />
                <span>Wallets</span>
              </div>
              {results.wallets.map((w) => (
                <div
                  key={w.address}
                  onClick={() => {
                    onSelectEntity('WALLET', w.address);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-soc-900/70 hover:bg-soc-800/80 border border-soc-800 hover:border-amber-500/40 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-amber-300 truncate">
                      {w.address}
                    </div>
                    <div className="text-[11px] text-soc-400 flex items-center space-x-2 mt-0.5">
                      <span>Vol: {(w.total_sent + w.total_received).toFixed(2)} BTC</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        w.risk_level === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : w.risk_level === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {w.risk_score} RISK
                    </span>
                    <ArrowRight className="w-4 h-4 text-soc-500 group-hover:text-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cases */}
          {!loading && results.cases.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-soc-400 uppercase tracking-wider px-2 py-1 flex items-center space-x-1.5">
                <Briefcase className="w-3 h-3 text-violet-400" />
                <span>Cases</span>
              </div>
              {results.cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectEntity('CASE', c.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-soc-900/70 hover:bg-soc-800/80 border border-soc-800 hover:border-violet-500/40 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-soc-100 truncate">
                      {c.title}
                    </div>
                    <div className="text-[11px] font-mono text-soc-400 flex items-center space-x-2 mt-0.5">
                      <span>{c.id}</span>
                      <span>•</span>
                      <span>{c.status}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-soc-500 group-hover:text-violet-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-soc-900 border-t border-soc-800 text-[11px] text-soc-500 flex items-center justify-between">
          <span>Search index updated in real-time</span>
          <div className="flex items-center space-x-2 font-mono">
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
