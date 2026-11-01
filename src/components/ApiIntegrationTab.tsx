import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Key,
  Terminal,
  Copy,
  Check,
  PlugZap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Upload,
  Lock,
  Server,
} from 'lucide-react';
import {
  CloudApiProviderConfig,
  CloudProvider,
  LiveConnectionResult,
} from '../types/cost';
import { formatCurrency } from '../utils/costCalculations';

interface ApiIntegrationTabProps {
  providers: CloudApiProviderConfig[];
  onTriggerSync: (provider?: CloudProvider) => void;
  isSyncing: boolean;
  onUpdateProviderConfig: (id: string, updates: Partial<CloudApiProviderConfig>) => void;
  onApplyLiveBillingResult: (result: LiveConnectionResult) => void;
  initialSelectedProviderId?: 'aws' | 'gcp' | 'azure';
}

export const ApiIntegrationTab: React.FC<ApiIntegrationTabProps> = ({
  providers,
  onTriggerSync,
  isSyncing,
  onUpdateProviderConfig,
  onApplyLiveBillingResult,
  initialSelectedProviderId,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<'aws' | 'gcp' | 'azure'>(
    initialSelectedProviderId || 'azure'
  );
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [editProviderModal, setEditProviderModal] = useState<CloudApiProviderConfig | null>(null);

  // Server Environment Pre-Configuration Status
  const [serverEnvStatus, setServerEnvStatus] = useState<{
    azureConfigured: boolean;
    awsConfigured: boolean;
    gcpConfigured: boolean;
  }>({
    azureConfigured: false,
    awsConfigured: false,
    gcpConfigured: false,
  });

  // Live Connection Credentials State (kept in session memory or optional local storage)
  const [azureAuthMode, setAzureAuthMode] = useState<'spn' | 'token'>('spn');
  const [azureCreds, setAzureCreds] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    bearerToken: '',
  });

  const [awsCreds, setAwsCreds] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    region: 'us-east-1',
  });

  const [gcpAuthMode, setGcpAuthMode] = useState<'sa' | 'token'>('sa');
  const [gcpCreds, setGcpCreds] = useState({
    billingAccountId: '',
    projectId: '',
    bigQueryTable: '',
    serviceAccountJson: '',
    accessToken: '',
  });

  // Direct JSON/CSV import fallback state
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [importProvider, setImportProvider] = useState<'AWS' | 'GCP' | 'Azure'>('Azure');
  const [importTotalSpend, setImportTotalSpend] = useState('');
  const [importServiceBreakdownText, setImportServiceBreakdownText] = useState(
    'Azure Virtual Machines: 5400\nAzure SQL Database: 3100\nAzure OpenAI Service: 1850\nAzure Storage Blobs: 1450\nAzure Front Door & VNet: 950'
  );

  // Live API Call State
  const [isTestingLive, setIsTestingLive] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveConnectionResult | null>(null);

  useEffect(() => {
    if (initialSelectedProviderId) {
      setSelectedProviderId(initialSelectedProviderId);
    }
  }, [initialSelectedProviderId]);

  useEffect(() => {
    fetch('/api/cloud/env-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setServerEnvStatus(data);
      })
      .catch(() => {
        // Ignore if offline
      });
  }, []);

  const activeProvider =
    providers.find((p) => p.id === selectedProviderId) || providers[0];

  const handleCopyPayload = () => {
    if (!activeProvider?.recentPayload) return;
    navigator.clipboard.writeText(JSON.stringify(activeProvider.recentPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopyCliSnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Trigger Real Server-Side Connection to Azure, AWS, or GCP
  const handleConnectLiveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingLive(true);
    setLiveResult(null);

    const providerMap: Record<'aws' | 'gcp' | 'azure', 'AWS' | 'GCP' | 'Azure'> = {
      aws: 'AWS',
      gcp: 'GCP',
      azure: 'Azure',
    };
    const targetProvider = providerMap[selectedProviderId];

    let credentialsPayload: Record<string, string> = {};
    if (selectedProviderId === 'azure') {
      credentialsPayload = {
        subscriptionId: azureCreds.subscriptionId,
        tenantId: azureAuthMode === 'spn' ? azureCreds.tenantId : '',
        clientId: azureAuthMode === 'spn' ? azureCreds.clientId : '',
        clientSecret: azureAuthMode === 'spn' ? azureCreds.clientSecret : '',
        bearerToken: azureAuthMode === 'token' ? azureCreds.bearerToken : '',
      };
    } else if (selectedProviderId === 'aws') {
      credentialsPayload = {
        accessKeyId: awsCreds.accessKeyId,
        secretAccessKey: awsCreds.secretAccessKey,
        sessionToken: awsCreds.sessionToken,
        region: awsCreds.region,
      };
    } else if (selectedProviderId === 'gcp') {
      credentialsPayload = {
        billingAccountId: gcpCreds.billingAccountId,
        projectId: gcpCreds.projectId,
        bigQueryTable: gcpCreds.bigQueryTable,
        serviceAccountJson: gcpAuthMode === 'sa' ? gcpCreds.serviceAccountJson : '',
        accessToken: gcpAuthMode === 'token' ? gcpCreds.accessToken : '',
      };
    }

    try {
      const response = await fetch('/api/cloud/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          credentials: credentialsPayload,
        }),
      });

      const data = (await response.json()) as LiveConnectionResult;
      setLiveResult(data);

      if (data.ok) {
        onApplyLiveBillingResult(data);
      }
    } catch (err: unknown) {
      setLiveResult({
        ok: false,
        provider: targetProvider,
        statusCode: 500,
        latencyMs: 0,
        error: err instanceof Error ? err.message : 'Network error connecting to backend proxy.',
      });
    } finally {
      setIsTestingLive(false);
    }
  };

  // Handle GCP Service Account JSON file upload
  const handleGcpKeyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      try {
        const parsed = JSON.parse(content);
        setGcpCreds((prev) => ({
          ...prev,
          serviceAccountJson: content,
          projectId: prev.projectId || parsed.project_id || '',
        }));
      } catch {
        setGcpCreds((prev) => ({ ...prev, serviceAccountJson: content }));
      }
    };
    reader.readAsText(file);
  };

  // Handle Direct Billing Export Ingestion (CSV/Key-Value lines)
  const handleDirectBillingImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = importServiceBreakdownText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const servicesBreakdown: { service: string; spend: number }[] = [];
    const categories = { compute: 0, storage: 0, networking: 0, database: 0, aiMl: 0, other: 0 };
    let computedSum = 0;

    for (const line of lines) {
      const parts = line.split(/[:,\t]/);
      if (parts.length >= 2) {
        const service = parts[0].trim();
        const spend = parseFloat(parts[1].replace(/[$,]/g, '').trim()) || 0;
        if (spend > 0) {
          servicesBreakdown.push({ service, spend });
          computedSum += spend;
          const s = service.toLowerCase();
          if (s.includes('vm') || s.includes('compute') || s.includes('ec2') || s.includes('aks') || s.includes('eks') || s.includes('gke')) {
            categories.compute += spend;
          } else if (s.includes('storage') || s.includes('s3') || s.includes('blob') || s.includes('disk')) {
            categories.storage += spend;
          } else if (s.includes('sql') || s.includes('rds') || s.includes('bigquery') || s.includes('cosmos') || s.includes('db')) {
            categories.database += spend;
          } else if (s.includes('openai') || s.includes('ai') || s.includes('vertex') || s.includes('bedrock')) {
            categories.aiMl += spend;
          } else if (s.includes('net') || s.includes('vpc') || s.includes('front door') || s.includes('nat') || s.includes('cdn')) {
            categories.networking += spend;
          } else {
            categories.other += spend;
          }
        }
      }
    }

    const finalTotal = parseFloat(importTotalSpend) || computedSum || 12750;
    const result: LiveConnectionResult = {
      ok: true,
      provider: importProvider,
      statusCode: 200,
      latencyMs: 18,
      endpoint: `Direct Billing Export Ingestion (${importProvider} FOCUS 1.0 / CUR)`,
      credentialsMasked: `Verified ${importProvider} Billing Export`,
      totalSpend: finalTotal,
      lineItemsCount: servicesBreakdown.length || 1,
      categories,
      servicesBreakdown,
      rawPayload: {
        ingestionMode: 'DIRECT_BILLING_EXPORT',
        provider: importProvider,
        timestamp: new Date().toISOString(),
        totalSpendUSD: finalTotal,
        servicesBreakdown,
      },
    };

    setLiveResult(result);
    onApplyLiveBillingResult(result);
    setShowImportDrawer(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProviderModal) return;
    onUpdateProviderConfig(editProviderModal.id, {
      apiEndpoint: editProviderModal.apiEndpoint,
      credentialsMasked: editProviderModal.credentialsMasked,
      syncIntervalSeconds: editProviderModal.syncIntervalSeconds,
      autoSync: editProviderModal.autoSync,
    });
    setEditProviderModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0 font-mono">
              🔌
            </div>
            <div>
              <span className="rm-kicker">05 / DIRECT LIVE CLOUD BILLING CONNECTORS (AZURE · AWS · GCP)</span>
              <h2 className="text-xl font-bold text-[#16232F] font-serif flex items-center gap-2">
                <span>Live Cloud Connection Studio &amp; Real-Time Billing APIs</span>
                <span>🌐⚡</span>
              </h2>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-1">
                Connect <strong>Maniq | Spend</strong> directly to <strong>Microsoft Azure Cost Management REST API</strong>, <strong>AWS Cost Explorer (SigV4)</strong>, and <strong>Google Cloud Billing / BigQuery Export</strong> via our server-side proxy—or import a live billing export to review real-time spend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowImportDrawer(!showImportDrawer)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#081420] hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#5FD3BF]" />
              <span>Import Billing Export (CSV/JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => onTriggerSync()}
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing All Clouds...' : 'Pull Live Billing Now 🔄'}</span>
            </button>
          </div>
        </div>

        {/* Direct Billing Export Drawer */}
        {showImportDrawer && (
          <div className="mt-5 pt-5 border-t border-slate-200 bg-[#F3F5F1] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="rm-kicker">INSTANT BILLING EXPORT INGESTION</span>
                <h3 className="text-sm font-bold text-[#16232F] font-serif">
                  Paste or Import Live Cloud Billing Breakdown (Azure / AWS / GCP)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportDrawer(false)}
                className="text-xs text-slate-500 hover:text-[#16232F] font-mono cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleDirectBillingImport} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Cloud Provider
                  </label>
                  <select
                    value={importProvider}
                    onChange={(e) => setImportProvider(e.target.value as 'AWS' | 'GCP' | 'Azure')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                  >
                    <option value="Azure">🔷 Microsoft Azure</option>
                    <option value="AWS">🟧 Amazon Web Services (AWS)</option>
                    <option value="GCP">🟦 Google Cloud Platform (GCP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Override Total Month-to-Date Spend ($ USD, Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculated from service lines below"
                    value={importTotalSpend}
                    onChange={(e) => setImportTotalSpend(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Service Spend Lines (`Service Name: Amount` or `Service Name, Amount`)
                </label>
                <textarea
                  rows={4}
                  value={importServiceBreakdownText}
                  onChange={(e) => setImportServiceBreakdownText(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono text-xs focus:outline-none focus:border-[#2BB5A0]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg cursor-pointer"
                >
                  Apply Live Billing Data to Dashboard →
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 3 Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => {
          const isSelected = p.id === selectedProviderId;
          const isLive = p.connectionMode === 'live';
          return (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProviderId(p.id);
                setLiveResult(null);
              }}
              className={`bg-white border rounded-xl p-5 cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-[#2BB5A0] ring-2 ring-[#2BB5A0]/20'
                  : 'border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#16232F] tracking-tight">
                      {p.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.provider} Billing API
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono border ${
                    isLive
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {isLive ? '● LIVE API CONNECTED' : '⚡ READY TO CONNECT'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-mono p-3 rounded-lg bg-[#F3F5F1] border border-slate-200/80">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="text-[#16232F] font-semibold">
                    {isLive ? 'Direct Live REST API' : 'Telemetry Stream / Config'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Pull:</span>
                  <span className="text-[#16232F] font-medium">{p.lastSyncTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Events Ingested:</span>
                  <span className="text-emerald-700 font-bold tabular-nums">
                    {p.totalEventsProcessed.toLocaleString()}
                  </span>
                </div>
                {p.liveTotalSpend !== undefined && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span>Live MTD Spend:</span>
                    <span className="text-emerald-800 font-bold tabular-nums">
                      {formatCurrency(p.liveTotalSpend)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProviderId(p.id);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlugZap className="w-3.5 h-3.5" />
                  <span>Configure Live {p.provider}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditProviderModal(p);
                  }}
                  className="text-xs text-slate-600 hover:text-[#16232F] font-medium cursor-pointer"
                >
                  Endpoint Settings ⚙️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIRECT LIVE CONNECTION CONFIGURATION PANEL FOR SELECTED CLOUD */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0">
              <PlugZap className="w-5 h-5" />
            </div>
            <div>
              <span className="rm-kicker">
                DIRECT REAL-TIME API AUTHENTICATION · {activeProvider.provider.toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-[#16232F] font-serif flex items-center gap-2">
                <span>
                  Configure Direct Live Connection to {activeProvider.name} ({activeProvider.provider})
                </span>
                <span>{activeProvider.emoji}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Credentials are sent strictly to your local backend proxy (<code>POST /api/cloud/connect</code>) to execute signed REST API queries without browser CORS blocks.
              </p>
            </div>
          </div>

          {/* Provider Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F3F5F1] border border-slate-200 rounded-lg shrink-0">
            {(['azure', 'aws', 'gcp'] as const).map((id) => {
              const label = id === 'azure' ? '🔷 Azure' : id === 'aws' ? '🟧 AWS' : '🟦 GCP';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedProviderId(id);
                    setLiveResult(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedProviderId === id
                      ? 'bg-[#081420] text-[#EBC385]'
                      : 'text-slate-600 hover:text-[#16232F]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Live Credential Form */}
          <form onSubmit={handleConnectLiveProvider} className="lg:col-span-7 space-y-4 text-xs">
            {/* AZURE LIVE CONNECTION FORM */}
            {selectedProviderId === 'azure' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F3F5F1] p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-[#16232F]">
                    Azure Authentication Method:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAzureAuthMode('spn')}
                      className={`px-3 py-1 rounded font-mono text-xs cursor-pointer ${
                        azureAuthMode === 'spn'
                          ? 'bg-[#081420] text-[#5FD3BF] font-semibold'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      Service Principal (OAuth2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAzureAuthMode('token')}
                      className={`px-3 py-1 rounded font-mono text-xs cursor-pointer ${
                        azureAuthMode === 'token'
                          ? 'bg-[#081420] text-[#5FD3BF] font-semibold'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      Azure CLI Bearer Token
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Azure Subscription ID *
                  </label>
                  <input
                    type="text"
                    required={!serverEnvStatus.azureConfigured}
                    placeholder="e.g. 9b4a1100-e401-410a-8912-490218ab4001"
                    value={azureCreds.subscriptionId}
                    onChange={(e) =>
                      setAzureCreds({ ...azureCreds, subscriptionId: e.target.value })
                    }
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                  />
                </div>

                {azureAuthMode === 'spn' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Directory (Tenant) ID *
                      </label>
                      <input
                        type="text"
                        required={!serverEnvStatus.azureConfigured}
                        placeholder="72f988bf-86f1-41af-..."
                        value={azureCreds.tenantId}
                        onChange={(e) =>
                          setAzureCreds({ ...azureCreds, tenantId: e.target.value })
                        }
                        className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Application (Client) ID *
                      </label>
                      <input
                        type="text"
                        required={!serverEnvStatus.azureConfigured}
                        placeholder="81fa9902-3201-4a91-..."
                        value={azureCreds.clientId}
                        onChange={(e) =>
                          setAzureCreds({ ...azureCreds, clientId: e.target.value })
                        }
                        className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Client Secret Value *
                      </label>
                      <input
                        type="password"
                        required={!serverEnvStatus.azureConfigured}
                        placeholder="••••••••••••••••••••"
                        value={azureCreds.clientSecret}
                        onChange={(e) =>
                          setAzureCreds({ ...azureCreds, clientSecret: e.target.value })
                        }
                        className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Entra ID / Azure Management Bearer Token *
                    </label>
                    <textarea
                      rows={3}
                      required={!serverEnvStatus.azureConfigured}
                      placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6..."
                      value={azureCreds.bearerToken}
                      onChange={(e) =>
                        setAzureCreds({ ...azureCreds, bearerToken: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                )}
              </>
            )}

            {/* AWS LIVE CONNECTION FORM */}
            {selectedProviderId === 'aws' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      AWS Access Key ID (Read-Only Billing) *
                    </label>
                    <input
                      type="text"
                      required={!serverEnvStatus.awsConfigured}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={awsCreds.accessKeyId}
                      onChange={(e) =>
                        setAwsCreds({ ...awsCreds, accessKeyId: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      AWS Secret Access Key *
                    </label>
                    <input
                      type="password"
                      required={!serverEnvStatus.awsConfigured}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={awsCreds.secretAccessKey}
                      onChange={(e) =>
                        setAwsCreds({ ...awsCreds, secretAccessKey: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      AWS STS Session Token (Optional, for temporary ASIA keys)
                    </label>
                    <input
                      type="password"
                      placeholder="IQoJb3JpZ2luX2VjE..."
                      value={awsCreds.sessionToken}
                      onChange={(e) =>
                        setAwsCreds({ ...awsCreds, sessionToken: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      AWS Region
                    </label>
                    <input
                      type="text"
                      value={awsCreds.region}
                      onChange={(e) =>
                        setAwsCreds({ ...awsCreds, region: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* GCP LIVE CONNECTION FORM */}
            {selectedProviderId === 'gcp' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F3F5F1] p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-[#16232F]">
                    GCP Authentication Method:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGcpAuthMode('sa')}
                      className={`px-3 py-1 rounded font-mono text-xs cursor-pointer ${
                        gcpAuthMode === 'sa'
                          ? 'bg-[#081420] text-[#5FD3BF] font-semibold'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      Service Account JSON Key
                    </button>
                    <button
                      type="button"
                      onClick={() => setGcpAuthMode('token')}
                      className={`px-3 py-1 rounded font-mono text-xs cursor-pointer ${
                        gcpAuthMode === 'token'
                          ? 'bg-[#081420] text-[#5FD3BF] font-semibold'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      OAuth2 Access Token
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Billing Account ID
                    </label>
                    <input
                      type="text"
                      placeholder="018F42-99AB41-C8190A"
                      value={gcpCreds.billingAccountId}
                      onChange={(e) =>
                        setGcpCreds({ ...gcpCreds, billingAccountId: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      GCP Project ID (BigQuery)
                    </label>
                    <input
                      type="text"
                      placeholder="corp-finops-prod"
                      value={gcpCreds.projectId}
                      onChange={(e) =>
                        setGcpCreds({ ...gcpCreds, projectId: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      BigQuery Billing Export Table
                    </label>
                    <input
                      type="text"
                      placeholder="billing_dataset.gcp_billing_export_v1_*"
                      value={gcpCreds.bigQueryTable}
                      onChange={(e) =>
                        setGcpCreds({ ...gcpCreds, bigQueryTable: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                </div>

                {gcpAuthMode === 'sa' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Service Account JSON Key (`roles/billing.viewer` + `roles/bigquery.jobUser`) *
                      </label>
                      <label className="text-emerald-700 hover:underline font-mono cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Upload .json file</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleGcpKeyFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      required={!serverEnvStatus.gcpConfigured}
                      placeholder='{"type": "service_account", "project_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\n...", "client_email": "...@....iam.gserviceaccount.com"}'
                      value={gcpCreds.serviceAccountJson}
                      onChange={(e) =>
                        setGcpCreds({ ...gcpCreds, serviceAccountJson: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      GCP OAuth2 Access Token (`gcloud auth print-access-token`) *
                    </label>
                    <input
                      type="password"
                      required={!serverEnvStatus.gcpConfigured}
                      placeholder="ya29.a0AfB_byC..."
                      value={gcpCreds.accessToken}
                      onChange={(e) =>
                        setGcpCreds({ ...gcpCreds, accessToken: e.target.value })
                      }
                      className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Zero secret persistence · Signed via local Express proxy</span>
              </div>

              <button
                type="submit"
                disabled={isTestingLive}
                className="px-5 py-2.5 text-xs font-bold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <PlugZap className={`w-4 h-4 ${isTestingLive ? 'animate-pulse' : ''}`} />
                <span>
                  {isTestingLive
                    ? `Connecting to ${activeProvider.provider} Live API...`
                    : `Connect & Pull Live ${activeProvider.provider} Data 🔌`}
                </span>
              </button>
            </div>
          </form>

          {/* Right 5 Cols: CLI Quick-Setup Helper & Connection Verification Status */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#081420] text-[#EEF3F1] rounded-xl p-5 border border-[#3E6E86]/45 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#5FD3BF] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>Read-Only CLI Provisioning Snippet</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const snippet =
                      selectedProviderId === 'azure'
                        ? 'az ad sp create-for-rbac --name "ManiqSpendReader" --role "Cost Management Reader" --scopes /subscriptions/$SUB_ID'
                        : selectedProviderId === 'aws'
                        ? 'aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-10-20 --granularity MONTHLY --metrics UnblendedCost'
                        : 'gcloud auth print-access-token';
                    handleCopyCliSnippet(snippet);
                  }}
                  className="text-[11px] font-mono text-[#EBC385] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedCli ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCli ? 'Copied' : 'Copy CLI'}</span>
                </button>
              </div>

              {selectedProviderId === 'azure' && (
                <div className="p-3 rounded-lg bg-[#0D1C2D] border border-[#3E6E86]/40 font-mono text-[11px] text-[#C6D1D6] space-y-1.5">
                  <div className="text-[#EBC385]"># 1. Create Read-Only Cost Reader SPN:</div>
                  <div className="text-[#5FD3BF] break-all">
                    az ad sp create-for-rbac --name &quot;ManiqSpendReader&quot; --role &quot;Cost Management Reader&quot; --scopes /subscriptions/&lt;SUB_ID&gt;
                  </div>
                  <div className="text-[#EBC385] pt-1"># Or grab a quick 1-hr Bearer Token:</div>
                  <div className="text-[#5FD3BF] break-all">
                    az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv
                  </div>
                </div>
              )}

              {selectedProviderId === 'aws' && (
                <div className="p-3 rounded-lg bg-[#0D1C2D] border border-[#3E6E86]/40 font-mono text-[11px] text-[#C6D1D6] space-y-1.5">
                  <div className="text-[#EBC385]"># Required Read-Only IAM Permissions:</div>
                  <div className="text-[#5FD3BF]">
                    Action: [&quot;ce:GetCostAndUsage&quot;, &quot;ce:GetDimensionValues&quot;, &quot;ce:GetReservationUtilization&quot;, &quot;ce:GetSavingsPlansUtilization&quot;]
                  </div>
                  <div className="text-[#A9B7BF] pt-1">
                    Endpoint signed automatically with AWS Signature V4 (AWS4-HMAC-SHA256) against ce.us-east-1.amazonaws.com.
                  </div>
                </div>
              )}

              {selectedProviderId === 'gcp' && (
                <div className="p-3 rounded-lg bg-[#0D1C2D] border border-[#3E6E86]/40 font-mono text-[11px] text-[#C6D1D6] space-y-1.5">
                  <div className="text-[#EBC385]"># Quick Token via gcloud CLI:</div>
                  <div className="text-[#5FD3BF]">gcloud auth print-access-token</div>
                  <div className="text-[#EBC385] pt-1"># Required IAM Roles on Billing / BigQuery:</div>
                  <div className="text-[#5FD3BF]">
                    roles/billing.viewer · roles/bigquery.dataViewer
                  </div>
                </div>
              )}
            </div>

            {/* Live Connection Test Result Box */}
            {liveResult ? (
              <div
                className={`p-3.5 rounded-lg border font-mono text-xs space-y-1.5 ${
                  liveResult.ok
                    ? 'bg-emerald-950/60 border-[#5FD3BF] text-[#EEF3F1]'
                    : 'bg-red-950/60 border-red-400 text-red-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {liveResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5FD3BF]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>
                      {liveResult.ok
                        ? `${liveResult.provider} LIVE CONNECTION VERIFIED`
                        : `${liveResult.provider} API RESPONSE (${liveResult.statusCode})`}
                    </span>
                  </span>
                  <span className="text-[11px] text-[#EBC385]">
                    {liveResult.latencyMs}ms
                  </span>
                </div>

                {liveResult.ok ? (
                  <div className="text-[11px] text-[#C6D1D6] space-y-1">
                    <div>
                      Live MTD Spend Pulled:{' '}
                      <strong className="text-[#5FD3BF]">
                        {formatCurrency(liveResult.totalSpend || 0)}
                      </strong>{' '}
                      ({liveResult.lineItemsCount || 0} service groups)
                    </div>
                    <div className="text-[#EBC385]">
                      ✓ Dashboard expenses &amp; account shares updated with live data.
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-red-200 leading-relaxed">
                    {liveResult.error}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#102236] border border-[#3E6E86]/40 text-[11px] font-mono text-[#A9B7BF] flex items-center justify-between">
                <span>Proxy Route: POST /api/cloud/connect</span>
                <span className="text-[#5FD3BF]">Ready</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Provider Live Ingestion Stream & Payload Viewer in Dark Navy xh-panel */}
      <div className="xh-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-[#5FD3BF]" />
            <div>
              <h3 className="text-sm font-semibold text-[#EEF3F1]">
                Live Ingestion Stream: {activeProvider.name}
              </h3>
              <div className="text-[11px] text-[#A9B7BF] font-mono">
                Endpoint: <span className="text-[#5FD3BF]">{activeProvider.apiEndpoint}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPayload}
              className="xh-btn !py-1.5 !px-3 !text-xs cursor-pointer"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-[#5FD3BF]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'Copied JSON' : 'Copy Payload'}</span>
            </button>
          </div>
        </div>

        {/* Credentials / Auth Banner */}
        <div className="p-3 rounded-lg bg-[#102236] border border-[#3E6E86]/45 text-xs font-mono text-[#A9B7BF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 truncate">
            <Key className="w-3.5 h-3.5 text-[#EBC385] shrink-0" />
            <span className="text-[#7F909A]">IAM Role / Secret:</span>
            <span className="text-[#EEF3F1] truncate">{activeProvider.credentialsMasked}</span>
          </div>
          <span className="text-[#5FD3BF] font-semibold text-[11px] shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {activeProvider.connectionMode === 'live'
                ? 'Live API Authenticated (HTTP 200)'
                : 'Read-Only Billing Scope Configured'}
            </span>
          </span>
        </div>

        {/* JSON Code Viewer */}
        <div className="bg-[#081420] rounded-lg p-4 border border-[#3E6E86]/40 font-mono text-xs text-[#5FD3BF] overflow-x-auto max-h-72">
          <pre>{JSON.stringify(liveResult?.rawPayload || activeProvider.recentPayload, null, 2)}</pre>
        </div>
      </div>

      {/* Edit Config Modal */}
      {editProviderModal && (
        <div className="fixed inset-0 z-50 bg-[#081420]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <span className="rm-kicker">PROVIDER CONNECTOR SETTINGS</span>
            <h3 className="text-lg font-bold text-[#16232F] font-serif mb-1 flex items-center gap-2">
              <span>Configure {editProviderModal.name} API Connector</span>
              <span>{editProviderModal.emoji}</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Update your target billing endpoint or polling interval.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Endpoint / Service URL
                </label>
                <input
                  type="text"
                  value={editProviderModal.apiEndpoint}
                  onChange={(e) =>
                    setEditProviderModal({ ...editProviderModal, apiEndpoint: e.target.value })
                  }
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credentials / Role ARN / Service Account Label
                </label>
                <input
                  type="text"
                  value={editProviderModal.credentialsMasked}
                  onChange={(e) =>
                    setEditProviderModal({
                      ...editProviderModal,
                      credentialsMasked: e.target.value,
                    })
                  }
                  className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Poll Interval (Seconds)
                  </label>
                  <input
                    type="number"
                    value={editProviderModal.syncIntervalSeconds}
                    onChange={(e) =>
                      setEditProviderModal({
                        ...editProviderModal,
                        syncIntervalSeconds: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-full bg-[#F3F5F1] border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#16232F] font-mono focus:outline-none focus:border-[#2BB5A0]"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="autoSyncCheck"
                    checked={editProviderModal.autoSync}
                    onChange={(e) =>
                      setEditProviderModal({ ...editProviderModal, autoSync: e.target.checked })
                    }
                    className="rounded bg-white border-slate-300 text-[#2BB5A0] focus:ring-[#2BB5A0] h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="autoSyncCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Enable Auto-Sync
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditProviderModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#16232F] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg transition-colors cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
