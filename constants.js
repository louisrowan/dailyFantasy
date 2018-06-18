'use strict';

const DATE = exports.DATE = '06-16';
exports.DOMAIN = 'https://www.fangraphs.com';
exports.PATH_TO_FILE = './fixtures/games_' + DATE + '.json';
exports.MIN_AB = 80; // min AB needed to qualify for starting a batter
exports.MIN_IP = 10; // min IP needed to not default pitcher multiplier to max