import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { LiveBillingSyncBar } from './components/LiveBillingSyncBar';
import { ExpenseTrackerTab } from './components/ExpenseTrackerTab';
import { OptimizationTab } from './components/OptimizationTab';
import { BenchmarksTab } from './components/BenchmarksTab';
import { AlertsAnomalyTab } from './components/AlertsAnomalyTab';
import { ApiIntegrationTab } from './components/ApiIntegrationTab';
import { PremiumSupportModal } from './components/PremiumSupportModal';

import {
  INITIAL_MONTHLY_EXPENSES,
  INITIAL_RECOMMENDATIONS,
  INITIAL_BENCHMARKS,
  INITIAL_ALERTS,
  INITIAL_ALERT_RULES,
  INITIAL_API_PROVIDERS,
  INITIAL_DAILY_TRENDS,
} from './data/initialData';

import {
  MonthlyExpense,
  OptimizationRecommendation,
  BenchmarkReportItem,
  AnomalyAlert,
  AlertRule,
  CloudApiProviderConfig,
  DailyExpensePoint,
  CloudProvider,
} from './types/cost';

import {
  calculateMonthOverMonth,
  calculatePotentialSavings,
  calculateCommitmentCoverage,
  generateLiveBillingSyncPacket,
  formatCurrency,
} from './utils/costCalculations';

