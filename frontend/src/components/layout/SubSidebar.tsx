import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Share2,
  UploadCloud,
  AlertTriangle,
  Briefcase,
  FileText,
  ChevronLeft,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { NavigationPage } from '../../types';

interface SubSidebarProps {
  currentPage: NavigationPage | 'not_found';
  onSelectPage: (page: NavigationPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeLeadsCount?: number;
  activeCasesCount?: number;
  totalTransactions?: number;
  totalWallets?: number;
}

export const SubSidebar: React.FC<SubSidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  activeLeadsCount = 0,
  activeCasesCount = 0,
  totalTransactions = 0,
  totalWallets = 0,
}) => {
  const sections = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard' as NavigationPage, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ingestion' as NavigationPage, label: 'Data Ingestion', icon: UploadCloud },
      ],
    },
    {
      group: 'Forensics',
      items: [
        {
          id: 'transactions' as NavigationPage,
          label: 'Transactions',
          icon: ArrowLeftRight,
          badge: totalTransactions > 0 ? `${totalTransactions}` : undefined,
          badgeColor: 'bg-soc-800 text-soc-300',
        },
        {
          id: 'wallets' as NavigationPage,
          label: 'Wallets',
          icon: Wallet,
          badge: totalWallets > 0 ? `${totalWallets}` : undefined,
          badgeColor: 'bg-soc-800 text-soc-300',
        },
        { id: 'graph' as NavigationPage, label: 'Network Graph', icon: Share2 },
      ],
    },
    {
      group: 'Investigations',
      items: [
        {
          id: 'leads' as NavigationPage,
          label: 'Intelligence Leads',
          icon: AlertTriangle,
          badge: activeLeadsCount > 0 ? `${activeLeadsCount}` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold',
        },
        {
          id: 'cases' as NavigationPage,
          label: 'Case Dockets',
          icon: Briefcase,
          badge: activeCasesCount > 0 ? `${activeCasesCount}` : undefined,
          badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold',
        },
        { id: 'reports' as NavigationPage, label: 'Forensic Reports', icon: FileText },
      ],
    },
  ];

  return (
    <aside
      className={`bg-soc-950/70 border border-slate-800/80 rounded-2xl p-3 shadow-lg flex flex-col transition-all duration-300 backdrop-blur-sm self-start sticky top-24 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header with Collapse toggle */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 px-2">
        {!collapsed && (
          <div className="text-[11px] font-mono uppercase tracking-wider text-soc-400 font-bold">
            Forensic Nav
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-soc-800 text-soc-400 hover:text-white transition-colors mx-auto"
          title={collapsed ? 'Expand Sub-Sidebar' : 'Collapse Sub-Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Grouped Sub-topics */}
      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="text-[10px] font-mono uppercase tracking-wider text-soc-500 px-2 py-1">
                {sec.group}
              </div>
            )}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 shadow-sm'
                      : 'text-soc-300 hover:text-white hover:bg-soc-900/60'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-cyan-400' : 'text-soc-400 group-hover:text-soc-200'
                    } ${!collapsed ? 'mr-2.5' : 'mx-auto'}`}
                  />

                  {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

                  {!collapsed && item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}

                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-soc-900 text-soc-100 text-xs rounded border border-soc-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap font-mono">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Investigator Footer Badge */}
      {!collapsed ? (
        <div className="mt-6 pt-3 border-t border-slate-800/80 px-2 flex items-center space-x-2">
          <Fingerprint className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-soc-200 truncate">Analyst: INV-0492</div>
            <div className="text-[9px] font-mono text-soc-500 truncate">NTRO Cyber Div</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-2 border-t border-slate-800/80 flex justify-center text-cyan-400" title="Analyst: INV-0492">
          <Fingerprint className="w-4 h-4" />
        </div>
      )}
    </aside>
  );
};
