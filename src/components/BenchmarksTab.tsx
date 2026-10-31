import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

    const summary = `Maniq | CloudCost IQ — FinOps Reservation & Savings Plan Benchmarks Report\nCurated by Mani Ravindran (ravindran.in)\nOverall Maturity Score: ${maturity.score}/100 (${maturity.grade})\n\n${text}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Industry Benchmarks & Overall FinOps Maturity Score */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0 font-mono">
              🛡️
            </div>
            <div>
              <span className="rm-kicker">03 / FINOPS FOUNDATION MATURITY &amp; COMMITMENT POSTURE</span>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#16232F] font-serif">
                  Reservation &amp; Savings Plan Industry Benchmarks
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-800">
                  Target: ravindran.in
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
                Standardized comparison against 1,200+ global enterprises using the FinOps Foundation Maturity Framework evaluated by <strong>Mani Ravindran</strong>.
              </p>
            </div>
          </div>

          {/* Maturity Score Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-[#0D1C2D] border border-[#3E6E86]/45 rounded-xl p-4 shrink-0 text-[#EEF3F1]">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-[#102236] border border-[#5FD3BF]/35 flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#5FD3BF]">
                  {maturity.score}
                </span>
                <span className="text-[10px] text-[#A9B7BF] font-mono">/ 100</span>
              </div>

              <div>
                <div className="text-[11px] font-mono text-[#A9B7BF] uppercase">FinOps Maturity Rating</div>
                <div className="text-sm font-bold text-[#EEF3F1] flex items-center gap-1.5">
                  <span>{maturity.grade} Tier</span>
                  <span className="text-xs text-[#EBC385] font-mono">(Top 40%)</span>
                </div>
                <div className="text-[11px] text-[#7F909A] mt-0.5">
                  Target: 85+ for Elite Top Quartile
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyReport}
              className="xh-btn !py-1.5 !px-3 !text-xs cursor-pointer shrink-0"
              title="Copy executive benchmark summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#5FD3BF]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>
        </div>

        {/* Top Improvement Focus */}
        {maturity.topAreasForImprovement.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-amber-800 font-semibold flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D79A45]" />
              <span>Priority Benchmark Gaps:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {maturity.topAreasForImprovement.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-0.5 rounded bg-amber-100/80 border border-amber-300 text-amber-900 font-mono text-[11px] font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Metric Cards Grid (Postrix Compliance Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {benchmarks.map((item, idx) => {
          const isHigherBetter = item.higherIsBetter;
          const isTopTier = isHigherBetter
            ? item.userValue >= item.industryTopQuartile
            : item.userValue <= item.industryTopQuartile;
          const isBeatingMedian = isHigherBetter
            ? item.userValue >= item.industryMedian
            : item.userValue <= item.industryMedian;

          const statusBadge = isTopTier ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100/80 border border-emerald-300 text-emerald-800">
              PASS · TOP QUARTILE
            </span>
          ) : isBeatingMedian ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
              ABOVE MEDIAN 📈
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-100 border border-amber-300 text-amber-900">
              GAP · LAGGING PEERS ⚠️
            </span>
          );

          // Percentile position calculation for progress bar
          const maxVal = Math.max(item.userValue, item.industryTopQuartile, item.industryMedian) * 1.25;
          const userPos = Math.min(100, Math.max(5, (item.userValue / maxVal) * 100));
          const medianPos = Math.min(100, Math.max(5, (item.industryMedian / maxVal) * 100));
          const topPos = Math.min(100, Math.max(5, (item.industryTopQuartile / maxVal) * 100));

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2BB5A0] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-[#16232F] leading-snug">
                        {item.emoji} {item.metricName}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        CHK-FINOPS-0{idx + 1} · {item.category.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {statusBadge}
                </div>

                {/* 3 Metric Value Pillars */}
                <div className="grid grid-cols-3 gap-2 bg-[#F3F5F1] p-3 rounded-lg border border-slate-200/80 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Your Org</div>
                    <div className="text-base font-bold text-emerald-700 tabular-nums">
                      {item.userValue}
                      <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Peer Median</div>
                    <div className="text-base font-bold text-[#16232F] tabular-nums">
                      {item.industryMedian}
                      <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Top 25% Quartile</div>
                    <div className="text-base font-bold text-[#3E6E86] tabular-nums">
                      {item.industryTopQuartile}
                      <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Benchmark Slider Bar with Markers */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative w-full bg-slate-200 h-2.5 rounded-full overflow-visible">
                    {/* Median marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-slate-600 z-10"
                      style={{ left: `${medianPos}%` }}
                      title={`Industry Median: ${item.industryMedian}${item.unit}`}
                    />
                    {/* Top quartile marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#081420] z-10"
                      style={{ left: `${topPos}%` }}
                      title={`Top Quartile: ${item.industryTopQuartile}${item.unit}`}
                    />
                    {/* Your org fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTopTier ? 'bg-[#2BB5A0]' : isBeatingMedian ? 'bg-[#3E6E86]' : 'bg-[#D79A45]'
                      }`}
                      style={{ width: `${userPos}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0{item.unit}</span>
                    <span className="text-slate-600">| Median ({item.industryMedian}{item.unit})</span>
                    <span className="text-[#16232F] font-semibold">| Top 25% ({item.industryTopQuartile}{item.unit})</span>
                  </div>
                </div>

                {/* Description & Actionable Recommendation in Postrix Monospace Box */}
                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {item.description}
                  </p>
                  <div className="p-2.5 rounded-md bg-[#F3F5F1] border border-slate-200/90 text-[#16232F] font-mono text-[11px] leading-relaxed">
                    <strong className="text-emerald-700 font-semibold">Detected Action: </strong>
                    {item.recommendation}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{item.category}</span>
                <span className="font-mono font-medium text-emerald-700">
                  {isTopTier ? 'Verified Leader' : 'Optimization Ready'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advisory Note from Mani Ravindran in Dark Navy xh-panel */}
      <div className="xh-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="rm-mono-mark !w-11 !h-11 !text-base shrink-0">
            RM
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#EEF3F1]">
              Enterprise Commitment Strategy by Mani Ravindran
            </h4>
            <p className="text-xs text-[#A9B7BF] max-w-2xl mt-0.5 leading-relaxed">
              &quot;Most enterprises lose millions by over-committing to rigid 3-year standard RIs. By pairing 1-year Compute Savings Plans with flexible Spot pools and automated instance downsizing, you can exceed top quartile performance without capacity lock-in.&quot;
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPremiumSupport}
          className="xh-btn primary whitespace-nowrap shrink-0 cursor-pointer"
        >
          Book 1-on-1 Commitment Review →
        </button>
      </div>
    </div>
  );
};
