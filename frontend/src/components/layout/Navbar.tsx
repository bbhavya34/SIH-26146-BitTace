import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { NavigationPage } from '../../types';

interface NavbarProps {
  currentPage: NavigationPage | 'not_found';
  onSelectPage: (page: NavigationPage | 'not_found') => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shortened core pillar categories
  const navCategories: { id: NavigationPage; label: string; activeFor: NavigationPage[] }[] = [
    { id: 'dashboard', label: 'Overview', activeFor: ['dashboard', 'ingestion'] },
    { id: 'transactions', label: 'Forensics', activeFor: ['transactions', 'wallets', 'graph'] },
    { id: 'leads', label: 'Investigations', activeFor: ['leads', 'cases'] },
    { id: 'reports', label: 'Reports', activeFor: ['reports'] },
  ];

  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6 py-1 max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
      {/* Brand Name Outside Navbar */}
      <div
        onClick={() => onSelectPage('dashboard')}
        className="cursor-pointer flex items-center flex-shrink-0 group py-1"
      >
        <span className="font-extrabold text-white text-lg tracking-wider font-sans group-hover:text-cyan-400 transition-colors">
          BitTrace
        </span>
      </div>

      {/* Floating Pill Navbar */}
      <nav className="flex items-center border border-slate-700/80 bg-soc-950/90 backdrop-blur-md px-5 sm:px-6 py-2 rounded-full text-white text-sm shadow-xl relative">
        {/* Shortened Dynamic Rolling Text Links */}
        <div className="hidden md:flex items-center gap-7">
          {navCategories.map((cat) => {
            const isActive = typeof currentPage === 'string' && cat.activeFor.includes(currentPage as NavigationPage);
            return (
              <button
                key={cat.id}
                onClick={() => onSelectPage(cat.id)}
                className={`relative overflow-hidden h-6 group font-sans text-xs uppercase tracking-wider font-semibold transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-soc-300 hover:text-white'
                }`}
              >
                <span className="block group-hover:-translate-y-full transition-transform duration-300">
                  {cat.label}
                </span>
                <span className="block absolute top-full left-0 group-hover:translate-y-[-100%] transition-transform duration-300 text-cyan-300">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Center */}
        <div className="hidden sm:flex items-center gap-3 md:ml-6">
          {/* Search Pill */}
          <button
            onClick={onOpenSearch}
            className="border border-slate-600 hover:bg-slate-800 px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center space-x-1.5 text-soc-200 hover:text-white"
          >
            <Search className="w-3.5 h-3.5 text-soc-400" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 bg-soc-900 rounded text-[10px] font-mono text-soc-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-soc-300 hover:text-white p-1"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 bg-soc-950 border border-slate-700/80 rounded-2xl w-full flex flex-col items-center gap-4 py-6 shadow-2xl z-50 text-sm font-sans md:hidden animate-in fade-in zoom-in-95 duration-150">
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectPage(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-center py-1 font-semibold ${
                  typeof currentPage === 'string' && cat.activeFor.includes(currentPage as NavigationPage)
                    ? 'text-cyan-400'
                    : 'text-soc-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="flex flex-col items-center gap-3 pt-2 w-full px-6">
              <button
                onClick={() => {
                  onOpenSearch();
                  setMobileMenuOpen(false);
                }}
                className="w-full border border-slate-600 hover:bg-slate-800 px-4 py-2 rounded-full text-xs font-medium transition text-soc-200 flex items-center justify-center space-x-2"
              >
                <Search className="w-3.5 h-3.5 text-soc-400" />
                <span>Search (Ctrl+K)</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
