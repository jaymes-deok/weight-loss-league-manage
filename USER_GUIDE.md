# Fit5 Weight Loss League Tracker - User Guide

## 🚀 Getting Started

### Quick Start
1. **Open the Application** - Navigate to the Fit5 Tracker URL in your web browser
2. **Load Your Data** - Click "Cloud Config" and enter your CSV URLs
3. **Explore the Dashboard** - View team rankings and individual performance
4. **Track Progress** - Switch between Dashboard and Leaderboard views

### Initial Setup

#### Step 1: Prepare Your Data Files
You'll need up to three CSV files:

**Main Data CSV (Required)**
- Contains all active players and their weight history
- Format: `Rank,Name,Team,Week 1 Weight,Goal 1,Week 2 Weight,Goal 2...`
- Update weekly with new weigh-in data

**Team Adjustments CSV (Optional)**
- Manual point adjustments for teams
- Format: `Team Name,Week Number,Goals,Remarks`
- Use for bonuses, penalties, or special circumstances

**Withdrawn Players CSV (Optional)**
- Historical data for players who left the league
- Same format as Main Data CSV
- Preserves their contribution to league history

#### Step 2: Publish Google Sheets as CSV
1. **Create Your Google Sheet**
   - Open [sheets.google.com](https://sheets.google.com)
   - Create a new spreadsheet or use an existing one
   - Set up columns according to the format above

2. **Publish to Web**
   - Click **File** → **Share** → **Publish to web**
   - In the dialog, select the entire sheet or specific tab
   - Choose **Comma-separated values (.csv)** as the format
   - Click **Publish**

3. **Get the CSV Link**
   - Copy the URL from the "Published content" section
   - The link will look like: `https://docs.google.com/spreadsheets/d/DOCUMENT_ID/export?format=csv`
   - Use this URL in the Fit5 configuration

#### Step 3: Configure the Application
1. Click the **Cloud Config** button
2. **Data Source Tab**: Enter your Main Data CSV URL
3. **Team Adjustments Tab**: Add adjustments CSV URL (if applicable)
4. **Withdrawn Players Tab**: Add withdrawn players CSV URL (if applicable)
5. Click **Update Source** for each tab you configure

### Authentication
- The system uses a simple passkey: **wcw**
- You'll be prompted for this passkey when:
  - Updating data sources
  - Making manual weight edits
  - Deleting players

---

## 🎯 Key Features

### Dashboard View
**Team Rankings**
- View overall team performance
- See actual vs. forecast points
- Check weekly trends with sparkline charts
- Expand team cards for detailed information

**Team Card Features**
- **Net Yield**: Total points earned this season
- **W{Current Week} Net Yield**: Points earned in the current week
- **W{Current Week + 1} Potential**: Forecast for next week
- **Player Table**: Individual team member performance
- **Manual Adjustments**: View weekly adjustment totals

### Leaderboard View
**Individual Performance**
- Track individual weight loss progress
- View weekly point yields and forecasts
- See milestones achieved
- Access detailed weight history

**Player Card Features**
- **Start Weight**: Initial weight at season start
- **Low**: Best weight achieved
- **Now**: Current weight
- **W{Current Week} Yield**: This week's performance
- **Potential**: Next week's forecast
- **Weight History**: Expand to see weekly progress

### Withdrawn Players Section
**Historical Records**
- View players who have left the league
- See their complete performance history
- Preserved contribution to team rankings
- Rose-colored theme for visual distinction

### Manual Adjustments
**Team Point Modifications**
- Add bonus points for achievements
- Apply penalties for rule violations
- Include coach's discretion points
- Multiple entries per week are automatically summed

---

## 🔧 Troubleshooting

### Common Issues

#### Data Not Loading
**Problem**: Clicking "Update Source" doesn't show any data
**Solutions**:
1. Check your CSV URL is correct and publicly accessible
2. Verify Google Sheet is published to the web
3. Ensure CSV format matches the required schema
4. Try opening the CSV URL in your browser to test

#### Incorrect Calculations
**Problem**: Points or rankings seem wrong
**Solutions**:
1. Check weight data for typos or missing values
2. Verify team names match exactly between main data and adjustments
3. Ensure week numbers are correct in adjustments CSV
4. Refresh the page and reload data

#### Display Issues
**Problem**: Tables look distorted or cut off
**Solutions**:
1. Use a wider browser window for better table viewing
2. Try zooming out (Ctrl - or Cmd -)
3. On mobile, landscape orientation works best

#### Authentication Issues
**Problem**: Passkey not working
**Solutions**:
1. Ensure you're typing: wcw (lowercase)
2. Check for extra spaces before/after the passkey
3. Try refreshing the page and re-entering

### Data Format Tips

#### CSV Formatting Best Practices
- Use commas as separators (not semicolons)
- Don't include extra commas in text fields
- Save as UTF-8 encoding
- Remove empty rows at the bottom

#### Google Sheets Tips
- Keep column headers exactly as specified
- Use numbers for weights (e.g., 85.5, not 85.5kg)
- Leave cells empty for missing weigh-ins
- Don't merge cells in the data range

---

## ❓ FAQ

### General Questions

**Q: How often should I update the data?**
A: Update your main CSV weekly after weigh-ins. Adjustments can be added anytime.

**Q: Can I have multiple leagues in one system?**
A: Currently, the system supports one league at a time. For multiple leagues, you'd need separate instances.

**Q: What happens if I refresh the page?**
A: All data reloads from your CSV URLs. Any unsaved manual edits will be lost.

**Q: Can I edit weights directly in the app?**
A: Yes, but it requires the "wcw" passkey and is meant for temporary corrections.

### Scoring Questions

**Q: How are points calculated?**
A: Points are based on weight loss achievements:
- Standard Success: New low weight = +1 point
- Hat-trick: Every 3rd success = +2 extra points
- Milestones: 5%, 10%, 15%+ weight loss = +3 to +8 points
- Penalty: Weight above season start = -1 point

**Q: What's the "forecast" based on?**
A: Forecast assumes a 2kg weight loss for the next week and calculates potential points using the same rules as actual scoring.

**Q: Do withdrawn players affect current rankings?**
A: Yes, their historical contribution up to their departure week is included in team totals.

### Technical Questions

**Q: Do I need to install any software?**
A: No, the application runs entirely in your web browser.

**Q: Can I use Excel instead of Google Sheets?**
A: Yes, but you'll need to save the file as CSV and host it somewhere accessible via URL.

**Q: Is my data secure?**
A: The system doesn't store any data - it only reads from your publicly shared CSV files.

**Q: What if I need help with the CSV format?**
A: Check the sample files provided or contact your league administrator for a template.

---

## 📞 Getting Help

### Quick Reference
- **Passkey**: wcw
- **Main CSV Format**: Rank,Name,Team,Week 1 Weight,Goal 1,Week 2 Weight,Goal 2...
- **Adjustments CSV Format**: Team Name,Week Number,Goals,Remarks

### Best Practices
1. **Backup Your Data**: Keep copies of your CSV files
2. **Test URLs**: Verify CSV links work before configuring
3. **Consistent Naming**: Use exact team names across all files
4. **Regular Updates**: Update main CSV weekly for best results

### Still Need Help?
If you encounter issues not covered in this guide:
1. Check your CSV format against the examples
2. Verify all URLs are accessible
3. Try refreshing the application
4. Contact your league administrator for assistance

---

*This guide covers all features of the Fit5 Weight Loss League Tracker. For technical details, see the README-DEV.md file.*

