import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  ArrowLeftRight,
  Wallet,
  Share2,
  AlertTriangle,
  Briefcase,
  FileText,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Radio
} from 'lucide-react';

export type NavigationPage = 
  | 'dashboard'
  | 'ingestion'
  | 'transactions'
  | 'wallets'
  | 'graph'
  | 'leads'
  | 'cases'
  | 'reports';

interface AppSidebarProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeLeadsCount?: number;
  activeCasesCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  activeLeadsCount = 0,
  activeCasesCount = 0,
}) => {
  const menuItems = [
    { id: 'dashboard' as NavigationPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingestion' as NavigationPage, label: 'Data Ingestion', icon: UploadCloud },
    { id: 'transactions' as NavigationPage, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'wallets' as NavigationPage, label: 'Wallets', icon: Wallet },
    { id: 'graph' as NavigationPage, label: 'Network Graph', icon: Share2 },
    { 
      id: 'leads' as NavigationPage, 
      label: 'Intelligence Leads', 
      icon: AlertTriangle,
      badge: activeLeadsCount > 0 ? activeLeadsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    },
    { 
      id: 'cases' as NavigationPage, 
      label: 'Case Management', 
      icon: Briefcase,
      badge: activeCasesCount > 0 ? activeCasesCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    },
    { id: 'reports' as NavigationPage, label: 'Forensic Reports', icon: FileText },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-soc-950 border-r border-soc-800 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-soc-800/80 bg-soc-900/40">
        {!collapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-base tracking-wider">BitTrace</span>
              <span className="text-[10px] text-soc-400 font-mono truncate">NTRO PS-26146</span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-md hover:bg-soc-800 text-soc-400 hover:text-white transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Status Sub-header */}
      {!collapsed && (
        <div className="px-4 py-2 bg-soc-900/20 border-b border-soc-800/40 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="font-mono uppercase font-semibold">Node Active</span>
          </div>
          <span className="font-mono text-soc-500 text-[10px]">v1.4-OFFLINE</span>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-soc-800/90 text-cyan-400 border-l-2 border-cyan-400 shadow-sm'
                  : 'text-soc-400 hover:text-soc-100 hover:bg-soc-900/70'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-soc-400 group-hover:text-soc-200'
                } ${!collapsed ? 'mr-3' : 'mx-auto'}`}
              />

              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-soc-900 text-soc-100 text-xs rounded border border-soc-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                  {item.badge !== undefined && ` (${item.badge})`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle for Small Bar */}
      {collapsed && (
        <div className="p-2 border-t border-soc-800/80 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-soc-800 text-soc-400 hover:text-white transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar Footer: Investigator Badge */}
      <div className="p-3 border-t border-soc-800/80 bg-soc-900/40">
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-soc-800 border border-soc-700 flex items-center justify-center text-soc-300 flex-shrink-0">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-soc-100 truncate">Analyst: INV-0492</div>
              <div className="text-[10px] font-mono text-soc-400 flex items-center space-x-1 truncate">
                <span>NTRO Intelligence</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Analyst: INV-0492 (NTRO)">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
