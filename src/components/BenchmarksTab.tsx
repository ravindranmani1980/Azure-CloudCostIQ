import React, { useState } from 'react';
import { ShieldCheck, Award, FileText, Copy, Check, TrendingUp, AlertTriangle } from 'lucide-react';
import { BenchmarkReportItem } from '../types/cost';
import { calculateFinOpsMaturityScore } from '../utils/costCalculations';

interface BenchmarksTabProps {
  benchmarks: BenchmarkReportItem[];
  onOpenPremiumSupport: () => void;
}

export const BenchmarksTab: React.FC<BenchmarksTabProps> = ({
  benchmarks,
  onOpenPremiumSupport,
}) => {
  const [copied, setCopied] = useState(false);

  const maturity = calculateFinOpsMaturityScore(benchmarks);

  const handleCopyReport = () => {
    const text = benchmarks
      .map(
        (b) =>
          `* ${b.metricName} [${b.category}]:\n  Your Org: ${b.userValue}${b.unit} | Industry Median: ${b.industryMedian}${b.unit} | Top Quartile: ${b.industryTopQuartile}${b.unit}\n  Recommendation: ${b.recommendation}`
      )
      .join('\n\n');

    const summary = `CloudCostIQ - FinOps Reservation & Savings Plan Benchmarks Report\nCurated by Mani Ravindran (maniravindran.com)\nOverall Maturity Score: ${maturity.score}/100 (${maturity.grade})\n\n${text}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Industry Benchmarks & Overall FinOps Maturity Score */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️📈</span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Reservation & Savings Plan Industry Benchmarks
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Standardized comparison against 1,200+ global enterprises using the FinOps Foundation Maturity Framework. See where your cloud commitment rate and cost efficiency place you relative to top quartile performers.
            </p>
          </div>

          {/* Maturity Score Box */}
          <div className="flex items-center gap-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 shrink-0">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                {maturity.score}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">/ 100</span>
            </div>

            <div>
              <div className="text-xs text-slate-400">FinOps Maturity Rating</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{maturity.grade} Tier</span>
                <span className="text-xs text-emerald-400 font-mono">(Top 40%)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Target: 85+ for Elite Top Quartile
              </div>
            </div>

            <button
              onClick={handleCopyReport}
              className="ml-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Copy executive benchmark summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>
        </div>

        {/* Top Improvement Focus */}
        {maturity.topAreasForImprovement.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Priority Benchmark Gaps:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {maturity.topAreasForImprovement.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-0.5 rounded-md bg-amber-950/30 border border-amber-800/40 text-amber-300 font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map((item) => {
          const isHigherBetter = item.higherIsBetter;
          const isTopTier = isHigherBetter
            ? item.userValue >= item.industryTopQuartile
            : item.userValue <= item.industryTopQuartile;
          const isBeatingMedian = isHigherBetter
            ? item.userValue >= item.industryMedian
            : item.userValue <= item.industryMedian;

          const statusBadge = isTopTier ? (
            <span className="text-emerald-400 font-semibold text-xs">Industry Leader 🏆</span>
          ) : isBeatingMedian ? (
            <span className="text-sky-400 font-semibold text-xs">Above Median 📈</span>
          ) : (
            <span className="text-amber-400 font-semibold text-xs">Lagging Peer Group ⚠️</span>
          );

          // Percentile position calculation for progress bar
          const maxVal = Math.max(item.userValue, item.industryTopQuartile, item.industryMedian) * 1.25;
          const userPos = Math.min(100, Math.max(5, (item.userValue / maxVal) * 100));
          const medianPos = Math.min(100, Math.max(5, (item.industryMedian / maxVal) * 100));
          const topPos = Math.min(100, Math.max(5, (item.industryTopQuartile / maxVal) * 100));

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {item.metricName}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      {item.category}
                    </div>
                  </div>
                </div>
                {statusBadge}
              </div>

              {/* 3 Metric Value Pillars */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Your Org</div>
                  <div className="text-base font-bold text-emerald-400 tabular-nums">
                    {item.userValue}
                    <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Peer Median</div>
                  <div className="text-base font-bold text-slate-300 tabular-nums">
                    {item.industryMedian}
                    <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Top 25% Quartile</div>
                  <div className="text-base font-bold text-sky-400 tabular-nums">
                    {item.industryTopQuartile}
                    <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </div>
                </div>
              </div>

              {/* Visual Benchmark Slider Bar with Markers */}
              <div className="space-y-1.5 pt-1">
                <div className="relative w-full bg-slate-800 h-2.5 rounded-full overflow-visible">
                  {/* Median marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-400 z-10"
                    style={{ left: `${medianPos}%` }}
                    title={`Industry Median: ${item.industryMedian}${item.unit}`}
                  />
                  {/* Top quartile marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-sky-400 z-10"
                    style={{ left: `${topPos}%` }}
                    title={`Top Quartile: ${item.industryTopQuartile}${item.unit}`}
                  />
                  {/* Your org fill */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTopTier ? 'bg-emerald-400' : isBeatingMedian ? 'bg-sky-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${userPos}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0{item.unit}</span>
                  <span className="text-slate-400">| Median ({item.industryMedian}{item.unit})</span>
                  <span className="text-sky-400 font-medium">| Top 25% ({item.industryTopQuartile}{item.unit})</span>
                </div>
              </div>

              {/* Description & Actionable Recommendation */}
              <div className="space-y-1 text-xs">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {item.description}
                </p>
                <div className="p-2.5 rounded-md bg-slate-800/40 border border-slate-700/40 text-slate-200 text-xs">
                  <strong className="text-emerald-400 font-semibold">Action to Close Gap: </strong>
                  {item.recommendation}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advisory Note from Mani Ravindran */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-lg font-bold shrink-0">
            MR
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Enterprise Commitment Strategy by Mani Ravindran
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              "Most enterprises lose millions by over-committing to rigid 3-year standard RIs. By pairing 1-year Compute Savings Plans with flexible Spot pools and automated instance downsizing, you can exceed top quartile performance without capacity lock-in."
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPremiumSupport}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          Book 1-on-1 Commitment Review →
        </button>
      </div>
    </div>
  );
};
