'use strict';

const Fs = require('fs');
const Path = require('path');

const Common = require('./common');
const Upstream = require('./upstream');

const PATH_TO_FILE = Path.resolve(__dirname, './fixtures/baseballSavant.json');


const fetchHTML = () => {

	return new Promise((resolve, reject) => {

		const requestPath = 'https://baseballsavant.mlb.com/expected_statistics?type=batter&year=2018&position=&team=&min=25';

		Upstream.get(requestPath, {}, (err, res, payload) => {

			if (err || !payload) {
				console.log('error fetching baseball savant data', err);
				reject(err);
			}

			resolve(payload.toString());
		});
	});
};


const parseHTML = html => {

	return new Promise((resolve, reject) => {

		const startChars = 'var data =';
		const endChars = 'var query_string =';

		const startIndex = html.indexOf(startChars) + startChars.length;
		const endIndex = html.indexOf(endChars);

		const data = html.slice(startIndex, endIndex - 1).replace(/;/g, "");

		let formatted;
		try {
			formatted = JSON.parse(data);
		}
		catch (err) {
			console.log('error parsing baseball savant html', err)
			reject(err);
		}

		return resolve(formatted.map(l => {

			const name = l.player_name.split(', ');

			return {
				name: name[1] + ' ' + name[0],
				team: l.team_name,
				position: l.position_name,
				woba: l.woba,
				estWoba: l.est_woba,
				wobaDiff: l.woba_minus_est_woba_diff
			};
		}).sort((a, b) => a.woba > b.woba ? -1 : 1));
	});
};


const printRes = data => {

	Fs.writeFileSync(PATH_TO_FILE, JSON.stringify(data, null, 2));
	console.log('Successfully wrote', data.length, 'baseball savant player data to', PATH_TO_FILE);
}


fetchHTML()
	.then(html => parseHTML(html))
	.then(res => printRes(res))
	.catch(err => console.log('in catch', err));
