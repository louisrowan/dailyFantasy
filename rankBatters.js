'use strict';

const { MIN_IP } = require('./constants');


const isOF = batter => batter.position.includes('LF') || batter.position.includes('CF') || batter.position.includes('RF');


exports.rankRaw = games => {

    let allBatters = [];

    games.forEach(game => {

        const gameBatters = [];
        game.team1.stats.lineup.forEach(batter => {

            if (batter) {
                gameBatters.push({
                    ...batter,
                    position: isOF(batter) ? 'OF' : batter.position,
                    opponent: game.team2.stats.pitcher
                });
            }
        });

        game.team2.stats.lineup.forEach(batter => {

            if (batter) {   
                gameBatters.push({
                    ...batter,
                    position: isOF(batter) ? 'OF' : batter.position,
                    opponent: game.team1.stats.pitcher
                });
            }
        });
        allBatters = allBatters.concat(gameBatters);
    });

    return allBatters.sort((a, b) => rawGamePrediction(a) > rawGamePrediction(b) ? -1 : 1);
};


const draftKingsPoints = {
    '1B': 3,
    '2B': 5,
    '3B': 8,
    'HR': 10,
    'RBI': 2,
    'R': 2,
    'BB': 2,
    'HBP': 2,
    'SB': 5
};


const calculateDraftKingsTotalPerStat = ({ // calculate raw stats vs starter, reliever, and apply DK points
    batter,
    stat,
    starterHandedness,
    pitcherMultiplier,
    paVsStarter,
    paVsReliever
}) => {

    const disableSplit = ['SB'].includes(stat);
    const statVsStarter = calculateStatRaw(batter, stat, disableSplit ? null : starterHandedness, pitcherMultiplier) * paVsStarter;
    const statVsReliever = calculateStatRaw(batter, stat) * paVsReliever;
    const statTotal = statVsStarter + statVsReliever;
    const ret = statTotal * draftKingsPoints[stat];
    return statTotal * draftKingsPoints[stat];
};


const rawGamePrediction = batter => { // draft kings projected total based on aggregate of all raw stat totals and DK point system

    const paVsStarter = 2 + (1 - (batter.spotInOrder/10));
    const paVsReliever = 2;
    const starterHandedness = batter.opponent.handedness;
    const pitcherMultiplier = calculatePitcherMultiplier(batter.opponent);
    
    const totalPoints = Object.keys(draftKingsPoints).reduce((total, stat) => { // loop thru all stats and add expected points

        return total += calculateDraftKingsTotalPerStat({
            batter,
            stat,
            starterHandedness,
            pitcherMultiplier,
            paVsStarter,
            paVsReliever
        });
    }, 0);

    batter.totalPoints = totalPoints;
    return totalPoints;
};


const calculatePitcherMultiplier = pitcher => { // opposing pitcher multiplier, .75 for elite pitcher and 1.25 for bad/inex pitchers

    if (!pitcher.IP || +pitcher.IP < MIN_IP) {
        return 1.25;
    }

    let fip = (+pitcher.FIP + +pitcher.xFIP)/2; // fip is average of regular FIP and xFIP
    if (fip < 2) fip = 2;
    if (fip > 6) fip = 6;

    const normalized = ((fip - 2)/(6 - 2)) + .5; // scale to between .75 and 1.25
    const buffer = normalized - 1;
    return 1 + (buffer/2);
};


const calculateStatRaw = (batter, stat, hand, pitcherMultiplier = 1) => { // calculate raw stat total

    const stats = batter[selectStatSplit(hand)];
    return ((stats[stat]/stats.PA) * pitcherMultiplier) || 0;
}


const selectStatSplit = hand => { // determine which stat split to use based on opposing pitcher hand

    if (hand === 'L') {
        return 'vsLeft';
    }
    else if (hand === 'R') {
        return 'vsRight';
    }
    return 'total';
};
