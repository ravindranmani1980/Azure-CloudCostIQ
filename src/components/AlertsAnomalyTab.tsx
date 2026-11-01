import React, { useState } from 'react';
import { Bell, Zap, CheckCircle2, Plus } from 'lucide-react';
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
      notifyEmail: 'https://ravindran.in/contact.html',
      channel: newChannel,
    };

    onAddRule(rule);
    setShowAddRuleModal(false);
    setNewRuleName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Spike Detection Engine & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0 font-mono">
              ⚡
            </div>
            <div>
              <span className="rm-kicker">04 / REAL-TIME TELEMETRY &amp; ANOMALY GOVERNANCE</span>
              <h2 className="text-xl font-bold text-[#16232F] font-serif flex items-center gap-2">
                <span>Usage Spike &amp; Cost Anomaly Detection Engine</span>
                <span>⚡🚨</span>
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
                Automated telemetry monitor inspecting real-time billing streams. Flags runaway microservices, uncapped query scans, and unexpected data transfer egress against rolling 7-day baselines.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono">
                <span className="bg-red-50 px-3 py-1 rounded-md border border-red-200 text-slate-700">
                  Active Alerts: <strong className="text-red-700">{activeAlerts.length}</strong>
                </span>
                <span className="bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 text-slate-700">
                  Active Rules: <strong className="text-emerald-700">{rules.filter((r) => r.enabled).length}</strong>
                </span>
                <span className="text-slate-600">
                  Spike Alert Dispatch:{' '}
                  <a
                    href="https://ravindran.in/contact.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#16232F] hover:text-emerald-700 underline underline-offset-2"
                  >
                    https://ravindran.in/contact.html
                  </a>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onSimulateSpike}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>Simulate Sudden Usage Spike ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddRuleModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#081420] hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#5FD3BF]" />
              <span>Configure Custom Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* 20-Day Daily Spend Trend Chart with Spike Markers */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#16232F] font-serif flex items-center gap-2">
              <span>Daily Multi-Cloud Spending (Last 20 Days)</span>
              <span>📈</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Crimson markers designate detected anomalies exceeding configured baseline thresholds.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-slate-500 rounded" />
              <span>Expected Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2BB5A0]" />
              <span>Normal Daily Spend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-red-700 font-semibold">Spike Anomaly</span>
            </div>
          </div>
        </div>

        {/* SVG Daily Trend Chart */}
        <div className="w-full h-44 relative flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-slate-200 bg-[#F3F5F1]/60 px-3 rounded-lg">
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 z-20 pointer-events-none bg-[#081420] border border-[#3E6E86]/50 text-[#EEF3F1] text-[11px] py-1 px-2.5 rounded shadow-xl whitespace-nowrap font-mono tabular-nums">
                  <div className="font-bold">{point.dayLabel}: {formatCurrency(point.spend)}</div>
                  <div className="text-[10px] text-[#A9B7BF]">
                    Baseline: {formatCurrency(point.baseline)}
                  </div>
                  {point.isSpike && (
                    <div className="text-[10px] text-red-400 font-bold">
                      {point.spikeReason || 'Spike Detected ⚡'}
                    </div>
                  )}
                </div>

                {/* Point / Bar */}
                <div className="w-full max-w-[28px] h-full flex flex-col justify-end items-center relative">
                  {/* Baseline dotted indicator */}
                  <div
                    className="absolute w-full border-t border-dashed border-slate-500 z-0"
                    style={{ bottom: `${baselineHeightPct}%` }}
                    title={`Baseline: ${formatCurrency(point.baseline)}`}
                  />

                  {/* Spend Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      point.isSpike
                        ? 'bg-red-600 group-hover:bg-red-700'
                        : 'bg-[#2BB5A0] group-hover:bg-[#5FD3BF]'
                    }`}
                    style={{ height: `${spendHeightPct}%` }}
                  />
                </div>

                <span className="text-[10px] text-slate-600 font-mono mt-1.5 truncate">
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
            <h3 className="text-base font-bold text-[#16232F] font-serif flex items-center gap-2">
              <span>Incident Anomaly Feed</span>
              <span className="text-xs text-slate-500 font-mono font-normal">
                ({filteredAlerts.length} total)
              </span>
            </h3>

            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
              {['All', 'critical', 'warning', 'info'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 text-xs rounded capitalize transition-colors cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-[#081420] text-[#EBC385] font-semibold'
                      : 'text-slate-600 hover:text-[#16232F]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#2BB5A0] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#16232F]">No active anomalies matching filter</p>
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
                    className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
                      isResolved
                        ? 'border-slate-200 opacity-65'
                        : isCritical
                        ? 'border-red-200 hover:border-red-400'
                        : 'border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{alert.emoji}</span>
                        <div>
                          <span className="text-sm font-bold text-[#16232F]">
                            {alert.service}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2 font-mono">
                            {alert.provider}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          +{alert.percentageIncrease}% Surge
                        </span>
                        <span className="text-[11px] text-slate-500 capitalize font-mono">
                          [{alert.status}]
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-[#F3F5F1] border border-slate-200/80 text-xs text-slate-700 font-mono mb-3 leading-relaxed">
                      Detected: {alert.rootCause}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-3 text-slate-600 font-mono">
                        <span>
                          Spike: <strong className="text-red-700">{formatCurrency(alert.currentSpike)}</strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Baseline: {formatCurrency(alert.expectedBaseline)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {alert.status !== 'resolved' ? (
                          <>
                            {alert.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => onUpdateAlertStatus(alert.id, 'investigating')}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 border border-amber-300 rounded-md transition-colors cursor-pointer"
                              >
                                Investigate 🔍
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onUpdateAlertStatus(alert.id, 'resolved')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                            >
                              Resolve Issue ✅
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-mono font-semibold">
                            Verified Resolved
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#16232F] font-serif flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#2BB5A0]" />
              <span>Spike Alert Rules</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddRuleModal(true)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-mono font-semibold cursor-pointer"
            >
              + New Rule
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-lg bg-[#F3F5F1] border border-slate-200/90 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#16232F]">
                    {rule.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => onToggleRule(rule.id)}
                    className="rounded bg-white border-slate-300 text-[#2BB5A0] focus:ring-[#2BB5A0] h-4 w-4 cursor-pointer"
                    aria-label={`Toggle rule ${rule.name}`}
                  />
                </div>

                <div className="text-[11px] text-slate-600 font-mono space-y-1">
                  <div>
                    Threshold: <strong className="text-emerald-700">+{rule.thresholdPercentage}%</strong> above baseline
                  </div>
                  <div>
                    Min Dollar Surge: <strong className="text-[#16232F]">${rule.minDollarSpike}</strong>
                  </div>
                  <div>
                    Channel: <span className="capitalize">{rule.channel}</span> (
                    <a
                      href="https://ravindran.in/contact.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      {rule.notifyEmail.toLowerCase().includes('gmail.com')
                        ? 'https://ravindran.in/contact.html'
                        : rule.notifyEmail}
                    </a>
                    )
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-slate-700 leading-relaxed">
            <span className="font-semibold text-emerald-800 font-mono">Pro Tip: </span>
            Setting threshold to 25% with $250 min prevents noise while catching runaway machine learning training loops and NAT Gateway egress leaks within 15 minutes.
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Rule */}
      {showAddRuleModal && (
        <div
          className="fixed inset-0 z-50 bg-[#081420]/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAddRuleModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="rm-kicker">ALERT GOVERNANCE RULE</span>
            <h3 className="text-lg font-bold text-[#16232F] font-serif mb-1 flex items-center gap-2">
              <span>Create Spike Alert Rule</span>
              <span>⚡</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Trigger instant notifications when cloud spend surges beyond your configured variance envelope.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Model Retraining Surge (>40%)"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Spike % Threshold
                  </label>
                  <input
                    type="number"
                    value={newThresholdPct}
                    onChange={(e) => setNewThresholdPct(e.target.value)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Dollar Spike ($)
                  </label>
                  <input
                    type="number"
                    value={newMinDollar}
                    onChange={(e) => setNewMinDollar(e.target.value)}
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notification Channel
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as 'email' | 'webhook' | 'in-app')}
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] focus:outline-none focus:border-[#2BB5A0]"
                >
                  <option value="email">Contact Portal (https://ravindran.in/contact.html)</option>
                  <option value="webhook">Webhook / PagerDuty / Slack</option>
                  <option value="in-app">In-App Dashboard Toast</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#16232F] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg transition-colors cursor-pointer"
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
