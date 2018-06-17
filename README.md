# dailyFantasy
Draft Kings daily fantasy baseball lineup optimizer

Steps
1. Update date on 'constants.js' to desired date.
2. Optional - Update team stats by running `node getTeamBattingStats.js`
3. `npm run start` to fetch days games, lineups, current player stats
4. Go to draftkings.com, open desired content, 'export' csv of players and move to './fixtures' and rename as 'salaries_<date>'
5. Run 'npm run generate' to generate optimal lineup, or 'npm run team' to generate team-stacked lineup with 5 batters from same team
6. Enter lineup on draftkings, collect profits