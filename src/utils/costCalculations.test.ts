import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalSpend,
  calculateMonthOverMonth,
  calculatePotentialSavings,
  calculateCommitmentCoverage,
  evaluateSpikeAnomalies,
  calculateFinOpsMaturityScore,
  formatCurrency,
} from './costCalculations';
import { MonthlyExpense, OptimizationRecommendation, BenchmarkReportItem, DailyExpensePoint } from '../types/cost';

test('calculateTotalSpend sums correctly', () => {
  const sampleExpenses: Partial<MonthlyExpense>[] = [
    { totalSpend: 10000 },
    { totalSpend: 15500 },
    { totalSpend: 20000 },
  ];
  assert.equal(calculateTotalSpend(sampleExpenses as MonthlyExpense[]), 45500);
});

test('calculateMonthOverMonth computes percentage and spend correctly', () => {
  const sampleExpenses: Partial<MonthlyExpense>[] = [
    { totalSpend: 50000 },
    { totalSpend: 55000 },
  ];
  const result = calculateMonthOverMonth(sampleExpenses as MonthlyExpense[]);
  assert.equal(result.currentSpend, 55000);
  assert.equal(result.previousSpend, 50000);
  assert.equal(result.percentageChange, 10.0);
});

test('calculatePotentialSavings tallies only open status items', () => {
  const sampleRecs: Partial<OptimizationRecommendation>[] = [
    { estimatedSavingsMonthly: 1200, estimatedSavingsAnnual: 14400, status: 'open' },
    { estimatedSavingsMonthly: 800, estimatedSavingsAnnual: 9600, status: 'applied' },
    { estimatedSavingsMonthly: 500, estimatedSavingsAnnual: 6000, status: 'open' },
  ];
  const result = calculatePotentialSavings(sampleRecs as OptimizationRecommendation[]);
  assert.equal(result.monthly, 1700);
  assert.equal(result.annual, 20400);
  assert.equal(result.count, 2);
});

test('calculateCommitmentCoverage calculates RI and Savings Plan percentage accurately', () => {
  const sampleExpense: Partial<MonthlyExpense> = {
    onDemandSpend: 30000,
    reservationSpend: 25000,
    savingsPlanSpend: 45000,
    spotSpend: 0,
  };
  const result = calculateCommitmentCoverage(sampleExpense as MonthlyExpense);
  // (25000 + 45000) / (30000 + 70000) = 70000 / 100000 = 70%
  assert.equal(result.coveragePercentage, 70.0);
  assert.equal(result.committedSpend, 70000);
  assert.equal(result.uncommittedSpend, 30000);
});

test('evaluateSpikeAnomalies flags entries that exceed threshold and minimum dollar amount', () => {
  const points: DailyExpensePoint[] = [
    { date: '2026-10-01', dayLabel: 'Oct 1', spend: 1000, baseline: 1000, isSpike: false, provider: 'AWS' },
    { date: '2026-10-02', dayLabel: 'Oct 2', spend: 1800, baseline: 1000, isSpike: false, provider: 'AWS' }, // +800 (+80%) -> spike
    { date: '2026-10-03', dayLabel: 'Oct 3', spend: 1050, baseline: 1000, isSpike: false, provider: 'AWS' }, // +50 (+5%) -> not spike
  ];

  const evaluated = evaluateSpikeAnomalies(points, 25, 200);
  assert.equal(evaluated[0].isSpike, false);
  assert.equal(evaluated[1].isSpike, true);
  assert.ok(evaluated[1].spikeReason?.includes('+80%'));
  assert.equal(evaluated[2].isSpike, false);
});

test('calculateFinOpsMaturityScore produces realistic score and grades', () => {
  const benchmarks: BenchmarkReportItem[] = [
    {
      id: 'b1',
      metricName: 'Commitment Coverage',
      category: 'Reservations',
      userValue: 78,
      industryMedian: 60,
      industryTopQuartile: 75,
      unit: '%',
      higherIsBetter: true,
      description: 'Coverage rate',
      recommendation: 'Good',
      emoji: '🛡️',
    },
    {
      id: 'b2',
      metricName: 'Idle Waste Rate',
      category: 'Efficiency',
      userValue: 8,
      industryMedian: 18,
      industryTopQuartile: 10,
      unit: '%',
      higherIsBetter: false,
      description: 'Unattached or idle spend',
      recommendation: 'Low waste',
      emoji: '♻️',
    },
  ];

  const maturity = calculateFinOpsMaturityScore(benchmarks);
  assert.ok(maturity.score >= 85);
  assert.equal(maturity.grade, 'Elite');
});

test('formatCurrency formats accurately', () => {
  assert.equal(formatCurrency(1250000, true), '$1.3M');
  assert.equal(formatCurrency(45200, true), '$45.2k');
});
