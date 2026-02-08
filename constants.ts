
export const FORECAST_THRESHOLD = 2;
export const FORECAST_WEIGHT_LOSS = 2.0;
export const TEAM_CAP = 10;

/**
 * GAME_WEEKS_DATES
 * Update these dates to match your league's actual schedule.
 */
export const GAME_WEEKS_DATES: Record<number, string> = {
  1: "24 Oct",
  2: "31 Oct",
  3: "07 Nov",
  4: "14 Nov",
  5: "21 Nov",
  6: "28 Nov",
  7: "05 Dec",
  8: "12 Dec",
  9: "19 Dec",
  10: "09 Jan",
  11: "16 Jan",
  12: "23 Jan", 
  13: "6 Feb",
  14: "13 Feb",
  15: "27 Mar",
  16: "10 Apr",
  17: "17 Apr",
  18: "24 Apr"
};

export const MILESTONES = [
  { percentage: 5, points: 3, label: "5%" },
  { percentage: 10, points: 4, label: "10%" },
  { percentage: 15, points: 5, label: "15%" },
  { percentage: 20, points: 6, label: "20%" },
  { percentage: 25, points: 7, label: "25%" },
  { percentage: 30, points: 8, label: "30%" },
  { percentage: 35, points: 9, label: "35%" },
];

/**
 * DEFAULT_CSV_URL
 * This is the primary "Sync" target. 
 * 
 * To change this to YOUR repository:
 * 1. Upload a file named 'data.csv' to your GitHub repo.
 * 2. Click on the file in GitHub, click "Raw".
 * 3. Copy that URL and paste it below.
 * 
 * To use Google Sheets:
 * 1. File > Share > Publish to Web.
 * 2. Select "Comma-separated values (.csv)".
 * 3. Copy that link and paste it below.
 */
export const DEFAULT_CSV_URL = "";
