import {
  MonthlyExpense,
  OptimizationRecommendation,
  BenchmarkReportItem,
  DailyExpensePoint,
  AnomalyAlert,
  CloudProvider,
} from '../types/cost';

/**
 * Calculates the total spend across an array of monthly expense records.
 */
export function calculateTotalSpend(expenses: MonthlyExpense[]): number {
  return expenses.reduce((acc, curr) => acc + curr.totalSpend, 0);
}

/**
 * Calculates current month spend, previous month spend, and MoM % difference.
 */
export function calculateMonthOverMonth(expenses: MonthlyExpense[]): {
  currentSpend: number;
  previousSpend: number;
  percentageChange: number;
} {
  if (expenses.length === 0) {
    return { currentSpend: 0, previousSpend: 0, percentageChange: 0 };
  }
  const current = expenses[expenses.length - 1]?.totalSpend || 0;
  const previous = expenses.length > 1 ? expenses[expenses.length - 2]?.totalSpend || 0 : current;
  
  const percentageChange = previous > 0 
    ? ((current - previous) / previous) * 100 
    : 0;

  return {
    currentSpend: Math.round(current * 100) / 100,
    previousSpend: Math.round(previous * 100) / 100,
    percentageChange: Math.round(percentageChange * 10) / 10,
  };
}

/**
 * Calculates potential savings from active/open optimization recommendations.
 */
export function calculatePotentialSavings(recommendations: OptimizationRecommendation[]): {
  monthly: number;
  annual: number;
  count: number;
} {
  const openRecs = recommendations.filter((r) => r.status === 'open');
  const monthly = openRecs.reduce((sum, r) => sum + r.estimatedSavingsMonthly, 0);
  const annual = openRecs.reduce((sum, r) => sum + r.estimatedSavingsAnnual, 0);

  return {
    monthly: Math.round(monthly),
    annual: Math.round(annual),
    count: openRecs.length,
  };
}

/**
 * Calculates Reservation & Savings Plan coverage percentage for an expense record.
 * Formula: (Reservation + SavingsPlan) / (OnDemand + Reservation + SavingsPlan + Spot) * 100
 */
export function calculateCommitmentCoverage(expense: MonthlyExpense): {
  coveragePercentage: number;
  committedSpend: number;
  uncommittedSpend: number;
} {
  const committed = expense.reservationSpend + expense.savingsPlanSpend;
  const totalComputeAndEligible = expense.onDemandSpend + committed + expense.spotSpend;

  if (totalComputeAndEligible === 0) {
    return { coveragePercentage: 0, committedSpend: 0, uncommittedSpend: 0 };
  }

  const coveragePercentage = (committed / totalComputeAndEligible) * 100;
  return {
    coveragePercentage: Math.round(coveragePercentage * 10) / 10,
    committedSpend: Math.round(committed),
    uncommittedSpend: Math.round(expense.onDemandSpend),
  };
}

/**
 * Detects sudden spikes in daily expense trends exceeding custom alert rules.
 */
export function evaluateSpikeAnomalies(
  dataPoints: DailyExpensePoint[],
  thresholdPercentage: number = 25,
  minDollarDelta: number = 250
): DailyExpensePoint[] {
  return dataPoints.map((point) => {
    const deltaDollar = point.spend - point.baseline;
    const deltaPercentage = point.baseline > 0 ? (deltaDollar / point.baseline) * 100 : 0;
    const isSpike = deltaPercentage >= thresholdPercentage && deltaDollar >= minDollarDelta;

    return {
      ...point,
      isSpike,
      spikeReason: isSpike 
        ? point.spikeReason || `Spend surged +${Math.round(deltaPercentage)}% ($+${Math.round(deltaDollar)}) over baseline`
        : undefined,
    };
  });
}

/**
 * Calculates aggregate FinOps Maturity Score (0-100) based on benchmark items.
 */
