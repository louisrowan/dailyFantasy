'use strict';

const Cheerio = require('cheerio');
const Fs = require('fs');
const Path = require('path');

const { DOMAIN } = require('./constants')
const Common = require('./common');
const Upstream = require('./upstream');

const PATH_TO_FILE = Path.resolve(__dirname, './fixtures/teamBattingStats.json');


const getTeamBattingStats = () => { // fetch fangraphs team batting stats file

    return new Promise((resolve, reject) => {

        const url = DOMAIN + '/leaders.aspx?pos=all&stats=bat&lg=all&qual=0&type=8&season=2018&month=0&season1=2018&ind=0&team=0,ts&rost=&age=&filter=&players=0';

        Upstream.get(url, {}, (err, res, payload) => {

            if (err || !payload) {
                console.log('error getting team batting stats', err);
                return reject()
            };

            return resolve(payload.toString());
        });
    });
};


const findTeamBattingStatRow = (id, $) => { // get team row from html

    const teamTable = $(`#${id}`);
    const rows = teamTable.children('tbody').children('tr');
    return rows;
};


const formatTeamRows = (rows, headers) => { // format team row from html to JS object

    const teams = [];

    rows.each((i, row) => {

        const team = {};
        let index = 0;

        row.children.forEach(element => {

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
};


const calculateLeagueAverages = formattedTeamBattingStats => { // league averages for team batting stats

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
};


const calculateTeamMultipliers = (leageAverages, formattedTeamBattingStats) => { // calculate individual team batting total diff from league average

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
};


const formatTeamBattingStats = html => { // flow control for process of converting raw html to formatted team batting stats

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
    .then(res => formatTeamBattingStats(res))
    .then(res => {

        Fs.writeFileSync(PATH_TO_FILE, JSON.stringify(res, null, 2));
        console.log('Wrote team batting stats to', PATH_TO_FILE);
    })
    .catch(err => {

        console.log('error in updating team batting stats', err);
    });
