'use strict';

const isOF = (batter) => batter.position.includes('LF') || batter.position.includes('CF') || batter.position.includes('RF')



exports.rankRaw = (games) => {

    let allBatters = [];

    games.forEach((game) => {

        const gameBatters = [];
        game.team1.stats.lineup.forEach((batter) => {

            if (batter) {
                gameBatters.push({
                    ...batter,
                    position: isOF(batter) ? 'OF' : batter.position,
                    opponent: game.team2.stats.pitcher
                });
            }
        });

        game.team2.stats.lineup.forEach((batter) => {

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

    const sorted = allBatters.sort((a, b) => {

        return rawGamePrediction(a) > rawGamePrediction(b) ? -1 : 1;
    });

    return sorted;
}

const rawGamePrediction = (batter) => {

    const paVsStarter = 2 + (1 - (batter.spotInOrder/10));
    const paVsReliever = 2;
    const starterHandedness = batter.opponent.handedness;
    const pitcherMultiplier = calculatePitcherMultiplier(batter.opponent);

    const _single_VsStarter = calculateStat(batter, '1B', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _single_VsReliever = calculateStat(batter, '1B') * paVsReliever;
    const total_single_ = _single_VsStarter + _single_VsReliever;
    const total_single_Points = total_single_ * 3;

    const _double_VsStarter = calculateStat(batter, '2B', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _double_VsReliever = calculateStat(batter, '2B') * paVsReliever;
    const total_double_ = _double_VsStarter + _double_VsReliever;
    const total_double_Points = total_double_ * 5;

    const _triple_VsStarter = calculateStat(batter, '3B', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _triple_VsReliever = calculateStat(batter, '3B') * paVsReliever;
    const total_triple_ = _triple_VsStarter + _triple_VsReliever;
    const total_triple_Points = total_triple_ * 8;

    const _hr_VsStarter = calculateStat(batter, 'HR', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _hr_VsReliever = calculateStat(batter, 'HR') * paVsReliever;
    const total_hr_ = _hr_VsStarter + _hr_VsReliever;
    const total_hr_Points = total_hr_ * 10;

    const _rbi_VsStarter = calculateStat(batter, 'RBI', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _rbi_VsReliever = calculateStat(batter, 'RBI') * paVsReliever;
    const total_rbi_ = _rbi_VsStarter + _rbi_VsReliever;
    const total_rbi_Points = total_rbi_ * 2;

    const _r_VsStarter = calculateStat(batter, 'R', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _r_VsReliever = calculateStat(batter, 'R') * paVsReliever;
    const total_r_ = _r_VsStarter + _r_VsReliever;
    const total_r_Points = total_r_ * 2;

    const _bb_VsStarter = calculateStat(batter, 'BB', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _bb_VsReliever = calculateStat(batter, 'BB') * paVsReliever;
    const total_bb_ = _bb_VsStarter + _bb_VsReliever;
    const total_bb_Points = total_bb_ * 2;

    const _hbp_VsStarter = calculateStat(batter, 'HBP', starterHandedness, pitcherMultiplier) * paVsStarter;
    const _hbp_VsReliever = calculateStat(batter, 'HBP') * paVsReliever;
    const total_hbp_ = _hbp_VsStarter + _hbp_VsReliever;
    const total_hbp_Points = total_hbp_ * 2;

    const _sb_VsStarter = calculateStat(batter, 'SB', null, pitcherMultiplier) * paVsStarter;
    const _sb_VsReliever = calculateStat(batter, 'SB') * paVsReliever;
    const total_sb_ = _sb_VsStarter + _sb_VsReliever;
    const total_sb_Points = total_sb_ * 5;

    const totalPoints =
        total_single_Points +
        total_double_Points +
        total_triple_Points +
        total_hr_Points +
        total_rbi_Points +
        total_r_Points +
        total_bb_Points +
        total_hbp_Points +
        total_sb_Points

    batter.totalPoints = totalPoints;


    return totalPoints;
}


const calculatePitcherMultiplier = (pitcher) => {

    if (!pitcher.IP || +pitcher.IP < 10) {
        return 1.25;
    }

    let fip = (+pitcher.FIP + +pitcher.xFIP)/2;
    if (fip < 2) fip = 2;
    if (fip > 6) fip = 6;

    const normalized = ((fip - 2)/(6 - 2)) + .5;
    const buffer = normalized - 1;
    return 1 + (buffer/2);
}




const calculateStat = (batter, stat, hand, pitcherMultiplier = 1) => {

    const stats = batter[selectStats(hand)];
    return ((stats[stat]/stats.PA) * pitcherMultiplier) || 0;
}


const selectStats = (hand) => {

    if (hand === 'L') {
        return 'vsLeft';
    }
    else if (hand === 'R') {
        return 'vsRight';
    }
    return 'total';
}