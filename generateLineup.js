'use strict';

const { DATE } = require('./constants');

const Fs = require('fs');
const Path = require('path');
const SalariesPath = Path.resolve(__dirname, './fixtures/salaries_' + DATE + '.csv');
const salaries = Fs.readFileSync(SalariesPath, 'utf-8').split('\n');


const readSalaries = () => { // read in exported DK CSV with player names and salaries

    return salaries.map(sal => {

        const s = sal.split(',');
        const player = {};

        player.position = s[0];
        player.name = s[2];
        player.salary = +s[5];
        player.game = s[6];
        player.team = s[7];
        player.averagePoints = +s[8];

        return player;
    });
}


exports.battersWithSalaries = (batters) => { // format DK salaries onto batters

    const battersWithSalaries = batters.map((b) => {

        const allSalaries = readSalaries();

        const salary = allSalaries.find(s => s.name === b.name);

        if (!salary) {
            return;
        };

        return {
            ...b,
            ...salary
        }
    }).filter(mapped => mapped !== undefined);

    return battersWithSalaries;
};


exports.pitchersWithSalaries = (pitchers) => { // format DK salaries onto pitchers

    const pitchersWithSalaries = pitchers.map((p) => {

        const allSalaries = readSalaries();

        const salary = allSalaries.find(s => s.name === p.name);

        if (!salary) {
            return;
        };

        return {
            ...p,
            ...salary,
            totalPoints: salary.averagePoints * p.multiplier // multiplier comes from offense pitcher is facing
        }
    }).filter(mapped => mapped !== undefined);

    return pitchersWithSalaries;
};


const MAX_SALARY = 50000;

// filter out players with higher sal and lower projected points than others at same position
// for example if player A plays 2B and has 10 projected points and a salary of 5000
// and player B also plays 2B, with 12 projected points and salary of 4900
// player A would be filtered out as it is impossible for them to start on optimized lineup
const filterPositions = (players, buffer) => {

    return players.filter(p => {

        let betterPlayers = 0;

        for (let i = 0; i < players.length; ++i) {

            const player = players[i];

            if (p.name === player.name) {
                continue;
            }

            if (p.totalPoints < player.totalPoints && p.salary > player.salary) {
                ++betterPlayers;
            }
        }

        if (betterPlayers > buffer) {
            // console.log('filter out', p.name, p.position);
            return false;
        }
        return true;
    });
}



