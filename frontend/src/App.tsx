import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { SubSidebar } from './components/layout/SubSidebar';
import { QuickViewDrawer } from './components/layout/QuickViewDrawer';
import { GlobalSearchDialog } from './components/common/GlobalSearchDialog';
import { CreateCaseDialog } from './components/common/CreateCaseDialog';
import { StartupIntro } from './components/common/StartupIntro';

import { DashboardPage } from './pages/DashboardPage';
import { IngestionPage } from './pages/IngestionPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { WalletsPage } from './pages/WalletsPage';
import { GraphPage } from './pages/GraphPage';
import { LeadsPage } from './pages/LeadsPage';
import { CasesPage } from './pages/CasesPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotFoundPage } from './pages/NotFoundPage';

import {
  fetchStats,
  fetchPipelineStatus,
  triggerGenerateDemo,
  fetchLeads,
  fetchCases,
  fetchTransactionDetail,
  fetchWalletDetail
} from './services/api';
import { DashboardStats, PipelineState, Lead, Case, NavigationPage } from './types';

export function App() {
  const [showStartupIntro, setShowStartupIntro] = useState(true);
  const [isIntroRevealing, setIsIntroRevealing] = useState(false);
  const [currentPage, setCurrentPage] = useState<NavigationPage | 'not_found'>('dashboard');
  const [subSidebarCollapsed, setSubSidebarCollapsed] = useState(false);

  // Global Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick View Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntity, setDrawerEntity] = useState<any>(null);
  const [drawerEntityType, setDrawerEntityType] = useState<'TRANSACTION' | 'WALLET' | 'LEAD'>('TRANSACTION');

  // Modal Dialogs
  const [searchOpen, setSearchOpen] = useState(false);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseTargetEntity, setCaseTargetEntity] = useState('');
  const [caseLeadId, setCaseLeadId] = useState<string | undefined>(undefined);
  const [caseInitialTitle, setCaseInitialTitle] = useState('');

  // Graph Deep Focus ID
  const [graphFocusId, setGraphFocusId] = useState<string | null>(null);

  // Initial Data Fetch & Polling
  const refreshAllData = async () => {
    try {
      const [s, p, l, c] = await Promise.all([
        fetchStats().catch(() => null),
        fetchPipelineStatus().catch(() => null),
        fetchLeads().catch(() => []),
        fetchCases().catch(() => []),
      ]);
      if (s) setStats(s);
      if (p) setPipelineState(p);
      setLeads(l);
      setCases(c);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    try {
      await triggerGenerateDemo();
      await refreshAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenEntity = (type: 'TRANSACTION' | 'WALLET' | 'LEAD', entity: any) => {
    setDrawerEntity(entity);
    setDrawerEntityType(type);
    setDrawerOpen(true);
  };

  const handleInspectInGraph = (id: string) => {
    setGraphFocusId(id);
    setCurrentPage('graph');
  };

  const handleOpenCreateCase = (targetEntity?: string, initialTitle?: string, leadId?: string) => {
    setCaseTargetEntity(targetEntity || '');
    setCaseInitialTitle(initialTitle || '');
    setCaseLeadId(leadId);
    setCaseModalOpen(true);
  };

  const handleSelectFromSearch = async (type: 'TRANSACTION' | 'WALLET' | 'CASE', id: string) => {
    if (type === 'TRANSACTION') {
      try {
        const tx = await fetchTransactionDetail(id);
        handleOpenEntity('TRANSACTION', tx);
      } catch (e) {
        console.error(e);
      }
    } else if (type === 'WALLET') {
      try {
        const w = await fetchWalletDetail(id);
        handleOpenEntity('WALLET', w);
      } catch (e) {
        console.error(e);
      }
    } else if (type === 'CASE') {
      setCurrentPage('cases');
    }
  };

  return (
    <>
      {showStartupIntro && (
        <StartupIntro
          onReveal={() => setIsIntroRevealing(true)}
          onComplete={() => setShowStartupIntro(false)}
        />
      )}
      <div className={`bittrace-shell${isIntroRevealing ? ' is-revealing' : ''} min-h-screen bg-soc-950 text-soc-200 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200`}>
      {/* Shortened Floating Pill Navbar */}
      <Navbar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Main Workspace Layout with Clean Sub-topic Sidebar */}
      <div className="bittrace-workspace flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-16 flex gap-6">
        {/* Sleek Sub-Sidebar for sub-related topics */}
        <SubSidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          collapsed={subSidebarCollapsed}
          onToggleCollapse={() => setSubSidebarCollapsed(!subSidebarCollapsed)}
          activeLeadsCount={leads.length}
          activeCasesCount={cases.length}
          totalTransactions={stats?.total_transactions}
          totalWallets={stats?.total_wallets}
        />

        {/* Content View */}
        <main className="bittrace-main flex-1 min-w-0">
          {currentPage === 'dashboard' && (
            <DashboardPage
              stats={stats}
              pipelineState={pipelineState}
              leads={leads}
              onOpenEntity={handleOpenEntity}
              onNavigatePage={(p) => setCurrentPage(p as NavigationPage)}
              onGenerateDemo={handleGenerateDemo}
              isGenerating={isGenerating}
            />
          )}

          {currentPage === 'ingestion' && (
            <IngestionPage
              pipelineState={pipelineState}
              onPipelineCompleted={refreshAllData}
            />
          )}

          {currentPage === 'transactions' && (
            <TransactionsPage
              onSelectTransaction={(tx) => handleOpenEntity('TRANSACTION', tx)}
            />
          )}

          {currentPage === 'wallets' && (
            <WalletsPage
              onSelectWallet={(w) => handleOpenEntity('WALLET', w)}
              onInspectInGraph={handleInspectInGraph}
              onCreateCase={(addr, title) => handleOpenCreateCase(addr, title)}
            />
          )}

          {currentPage === 'graph' && (
            <GraphPage
              initialFocusId={graphFocusId}
              onOpenEntity={handleOpenEntity}
            />
          )}

          {currentPage === 'leads' && (
            <LeadsPage
              onOpenEntity={(type, lead) => handleOpenEntity(type, lead)}
              onPromoteToCase={(entityId, leadId, title) =>
                handleOpenCreateCase(entityId, title, leadId)
              }
            />
          )}

          {currentPage === 'cases' && (
            <CasesPage
              onOpenCreateModal={() => handleOpenCreateCase()}
              onSelectTarget={handleInspectInGraph}
            />
          )}

          {currentPage === 'reports' && <ReportsPage />}

          {currentPage === 'not_found' && (
            <NotFoundPage onBackToHome={() => setCurrentPage('dashboard')} />
          )}
        </main>
      </div>

      {/* Right-Side Quick-View Drawer */}
      <QuickViewDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        entity={drawerEntity}
        entityType={drawerEntityType}
        onInspectInGraph={handleInspectInGraph}
        onCreateCase={(entityId, title) => handleOpenCreateCase(entityId, title)}
      />

      {/* Global Cmd+K Search Command Palette */}
      <GlobalSearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectEntity={handleSelectFromSearch}
      />

      {/* Create Case Modal */}
      <CreateCaseDialog
        isOpen={caseModalOpen}
        onClose={() => setCaseModalOpen(false)}
        targetEntity={caseTargetEntity}
        initialTitle={caseInitialTitle}
        leadId={caseLeadId}
        onCaseCreated={() => {
          refreshAllData();
          setCurrentPage('cases');
        }}
      />
      </div>
    </>
  );
}

export default App;
