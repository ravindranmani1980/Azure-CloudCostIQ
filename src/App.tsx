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
import { LiveCloudConnectStudio } from './components/LiveCloudConnectStudio';

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
  LiveConnectionResult,
} from './types/cost';

import {
  calculateMonthOverMonth,
  calculatePotentialSavings,
  calculateCommitmentCoverage,
  generateLiveBillingSyncPacket,
  formatCurrency,
} from './utils/costCalculations';

import { Sparkles, ArrowRight, ShieldCheck, Zap, ExternalLink, Mail, Globe, PlugZap } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedApiProviderId, setSelectedApiProviderId] = useState<'aws' | 'gcp' | 'azure'>('azure');
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [isLiveConnectModalOpen, setIsLiveConnectModalOpen] = useState<boolean>(false);
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

  const [benchmarks] = useState<BenchmarkReportItem[]>(() => {
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
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Live Connect Studio modal when user clicks "Connect Live Data"
  const handleOpenApiTab = (providerId?: 'aws' | 'gcp' | 'azure') => {
    if (providerId) {
      setSelectedApiProviderId(providerId);
    }
    setIsLiveConnectModalOpen(true);
  };

  // Apply Live Billing Connection Result from Azure, AWS, or GCP REST API
  const handleApplyLiveBillingResult = (result: LiveConnectionResult) => {
    if (!result.ok) return;

    const providerIdMap: Record<'AWS' | 'GCP' | 'Azure', 'aws' | 'gcp' | 'azure'> = {
      AWS: 'aws',
      GCP: 'gcp',
      Azure: 'azure',
    };
    const targetId = providerIdMap[result.provider];
    const nowTime = new Date().toLocaleTimeString();
    setLastSyncTime(`${nowTime} (${result.provider} Live API)`);

    // 1. Update provider status card & payload viewer
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === targetId) {
          return {
            ...p,
            isConnected: true,
            connectionMode: 'live',
            lastSyncTime: `Live (${nowTime})`,
            lastLatencyMs: result.latencyMs,
            lastHttpStatus: result.statusCode,
            liveTotalSpend: result.totalSpend,
            liveServicesBreakdown: result.servicesBreakdown,
            apiEndpoint: result.endpoint || p.apiEndpoint,
            credentialsMasked: result.credentialsMasked || p.credentialsMasked,
            totalEventsProcessed: p.totalEventsProcessed + (result.lineItemsCount || 1),
            recentPayload: result.rawPayload || p.recentPayload,
          };
        }
        return p;
      })
    );

    // 2. If live spend > 0, update current Month-to-Date expense record for that cloud provider
    if (result.totalSpend !== undefined && result.totalSpend > 0) {
      const liveAmount = Math.round(result.totalSpend);
      setExpenses((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const latest = { ...updated[updated.length - 1] };

        const updatedAccounts = latest.accounts.map((acc) => {
          if (acc.provider === result.provider) {
            return {
              ...acc,
              name: `${result.provider} Live Connected Account`,
              spend: liveAmount,
            };
          }
          return acc;
        });

        const newTotalSpend = updatedAccounts.reduce((s, a) => s + a.spend, 0);
        const ratio = latest.totalSpend > 0 ? newTotalSpend / latest.totalSpend : 1;

        latest.accounts = updatedAccounts;
        latest.totalSpend = newTotalSpend;
        latest.onDemandSpend = Math.round(latest.onDemandSpend * ratio);
        latest.reservationSpend = Math.round(latest.reservationSpend * ratio);
        latest.savingsPlanSpend = Math.round(latest.savingsPlanSpend * ratio);
        latest.spotSpend = Math.max(
          0,
          newTotalSpend - (latest.onDemandSpend + latest.reservationSpend + latest.savingsPlanSpend)
        );

        if (result.categories) {
          const catSum =
            result.categories.compute +
            result.categories.storage +
            result.categories.networking +
            result.categories.database +
            result.categories.aiMl +
            result.categories.other;
          if (catSum > 0) {
            latest.categories = {
              compute: Math.round(latest.categories.compute * 0.65 + result.categories.compute),
              storage: Math.round(latest.categories.storage * 0.65 + result.categories.storage),
              networking: Math.round(latest.categories.networking * 0.65 + result.categories.networking),
              database: Math.round(latest.categories.database * 0.65 + result.categories.database),
              aiMl: Math.round(latest.categories.aiMl * 0.65 + result.categories.aiMl),
              other: Math.round(latest.categories.other * 0.65 + result.categories.other),
            };
          }
        }

        updated[updated.length - 1] = latest;
        return updated;
      });
    }

    showToast(
      `🔌 Live ${result.provider} Connected! Pulled ${formatCurrency(
        result.totalSpend || 0
      )} MTD across ${result.lineItemsCount || 1} services (${result.latencyMs}ms)`
    );
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

  const appliedRecsCount = recommendations.filter((r) => r.status === 'applied').length;
  const openRecsCount = recommendations.filter((r) => r.status === 'open').length;

  return (
    <div className="min-h-screen bg-[#F3F5F1] text-[#16232F] flex flex-col font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPremiumSupport={() => setIsPremiumModalOpen(true)}
        onConnectLiveData={() => handleOpenApiTab('azure')}
        anomalyCount={activeAlerts.length}
      />

      {/* Secondary Dark Navy Telemetry Bar */}
      <LiveBillingSyncBar
        providers={providers}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        onOpenApiTab={handleOpenApiTab}
        lastSyncTimestamp={lastSyncTime}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#081420] border border-[#5FD3BF] text-[#EEF3F1] text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#5FD3BF] shrink-0" />
          <span className="font-medium font-mono">{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-7">
            {/* Postrix Dark Navy Hero Panel (.xh-panel) */}
            <section className="xh-panel">
              <div className="xh-kicker">
                <span className="k">💰📈 MANIQ | SPEND · FINOPS INTELLIGENCE CURATED BY MANI RAVINDRAN</span>
                <span className="tag">FinOps Maturity v2.6 · Azure / AWS / GCP Live Connectors</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
                <div className="flex items-center gap-3.5">
                  <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
                    RM
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                      Maximize Multi-Cloud Savings &amp; Benchmark Against Top Quartile Peers
                      <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                        Active Target:{' '}
                        <a
                          href="https://ravindran.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5FD3BF] hover:underline"
                        >
                          ravindran.in ↗
                        </a>{' '}
                        · Azure, AWS &amp; GCP · Potential Savings: {formatCurrency(savings.monthly)}/mo
                      </span>
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenApiTab('azure')}
                    className="xh-btn cursor-pointer"
                  >
                    <PlugZap className="w-3.5 h-3.5 text-[#5FD3BF]" />
                    <span>Connect Live Data 🔌</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('benchmarks')}
                    className="xh-btn cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5FD3BF]" />
                    <span>Reservation Benchmarks Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('optimization')}
                    className="xh-btn primary cursor-pointer"
                  >
                    <span>View {savings.count} Optimization Areas ({formatCurrency(savings.monthly)}/mo)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-5">
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
              </div>
            </section>

            {/* Postrix White Compliance & Posture Section */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="rm-kicker">01 / FINOPS COMMITMENT &amp; COST OPTIMIZATION POSTURE</span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-[#16232F] font-serif">
                        Cloud Cost Posture — 6-Point Industry Benchmark &amp; Savings Matrix
                      </h2>
                      <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-800">
                        Target: ravindran.in
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Live commitment coverage progress bar and condition-by-condition FinOps benchmark checklist evaluated by <strong>Mani Ravindran</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <div className="inline-flex items-center p-1 bg-[#F3F5F1] border border-slate-200 rounded-lg text-xs font-medium">
                    <span className="px-3 py-1 rounded-md bg-white text-[#16232F] shadow-xs font-semibold">
                      All {recommendations.length} Findings
                    </span>
                    <span className="px-3 py-1 text-slate-600">
                      Applied ({appliedRecsCount})
                    </span>
                    <span className="px-3 py-1 text-slate-600">
                      Open ({openRecsCount})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('benchmarks')}
                    className="px-3.5 py-2 text-xs font-semibold text-[#16232F] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Inspect Benchmarks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar Box */}
              <div className="p-4 rounded-xl bg-[#F3F5F1]/60 border border-slate-200/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Evaluated Endpoint: <strong className="text-[#16232F]">ravindran.in</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Commitment Coverage: <strong className="text-[#16232F]">{coverage.coveragePercentage}%</strong> (RI + SP / CUD)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold">{appliedRecsCount} Realized</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600">{openRecsCount} Open Actions</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#16232F] font-semibold">+{formatCurrency(savings.monthly)}/mo Potential</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2BB5A0] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(25, coverage.coveragePercentage + appliedRecsCount * 6))}%` }}
                  />
                </div>

                {/* Mini 6-Card Benchmark Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                  {benchmarks.map((b, i) => {
                    const isPass = b.higherIsBetter
                      ? b.userValue >= b.industryMedian
                      : b.userValue <= b.industryMedian;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setActiveTab('benchmarks')}
                        className="p-2.5 rounded-lg bg-white border border-slate-200/90 hover:border-emerald-400 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                          <span>FINOPS-0{i + 1}</span>
                          <span className={isPass ? 'text-emerald-600 font-bold' : 'text-[#D79A45] font-bold'}>
                            {isPass ? 'PASS' : 'GAP'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#16232F] truncate" title={b.metricName}>
                          {b.emoji} {b.metricName}
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-emerald-700 mt-1">
                          {b.userValue}{b.unit} <span className="text-slate-400 font-normal">/ {b.industryTopQuartile}{b.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 2-Column Split: Top Savings Quick Wins & Active Spikes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Top 3 High-Yield Savings Actions */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <span className="rm-kicker">02 / PRIORITY SAVINGS QUEUE</span>
                      <h3 className="text-base font-bold text-[#16232F] font-serif flex items-center gap-2">
                        <span>Top Budget Optimization Opportunities</span>
                        <span>💡</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('optimization')}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-mono font-semibold cursor-pointer"
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
                          className="p-3.5 rounded-lg bg-[#F3F5F1] border border-slate-200/90 hover:border-emerald-400 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{rec.emoji}</span>
                            <div>
                              <h4 className="text-xs font-bold text-[#16232F] tracking-tight">
                                {rec.title}
                              </h4>
                              <div className="text-[11px] text-slate-600 font-mono">
                                {rec.provider} · {rec.category} · Effort: {rec.effort}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold font-mono text-emerald-700">
                              +{formatCurrency(rec.estimatedSavingsMonthly)}/mo
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleRecStatus(rec.id, isApplied ? 'open' : 'applied')}
                              className={`mt-1 px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer ${
                                isApplied
                                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                                  : 'bg-[#2BB5A0] text-[#04211B] hover:bg-[#5FD3BF]'
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

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Implementing these 3 items saves:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(recommendations.slice(0, 3).reduce((sum, r) => sum + r.estimatedSavingsMonthly, 0))}/mo
                  </span>
                </div>
              </div>

              {/* Right: Active Spikes & Benchmark Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <span className="rm-kicker">03 / REAL-TIME SPIKE TELEMETRY</span>
                      <h3 className="text-base font-bold text-[#16232F] font-serif flex items-center gap-2">
                        <span>Real-Time Usage Anomaly Alerts</span>
                        <span>⚡</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('alerts')}
                      className="text-xs text-red-700 hover:text-red-800 font-mono font-semibold cursor-pointer"
                    >
                      Alert Center ({activeAlerts.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
                          a.severity === 'critical'
                            ? 'bg-red-50/70 border-red-200'
                            : 'bg-amber-50/70 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{a.emoji}</span>
                          <div>
                            <div className="text-xs font-bold text-[#16232F]">
                              {a.service}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate max-w-xs font-mono">
                              {a.provider} · {a.rootCause}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold font-mono text-red-700">
                            +{a.percentageIncrease}%
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            {formatCurrency(a.currentSpike)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSimulateSpike}
                    className="text-xs font-mono font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Anomaly Test Spike ⚡</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenApiTab('azure')}
                    className="text-xs font-mono text-emerald-700 hover:underline cursor-pointer"
                  >
                    Connect Live Data (Azure · AWS · GCP) →
                  </button>
                </div>
              </div>
            </div>

            {/* FinOps Advisor Spotlight: Mani Ravindran */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="rm-mono-mark !w-14 !h-14 !text-lg shrink-0">
                  RM
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#16232F] font-serif">
                      FinOps Architecture &amp; Cost Optimization by Mani Ravindran
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-semibold">
                      Enterprise Advisor
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Looking to negotiate an AWS EDP, Azure EA commitment, or Google Cloud CUD? Need tailored Kubernetes cost allocation or automated anomaly response? Connect directly with Mani Ravindran.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-2 font-mono">
                    <a
                      href="https://ravindran.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 underline underline-offset-4"
                    >
                      <span>Visit Website (ravindran.in)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-400" aria-hidden="true">·</span>
                    <a
                      href="mailto:MANI.RAVINDRAN@gmail.com"
                      className="text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3 text-[#2BB5A0]" />
                      <span>MANI.RAVINDRAN@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPremiumModalOpen(true)}
                className="px-5 py-2.5 text-xs font-bold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg shadow-xs whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95"
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

        {/* Tab 6: Real-Time Cloud Billing APIs & Live Connection Studio */}
        {activeTab === 'api-sync' && (
          <ApiIntegrationTab
            providers={providers}
            onTriggerSync={handleTriggerSync}
            isSyncing={isSyncing}
            onUpdateProviderConfig={handleUpdateProviderConfig}
            onApplyLiveBillingResult={handleApplyLiveBillingResult}
            initialSelectedProviderId={selectedApiProviderId}
          />
        )}
      </main>

      {/* Postrix Dark Navy Footer */}
      <footer className="bg-[#081420] text-[#B9C4CC] border-t border-[#3E6E86]/35 px-4 sm:px-6 py-6 mt-auto no-print">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="rm-mono-mark !w-6 !h-6 !text-[11px]" aria-hidden="true">
              RM
            </span>
            <span>
              <strong className="font-serif text-sm font-semibold text-[#F3F5F1]">
                Maniq <span className="text-[#3E6E86] font-normal">|</span> <span className="text-[#D79A45]">Spend</span>
              </strong>{' '}
              — Cloud Cost Savings Analyzer &amp; FinOps Benchmarks Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span>
              Author: <strong className="font-medium text-[#F3F5F1]">Mani Ravindran</strong>
            </span>
            <span className="text-[#3E6E86]" aria-hidden="true">·</span>
            <a
              href="https://ravindran.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#5FD3BF] hover:text-[#EBC385] underline underline-offset-4 transition-colors"
            >
              ravindran.in
            </a>
            <span className="text-[#3E6E86]" aria-hidden="true">·</span>
            <a
              href="mailto:MANI.RAVINDRAN@gmail.com"
              className="font-mono text-[#B9C4CC] hover:text-[#5FD3BF] transition-colors"
            >
              Contact Support
            </a>
            <span className="text-[#3E6E86]" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsPremiumModalOpen(true)}
              className="font-mono font-medium text-[#EBC385] hover:text-[#D79A45] underline underline-offset-4 transition-colors cursor-pointer"
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

      {/* Global Quick-Access Live Cloud Connect Modal */}
      {isLiveConnectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#081420]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsLiveConnectModalOpen(false)}
        >
          <div
            className="max-w-5xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <LiveCloudConnectStudio
              providers={providers}
              onApplyLiveBillingResult={(res) => {
                handleApplyLiveBillingResult(res);
                setIsLiveConnectModalOpen(false);
              }}
              initialProvider={selectedApiProviderId}
              isModal={true}
              onClose={() => setIsLiveConnectModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
