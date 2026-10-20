import React from 'react';
import { formatCurrency } from '../utils/costCalculations';

interface MetricCardsProps {
  currentSpend: number;
  previousSpend: number;
  percentageChange: number;
  potentialSavingsMonthly: number;
  potentialSavingsAnnual: number;
  openRecommendationsCount: number;
  commitmentCoveragePct: number;
  activeAnomaliesCount: number;
  criticalAnomaliesCount: number;
  onNavigateTab: (tab: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  currentSpend,
  percentageChange,
  potentialSavingsMonthly,
  potentialSavingsAnnual,
  openRecommendationsCount,
  commitmentCoveragePct,
  activeAnomaliesCount,
  criticalAnomaliesCount,
  onNavigateTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Monthly Total Spend */}
      <div 
        onClick={() => onNavigateTab('expenses')}
        className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all cursor-pointer group hover:bg-slate-900"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Current Month Spend
          </span>
          <span className="text-xl leading-none">💰</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {formatCurrency(currentSpend)}
          </span>
          <span
            className={`text-xs font-bold font-mono tabular-nums ${
              percentageChange > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`} MoM
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span>AWS, GCP & Azure</span>
          <span aria-hidden="true">·</span>
          <span>Updated MTD</span>
        </div>
      </div>

      {/* Card 2: Identified Potential Savings */}
      <div 
        onClick={() => onNavigateTab('optimization')}
        className="bg-slate-900/90 border border-slate-800 hover:border-emerald-600/50 rounded-xl p-5 transition-all cursor-pointer group hover:bg-slate-900"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
            Potential Savings
          </span>
          <span className="text-xl leading-none">📈</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
            {formatCurrency(potentialSavingsMonthly)}
          </span>
          <span className="text-xs font-medium text-slate-400">/month</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium font-mono tabular-nums">
            {formatCurrency(potentialSavingsAnnual, true)}/yr
          </span>
          <span aria-hidden="true">·</span>
          <span>{openRecommendationsCount} optimization areas</span>
        </div>
      </div>

      {/* Card 3: Commitment & Reservation Coverage */}
      <div 
        onClick={() => onNavigateTab('benchmarks')}
        className="bg-slate-900/90 border border-slate-800 hover:border-sky-600/50 rounded-xl p-5 transition-all cursor-pointer group hover:bg-slate-900"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-sky-400 tracking-wide uppercase">
            Commitment Coverage
          </span>
          <span className="text-xl leading-none">🛡️</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {commitmentCoveragePct}%
          </span>
          <span className="text-xs font-medium text-amber-400">Lagging Median (64%)</span>
        </div>
        {/* Simple Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div 
            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, commitmentCoveragePct)}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
          <span>Top quartile: 82.5%</span>
          <span aria-hidden="true">·</span>
          <span>RI + SP / CUD</span>
        </div>
      </div>

      {/* Card 4: Spike & Cost Anomalies */}
      <div 
        onClick={() => onNavigateTab('alerts')}
        className={`bg-slate-900/90 border rounded-xl p-5 transition-all cursor-pointer group hover:bg-slate-900 ${
          criticalAnomaliesCount > 0 
            ? 'border-rose-900/60 hover:border-rose-700/80 bg-rose-950/10' 
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold tracking-wide uppercase ${
            criticalAnomaliesCount > 0 ? 'text-rose-400' : 'text-amber-400'
          }`}>
            Cost Anomalies & Spikes
          </span>
          <span className="text-xl leading-none">⚡</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${
            criticalAnomaliesCount > 0 ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {activeAnomaliesCount} Active
          </span>
          {criticalAnomaliesCount > 0 && (
            <span className="text-xs font-bold text-rose-400 font-mono">
              ({criticalAnomaliesCount} Critical)
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span>Real-time API prober</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400">Z-score +25% rule active</span>
        </div>
      </div>
    </div>
  );
};
