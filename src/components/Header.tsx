import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPremiumSupport: () => void;
  anomalyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenPremiumSupport,
  anomalyCount,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview 📊' },
    { id: 'expenses', label: 'Monthly Expenses 💰' },
    { id: 'optimization', label: 'Optimization 📈' },
    { id: 'benchmarks', label: 'Reservation Benchmarks 🛡️' },
    { id: 'alerts', label: `Spike Alerts ⚡${anomalyCount > 0 ? ` (${anomalyCount})` : ''}` },
    { id: 'api-sync', label: 'Cloud Billing APIs 🌐' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Clean Nav) - Zone 3 (Primary Action) */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
                <span className="text-xl leading-none">💰</span>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                  CloudCostIQ
                </span>
                <span className="block text-[11px] text-slate-400 font-medium tracking-tight">
                  by Mani Ravindran · <span className="text-emerald-400 font-semibold">ravindran.in</span>
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action CTA & Direct Website Link */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://ravindran.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <span>ravindran.in</span>
              <span className="text-[10px] text-emerald-400">↗</span>
            </a>

            <button
              onClick={onOpenPremiumSupport}
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-lg shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Premium Support Access</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
