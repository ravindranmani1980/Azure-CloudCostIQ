import React, { useState } from 'react';
import { Check, Plus, Sparkles, Undo2, Trash2 } from 'lucide-react';
import { OptimizationRecommendation, OptimizationCategory, CloudProvider } from '../types/cost';
import { formatCurrency } from '../utils/costCalculations';

interface OptimizationTabProps {
  recommendations: OptimizationRecommendation[];
  onToggleStatus: (id: string, newStatus: 'open' | 'applied' | 'dismissed') => void;
  onAddRecommendation: (rec: OptimizationRecommendation) => void;
  onOpenPremiumSupport: () => void;
}

export const OptimizationTab: React.FC<OptimizationTabProps> = ({
  recommendations,
  onToggleStatus,
  onAddRecommendation,
  onOpenPremiumSupport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // New recommendation state
  const [newTitle, setNewTitle] = useState('');
  const [newService, setNewService] = useState('AWS EC2');
  const [newProvider, setNewProvider] = useState<CloudProvider>('AWS');
  const [newCategory, setNewCategory] = useState<OptimizationCategory>('Compute Downsizing');
  const [newDescription, setNewDescription] = useState('');
  const [newMonthlySavings, setNewMonthlySavings] = useState('1500');

  const categories: string[] = [
    'All',
    'Compute Downsizing',
    'Reservation Commitment',
    'Idle Resource Cleanup',
    'Storage Tiering',
    'Spot Migration',
    'Egress Optimization',
  ];

  const filteredRecs = recommendations.filter((r) => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (selectedRisk !== 'All' && r.riskLevel !== selectedRisk) return false;
    return true;
  });

  const openRecs = recommendations.filter((r) => r.status === 'open');
  const appliedRecs = recommendations.filter((r) => r.status === 'applied');
  const totalOpenSavingsMonthly = openRecs.reduce((sum, r) => sum + r.estimatedSavingsMonthly, 0);
  const totalAppliedSavingsMonthly = appliedRecs.reduce((sum, r) => sum + r.estimatedSavingsMonthly, 0);

  const handleRunAiAnalysis = () => {
    setAiAnalysisRunning(true);
    setTimeout(() => {
      setAiAnalysisRunning(false);
      setAiReport(
        `FinOps Executive Optimization Plan:\n` +
        `1. High-Yield Wave 1 ($10,100/mo): Purge 42 unattached disks and enable automated weekend stop/start on Dev RDS databases immediately (Zero operational risk).\n` +
        `2. Wave 2 Commitment ($4,100/mo): Purchase 1-year Compute Savings Plan covering baseline compute at 78% (unlocks 28% steady discount).\n` +
        `3. Wave 3 Architecture ($4,650/mo): Consolidate cross-AZ NAT Gateways and transition stateless Jenkins/dbt batch workers to spot fleet pools.`
      );
    }, 900);
  };

  const handleCreateRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const monthly = parseFloat(newMonthlySavings) || 1000;
    const newRec: OptimizationRecommendation = {
      id: `rec-${Date.now()}`,
      title: newTitle,
      service: newService,
      provider: newProvider,
      category: newCategory,
      description: newDescription || 'Identified via automated cloud usage telemetry scan.',
      currentSpendMonthly: Math.round(monthly * 2.5),
      estimatedSavingsMonthly: monthly,
      estimatedSavingsAnnual: monthly * 12,
      riskLevel: 'Low',
      effort: 'Instant',
      status: 'open',
      targetResource: `${newProvider} ${newService} Fleet`,
      emoji: '💡',
    };

    onAddRecommendation(newRec);
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Total Savings Summary & Quick Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0 font-mono">
              📈
            </div>
            <div>
              <span className="rm-kicker">02 / BUDGET OPTIMIZATION &amp; WASTE ELIMINATION</span>
              <h2 className="text-xl font-bold text-[#16232F] font-serif flex items-center gap-2">
                <span>Identified Budget Optimization Opportunities</span>
                <span>💰📈</span>
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl mt-1">
                Actionable FinOps recommendations across compute, reservations, idle zombie resources, and egress evaluated by <strong>Ravindran Mani</strong>. Click &quot;Apply&quot; to simulate realized savings.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono">
                <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span className="text-slate-600">Available Savings: </span>
                  <span className="text-emerald-700 font-bold tabular-nums">
                    {formatCurrency(totalOpenSavingsMonthly)}/mo
                  </span>
                  <span className="text-slate-500"> ({formatCurrency(totalOpenSavingsMonthly * 12, true)}/yr)</span>
                </div>

                <div className="bg-[#F3F5F1] px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600">Realized / Applied: </span>
                  <span className="text-[#3E6E86] font-bold tabular-nums">
                    {formatCurrency(totalAppliedSavingsMonthly)}/mo
                  </span>
                  <span className="text-slate-500"> ({appliedRecs.length} implemented)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={aiAnalysisRunning}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#081420] hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5FD3BF]" />
              <span>{aiAnalysisRunning ? 'Synthesizing...' : 'AI Optimization Copilot 💡'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Finding</span>
            </button>
          </div>
        </div>

        {/* AI Copilot Insights Drawer */}
        {aiReport && (
          <div className="mt-5 p-4 rounded-lg bg-[#0D1C2D] border border-[#3E6E86]/45 text-xs text-[#EEF3F1]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#5FD3BF] font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ravindran Mani&apos;s FinOps Execution Runbook</span>
              </span>
              <button
                type="button"
                onClick={() => setAiReport(null)}
                className="text-[#A9B7BF] hover:text-white text-[11px] cursor-pointer"
              >
                Close
              </button>
            </div>
            <pre className="font-sans whitespace-pre-wrap leading-relaxed text-[#C6D1D6]">
              {aiReport}
            </pre>
            <div className="mt-3 pt-2 border-t border-[#C9D3D9]/15 flex items-center justify-between">
              <span className="text-[11px] text-[#A9B7BF]">
                Need hands-on enterprise migration assistance?
              </span>
              <button
                type="button"
                onClick={onOpenPremiumSupport}
                className="text-[#EBC385] hover:text-[#D79A45] font-mono font-semibold text-[11px] underline cursor-pointer"
              >
                Contact Ravindran Mani for 1-on-1 Consultation →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg overflow-x-auto no-scrollbar w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#081420] text-[#EBC385]'
                  : 'text-slate-600 hover:text-[#16232F] hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-medium text-slate-600">Risk:</span>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#16232F] font-medium focus:outline-none focus:border-[#2BB5A0] cursor-pointer"
          >
            <option value="All">All Risks</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-3.5">
        {filteredRecs.map((rec) => {
          const isApplied = rec.status === 'applied';
          const isDismissed = rec.status === 'dismissed';

          return (
            <div
              key={rec.id}
              className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
                isApplied
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : isDismissed
                  ? 'border-slate-200 opacity-50'
                  : 'border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#F3F5F1] border border-slate-200 flex items-center justify-center text-xl shrink-0">
                    <span>{rec.emoji}</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#16232F] tracking-tight">
                        {rec.title}
                      </h3>
                      {isApplied && (
                        <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded">
                          PASS · Applied &amp; Realized ✨
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {rec.description}
                    </p>

                    {/* Postrix-style Technical Metadata Box */}
                    <div className="p-2.5 rounded-md bg-[#F3F5F1] border border-slate-200/80 text-[11px] text-slate-600 flex flex-wrap items-center gap-2 font-mono">
                      <span className="font-semibold text-[#16232F]">{rec.provider}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.service}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#3E6E86] font-medium">{rec.targetResource}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Risk:{' '}
                        <strong className={rec.riskLevel === 'Low' ? 'text-emerald-700' : 'text-amber-700'}>
                          {rec.riskLevel}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Effort: {rec.effort}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Numbers & Action Button */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-[11px] text-slate-500 font-mono uppercase">Monthly Savings</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-emerald-700">
                      +{formatCurrency(rec.estimatedSavingsMonthly)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {formatCurrency(rec.estimatedSavingsAnnual, true)} / year
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isApplied ? (
                      <button
                        type="button"
                        onClick={() => onToggleStatus(rec.id, 'open')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Revert to open status"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Revert</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleStatus(rec.id, 'applied')}
                        className="px-3.5 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Apply Optimization</span>
                      </button>
                    )}

                    {!isDismissed && (
                      <button
                        type="button"
                        onClick={() => onToggleStatus(rec.id, 'dismissed')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Dismiss recommendation"
                        aria-label="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Custom Finding */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-[#081420]/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="rm-kicker">CUSTOM FINOPS FINDING</span>
            <h3 className="text-lg font-bold text-[#16232F] font-serif mb-1 flex items-center gap-2">
              <span>Log Cloud Optimization Finding</span>
              <span>💡</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Add a discovered optimization opportunity to track against your monthly infrastructure budget.
            </p>

            <form onSubmit={handleCreateRecommendation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delete unused Cloud SQL replicas in staging"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cloud Provider
                  </label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as CloudProvider)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                  >
                    <option value="AWS">AWS</option>
                    <option value="GCP">GCP</option>
                    <option value="Azure">Azure</option>
                    <option value="Multi-Cloud">Multi-Cloud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as OptimizationCategory)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                  >
                    <option value="Compute Downsizing">Compute Downsizing</option>
                    <option value="Reservation Commitment">Reservation Commitment</option>
                    <option value="Idle Resource Cleanup">Idle Resource Cleanup</option>
                    <option value="Storage Tiering">Storage Tiering</option>
                    <option value="Spot Migration">Spot Migration</option>
                    <option value="Egress Optimization">Egress Optimization</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service / Product
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Aurora / Cloud SQL"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Est. Monthly Savings ($)
                  </label>
                  <input
                    type="number"
                    value={newMonthlySavings}
                    onChange={(e) => setNewMonthlySavings(e.target.value)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description &amp; Impact
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail the utilization trigger and remediation steps..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#16232F] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg transition-colors cursor-pointer"
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
