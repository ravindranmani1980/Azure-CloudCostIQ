export type CloudProvider = 'AWS' | 'GCP' | 'Azure' | 'Multi-Cloud';

export interface MonthlyExpense {
  id: string;
  month: string; // e.g. "2026-05"
  monthLabel: string; // e.g. "May 2026"
  totalSpend: number;
  onDemandSpend: number;
  reservationSpend: number;
  savingsPlanSpend: number;
  spotSpend: number;
  provider: CloudProvider;
  categories: {
    compute: number;
    storage: number;
    networking: number;
    database: number;
    aiMl: number;
    other: number;
  };
  accounts: {
    name: string;
    spend: number;
    provider: CloudProvider;
  }[];
}

export interface DailyExpensePoint {
  date: string; // e.g. "2026-10-01"
  dayLabel: string;
  spend: number;
  baseline: number;
  isSpike: boolean;
  spikeReason?: string;
  provider: CloudProvider;
}

export type OptimizationCategory = 
  | 'Compute Downsizing'
  | 'Reservation Commitment'
  | 'Idle Resource Cleanup'
  | 'Storage Tiering'
  | 'Egress Optimization'
  | 'Spot Migration';

export interface OptimizationRecommendation {
  id: string;
  title: string;
  service: string;
  provider: CloudProvider;
  category: OptimizationCategory;
  description: string;
  currentSpendMonthly: number;
  estimatedSavingsMonthly: number;
  estimatedSavingsAnnual: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  effort: 'Instant' | '1-Day' | 'Multi-Day';
  status: 'open' | 'applied' | 'dismissed';
  targetResource: string;
  emoji: string;
}

export interface BenchmarkReportItem {
  id: string;
  metricName: string;
  category: string;
  userValue: number;
  industryMedian: number;
  industryTopQuartile: number;
  unit: '%' | '$' | 'ratio';
  higherIsBetter: boolean;
  description: string;
  recommendation: string;
  emoji: string;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  service: string;
  provider: CloudProvider;
  severity: 'critical' | 'warning' | 'info';
  currentSpike: number;
  expectedBaseline: number;
  percentageIncrease: number;
  rootCause: string;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  emoji: string;
}

export interface AlertRule {
  id: string;
  name: string;
  thresholdPercentage: number;
  minDollarSpike: number;
  enabled: boolean;
  notifyEmail: string;
  channel: 'email' | 'webhook' | 'in-app';
}

export interface CloudApiProviderConfig {
  id: 'aws' | 'gcp' | 'azure';
  name: string;
  provider: CloudProvider;
  emoji: string;
  isConnected: boolean;
  lastSyncTime: string;
  syncIntervalSeconds: number;
  apiEndpoint: string;
  credentialsMasked: string;
  autoSync: boolean;
  totalEventsProcessed: number;
  recentPayload?: Record<string, unknown>;
}

export interface ConsultationRequest {
  fullName: string;
  email: string;
  company: string;
  monthlySpend: string;
  cloudProviders: string[];
  interestArea: string;
  message: string;
}