export function calculateFinOpsMaturityScore(benchmarks: BenchmarkReportItem[]): {
  score: number;
  grade: 'Elite' | 'Mature' | 'Emerging' | 'Lagging';
  topAreasForImprovement: string[];
} {
  if (benchmarks.length === 0) {
    return { score: 0, grade: 'Lagging', topAreasForImprovement: [] };
  }

  let totalScorePoints = 0;
  const improvementAreas: string[] = [];

  for (const item of benchmarks) {
    let itemScore = 0;
    if (item.higherIsBetter) {
      if (item.userValue >= item.industryTopQuartile) {
        itemScore = 100;
      } else if (item.userValue >= item.industryMedian) {
        const span = item.industryTopQuartile - item.industryMedian;
        const progress = span > 0 ? (item.userValue - item.industryMedian) / span : 0.5;
        itemScore = 70 + progress * 29;
      } else {
        const progress = item.industryMedian > 0 ? item.userValue / item.industryMedian : 0;
        itemScore = Math.min(65, Math.max(20, progress * 65));
        improvementAreas.push(item.metricName);
      }
    } else {
      // Lower is better (e.g. idle waste %)
      if (item.userValue <= item.industryTopQuartile) {
        itemScore = 100;
      } else if (item.userValue <= item.industryMedian) {
        itemScore = 75;
      } else {
        itemScore = 40;
        improvementAreas.push(item.metricName);
      }
    }
    totalScorePoints += itemScore;
  }

  const average = Math.round(totalScorePoints / benchmarks.length);
  let grade: 'Elite' | 'Mature' | 'Emerging' | 'Lagging' = 'Lagging';
  if (average >= 85) grade = 'Elite';
  else if (average >= 70) grade = 'Mature';
  else if (average >= 50) grade = 'Emerging';

  return {
    score: average,
    grade,
    topAreasForImprovement: improvementAreas.slice(0, 3),
  };
}

/**
 * Formats a currency value compactly or cleanly.
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}k`;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates simulated live billing data from AWS, GCP, or Azure.
 */
export function generateLiveBillingSyncPacket(provider: CloudProvider): {
  syncedSpend: number;
  itemsProcessed: number;
  anomalyDetected: boolean;
  alert?: Partial<AnomalyAlert>;
  message: string;
} {
  const baseSpends = {
    AWS: 34200,
    GCP: 22800,
    Azure: 16500,
    'Multi-Cloud': 73500,
  };

  const spendVariance = Math.floor(Math.random() * 800) - 300;
  const currentTotal = (baseSpends[provider] || 30000) + spendVariance;
  const itemsProcessed = Math.floor(Math.random() * 120) + 400;

  // 30% chance of detecting a micro-anomaly
  const hasSpike = Math.random() > 0.7;

  let alert: Partial<AnomalyAlert> | undefined;
  if (hasSpike) {
    const services = {
      AWS: ['Amazon EC2 m6i.4xlarge (us-east-1)', 'AWS NAT Gateway Data Egress', 'Amazon OpenSearch Cluster'],
      GCP: ['BigQuery Slot Bursting & Scan', 'Cloud TPU v5e Retraining', 'Cloud Interconnect Egress'],
      Azure: ['Azure OpenAI GPT-4o Token Quota', 'Azure SQL Managed Instance', 'Virtual Machines D16s_v5'],
      'Multi-Cloud': ['Cross-Cloud VPN Interconnect Bandwidth'],
    };
    const sList = services[provider] || services.AWS;
    const chosenService = sList[Math.floor(Math.random() * sList.length)];
    const spikeAmount = Math.floor(Math.random() * 950) + 450;
    const baseline = Math.floor(spikeAmount * 0.35);

    alert = {
      id: `alert-live-${Date.now()}`,
      timestamp: new Date().toISOString(),
      service: chosenService,
      provider,
      severity: spikeAmount > 800 ? 'critical' : 'warning',
      currentSpike: spikeAmount,
      expectedBaseline: baseline,
      percentageIncrease: Math.round(((spikeAmount - baseline) / baseline) * 100),
      rootCause: `Automated ${provider} API ingestion detected un-budgeted consumption spike in ${chosenService}.`,
      status: 'active',
      emoji: '⚡',
    };
  }

  return {
    syncedSpend: currentTotal,
    itemsProcessed,
    anomalyDetected: hasSpike,
    alert,
    message: `Successfully synchronized ${itemsProcessed} line items from ${provider} Billing API.`,
  };
}
