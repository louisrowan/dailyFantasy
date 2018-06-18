'use strict';

const TeamBattingStats = require('./fixtures/teamBattingStats.json');


exports.rankRaw = (games) => {

    let pitchers = [];

    games.forEach((game) => {

        const team1Pitcher = {
            ...game.team1.stats.pitcher,
            opponent: game.team2.name
        };

        const team2Pitcher = {
            ...game.team2.stats.pitcher,
            opponent: game.team1.name
        };

        for (let i = 0; i < TeamBattingStats.length; ++i) { // calculate multipler based on opposing offense

            const team = TeamBattingStats[i];
            if (team.name === team1Pitcher.opponent) {
                team1Pitcher.multiplier = team.multiplier;
            }
            else if (team.name === team2Pitcher.opponent) {
                team2Pitcher.multiplier = team.multiplier;
            }
        };

        if (!team1Pitcher.multiplier || !team2Pitcher.multiplier) {
            console.log('no multiplier for either', team1Pitcher, team2Pitcher);
            process.exit();
        }

        pitchers.push(team1Pitcher);
        pitchers.push(team2Pitcher);
    });

    const sortedPitchers = pitchers.sort((a, b) => a.xFIP > b.xFIP ? 1 : -1);

    console.log(
        'pitcher'.padEnd(20, ' '),
        'xFIP'.padEnd(10, ' '),
        'opponent'.padEnd(10, ' '),
        'multiplier'.padEnd(5, ' ')
    );

    sortedPitchers.forEach(s => {

        console.log(
            s.name.padEnd(20, ' '),
            s.xFIP.padEnd(10, ' '),
            s.opponent.padEnd(10, ' '),
            s.multiplier.toFixed(3).padEnd(5, ' ')
        );
    });

    return sortedPitchers;
};
