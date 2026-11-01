import React, { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { MonthlyExpense } from '../types/cost';
import { formatCurrency } from '../utils/costCalculations';

interface ExpenseTrackerTabProps {
  expenses: MonthlyExpense[];
  onAddExpense: (expense: MonthlyExpense) => void;
}

export const ExpenseTrackerTab: React.FC<ExpenseTrackerTabProps> = ({
  expenses,
  onAddExpense,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMonthName, setNewMonthName] = useState('Nov 2026');
  const [newTotalSpend, setNewTotalSpend] = useState('81200');
  const [newComputeSpend, setNewComputeSpend] = useState('37500');
  const [newStorageSpend, setNewStorageSpend] = useState('15200');

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (selectedProvider === 'All') return true;
    return e.accounts.some((a) => a.provider === selectedProvider);
  });

  const latestExpense = expenses[expenses.length - 1];

  // Category totals for latest month
  const categoryData = latestExpense
    ? [
        { name: 'Compute (EC2 / GCE / VMs)', amount: latestExpense.categories.compute, emoji: '💻', color: 'bg-[#2BB5A0]' },
        { name: 'Storage (S3 / GCS / EBS)', amount: latestExpense.categories.storage, emoji: '📦', color: 'bg-[#3E6E86]' },
        { name: 'Networking & Egress', amount: latestExpense.categories.networking, emoji: '🌐', color: 'bg-[#D79A45]' },
        { name: 'Databases (RDS / BigQuery / Azure SQL)', amount: latestExpense.categories.database, emoji: '🗄️', color: 'bg-[#0E2238]' },
        { name: 'AI & Machine Learning (OpenAI / TPUs)', amount: latestExpense.categories.aiMl, emoji: '🤖', color: 'bg-emerald-600' },
        { name: 'Other Support & Management', amount: latestExpense.categories.other, emoji: '⚙️', color: 'bg-slate-500' },
      ]
    : [];

  const maxMonthlySpend = Math.max(...expenses.map((e) => e.totalSpend), 90000);

  const handleExportCSV = () => {
    const headers = 'Month,Total Spend,On-Demand,Reservations,Savings Plans,Spot\n';
    const rows = expenses
      .map(
        (e) =>
          `"${e.monthLabel}",${e.totalSpend},${e.onDemandSpend},${e.reservationSpend},${e.savingsPlanSpend},${e.spotSpend}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloud_expenses_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(newTotalSpend) || 75000;
    const compute = parseFloat(newComputeSpend) || 35000;
    const storage = parseFloat(newStorageSpend) || 14000;
    const remaining = Math.max(0, total - (compute + storage));

    const newEntry: MonthlyExpense = {
      id: `exp-${Date.now()}`,
      month: '2026-11',
      monthLabel: newMonthName,
      totalSpend: total,
      onDemandSpend: Math.round(total * 0.55),
      reservationSpend: Math.round(total * 0.18),
      savingsPlanSpend: Math.round(total * 0.20),
      spotSpend: Math.round(total * 0.07),
      provider: 'Multi-Cloud',
      categories: {
        compute,
        storage,
        networking: Math.round(remaining * 0.35),
        database: Math.round(remaining * 0.35),
        aiMl: Math.round(remaining * 0.2),
        other: Math.round(remaining * 0.1),
      },
      accounts: [
        { name: 'Production Core (AWS)', spend: Math.round(total * 0.54), provider: 'AWS' },
        { name: 'Analytics & BigQuery (GCP)', spend: Math.round(total * 0.31), provider: 'GCP' },
        { name: 'Legacy Enterprise DB (Azure)', spend: Math.round(total * 0.15), provider: 'Azure' },
      ],
    };

    onAddExpense(newEntry);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar on White Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0 font-mono">
              💰
            </div>
            <div>
              <span className="rm-kicker">01 / MULTI-CLOUD LEDGER &amp; PRICING MODEL STACK</span>
              <h2 className="text-xl font-bold text-[#16232F] font-serif flex items-center gap-2">
                <span>Monthly Cloud Expense Tracker</span>
                <span>💰📈</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Historical invoice breakdown across compute, storage, databases, and multi-cloud accounts evaluated by <strong>Mani Ravindran</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#F3F5F1] border border-slate-200 rounded-lg">
              {['All', 'AWS', 'GCP', 'Azure'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedProvider === p
                      ? 'bg-white text-[#16232F] shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-[#16232F]'
                  }`}
                >
                  {p === 'All' ? 'All Clouds 🌐' : p === 'AWS' ? 'AWS 🟧' : p === 'GCP' ? 'GCP 🟦' : 'Azure 🔷'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Month / Forecast</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#081420] hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#5FD3BF]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card: Monthly Spend & Commitment Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#16232F] font-serif">
              6-Month Spend Trend by Pricing Model
            </h3>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 font-mono">
              <span>On-Demand vs Reserved vs Savings Plans</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">Real-time normalized</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#D79A45]" />
              <span>On-Demand (Retail)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#3E6E86]" />
              <span>Reserved Instances</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#2BB5A0]" />
              <span>Savings Plans / CUDs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#0E2238]" />
              <span>Spot Capacity</span>
            </div>
          </div>
        </div>

        {/* SVG Stacked Bar Chart */}
        <div className="w-full h-64 relative flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-200 bg-[#F3F5F1]/60 px-4 rounded-lg">
          {filteredExpenses.map((exp) => {
            const total = exp.totalSpend;
            const barHeightPct = (total / maxMonthlySpend) * 100;
            const onDemandPct = (exp.onDemandSpend / total) * 100;
            const resPct = (exp.reservationSpend / total) * 100;
            const spPct = (exp.savingsPlanSpend / total) * 100;
            const spotPct = (exp.spotSpend / total) * 100;

            return (
              <div key={exp.id} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-[#081420] border border-[#3E6E86]/50 text-[#EEF3F1] text-[11px] py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap font-mono tabular-nums">
                  {exp.monthLabel}: {formatCurrency(total)}
                  <div className="text-[10px] text-[#5FD3BF]">
                    On-Demand: {formatCurrency(exp.onDemandSpend)} ({Math.round(onDemandPct)}%)
                  </div>
                </div>

                {/* Amount label */}
                <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-700 mb-1 group-hover:text-emerald-700 transition-colors">
                  {formatCurrency(total, true)}
                </span>

                {/* Stacked Bar Container */}
                <div
                  className="w-full max-w-[56px] rounded-t overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-105 shadow-xs"
                  style={{ height: `${barHeightPct}%` }}
                >
                  <div style={{ height: `${onDemandPct}%` }} className="bg-[#D79A45] w-full" title={`On-Demand: ${formatCurrency(exp.onDemandSpend)}`} />
                  <div style={{ height: `${resPct}%` }} className="bg-[#3E6E86] w-full" title={`Reserved: ${formatCurrency(exp.reservationSpend)}`} />
                  <div style={{ height: `${spPct}%` }} className="bg-[#2BB5A0] w-full" title={`Savings Plans: ${formatCurrency(exp.savingsPlanSpend)}`} />
                  <div style={{ height: `${spotPct}%` }} className="bg-[#0E2238] w-full" title={`Spot: ${formatCurrency(exp.spotSpend)}`} />
                </div>

                {/* Month label */}
                <span className="text-xs font-mono font-semibold text-slate-700 mt-2 truncate w-full text-center">
                  {exp.monthLabel.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split: Category Breakdown & Account Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Spend by Service Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-[#16232F] font-serif mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Spend Breakdown by Category (Current Month)</span>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
              {latestExpense ? formatCurrency(latestExpense.totalSpend) : '$0'}
            </span>
          </h3>

          <div className="space-y-4">
            {categoryData.map((cat) => {
              const total = latestExpense?.totalSpend || 1;
              const pct = Math.round((cat.amount / total) * 100);
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[#16232F] font-semibold">
                      {formatCurrency(cat.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className={`${cat.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Spend by Account / Cloud Provider */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-[#16232F] font-serif mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Major Cloud Providers &amp; Account Share</span>
            <span className="text-xs text-slate-600 font-mono">3 Connected Environments</span>
          </h3>

          <div className="space-y-4">
            {latestExpense?.accounts.map((acc) => {
              const total = latestExpense.totalSpend;
              const pct = Math.round((acc.spend / total) * 100);
              const providerEmoji = acc.provider === 'AWS' ? '🟧 AWS' : acc.provider === 'GCP' ? '🟦 GCP' : '🔷 Azure';
              return (
                <div key={acc.name} className="p-4 rounded-lg bg-[#F3F5F1] border border-slate-200/90 hover:border-emerald-400 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#16232F] font-mono">{providerEmoji}</span>
                      <span className="text-xs text-slate-600">· {acc.name}</span>
                    </div>
                    <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                      {formatCurrency(acc.spend)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                    <span>Invoice Share:</span>
                    <span className="font-mono tabular-nums text-slate-800 font-medium">{pct}% of total</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        acc.provider === 'AWS' ? 'bg-[#D79A45]' : acc.provider === 'GCP' ? 'bg-[#3E6E86]' : 'bg-[#2BB5A0]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Add Manual Expense Adjustment / Forecast */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-[#081420]/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="rm-kicker">BUDGET FORECAST SIMULATOR</span>
            <h3 className="text-lg font-bold text-[#16232F] font-serif mb-1 flex items-center gap-2">
              <span>Add Monthly Expense / Forecast</span>
              <span>📈</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Simulate next month&apos;s projected spend to analyze potential savings and benchmark shifts.
            </p>

            <form onSubmit={handleSaveNewExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Month Label
                </label>
                <input
                  type="text"
                  value={newMonthName}
                  onChange={(e) => setNewMonthName(e.target.value)}
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Spend ($ USD)
                </label>
                <input
                  type="number"
                  value={newTotalSpend}
                  onChange={(e) => setNewTotalSpend(e.target.value)}
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Compute Spend ($)
                  </label>
                  <input
                    type="number"
                    value={newComputeSpend}
                    onChange={(e) => setNewComputeSpend(e.target.value)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Spend ($)
                  </label>
                  <input
                    type="number"
                    value={newStorageSpend}
                    onChange={(e) => setNewStorageSpend(e.target.value)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>
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
                  Save &amp; Simulate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
