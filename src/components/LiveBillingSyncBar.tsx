import React, { useState, useEffect } from 'react';
import { RefreshCw, SlidersHorizontal, Globe } from 'lucide-react';
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
            <span className="text-[#A9B7BF]">Real-Time Cloud Billing Feeds:</span>
            {providers.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0D1C2D] border border-[#3E6E86]/45 text-[11px] font-mono text-[#EEF3F1]"
              >
                <span>{p.emoji}</span>
                <span>{p.name.split(' ')[0]}</span>
                <span className="text-[#5FD3BF] tabular-nums">
                  ({p.totalEventsProcessed.toLocaleString()})
                </span>
              </span>
            ))}
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
              onClick={onOpenApiTab}
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
