import React, { useState, useEffect } from 'react';
import { RefreshCw, SlidersHorizontal, Globe, PlugZap } from 'lucide-react';
import { CloudApiProviderConfig, CloudProvider } from '../types/cost';

interface LiveBillingSyncBarProps {
  providers: CloudApiProviderConfig[];
  onTriggerSync: (provider?: CloudProvider) => void;
  isSyncing: boolean;
  onOpenApiTab: (providerId?: 'aws' | 'gcp' | 'azure') => void;
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
    <div className="bg-[#081420] border-b border-[#3E6E86]/40 text-[#C6D1D6] px-4 sm:px-6 py-2.5 text-xs">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Active Target & Cloud Feeds */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#5FD3BF]" />
            <span className="text-[#A9B7BF]">Active Target:</span>
            <a
              href="https://ravindran.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-semibold text-[#EEF3F1] hover:text-[#5FD3BF] transition-colors"
            >
              ravindran.in
            </a>
            <span className="font-mono text-[#5FD3BF]">(Multi-Cloud FinOps)</span>
          </div>

          <span className="text-[#3E6E86]" aria-hidden="true">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-[#A9B7BF]">Advisor:</span>
            <strong className="font-semibold text-[#EEF3F1]">Mani Ravindran</strong>
          </div>

          <span className="text-[#3E6E86]" aria-hidden="true">·</span>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#A9B7BF]">Cloud Connections:</span>
            {providers.map((p) => {
              const isLive = p.connectionMode === 'live';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenApiTab(p.id)}
                  title={`Click to configure live ${p.provider} connection`}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono transition-colors cursor-pointer ${
                    isLive
                      ? 'bg-[#102826] border-[#5FD3BF] text-[#EEF3F1]'
                      : 'bg-[#0D1C2D] border-[#3E6E86]/45 text-[#EEF3F1] hover:border-[#5FD3BF]/60'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.provider}</span>
                  <span
                    className={`px-1 rounded text-[9px] font-semibold uppercase ${
                      isLive
                        ? 'bg-[#2BB5A0] text-[#04211B]'
                        : 'bg-[#102236] text-[#EBC385]'
                    }`}
                  >
                    {isLive ? 'LIVE' : 'CONFIG'}
                  </span>
                  <span className="text-[#5FD3BF] tabular-nums">
                    ({p.totalEventsProcessed.toLocaleString()})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Sync Status & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end shrink-0">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#A9B7BF]">
            <span>Last sync: <strong className="text-[#EEF3F1] font-normal">{lastSyncTimestamp}</strong></span>
            {autoSyncEnabled && (
              <span className="text-[#5FD3BF]">· Auto-pull {countdown}s ⏱️</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenApiTab()}
              className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded border bg-[#102236] border-[#EBC385]/50 text-[#EBC385] hover:border-[#EBC385] hover:bg-[#152C44] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              title="Configure Direct Live Connections to Azure, AWS & GCP"
            >
              <PlugZap className="w-3.5 h-3.5 text-[#5FD3BF]" />
              <span>Live Cloud Connect 🔌</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer whitespace-nowrap ${
                autoSyncEnabled
                  ? 'bg-[#102236] border-[#5FD3BF]/40 text-[#5FD3BF] hover:border-[#5FD3BF]'
                  : 'bg-[#0D1C2D] border-[#3E6E86]/40 text-[#A9B7BF] hover:text-[#EEF3F1]'
              }`}
              title="Toggle automatic background billing sync"
            >
              {autoSyncEnabled ? 'Auto-Sync: ON ⚡' : 'Auto-Sync: Paused ⏸️'}
            </button>

            <button
              type="button"
              onClick={() => onTriggerSync()}
              disabled={isSyncing}
              className="xh-btn !py-1 !px-2.5 !text-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#5FD3BF] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Pulling Data...' : 'Pull Real-Time Billing 🔄'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenApiTab()}
              className="p-1.5 text-[#A9B7BF] hover:text-[#5FD3BF] bg-[#0D1C2D] hover:bg-[#102236] rounded border border-[#3E6E86]/40 transition-colors cursor-pointer"
              title="Configure API Keys, IAM Roles & Endpoints"
              aria-label="Configure Cloud Billing APIs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
