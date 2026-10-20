import React, { useState } from 'react';
import { Cloud, CheckCircle, RefreshCw, Key, ShieldCheck, Terminal, Copy, Check, Radio } from 'lucide-react';
import { CloudApiProviderConfig, CloudProvider } from '../types/cost';

interface ApiIntegrationTabProps {
  providers: CloudApiProviderConfig[];
  onTriggerSync: (provider?: CloudProvider) => void;
  isSyncing: boolean;
  onUpdateProviderConfig: (id: string, updates: Partial<CloudApiProviderConfig>) => void;
}

export const ApiIntegrationTab: React.FC<ApiIntegrationTabProps> = ({
  providers,
  onTriggerSync,
  isSyncing,
  onUpdateProviderConfig,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('aws');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [editProviderModal, setEditProviderModal] = useState<CloudApiProviderConfig | null>(null);

  const activeProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  const handleCopyPayload = () => {
    if (!activeProvider?.recentPayload) return;
    navigator.clipboard.writeText(JSON.stringify(activeProvider.recentPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌐⚡</span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Real-Time Cloud Provider Billing API Integrations
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Direct API connectors ingesting real-time usage metrics and hourly invoice line items from AWS Cost Explorer, GCP Cloud Billing, and Azure Cost Management.
            </p>
          </div>

          <button
            onClick={() => onTriggerSync()}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing All Providers...' : 'Pull Live Billing Now 🔄'}</span>
          </button>
        </div>
      </div>

      {/* 3 Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => {
          const isSelected = p.id === selectedProviderId;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedProviderId(p.id)}
              className={`bg-slate-900/90 border rounded-xl p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-500 shadow-md shadow-emerald-950/40 bg-slate-900'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {p.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {p.provider} Billing API
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                    ONLINE
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Last Pull:</span>
                  <span className="text-slate-200">{p.lastSyncTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Events Ingested:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {p.totalEventsProcessed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interval:</span>
                  <span className="text-slate-300">Every {p.syncIntervalSeconds}s</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerSync(p.provider);
                  }}
                  disabled={isSyncing}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Pull {p.provider}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditProviderModal(p);
                  }}
                  className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  Configure ⚙️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Provider Live Ingestion Stream & Payload Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Live Ingestion Stream: {activeProvider.name}
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">
                Endpoint: <span className="text-slate-300">{activeProvider.apiEndpoint}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPayload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'Copied JSON' : 'Copy Payload'}</span>
            </button>
          </div>
        </div>

        {/* Credentials / Auth Banner */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 truncate">
            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-500">IAM Role / Secret:</span>
            <span className="text-slate-300 truncate">{activeProvider.credentialsMasked}</span>
          </div>
          <span className="text-emerald-400 font-semibold text-[11px] shrink-0">
            ✓ Read-Only Billing Scope Granted
          </span>
        </div>

        {/* JSON Code Viewer */}
        <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto max-h-72">
          <pre>{JSON.stringify(activeProvider.recentPayload, null, 2)}</pre>
        </div>
      </div>

      {/* Edit Config Modal */}
      {editProviderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span>Configure {editProviderModal.name} API Connector</span>
              <span>{editProviderModal.emoji}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your read-only billing IAM role ARN, service account or API credentials.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Endpoint / Service URL
                </label>
                <input
                  type="text"
                  value={editProviderModal.apiEndpoint}
                  onChange={(e) =>
                    setEditProviderModal({ ...editProviderModal, apiEndpoint: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Credentials / Role ARN / Service Account
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
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
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="autoSyncCheck" className="text-xs text-slate-300 cursor-pointer">
                    Enable Auto-Sync
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditProviderModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
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
