
import { PlayerStats } from '../types';
import { MILESTONES, FORECAST_WEIGHT_LOSS } from '../constants';

export const calculatePlayerStats = (
  name: string, 
  team: string, 
  rawWeights: (number | null)[], 
  upToWeek: number = 999
): PlayerStats => {
  const weightsSubset = rawWeights.slice(0, upToWeek);
  const validIndices = weightsSubset
    .map((w, idx) => (w !== null && w > 0 ? idx : -1))
    .filter(idx => idx !== -1);

  if (validIndices.length === 0) {
    return {
      actualPoints: 0,
      latestWeekPoints: 0,
      forecastPoints: 0,
      forecastReasons: [],
      startWeight: null,
      currentWeight: null,
      allTimeLow: null,
      weightLossKg: 0,
      weightLossPercent: 0,
      newLowCount: 0,
      milestonesReached: [],
      isPenalized: false,
      nextLowTarget: null,
      nextMilestoneTarget: null
    };
  }

  const startWeight = rawWeights[validIndices[0]]!;
  const currentWeight = weightsSubset[validIndices[validIndices.length - 1]]!;
  
  // Persistent State for Sequential Calculation
  let runningLowest = startWeight;
  let successCount = 0;
  let milestonesUnlocked: number[] = []; // Track percentages hit: 5, 10, 15...
  const weeklyPointsMap: Record<number, number> = {};

  // Process weeks chronologically to maintain counters
  for (let i = 0; i < weightsSubset.length; i++) {
    const w = weightsSubset[i];
    if (w === null || w <= 0) continue;

    const weekNum = i + 1;
    let yieldForWeek = 0;

    // 1.4 The Penalty Rule (-1 Goal)
    if (w > startWeight) {
      yieldForWeek = -1;
    } 
    // 1.1 Standard Success (+1 Goal)
    else if (i > validIndices[0] && w < runningLowest) {
      let standard = 1;
      successCount++;
      
      // 1.2 Hat-trick Protocol (+2 Goals)
      let hatTrick = 0;
      if (successCount > 0 && successCount % 3 === 0) {
        hatTrick = 2;
      }

      // 1.6 Milestone Protocol
      let milestoneBonus = 0;
      const lossPercent = ((startWeight - w) / startWeight) * 100;
      
      // Find the highest milestone bracket we just crossed into
      const crossedBracket = Math.floor(lossPercent / 5) * 5;
      if (crossedBracket >= 5 && !milestonesUnlocked.includes(crossedBracket)) {
        // Yield Calculation: 3 + floor((Total_Loss_% - 5) / 5)
        milestoneBonus = 3 + Math.floor((crossedBracket - 5) / 5);
        milestonesUnlocked.push(crossedBracket);
      }

      yieldForWeek = standard + hatTrick + milestoneBonus;
      runningLowest = w;
    }

    weeklyPointsMap[weekNum] = yieldForWeek;
  }

  const totalActualPoints = Object.values(weeklyPointsMap).reduce((sum, p) => sum + p, 0);

  // Forecast Logic (Future potential with same rules as actual)
  let forecastPoints = 0;
  const forecastReasons: string[] = [];
  const projectedWeight = currentWeight - FORECAST_WEIGHT_LOSS;
  
  // Apply same scoring rules as actual, but with projected weight
  let forecastYield = 0;
  
  // 1.4 The Penalty Rule (-1 Goal) - same as actual
  if (projectedWeight > startWeight) {
    forecastYield = -1;
  } 
  // 1.1 Standard Success (+1 Goal) - same as actual
  else if (projectedWeight < runningLowest) {
    let standard = 1;
    let forecastSuccessCount = successCount + 1;
    
    // 1.2 Hat-trick Protocol (+2 Goals) - same as actual
    let hatTrick = 0;
    if (forecastSuccessCount > 0 && forecastSuccessCount % 3 === 0) {
      hatTrick = 2;
    }

    // 1.6 Milestone Protocol - same as actual
    let milestoneBonus = 0;
    const projectedLoss = ((startWeight - projectedWeight) / startWeight) * 100;
    
    // Find the highest milestone bracket we would cross into
    const crossedBracket = Math.floor(projectedLoss / 5) * 5;
    if (crossedBracket >= 5 && !milestonesUnlocked.includes(crossedBracket)) {
      milestoneBonus = 3 + Math.floor((crossedBracket - 5) / 5);
    }

    forecastYield = standard + hatTrick + milestoneBonus;
  }

  forecastPoints = forecastYield;
  forecastReasons.push(`Projected: ${projectedWeight.toFixed(1)}kg [+${forecastYield}]`);

  return {
    actualPoints: totalActualPoints,
    latestWeekPoints: weeklyPointsMap[upToWeek] || 0,
    forecastPoints,
    forecastReasons,
    startWeight,
    currentWeight,
    allTimeLow: runningLowest,
    weightLossKg: startWeight - currentWeight,
    weightLossPercent: ((startWeight - currentWeight) / startWeight) * 100,
    newLowCount: successCount,
    milestonesReached: milestonesUnlocked.map(m => `${m}%`),
    isPenalized: currentWeight > startWeight,
    nextLowTarget: projectedWeight,
    nextMilestoneTarget: null
  };
};
