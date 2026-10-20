import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, SlidersHorizontal, Radio } from 'lucide-react';
import { CloudApiProviderConfig, CloudProvider } from '../types/cost';

interface LiveBillingSyncBarProps {
  providers: CloudApiProviderConfig[];
  onTriggerSync: (provider?: CloudProvider) => void;
  isSyncing: boolean;
  onOpenApiTab: () => void;
  lastSyncTimestamp: string;
}

export const LiveBillingSyncBar: React.FC<LiveBillingSyncBarProps> = ({
  providers,
  onTriggerSync,
  isSyncing,
  onOpenApiTab,
  lastSyncTimestamp,
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // Background auto-sync interval
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setTimeout(() => onTriggerSync(), 0);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, onTriggerSync]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Cloud Provider Connection Statuses */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Real-Time Cloud Billing Feeds:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300"
            >
              <span>{p.emoji}</span>
              <span className="font-medium">{p.name.split(' ')[0]}</span>
              <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                ({p.totalEventsProcessed.toLocaleString()})
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="API Status: Connected" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Actions & Trigger */}
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
            <span>Last sync:</span>
            <span className="text-slate-200 font-mono">{lastSyncTimestamp}</span>
          </div>
          {autoSyncEnabled && (
            <div className="text-[10px] text-emerald-400/80 font-mono">
              Auto-pull in {countdown}s ⏱️
            </div>
          )}
        </div>

        <button
          onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            autoSyncEnabled
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle automatic background billing sync"
        >
          {autoSyncEnabled ? 'Auto-Sync: ON ⚡' : 'Auto-Sync: Paused ⏸️'}
        </button>

        <button
          onClick={() => onTriggerSync()}
          disabled={isSyncing}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Pulling Data...' : 'Pull Real-Time Billing 🔄'}</span>
        </button>

        <button
          onClick={onOpenApiTab}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
          title="Configure API Keys, IAM Roles & Endpoints"
          aria-label="Configure Cloud Billing APIs"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
