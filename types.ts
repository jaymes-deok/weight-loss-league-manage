
export interface WeightEntry {
  week: number;
  weight: number | null;
  date: string;
  pointsEarned: number;
  pointBreakdown?: string;
  forecastedPoints: number;
}

export interface Milestone {
  percentage: number;
  points: number;
  label: string;
}

export interface PlayerStats {
  actualPoints: number;
  latestWeekPoints: number;
  forecastPoints: number;
  forecastReasons: string[];
  startWeight: number | null;
  currentWeight: number | null;
  allTimeLow: number | null;
  weightLossKg: number;
  weightLossPercent: number;
  newLowCount: number;
  milestonesReached: string[];
  isPenalized: boolean;
  nextLowTarget: number | null;
  nextMilestoneTarget: number | null;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  weights: WeightEntry[];
  stats: PlayerStats;
}

export interface Team {
  name: string;
  players: Player[];
  top10Actual: number;
  top10Latest: number;
  top10Forecast: number;
  totalWeightLoss: number;
}

export interface TeamAdjustment {
  teamName: string;
  weekNumber: number;
  goals: number;
  remarks: string;
}
