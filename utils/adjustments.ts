import { TeamAdjustment } from '../types';

export const parseAdjustmentsCSV = (csvText: string): TeamAdjustment[] => {
  const lines = csvText.trim().split('\n');
  const adjustments: TeamAdjustment[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV parsing with quotes
    const fields = parseCSVLine(line);
    
    if (fields.length >= 4) {
      adjustments.push({
        teamName: fields[0].trim(),
        weekNumber: parseInt(fields[1]) || 0,
        goals: parseFloat(fields[2]) || 0,
        remarks: fields[3].trim()
      });
    }
  }
  
  return adjustments;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const getTeamAdjustments = (
  adjustments: TeamAdjustment[], 
  teamName: string, 
  weekNumber: number
): TeamAdjustment[] => {
  return adjustments.filter(
    adj => adj.teamName === teamName && adj.weekNumber === weekNumber
  );
};

export const getTeamAdjustmentTotal = (
  adjustments: TeamAdjustment[], 
  teamName: string, 
  weekNumber: number
): number => {
  const teamAdjustments = getTeamAdjustments(adjustments, teamName, weekNumber);
  return teamAdjustments.reduce((sum, adj) => sum + adj.goals, 0);
};
