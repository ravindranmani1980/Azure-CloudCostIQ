import React, { useState } from 'react';
import { Download, Filter, Plus, TrendingUp, DollarSign } from 'lucide-react';
import { MonthlyExpense, CloudProvider } from '../types/cost';
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
  const categoryData = latestExpense ? [
    { name: 'Compute (EC2 / GCE / VMs)', amount: latestExpense.categories.compute, emoji: '💻', color: 'bg-emerald-500' },
    { name: 'Storage (S3 / GCS / EBS)', amount: latestExpense.categories.storage, emoji: '📦', color: 'bg-sky-500' },
    { name: 'Networking & Egress', amount: latestExpense.categories.networking, emoji: '🌐', color: 'bg-amber-500' },
    { name: 'Databases (RDS / BigQuery / Azure SQL)', amount: latestExpense.categories.database, emoji: '🗄️', color: 'bg-indigo-500' },
    { name: 'AI & Machine Learning (OpenAI / TPUs)', amount: latestExpense.categories.aiMl, emoji: '🤖', color: 'bg-purple-500' },
    { name: 'Other Support & Management', amount: latestExpense.categories.other, emoji: '⚙️', color: 'bg-slate-500' },
  ] : [];

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
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Monthly Cloud Expense Tracker</span>
            <span>💰📈</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical invoice breakdown across compute, storage, databases, and multi-cloud accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Provider Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {['All', 'AWS', 'GCP', 'Azure'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedProvider === p
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'All' ? 'All Clouds 🌐' : p === 'AWS' ? 'AWS 🟧' : p === 'GCP' ? 'GCP 🟦' : 'Azure 🔷'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Month / Forecast</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Chart Card: Monthly Spend & Commitment Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white">
              6-Month Spend Trend by Pricing Model
            </h3>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>On-Demand vs Reserved vs Savings Plans</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">Real-time normalized</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span>On-Demand (Retail)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-500" />
              <span>Reserved Instances</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Savings Plans / CUDs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>Spot Capacity</span>
            </div>
          </div>
        </div>

        {/* SVG Stacked Bar Chart */}
        <div className="w-full h-64 relative flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800">
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-950 border border-slate-700 text-white text-[11px] py-1 px-2 rounded shadow-lg whitespace-nowrap font-mono tabular-nums">
                  {exp.monthLabel}: {formatCurrency(total)}
                  <div className="text-[10px] text-slate-400 font-sans">
                    On-Demand: {formatCurrency(exp.onDemandSpend)} ({Math.round(onDemandPct)}%)
                  </div>
                </div>

                {/* Amount label */}
                <span className="text-[11px] font-mono tabular-nums text-slate-400 mb-1 group-hover:text-emerald-400 transition-colors">
                  {formatCurrency(total, true)}
                </span>

                {/* Stacked Bar Container */}
                <div
                  className="w-full max-w-[56px] rounded-t overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${barHeightPct}%` }}
                >
                  <div style={{ height: `${onDemandPct}%` }} className="bg-amber-500/90 w-full" title={`On-Demand: ${formatCurrency(exp.onDemandSpend)}`} />
                  <div style={{ height: `${resPct}%` }} className="bg-sky-500/90 w-full" title={`Reserved: ${formatCurrency(exp.reservationSpend)}`} />
                  <div style={{ height: `${spPct}%` }} className="bg-emerald-500/90 w-full" title={`Savings Plans: ${formatCurrency(exp.savingsPlanSpend)}`} />
                  <div style={{ height: `${spotPct}%` }} className="bg-purple-500/90 w-full" title={`Spot: ${formatCurrency(exp.spotSpend)}`} />
                </div>

                {/* Month label */}
                <span className="text-xs font-semibold text-slate-400 mt-2 truncate w-full text-center">
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
            <span>Spend Breakdown by Category (Current Month)</span>
            <span className="text-xs font-mono text-emerald-400">
              {latestExpense ? formatCurrency(latestExpense.totalSpend) : '$0'}
            </span>
          </h3>

          <div className="space-y-3.5">
            {categoryData.map((cat) => {
              const total = latestExpense?.totalSpend || 1;
              const pct = Math.round((cat.amount / total) * 100);
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-200 font-semibold">
                      {formatCurrency(cat.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`${cat.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Spend by Account / Cloud Provider */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
            <span>Major Cloud Providers & Account Share</span>
            <span className="text-xs text-slate-400 font-mono">3 Connected Environments</span>
          </h3>

          <div className="space-y-4">
            {latestExpense?.accounts.map((acc) => {
              const total = latestExpense.totalSpend;
              const pct = Math.round((acc.spend / total) * 100);
              const providerEmoji = acc.provider === 'AWS' ? '🟧 AWS' : acc.provider === 'GCP' ? '🟦 GCP' : '🔷 Azure';
              return (
                <div key={acc.name} className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{providerEmoji}</span>
                      <span className="text-xs text-slate-400">· {acc.name}</span>
                    </div>
                    <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                      {formatCurrency(acc.spend)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Invoice Share:</span>
                    <span className="font-mono tabular-nums text-slate-300">{pct}% of total</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        acc.provider === 'AWS' ? 'bg-amber-500' : acc.provider === 'GCP' ? 'bg-blue-500' : 'bg-sky-400'
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span>Add Monthly Expense / Budget Forecast</span>
              <span>📈</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Simulate next month's projected spend to analyze potential savings and benchmark shifts.
            </p>

            <form onSubmit={handleSaveNewExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Month Label
                </label>
                <input
                  type="text"
                  value={newMonthName}
                  onChange={(e) => setNewMonthName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Spend ($ USD)
                </label>
                <input
                  type="number"
                  value={newTotalSpend}
                  onChange={(e) => setNewTotalSpend(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Compute Spend ($)
                  </label>
                  <input
                    type="number"
                    value={newComputeSpend}
                    onChange={(e) => setNewComputeSpend(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Storage Spend ($)
                  </label>
                  <input
                    type="number"
                    value={newStorageSpend}
                    onChange={(e) => setNewStorageSpend(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  Save & Simulate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
