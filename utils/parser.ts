
import { Player, WeightEntry } from '../types';
import { calculatePlayerStats } from './scoring';

export const mergeCsvData = (
  existingPlayers: Player[], 
  csvData: string, 
  weekDates: Record<number, string>
): Player[] => {
  const lines = csvData.split(/\r?\n/);
  if (lines.length < 2) return existingPlayers;

  const playersMap = new Map<string, Player>();
  existingPlayers.forEach(p => playersMap.set(`${p.team}-${p.name}`, p));

  const newPlayers: Player[] = [];
  const weekCount = Object.keys(weekDates).length;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    if (row.length < 4 || !row[1] || !row[2]) continue;

    const name = row[1];
    const team = row[2];
    const key = `${team}-${name}`;
    const existing = playersMap.get(key);
    
    const weeklyWeights: (number | null)[] = [];
    for (let w = 0; w < weekCount; w++) {
      const colIndex = 3 + (w * 2);
      const csvVal = row[colIndex];
      const parsedCsvVal = csvVal && !isNaN(parseFloat(csvVal)) && parseFloat(csvVal) > 0 ? parseFloat(csvVal) : null;
      
      if (existing && existing.weights[w]) {
        const existingWeight = existing.weights[w].weight;
        weeklyWeights.push(existingWeight !== null ? existingWeight : parsedCsvVal);
      } else {
        weeklyWeights.push(parsedCsvVal);
      }
    }

    if (weeklyWeights.every(w => w === null)) continue;

    const stats = calculatePlayerStats(name, team, weeklyWeights);
    
    let runningLowest = stats.startWeight || 0;
    let successCount = 0;
    let milestonesUnlocked: number[] = [];
    
    const weights: WeightEntry[] = weeklyWeights.map((w, idx) => {
      let earned = 0;
      let breakdownParts: string[] = [];
      const weekNum = idx + 1;
      
      if (w !== null && w > 0) {
        if (w > (stats.startWeight || 0)) {
          earned = -1;
          breakdownParts.push("Penalty -1");
        } else if (idx > 0 && w < runningLowest) {
          earned = 1; 
          breakdownParts.push("Standard +1");
          successCount++;
          if (successCount % 3 === 0) {
            earned += 2;
            breakdownParts.push("Hat-trick +2");
          }
          
          const loss = (((stats.startWeight || 0) - w) / (stats.startWeight || 1)) * 100;
          const bracket = Math.floor(loss / 5) * 5;
          if (bracket >= 5 && !milestonesUnlocked.includes(bracket)) {
            const mPts = (3 + Math.floor((bracket - 5) / 5));
            earned += mPts;
            breakdownParts.push(`${bracket}% Milestone +${mPts}`);
            milestonesUnlocked.push(bracket);
          }
          runningLowest = w;
        } else {
          breakdownParts.push("Neutral 0");
        }
      }

      return {
        week: weekNum,
        weight: w,
        date: weekDates[weekNum] || `Week ${weekNum}`,
        pointsEarned: earned,
        pointBreakdown: breakdownParts.join(", "),
        forecastedPoints: 0
      };
    });

    newPlayers.push({
      id: existing?.id || `${team}-${name}-${Date.now()}-${i}`,
      name,
      team,
      weights,
      stats
    });
  }

  return newPlayers;
};

export const parseFit5CSV = (csvData: string, weekDates: Record<number, string>): Player[] => {
  return mergeCsvData([], csvData, weekDates);
};
