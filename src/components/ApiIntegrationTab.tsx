import React, { useState } from 'react';
import { RefreshCw, Key, Terminal, Copy, Check } from 'lucide-react';
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#081420] text-[#5FD3BF] flex items-center justify-center text-lg shrink-0 font-mono">
              🌐
            </div>
            <div>
              <span className="rm-kicker">05 / CLOUD BILLING TELEMETRY CONNECTORS</span>
              <h2 className="text-xl font-bold text-[#16232F] font-serif flex items-center gap-2">
                <span>Real-Time Cloud Provider Billing API Integrations</span>
                <span>🌐⚡</span>
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
                Direct API connectors ingesting real-time usage metrics and hourly invoice line items from AWS Cost Explorer, GCP Cloud Billing, and Azure Cost Management.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTriggerSync()}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-[#04211B] bg-[#2BB5A0] hover:bg-[#5FD3BF] rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
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

                <span className="px-2 py-0.5 rounded bg-emerald-100/80 border border-emerald-300 text-[11px] text-emerald-800 font-semibold font-mono">
                  PASS · ONLINE
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-mono p-3 rounded-lg bg-[#F3F5F1] border border-slate-200/80">
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
                <div className="flex justify-between">
                  <span>Interval:</span>
                  <span className="text-slate-700">Every {p.syncIntervalSeconds}s</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerSync(p.provider);
                  }}
                  disabled={isSyncing}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
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
                  className="text-xs text-slate-600 hover:text-[#16232F] font-medium cursor-pointer"
                >
                  Configure ⚙️
                </button>
              </div>
            </div>
          );
        })}
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
          <span className="text-[#5FD3BF] font-semibold text-[11px] shrink-0">
            ✓ Read-Only Billing Scope Granted
          </span>
        </div>

        {/* JSON Code Viewer */}
        <div className="bg-[#081420] rounded-lg p-4 border border-[#3E6E86]/40 font-mono text-xs text-[#5FD3BF] overflow-x-auto max-h-72">
          <pre>{JSON.stringify(activeProvider.recentPayload, null, 2)}</pre>
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
              Enter your read-only billing IAM role ARN, service account or API credentials.
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
