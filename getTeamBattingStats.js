'use strict';

const Cheerio = require('cheerio');
const Fs = require('fs');
const Path = require('path');

const Common = require('./common');
const Upstream = require('./upstream');

const domain = 'https://www.fangraphs.com';
const PATH_TO_FILE = Path.resolve(__dirname, './fixtures/teamBattingStats.json');



const getTeamBattingStats = () => {

    return new Promise((resolve, reject) => {

        const url = domain + '/leaders.aspx?pos=all&stats=bat&lg=all&qual=0&type=8&season=2018&month=0&season1=2018&ind=0&team=0,ts&rost=&age=&filter=&players=0';

        Upstream.get(url, {}, (err, res, payload) => {

            if (err || !payload) {
                console.log('error getting team batting stats', err);
                return reject()
            };

            return resolve(payload.toString());
        });
    });
};



const findTeamBattingStatRow = (id, $) => {

    const teamTable = $(`#${id}`);
    const rows = teamTable.children('tbody').children('tr');
    return rows;
}


const formatTeamRows = (rows, headers) => {

    const teams = [];

    rows.each((i, row) => {

        const team = {};
        let index = 0;

        row.children.forEach((element) => {

            if (element.name === 'td') {

                let data = null;
                const child = element.children[0];

                if (child.type === 'text') {
                    data = child.data;
                }
                if (child.type === 'tag') {
                    data = child.children[0].data;
                }

                team[headers[index].value] = +data ? +data : data;
                ++index;
            }
        });
        teams.push(team);
    });
    return teams;
}


const calculateLeagueAverages = (formattedTeamBattingStats) => {

    let runs = 0;
    let pa = 0;
    let wOBA = 0;
    let teams = 0;
    formattedTeamBattingStats.forEach(team => {

        runs += team['R'];
        pa += team['PA'];
        wOBA += team['wOBA'];
        ++teams;
    });

    const averageRuns = runs/pa;
    const averageWOBA = wOBA/teams;
    return {
        averageRuns,
        averageWOBA
    };
}


const calculateTeamMultipliers = (leageAverages, formattedTeamBattingStats) => {

    const { averageRuns, averageWOBA } = leageAverages;

    let teams = [];
    formattedTeamBattingStats.forEach(team => {

        const teamRunsPerPA = team['R']/team['PA'];
        const teamWOBA = team['wOBA'];

        const multiplier = (averageRuns/teamRunsPerPA) * (averageWOBA/teamWOBA);

        teams.push({
            name: team.Team,
            multiplier
        });
    });
    return teams;
}


const formatTeamBattingStats = (html) => {

    return new Promise((resolve, reject) => {

        const $ = Cheerio.load(html);

        const standardTableId = 'LeaderBoard1_dg1_ctl00';
        const headers = Common.formatHeaders(standardTableId, $);
        const teamBattingRows = findTeamBattingStatRow(standardTableId, $);
        const formattedTeamBattingStats = formatTeamRows(teamBattingRows, headers);
        const leageAverages = calculateLeagueAverages(formattedTeamBattingStats);
        const teamMultipliers = calculateTeamMultipliers(leageAverages, formattedTeamBattingStats);

        return resolve(teamMultipliers);
    });
};



getTeamBattingStats()
    .then(res => {

        return formatTeamBattingStats(res);
    })
    .then(res => {

        Fs.writeFileSync(PATH_TO_FILE, JSON.stringify(res, null, 2));
    })
    .catch(err => {

        console.log('err in get team batting stats promise', err);
    });
