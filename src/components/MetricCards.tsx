import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Monthly Total Spend */}
      <div
        onClick={() => onNavigateTab('expenses')}
        className="xh-metric cursor-pointer"
      >
        <div className="lbl">
          <span className="whitespace-nowrap">01 · Monthly Spend 💰</span>
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap ${
              percentageChange > 0 ? 'text-[#EBC385]' : 'text-[#5FD3BF]'
            }`}
          >
            {percentageChange > 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`} MoM
          </span>
        </div>
        <div className="num tabular-nums">
          {formatCurrency(currentSpend)}
        </div>
        <p>AWS, GCP &amp; Azure · Updated MTD</p>
      </div>

      {/* Card 2: Identified Potential Savings */}
      <div
        onClick={() => onNavigateTab('optimization')}
        className="xh-metric cursor-pointer"
      >
        <div className="lbl">
          <span className="whitespace-nowrap">02 · Savings Queue 📈</span>
          <button
            type="button"
            className="text-[#EBC385] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inspect {openRecommendationsCount} →
          </button>
        </div>
        <div className="num hi tabular-nums">
          {formatCurrency(potentialSavingsMonthly)}
          <span className="text-xs font-normal text-[#A9B7BF] ml-1.5">/month</span>
        </div>
        <p>
          {formatCurrency(potentialSavingsAnnual, true)}/yr · {openRecommendationsCount} optimization areas
        </p>
      </div>

      {/* Card 3: Commitment & Reservation Coverage */}
      <div
        onClick={() => onNavigateTab('benchmarks')}
        className="xh-metric cursor-pointer"
      >
        <div className="lbl">
          <span className="whitespace-nowrap">03 · RI/SP Coverage 🛡️</span>
          <span className="text-[#EBC385] whitespace-nowrap">Median: 64%</span>
        </div>
        <div className="num tabular-nums">
          {commitmentCoveragePct}%
          <span className="text-xs font-normal text-[#A9B7BF] ml-1.5">RI + SP / CUD</span>
        </div>
        <p>Top quartile: 82.5% · Target: ravindran.in</p>
      </div>

      {/* Card 4: Spike & Cost Anomalies */}
      <div
        onClick={() => onNavigateTab('alerts')}
        className="xh-metric cursor-pointer"
      >
        <div className="lbl">
          <span className="whitespace-nowrap">04 · Cost Anomalies ⚡</span>
          <span className="text-[#5FD3BF] whitespace-nowrap">+25% Rule</span>
        </div>
        <div className="num flex items-baseline gap-2.5 tabular-nums">
          <span className={criticalAnomaliesCount > 0 ? 'text-red-400' : 'text-[#EBC385]'}>
            {activeAnomaliesCount} <span className="text-xs font-normal text-[#A9B7BF]">Active</span>
          </span>
          {criticalAnomaliesCount > 0 && (
            <>
              <span className="text-[#7F909A] text-sm">·</span>
              <span className="text-[#EBC385]">
                {criticalAnomaliesCount} <span className="text-xs font-normal text-[#A9B7BF]">Critical</span>
              </span>
            </>
          )}
        </div>
        <p>Real-time API prober · Alert dispatch active</p>
      </div>
    </div>
  );
};
