import React from 'react';
import { Sparkles } from 'lucide-react';

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
    <header className="rm-site-header px-4 sm:px-6 no-print">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-6 min-h-[64px] py-2">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="rm-brand whitespace-nowrap shrink-0 cursor-pointer text-left focus:outline-none text-base sm:text-[1.12rem]"
        >
          <span className="rm-mono-mark" aria-hidden="true">
            RM
          </span>
          <span>
            Maniq <span className="text-[#3E6E86] font-normal mx-0.5">|</span> <span className="accent">Spend</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
                className={`rm-navlink whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'rm-navlink-active' : ''
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenPremiumSupport}
            className="xh-btn primary !px-2.5 !py-1.5 sm:!px-3.5 sm:!py-2 !text-xs sm:!text-[0.84rem] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Support</span>
            <span className="hidden sm:inline">Premium Support Access</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden max-w-[1440px] mx-auto flex items-center gap-4 overflow-x-auto py-2 border-t border-[#3E6E86]/35 no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`rm-navlink !text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'rm-navlink-active' : ''
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