import { Sparkles, ArrowRight, ShieldCheck, Zap, ExternalLink, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core FinOps Application State
  const [expenses, setExpenses] = useState<MonthlyExpense[]>(() => {
    const saved = localStorage.getItem('cloudcost_expenses');
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_EXPENSES;
  });

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>(() => {
    const saved = localStorage.getItem('cloudcost_recommendations');
    return saved ? JSON.parse(saved) : INITIAL_RECOMMENDATIONS;
  });

  const [benchmarks, setBenchmarks] = useState<BenchmarkReportItem[]>(() => {
    const saved = localStorage.getItem('cloudcost_benchmarks');
    return saved ? JSON.parse(saved) : INITIAL_BENCHMARKS;
  });

  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => {
    const saved = localStorage.getItem('cloudcost_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [rules, setRules] = useState<AlertRule[]>(() => {
    const saved = localStorage.getItem('cloudcost_rules');
    return saved ? JSON.parse(saved) : INITIAL_ALERT_RULES;
  });

  const [providers, setProviders] = useState<CloudApiProviderConfig[]>(() => {
    const saved = localStorage.getItem('cloudcost_providers');
    return saved ? JSON.parse(saved) : INITIAL_API_PROVIDERS;
  });

  const [dailyTrends, setDailyTrends] = useState<DailyExpensePoint[]>(() => {
    const saved = localStorage.getItem('cloudcost_daily_trends');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_TRENDS;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now (Live)');

  // Persistence
  useEffect(() => {
    localStorage.setItem('cloudcost_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('cloudcost_recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem('cloudcost_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('cloudcost_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('cloudcost_providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem('cloudcost_daily_trends', JSON.stringify(dailyTrends));
  }, [dailyTrends]);

  // Derived Calculations
  const mom = calculateMonthOverMonth(expenses);
  const savings = calculatePotentialSavings(recommendations);
  const latestExpense = expenses[expenses.length - 1];
  const coverage = latestExpense ? calculateCommitmentCoverage(latestExpense) : { coveragePercentage: 54.2 };
  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'investigating');
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && a.status === 'active');

  // Trigger Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-Time Cloud Billing API Sync Handler
  const handleTriggerSync = (targetProvider?: CloudProvider) => {
    setIsSyncing(true);
    const chosenProvider = targetProvider || (['AWS', 'GCP', 'Azure'][Math.floor(Math.random() * 3)] as CloudProvider);

    setTimeout(() => {
      const packet = generateLiveBillingSyncPacket(chosenProvider);
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());

      // Update provider config
      setProviders((prev) =>
        prev.map((p) => {
          if (!targetProvider || p.provider === targetProvider) {
            return {
              ...p,
              lastSyncTime: 'Just now',
              totalEventsProcessed: p.totalEventsProcessed + packet.itemsProcessed,
              recentPayload: {
                ...p.recentPayload,
                lastSyncTimestamp: new Date().toISOString(),
                liveLineItemsProcessed: packet.itemsProcessed,
                realtimeSpendRecorded: packet.syncedSpend,
              },
            };
          }
          return p;
        })
      );

      // If an anomaly was detected in the stream, add to alerts!
      if (packet.anomalyDetected && packet.alert) {
        const fullAlert: AnomalyAlert = {
          id: packet.alert.id || `alt-${Date.now()}`,
          timestamp: packet.alert.timestamp || new Date().toISOString(),
          service: packet.alert.service || 'AWS EC2 m6i.4xlarge',
          provider: packet.alert.provider || chosenProvider,
          severity: packet.alert.severity || 'warning',
          currentSpike: packet.alert.currentSpike || 850,
          expectedBaseline: packet.alert.expectedBaseline || 220,
          percentageIncrease: packet.alert.percentageIncrease || 286,
          rootCause: packet.alert.rootCause || 'Unbudgeted consumption surge detected via billing API stream.',
          status: 'active',
          emoji: '⚡',
        };
        setAlerts((prev) => [fullAlert, ...prev]);
        showToast(`⚡ Real-Time Alert: Anomaly detected on ${chosenProvider}! (${fullAlert.service})`);
      } else {
        showToast(`✓ ${packet.message} 💰`);
      }
    }, 1000);
  };

  // Toggle recommendation status (Simulates realized savings!)
  const handleToggleRecStatus = (id: string, newStatus: 'open' | 'applied' | 'dismissed') => {
    setRecommendations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, status: newStatus };
        }
        return r;
      })
    );

    const rec = recommendations.find((r) => r.id === id);
    if (newStatus === 'applied' && rec) {
      showToast(`Applied: "${rec.title}"! Monthly budget reduced by ${formatCurrency(rec.estimatedSavingsMonthly)} 📈`);
    } else if (newStatus === 'open' && rec) {
      showToast(`Reverted: "${rec.title}" to open status.`);
    }
  };

  // Add custom manual expense
  const handleAddExpense = (newExpense: MonthlyExpense) => {
    setExpenses((prev) => [...prev, newExpense]);
    showToast(`Added expense forecast for ${newExpense.monthLabel} (${formatCurrency(newExpense.totalSpend)}) 💰`);
  };

  // Add custom recommendation
  const handleAddRecommendation = (rec: OptimizationRecommendation) => {
    setRecommendations((prev) => [rec, ...prev]);
    showToast(`Logged new optimization finding: "${rec.title}" (+${formatCurrency(rec.estimatedSavingsMonthly)}/mo) 💡`);
  };

  // Update alert status
  const handleUpdateAlertStatus = (id: string, newStatus: AnomalyAlert['status']) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    showToast(`Alert marked as ${newStatus} ✅`);
  };

  // Add alert rule
  const handleAddRule = (rule: AlertRule) => {
    setRules((prev) => [...prev, rule]);
    showToast(`Active alert rule created: ${rule.name}`);
  };

  // Toggle rule
  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Simulate usage spike (interactive feature)
  const handleSimulateSpike = () => {
    const spikeServices = [
      { name: 'AWS NAT Gateway Cross-AZ Loop', provider: 'AWS' as CloudProvider, spike: 1850, base: 310, emoji: '⚡' },
      { name: 'GCP BigQuery Uncapped Ad-Hoc Scan', provider: 'GCP' as CloudProvider, spike: 1240, base: 260, emoji: '🚨' },
      { name: 'Azure OpenAI GPT-4o Token Surge', provider: 'Azure' as CloudProvider, spike: 980, base: 190, emoji: '🤖' },
    ];
    const picked = spikeServices[Math.floor(Math.random() * spikeServices.length)];
    const pct = Math.round(((picked.spike - picked.base) / picked.base) * 100);

    const newAlert: AnomalyAlert = {
      id: `spike-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      service: picked.name,
      provider: picked.provider,
      severity: 'critical',
      currentSpike: picked.spike,
      expectedBaseline: picked.base,
      percentageIncrease: pct,
      rootCause: `High-frequency simulator injected sudden +${pct}% unexpected surge into ${picked.provider} billing stream.`,
      status: 'active',
      emoji: picked.emoji,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Update today's daily trend
    setDailyTrends((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) {
        updated[updated.length - 1] = {
          ...last,
          spend: last.spend + picked.spike,
          isSpike: true,
          spikeReason: `${picked.name} (+${pct}%)`,
        };
      }
      return updated;
    });

    showToast(`🚨 SUDDEN SPIKE ALERT: ${picked.name} spiked +${pct}% ($${picked.spike})! Alert dispatched to MANI.RAVINDRAN@gmail.com`);
    setActiveTab('alerts');
  };

  // Update cloud API config
  const handleUpdateProviderConfig = (id: string, updates: Partial<CloudApiProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast(`Updated ${id.toUpperCase()} API configuration.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPremiumSupport={() => setIsPremiumModalOpen(true)}
        anomalyCount={activeAlerts.length}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-emerald-500/80 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-Time Cloud Billing Live Bar */}
        <LiveBillingSyncBar
          providers={providers}
          onTriggerSync={handleTriggerSync}
          isSyncing={isSyncing}
          onOpenApiTab={() => setActiveTab('api-sync')}
          lastSyncTimestamp={lastSyncTime}
        />

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Welcome Banner with Advisor Credit */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl leading-none">💰📈</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Cloud Cost & FinOps Intelligence
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-300">
                    Curated by <strong className="text-white">Mani Ravindran</strong>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Maximize Multi-Cloud Savings & Benchmark Against Top Quartile Peers
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Automated tracking of monthly expenses across AWS, GCP, and Azure. Identify zombie idle assets, benchmark your 1-year and 3-year commitment plans against FinOps standards, and intercept surprise billing spikes in real time.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('optimization')}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <span>View {savings.count} Optimization Areas ({formatCurrency(savings.monthly)}/mo)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('benchmarks')}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Reservation Benchmarks Report</span>
                  </button>

                  <button
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Mani Ravindran Advisory Access 💼</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Primary KPI Metric Cards */}
            <MetricCards
              currentSpend={mom.currentSpend}
              previousSpend={mom.previousSpend}
              percentageChange={mom.percentageChange}
              potentialSavingsMonthly={savings.monthly}
              potentialSavingsAnnual={savings.annual}
              openRecommendationsCount={savings.count}
              commitmentCoveragePct={coverage.coveragePercentage}
              activeAnomaliesCount={activeAlerts.length}
              criticalAnomaliesCount={criticalAlerts.length}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            {/* 2-Column Split: Top Savings Quick Wins & Active Spikes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Top 3 High-Yield Savings Actions */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Top Budget Optimization Opportunities</span>
                      <span>💡</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('optimization')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      View All ({recommendations.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec) => {
                      const isApplied = rec.status === 'applied';
                      return (
                        <div
                          key={rec.id}
                          className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{rec.emoji}</span>
                            <div>
                              <h4 className="text-xs font-bold text-white tracking-tight">
                                {rec.title}
                              </h4>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {rec.provider} · {rec.category} · Effort: {rec.effort}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold font-mono text-emerald-400">
                              +{formatCurrency(rec.estimatedSavingsMonthly)}/mo
                            </div>
                            <button
                              onClick={() => handleToggleRecStatus(rec.id, isApplied ? 'open' : 'applied')}
                              className={`mt-1 px-2.5 py-0.5 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                                isApplied
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                                  : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                              }`}
                            >
                              {isApplied ? 'Applied ✓' : 'Apply'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Implementing these 3 items saves:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{formatCurrency(recommendations.slice(0, 3).reduce((sum, r) => sum + r.estimatedSavingsMonthly, 0))}/mo
                  </span>
                </div>
              </div>

              {/* Right: Active Spikes & Benchmark Summary */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Real-Time Usage Anomaly Alerts</span>
                      <span>⚡</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Alert Center ({activeAlerts.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                          a.severity === 'critical'
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : 'bg-amber-950/20 border-amber-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{a.emoji}</span>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {a.service}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                              {a.provider} · {a.rootCause}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold font-mono text-rose-400">
                            +{a.percentageIncrease}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatCurrency(a.currentSpike)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={handleSimulateSpike}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Anomaly Test Spike ⚡</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('api-sync')}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Stream Status: Active (3 Clouds)
                  </button>
                </div>
              </div>
            </div>

            {/* FinOps Advisor Spotlight: Mani Ravindran */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-emerald-950/50 shrink-0">
                  MR
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      FinOps Architecture & Cost Optimization by Mani Ravindran
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
                      Enterprise Advisor
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Looking to negotiate an AWS EDP or Google Cloud Committed Use Discount? Need tailored Kubernetes cost allocation or automated anomaly response? Connect directly with Mani Ravindran.
                  </p>
                  <div className="flex items-center gap-4 text-xs pt-2">
                    <a
                      href="https://maniravindran.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>Visit Website (maniravindran.com)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <a
                      href="mailto:MANI.RAVINDRAN@gmail.com"
                      className="text-slate-300 hover:text-emerald-300 flex items-center gap-1 font-mono"
                    >
                      <Mail className="w-3 h-3 text-emerald-400" />
                      <span>MANI.RAVINDRAN@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsPremiumModalOpen(true)}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-lg shadow-sm whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95"
              >
                Access Premium Support 🚀
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Expenses */}
        {activeTab === 'expenses' && (
          <ExpenseTrackerTab
            expenses={expenses}
            onAddExpense={handleAddExpense}
          />
        )}

        {/* Tab 3: Optimization Opportunities */}
        {activeTab === 'optimization' && (
          <OptimizationTab
            recommendations={recommendations}
            onToggleStatus={handleToggleRecStatus}
            onAddRecommendation={handleAddRecommendation}
            onOpenPremiumSupport={() => setIsPremiumModalOpen(true)}
          />
        )}

        {/* Tab 4: Reservation & Savings Plan Benchmarks */}
        {activeTab === 'benchmarks' && (
          <BenchmarksTab
            benchmarks={benchmarks}
            onOpenPremiumSupport={() => setIsPremiumModalOpen(true)}
          />
        )}

        {/* Tab 5: Spike & Anomaly Alerts */}
        {activeTab === 'alerts' && (
          <AlertsAnomalyTab
            alerts={alerts}
            rules={rules}
            dailyTrends={dailyTrends}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onAddRule={handleAddRule}
            onToggleRule={handleToggleRule}
            onSimulateSpike={handleSimulateSpike}
          />
        )}

        {/* Tab 6: Real-Time Cloud Billing APIs */}
        {activeTab === 'api-sync' && (
          <ApiIntegrationTab
            providers={providers}
            onTriggerSync={handleTriggerSync}
            isSyncing={isSyncing}
            onUpdateProviderConfig={handleUpdateProviderConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">CloudCostIQ</span>
            <span aria-hidden="true">·</span>
            <span>Created by <strong className="text-slate-300">Mani Ravindran</strong></span>
            <span aria-hidden="true">·</span>
            <a
              href="https://maniravindran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              maniravindran.com
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:MANI.RAVINDRAN@gmail.com"
              className="hover:text-slate-300 transition-colors"
            >
              Contact Support
            </a>
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Premium Support Access 💼
            </button>
          </div>
        </div>
      </footer>

      {/* Premium Support Consultation Modal */}
      <PremiumSupportModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </div>
  );
}
