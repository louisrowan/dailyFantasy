'use strict';

const { DATE, PATH_TO_FILE } = require('./constants');

const GenerateLineup = require('./generateLineup');
const RankPitchers = require('./rankPitchers');
const RankBatters = require('./rankBatters');


const handleAllDataFetched = (games) => { // print stuff to screen and generate lineups

    return new Promise(resolve => {

        console.log('generating lineup for', DATE, ':', PATH_TO_FILE);
        console.log()

        games.forEach((g) => {

            console.log(g.team1.name);
            console.log(g.team2.name);
        });
        console.log(games.length * 2);
        console.log('');


        const allPitchers = RankPitchers.rankRaw(games);
        const allBatters = RankBatters.rankRaw(games);

        const pos = {};

        allBatters.forEach((b) => {
            pos[b.position] ? pos[b.position].push(b) : pos[b.position] = [b];
        });

        Object.keys(pos).forEach((position) => {

            console.log('');
            console.log(position);
            pos[position].forEach((player) => {
                console.log(
                    player.name.padEnd(20, ' '),
                    player.totalPoints.toFixed(3).padEnd(5, ' ')
                );
            });
        });

        console.log('total games:', games.length);


        const battersWithSalaries = GenerateLineup.battersWithSalaries(allBatters);
        const pitchersWithSalaries = GenerateLineup.pitchersWithSalaries(allPitchers)

        return resolve({
            battersWithSalaries,
            pitchersWithSalaries
        });
    });
}

let teamStack = false;
const args = process.argv[2];
if (args === 'team') {
    teamStack = true;
}

handleAllDataFetched(require(PATH_TO_FILE))
    .then(res => {

        const { battersWithSalaries, pitchersWithSalaries } = res;
        return teamStack ?
            GenerateLineup.generateTeamStack(battersWithSalaries, pitchersWithSalaries) :
            GenerateLineup.generate(battersWithSalaries, pitchersWithSalaries);
    })
