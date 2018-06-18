'use strict';

const { DATE, PATH_TO_FILE } = require('./constants');

const GenerateLineup = require('./generateLineup');
const RankPitchers = require('./rankPitchers');
const RankBatters = require('./rankBatters');


const handleAllDataFetched = games => { // print stuff to screen and generate lineups

    return new Promise(resolve => {

        console.log('generating lineups for', DATE, ':', PATH_TO_FILE);
        console.log();

        games.forEach((g, i) => {
            console.log(`Game ${i + 1}: ${g.team1.name} vs ${g.team2.name}`);
        });
        console.log('');

        const allPitchers = RankPitchers.rankRaw(games);
        const allBatters = RankBatters.rankRaw(games);
        const battersWithSalaries = GenerateLineup.battersWithSalaries(allBatters);
        const pitchersWithSalaries = GenerateLineup.pitchersWithSalaries(allPitchers);

        return resolve({
            battersWithSalaries,
            pitchersWithSalaries
        });
    });
};


let teamStack = false;
const args = process.argv[2];
if (args === 'team') {
    teamStack = true;
};


handleAllDataFetched(require(PATH_TO_FILE))
    .then(res => {

        const { battersWithSalaries, pitchersWithSalaries } = res;
        return teamStack ?
            GenerateLineup.generateTeamStack(battersWithSalaries, pitchersWithSalaries) :
            GenerateLineup.generate(battersWithSalaries, pitchersWithSalaries);
    });
