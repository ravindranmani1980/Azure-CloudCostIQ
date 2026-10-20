import React, { useState } from 'react';
import { AlertTriangle, Bell, Zap, CheckCircle2, Plus, Sliders, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { AnomalyAlert, AlertRule, DailyExpensePoint } from '../types/cost';
import { formatCurrency } from '../utils/costCalculations';

interface AlertsAnomalyTabProps {
  alerts: AnomalyAlert[];
  rules: AlertRule[];
  dailyTrends: DailyExpensePoint[];
  onUpdateAlertStatus: (id: string, newStatus: AnomalyAlert['status']) => void;
  onAddRule: (rule: AlertRule) => void;
  onToggleRule: (id: string) => void;
  onSimulateSpike: () => void;
}

export const AlertsAnomalyTab: React.FC<AlertsAnomalyTabProps> = ({
  alerts,
  rules,
  dailyTrends,
  onUpdateAlertStatus,
  onAddRule,
  onToggleRule,
  onSimulateSpike,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [showAddRuleModal, setShowAddRuleModal] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newThresholdPct, setNewThresholdPct] = useState('30');
  const [newMinDollar, setNewMinDollar] = useState('300');
  const [newChannel, setNewChannel] = useState<'email' | 'webhook' | 'in-app'>('email');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'All') return true;
    return a.severity === filterSeverity;
  });

  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'investigating');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      thresholdPercentage: parseInt(newThresholdPct, 10) || 25,
      minDollarSpike: parseInt(newMinDollar, 10) || 200,
      enabled: true,
      notifyEmail: 'MANI.RAVINDRAN@gmail.com',
      channel: newChannel,
    };

    onAddRule(rule);
    setShowAddRuleModal(false);
    setNewRuleName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Spike Detection Engine & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚡🚨</span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Usage Spike & Cost Anomaly Detection Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Automated telemetry monitor inspecting real-time billing streams. Flags runaway microservices, uncapped query scans, and unexpected data transfer egress against rolling 7-day baselines.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 font-mono">
                Active Alerts: <strong className="text-rose-400">{activeAlerts.length}</strong>
              </span>
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 font-mono">
                Active Rules: <strong className="text-emerald-400">{rules.filter((r) => r.enabled).length}</strong>
              </span>
              <span className="text-slate-400 font-mono">
                Spike Alert Dispatch: <strong className="text-slate-200">MANI.RAVINDRAN@gmail.com</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onSimulateSpike}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-rose-950 cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>Simulate Sudden Usage Spike ⚡</span>
            </button>

            <button
              onClick={() => setShowAddRuleModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configure Custom Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* 20-Day Daily Spend Trend Chart with Spike Markers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Daily Multi-Cloud Spending (Last 20 Days)</span>
              <span>📈</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Red markers designate detected anomalies exceeding configured baseline thresholds.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-slate-500 rounded" />
              <span>Expected Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Normal Daily Spend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 font-semibold">Spike Anomaly</span>
            </div>
          </div>
        </div>

        {/* SVG Daily Trend Chart */}
        <div className="w-full h-44 relative flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-slate-800">
          {dailyTrends.map((point) => {
            const maxSpend = 4500;
            const spendHeightPct = (point.spend / maxSpend) * 100;
            const baselineHeightPct = (point.baseline / maxSpend) * 100;

            return (
              <div
                key={point.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 z-20 pointer-events-none bg-slate-950 border border-slate-700 text-white text-[11px] py-1 px-2.5 rounded shadow-xl whitespace-nowrap font-mono tabular-nums">
                  <div className="font-bold">{point.dayLabel}: {formatCurrency(point.spend)}</div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Baseline: {formatCurrency(point.baseline)}
                  </div>
                  {point.isSpike && (
                    <div className="text-[10px] text-rose-400 font-bold">
                      {point.spikeReason || 'Spike Detected ⚡'}
                    </div>
                  )}
                </div>

                {/* Point / Bar */}
                <div className="w-full max-w-[28px] h-full flex flex-col justify-end items-center relative">
                  {/* Baseline dotted indicator */}
                  <div
                    className="absolute w-full border-t border-dashed border-slate-500/80 z-0"
                    style={{ bottom: `${baselineHeightPct}%` }}
                    title={`Baseline: ${formatCurrency(point.baseline)}`}
                  />

                  {/* Spend Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      point.isSpike
                        ? 'bg-rose-500 shadow-md shadow-rose-950/80 group-hover:bg-rose-400'
                        : 'bg-emerald-500/80 group-hover:bg-emerald-400'
                    }`}
                    style={{ height: `${spendHeightPct}%` }}
                  />
                </div>

                <span className="text-[10px] text-slate-500 font-mono mt-1.5 truncate">
                  {point.dayLabel.split(' ')[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split: Active Anomaly Feed & Custom Alert Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Anomalies List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Incident Anomaly Feed</span>
              <span className="text-xs text-slate-400 font-mono">
                ({filteredAlerts.length} total)
              </span>
            </h3>

            <div className="flex items-center gap-1">
              {['All', 'critical', 'warning', 'info'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">No active anomalies matching filter</p>
                <p className="text-xs text-slate-500 mt-1">
                  All cloud resource usage is tracking within expected statistical thresholds.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                const isResolved = alert.status === 'resolved';

                return (
                  <div
                    key={alert.id}
                    className={`bg-slate-900/90 border rounded-xl p-4 transition-all ${
                      isResolved
                        ? 'border-slate-800/50 opacity-60'
                        : isCritical
                        ? 'border-rose-800/80 bg-rose-950/15'
                        : 'border-amber-800/60 bg-amber-950/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{alert.emoji}</span>
                        <div>
                          <span className="text-xs font-bold text-white">
                            {alert.service}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">
                            {alert.provider}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          +{alert.percentageIncrease}% Surge
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize font-mono">
                          [{alert.status}]
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {alert.rootCause}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-3 text-slate-400 font-mono">
                        <span>Spike: <strong className="text-rose-400">{formatCurrency(alert.currentSpike)}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Baseline: {formatCurrency(alert.expectedBaseline)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {alert.status !== 'resolved' ? (
                          <>
                            {alert.status === 'active' && (
                              <button
                                onClick={() => onUpdateAlertStatus(alert.id, 'investigating')}
                                className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/60 rounded-md transition-colors cursor-pointer"
                              >
                                Investigate 🔍
                              </button>
                            )}
                            <button
                              onClick={() => onUpdateAlertStatus(alert.id, 'resolved')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 rounded-md transition-colors cursor-pointer"
                            >
                              Resolve Issue ✅
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">
                            Resolved by FinOps team
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Alert Rules Engine */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Spike Alert Rules</span>
            </h3>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              + New Rule
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    {rule.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => onToggleRule(rule.id)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    aria-label={`Toggle rule ${rule.name}`}
                  />
                </div>

                <div className="text-[11px] text-slate-400 font-mono space-y-1">
                  <div>Threshold: <strong className="text-emerald-400">+{rule.thresholdPercentage}%</strong> above baseline</div>
                  <div>Min Dollar Surge: <strong className="text-slate-300">${rule.minDollarSpike}</strong></div>
                  <div>Channel: <span className="capitalize">{rule.channel}</span> ({rule.notifyEmail})</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-slate-300 leading-relaxed">
            <span className="font-semibold text-emerald-400">Pro Tip: </span>
            Setting threshold to 25% with $250 min prevents noise while catching runaway machine learning training loops and NAT Gateway egress leaks within 15 minutes.
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span>Create Spike Alert Rule</span>
              <span>⚡</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Trigger instant notifications when cloud spend surges beyond your configured variance envelope.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Model Retraining Surge (>40%)"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Spike % Threshold
                  </label>
                  <input
                    type="number"
                    value={newThresholdPct}
                    onChange={(e) => setNewThresholdPct(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min Dollar Spike ($)
                  </label>
                  <input
                    type="number"
                    value={newMinDollar}
                    onChange={(e) => setNewMinDollar(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notification Channel
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as 'email' | 'webhook' | 'in-app')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="email">Email (MANI.RAVINDRAN@gmail.com)</option>
                  <option value="webhook">Webhook / PagerDuty / Slack</option>
                  <option value="in-app">In-App Dashboard Toast</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
