'use strict';

const Cheerio = require('cheerio');

const Common = require('./common');
const Upstream = require('./upstream');

const domain = 'https://www.fangraphs.com';



const findStatRowYear = (id, $) => {

    const statRows = $(`#${id} tr`);
    let currentYear;
    statRows.each((i, row) => {

        try {
            const yearTD = row.children[1];
            const yearLink = yearTD.children[0];
            const yearLinkHref = yearLink.attribs.href;
            const isActiveSeason = yearLink.name === 'a' &&
                yearLinkHref.includes('season=2018') &&
                !yearLinkHref.includes('minor');

            if (!currentYear && isActiveSeason) {
                currentYear = row;
            }
        }
        catch (err) {};
    });

    return currentYear || {};
};



const findStatRowSplit = (id, $, handedness) => {

    const statRows = $(`#${id} tr`);
    let currentSplit;
    statRows.each((i, row) => {

        try {
            const splitTD = row.children[2];
            const splitText = splitTD.children[0];

            const isCorrectSplit = splitText.data === handedness;
            if (!currentSplit && isCorrectSplit) {
                currentSplit = row;
            }
        }
        catch (err) {};
    });

    return currentSplit || {};
}


const pushYearTDsIntoRow = (yearTR) => {

    let playerStats = [];
    let i = 0;
    while (true) {

        if (!yearTR.children) { // year does not exist
            break;
        }

        const child = yearTR.children[i];
        if (!child) {
            break;
        }

        if (child.name === 'td') {
            playerStats.push(child)
        }

        ++i;
    }

    return playerStats;
}


const mapStatsToHeaders = (statArray, headers) => {

    const player = {};

    statArray.forEach((statTD, i) => {

        const currentHeader = headers[i];

        let value;
        if (statTD.children[0].name === 'a') {
            value = statTD.children[0].children[0].data;
        }
        else {
            value = statTD.children[0].data
        }

        player[currentHeader.value] = value;
    });

    return player;
}


const getPitcherHandedness = ($) => {

    const playerInfoDivs = $('.player-info-box-item, div');
    playerInfoDivs.each((_, element) => {

        if (element.children) {
            element.children.forEach((child) => {

                if (child.data && child.data.includes('Bats/Throws')) {
                    const handedness = child.data.split(': ')[1].split('/')[1];
                    return handedness;
                }
            })
        }
    });

    return 'R'; // default to righty
}






exports.getPitcherData = (pitcher, cb) => {

    const url = domain + '/' + pitcher.href;

    Upstream.get(url, {}, (err, res, payload) => {

        if (!payload) {
            console.log('no pl for get pitcher', pitcher, url);
            return cb(new Error());
        }

        const html = payload.toString();
        const $ = Cheerio.load(html);

        const standardTableId = 'SeasonStats1_dgSeason11_ctl00';

        const headers = Common.formatHeaders(standardTableId, $);
        const currentYear = findStatRowYear(standardTableId, $);
        const playerStats = pushYearTDsIntoRow(currentYear);

        const player = {
            name: pitcher.name,
            handedness: getPitcherHandedness($),
            ...mapStatsToHeaders(playerStats, headers)
        };

        return cb(null, player);
    });
};





exports.getLineupData = (lineup, cb) => {

    const promises = [];

    Object.keys(lineup).forEach((index) => {

        const batter = lineup[index];
        const batterPromise = getBatterData(batter);
        promises.push(batterPromise);
    });

    Promise.all(promises)
        .then((res) => {

            return cb(null, res);
        })
        .catch(err => {

            return cb(err);
        });
};


const getBatterData = (batter) => {

    return new Promise((resolve, reject) => {

        const splitRequest = getBattingStats(batter, true);
        const totalRequest = getBattingStats(batter);
        const requests = [splitRequest, totalRequest];

        Promise.all(requests)
            .then((responses) => {

                const [splitHtml, totalHtml] = responses;

                const [vsLeft, vsRight] = formatSplitBattingStats(splitHtml);
                const total = formatTotalBattingStats(totalHtml);

                const player = {
                    name: batter.name,
                    spotInOrder: batter.spotInOrder,
                    position: batter.position,
                    vsLeft,
                    vsRight,
                    total
                };

                return resolve(player);
            })
            .catch(err => {

                console.log('error getting batting data', err);
                return resolve();
            })
    });
}


const getBattingStats = (batter, splits) => {

    return new Promise((resolve, reject) => {

        const href = splits ? batter.href.replace('statss', 'statsplits') + '&season=2018' : batter.href;
        const url = domain + '/' + href;

        Upstream.get(url, {}, (err, res, payload) => {

            if (err) {
                return reject(err);
            }

            if (!payload) {
                console.log('no pl', url);
                return reject();
            }
            else {
                '.'
            }

            const html = payload.toString();
            const $ = Cheerio.load(html);

            resolve($);
        })
    });
};


const formatSplitBattingStats = ($) => {

    const standardTableId = 'SeasonSplits1_dgSeason1_ctl00';
    const advancedTableId = 'SeasonSplits1_dgSeason2_ctl00';

    const standardHeaders = Common.formatHeaders(standardTableId, $);
    const advancedHeaders = Common.formatHeaders(advancedTableId, $);

    const vsLeftRowStandard = findStatRowSplit(standardTableId, $, 'vs L');
    const vsRightRowStandard = findStatRowSplit(standardTableId, $, 'vs R');
    const vsLeftRowAdvanced = findStatRowSplit(advancedTableId, $, 'vs L');
    const vsRightRowAdvanced = findStatRowSplit(advancedTableId, $, 'vs R');

    const vsLeftStatArrayStandard = pushYearTDsIntoRow(vsLeftRowStandard);
    const vsRightStatArrayStandard = pushYearTDsIntoRow(vsRightRowStandard);
    const vsLeftStatArrayAdvanced = pushYearTDsIntoRow(vsLeftRowAdvanced);
    const vsRightStatArrayAdvanced = pushYearTDsIntoRow(vsRightRowAdvanced);

    const vsLeftStats = {
        ...mapStatsToHeaders(vsLeftStatArrayStandard, standardHeaders),
        ...mapStatsToHeaders(vsLeftStatArrayAdvanced, advancedHeaders)
    };

    const vsRightStats = {
        ...mapStatsToHeaders(vsRightStatArrayStandard, standardHeaders),
        ...mapStatsToHeaders(vsRightStatArrayAdvanced, advancedHeaders)
    };

    return [vsLeftStats, vsRightStats];
};


const formatTotalBattingStats = ($) => {

    const standardTableId = 'SeasonStats1_dgSeason1_ctl00';
    const advancedTableId = 'SeasonStats1_dgSeason2_ctl00';

    const standardHeaders = Common.formatHeaders(standardTableId, $);
    const advancedHeaders = Common.formatHeaders(advancedTableId, $);

    const rowStandard = findStatRowYear(standardTableId, $);
    const rowAdvanced = findStatRowYear(advancedTableId, $);

    const statArrayStandard = pushYearTDsIntoRow(rowStandard);
    const statArrayAdvanced = pushYearTDsIntoRow(rowAdvanced);

    const stats = {
        ...mapStatsToHeaders(statArrayStandard, standardHeaders),
        ...mapStatsToHeaders(statArrayAdvanced, advancedHeaders)
    };

    return stats;
}





