Project Handover: Fit5 Weight Loss League Tracker
1. Current State
100% Functional:
Fit5 Scoring Engine (v2.0): Complex logic for standard goals, hat-tricks, penalties, and percentage milestones with parameterized forecast weight loss (2kg).
Dashboard View: Team rankings with dynamic sparklines (Actual vs. Forecast) and manual adjustments integration.
Leaderboard View: Individual athlete tracking with expandable history and withdrawn players historical records.
Team Manual Adjustments: CSV-based adjustment system for manual goal modifications with weekly summation.
Withdrawn Players: Historical records preservation for athletes who left the league.
Data Sources: Multi-CSV architecture (main data, adjustments, withdrawn players) with separate configuration.
Manual Overrides: In-line weight editing and player deletion.
Auth System: Simple passkey ("wcw") for administrative actions.
Cloud Sync: Simplified CSV-only parsing from public URLs (GitHub API removed).
In Progress / Improvements Needed:
Error Boundaries: Currently, malformed CSVs might crash the parser without a user-friendly alert.
Multi-League Support: The system is currently hard-coded for one league (constants are global).
Mobile UX: While responsive, some tables in the expanded player view require horizontal scrolling.
Terminal Output: npm commands execute silently in some environments, requiring manual terminal execution.

2. Tech Stack & Dependencies
Framework: React 19 (using ESM modules via esm.sh).
Styling: Tailwind CSS (CDN-based for rapid iteration).
Icons: Lucide React (^0.562.0).
Build Tool: Vite (^7.3.1).
Language: TypeScript 5.7.
Data Sources: Public CSV URLs (no local persistence or GitHub API).

3. Architecture Overview
The application follows a Unidirectional Data Flow with a centralized state in App.tsx:
Data Sources (Multi-CSV Architecture):
- Main Data CSV: Player weights and team assignments
- Adjustments CSV: Manual team adjustments (Team Name, Week Number, Goals, Remarks)
- Withdrawn Players CSV: Historical data for departed players
Ingestion (utils/parser.ts): Raw CSV data is merged with local state.
Processing (utils/scoring.ts): Core scoring engine with:
- actualPoints: Historical performance with team adjustments applied
- forecastPoints: Predicted gains based on 2kg parameterized weight loss
- Sequential processing for hat-tricks and milestones
Adjustments Processing (utils/adjustments.ts):
- CSV parsing for manual adjustments
- Team-wise summation of multiple entries
- Integration with team scoring calculations
UI Components:
StatsCard: Generic display for high-level metrics.
TeamSparkline: Custom SVG visualization for team performance trends.
App.tsx: Main Orchestrator handling routing (Tabs), filtering, and multi-source data management.

4. Recent Architectural Changes
Data Architecture Evolution:
- Removed: GitHub API integration, localStorage persistence
- Added: Multi-CSV data source architecture
- Added: Team manual adjustments with summation logic
- Added: Withdrawn players historical records
Configuration Management:
- Three-tab configuration panel (Data Source, Team Adjustments, Withdrawn Players)
- In-memory state management (no persistence)
- Separate URL configuration for each data source
Scoring Logic Updates:
- Parameterized forecast weight loss (2kg constant)
- Team calculations now include manual adjustments
- Withdrawn players maintain historical scoring up to departure point
Visual Design Enhancements:
- Rose color theme for withdrawn players vs indigo for active
- Adjustment totals displayed in team cards
- Visual distinctions (strikethrough, badges, opacity)

5. Key Implementation Details
Team Adjustments:
- Schema: "Team Name,Week Number,Goals,Remarks"
- Logic: Sum all entries for same team/week
- Impact: Added to team's actual and latest points
- Display: Table in expanded team cards with weekly totals

Withdrawn Players:
- Schema: Same as main CSV (Rank, Name, Team, Week 1 Weight, Goal 1...)
- Display: Separate section below main content
- Visual: Rose theme, strikethrough names, "Withdrawn" badges
- Data: Complete historical preservation up to withdrawal point

State Management:
- Centralized in App.tsx with no persistence
- Three separate data sources loaded independently
- Real-time recalculation when data sources change

6. Configuration & Usage
Data Source Setup:
1. Main CSV URL: Primary player data
2. Adjustments CSV URL: Manual team adjustments (optional)
3. Withdrawn Players CSV URL: Historical data (optional)
Authentication:
- Passkey: "wcw" (hardcoded in App.tsx)
- Required for: Data source updates, manual weight edits
File Formats:
- Main/Withdrawn: "Rank,Name,Team,Week 1 Weight,Goal 1,Week 2 Weight,Goal 2..."
- Adjustments: "Team Name,Week Number,Goals,Remarks"