const generate = exports.generate = (battersWithSalaries, pitchersWithSalaries, defaultLineup = {}) => {

    const sorted = battersWithSalaries.sort((a, b) => {

        return a.pointsPerK > b.pointsPerK ? -1 : 1;
    }).filter(b => b.total.AB > 80);
    
    const catchers = filterPositions(sorted.filter(p => p.position === 'C'), 0);
    const firstBasemen = filterPositions(sorted.filter(p => p.position === '1B'), 0);
    const secondBasemen = filterPositions(sorted.filter(p => p.position === '2B'), 0);
    const thirdBasemen = filterPositions(sorted.filter(p => p.position === '3B'), 0);
    const shortStops = filterPositions(sorted.filter(p => p.position === 'SS'), 0);
    const outfielders = filterPositions(sorted.filter(p => p.position === 'OF'), 2);
    const pitchers = filterPositions(pitchersWithSalaries, 1);

    const start = Date.now();
    let perms = 0;
    let highestSoFar = 0;
    let highestLineup = [];

    const hasDefaultC = !!defaultLineup['C'];
    for (let catcherI = 0; catcherI < (hasDefaultC ? 1 : catchers.length); ++catcherI) {

        const catcher = hasDefaultC ? defaultLineup['C'] : catchers[catcherI];
        const _0points = catcher.totalPoints;
        const _0salary = catcher.salary;

        console.log('catcher', catcherI + 1, '/', catchers.length, Date.now() - start);

        const hasDefault1B = !!defaultLineup['1B'];
        for (let firstBasemenI = 0; firstBasemenI < (hasDefault1B ? 1 : firstBasemen.length); ++firstBasemenI) {

            const firstBaseman = hasDefault1B ? defaultLineup['1B'] : firstBasemen[firstBasemenI];
            const _1points = _0points + firstBaseman.totalPoints;
            const _1salary = _0salary + firstBaseman.salary;

            const hasDefault2B = !!defaultLineup['2B'];
            for (let secondBasemenI = 0; secondBasemenI < (hasDefault2B ? 1 : secondBasemen.length); ++secondBasemenI) {

                const secondBaseman = hasDefault2B ? defaultLineup['2b'] : secondBasemen[secondBasemenI];
                const _2points = _1points + secondBaseman.totalPoints;
                const _2salary = _1salary + secondBaseman.salary;

                const hasDefault3B = !!defaultLineup['3B'];
                for (let thirdBasemenI = 0; thirdBasemenI < (hasDefault3B ? 1 : thirdBasemen.length); ++thirdBasemenI) {

                    const thirdBaseman = hasDefault3B ? defaultLineup['3B'] : thirdBasemen[thirdBasemenI];
                    const _3points = _2points + thirdBaseman.totalPoints;
                    const _3salary = _2salary + thirdBaseman.salary;

                    const hasDefaultSS = !!defaultLineup['SS'];
                    for (let shortStopI = 0; shortStopI < (hasDefaultSS ? 1 : shortStops.length); ++shortStopI) {

                        const shortStop = hasDefaultSS ? defaultLineup['SS'] : shortStops[shortStopI];
                        const _4points = _3points + shortStop.totalPoints;
                        const _4salary = _3salary + shortStop.salary;

                        const hasDefaultOF1 = !!defaultLineup['OF1'];
                        for (let outfielder1I = 0; outfielder1I < (hasDefaultOF1 ? 1 : outfielders.length - 2); ++outfielder1I) {

                            const outfielder1 = hasDefaultOF1 ? defaultLineup['OF1'] : outfielders[outfielder1I];
                            const _5points = _4points + outfielder1.totalPoints;
                            const _5salary = _4salary + outfielder1.salary;

                            const hasDefaultOF2 = !!defaultLineup['OF2'];
                            for (let outfielder2I = outfielder1I + 1; outfielder2I < (hasDefaultOF2 ? 2 : outfielders.length - 1); ++outfielder2I) {

                                const outfielder2 = hasDefaultOF2 ? defaultLineup['OF2'] : outfielders[outfielder2I];
                                const _6points = _5points + outfielder2.totalPoints;
                                const _6salary = _5salary + outfielder2.salary;

                                const hasDefaultOF3 = !!defaultLineup['OF3'];
                                for (let outfielder3I = outfielder1I + 2; outfielder3I < (hasDefaultOF3 ? 3 : outfielders.length); ++outfielder3I) {

                                    const outfielder3 = hasDefaultOF3 ? defaultLineup['OF3'] : outfielders[outfielder3I];
                                    const _7points = _6points + outfielder3.totalPoints;
                                    const _7salary = _6salary + outfielder3.salary;

                                    if (outfielder1.name === outfielder2.name ||
                                        outfielder2.name === outfielder3.name ||
                                        outfielder1.name === outfielder3.name) {
                                        ++perms;
                                        continue;
                                    }

                                    const hasDefaultP1 = !!defaultLineup['P1'];
                                    for (let pitcher1I = 0; pitcher1I < (hasDefaultP1 ? 1 : pitchers.length - 1); ++pitcher1I) {

                                        const pitcher1 = hasDefaultP1 ? defaultLineup['P1'] : pitchers[pitcher1I];
                                        const _8points = _7points + pitcher1.totalPoints;
                                        const _8salary = _7salary + pitcher1.salary;

                                        const hasDefaultP2 = !!defaultLineup['P2'];
                                        for (let pitcher2I = pitcher1I + 1; pitcher2I < (hasDefaultP2 ? 2 : pitchers.length); ++pitcher2I) {

                                            const pitcher2 = hasDefaultP2 ? defaultLineup['P2'] : pitchers[pitcher2I];
                                            const totalPoints = _8points + pitcher2.totalPoints;
                                            const totalSalary = _8salary + pitcher2.salary;

                                            if (pitcher1.name === pitcher2.name) {
                                                ++perms;
                                                continue;
                                            }

                                            if (totalPoints > highestSoFar && totalSalary < MAX_SALARY) {
                                                highestSoFar = totalPoints;
                                                highestLineup = [
                                                    catcher,
                                                    firstBaseman,
                                                    secondBaseman,
                                                    thirdBaseman,
                                                    shortStop,
                                                    outfielder1,
                                                    outfielder2,
                                                    outfielder3,
                                                    pitcher1,
                                                    pitcher2
                                                ];
                                            }
                                            ++perms;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    console.log('time:', Date.now() - start, 'perms:', perms)

    highestLineup.forEach(p => {

        const isPitcher = !p.spotInOrder;

        const FIP = !isPitcher && p.opponent.FIP && p.opponent.xFIP ? (+p.opponent.FIP + +p.opponent.xFIP)/2 : 'N/A';

        console.log(
            p.position.padEnd(5, ' '),
            p.name.padEnd(15, ' '),
            p.team.padEnd(5, ' '),
            p.totalPoints.toFixed(2).padEnd(5, ' '),
            p.salary.toString().padEnd(5, ' '),
            !isPitcher ? p.opponent.name.padEnd(15, ' ') : '',
            !isPitcher ? `FIP: ${FIP}`.padEnd(10, ' ') : ''
        );
    });

    console.log('');
    console.log('total points:', highestLineup.reduce((total, player) => total += player.totalPoints, 0));
    console.log('total salary:', highestLineup.reduce((total, player) => total += player.salary, 0));
}




exports.generateTeamStack = (battersWithSalaries, pitchersWithSalaries) => {

    const pitchers = {};
    battersWithSalaries.forEach(b => {

        const opponent = b.opponent.name;
        if (!pitchers[opponent]) {
            pitchers[opponent] = []
        }
        b.total.AB > 80 ? pitchers[opponent].push(b) : '';
    });

    let highestOverall = 0;
    let highestLineupOverall = [];

    Object.keys(pitchers).forEach(p => {

        const batters = pitchers[p];
        let highestSoFar = 0;
        let highestLineup = [];

        let perms = 0

        for (let batter1I = 0; batter1I < batters.length - 4; ++batter1I) {

            const batter1 = batters[batter1I];

            for (let batter2I = batter1I + 1; batter2I < batters.length - 3; ++batter2I) {

                const batter2 = batters[batter2I];

                for (let batter3I = batter2I + 1; batter3I < batters.length - 2; ++batter3I) {

                    const batter3 = batters[batter3I];

                    for (let batter4I = batter3I + 1; batter4I < batters.length - 1; ++batter4I) {

                        const batter4 = batters[batter4I];

                        for (let batter5I = batter4I + 1; batter5I < batters.length; ++batter5I) {

                            ++perms

                            const batter5 = batters[batter5I];

                            const lineup = [
                                batter1,
                                batter2,
                                batter3,
                                batter4,
                                batter5
                            ];

                            let points = 0;
                            let salary = 0;
                            lineup.forEach(l => {

                                points += l.totalPoints;
                                salary += l.salary
                            });

                            const value = 1000 * points/salary;

                            if (value > highestSoFar) {
                                highestSoFar = value;
                                highestLineup = lineup;
                            }
                        }
                    }
                }
            }
        }

        if (highestSoFar > highestOverall) {
            highestOverall = highestSoFar;
            highestLineupOverall = highestLineup;
        }
    })

    console.log()
    console.log(highestLineupOverall[0].opponent.name)
    let sal = 0;
    let points = 0;
    const teamLineup = {};

    highestLineupOverall.forEach(l => {

        if (l.position === 'OF') {
            if (!!teamLineup['OF1']) {
                if (!!teamLineup['OF2']) {
                    teamLineup['OF3'] = l;
                }
                else {
                    teamLineup['OF2'] = l;
                }
            }
            else {
                teamLineup['OF1'] = l;
            }
        }
        else {
            teamLineup[l.position] = l;
        }

        sal += l.salary;
        points += l.totalPoints;
        console.log(l.name, l.totalPoints.toFixed(3), l.salary, l.position);
    });
    
    generate(battersWithSalaries, pitchersWithSalaries, teamLineup);
}

