'use strict';

const Wreck = require('wreck');


const Upstream = {};

Upstream.get = (url, options, cb, retries = 0) => {

    Wreck.get(url, options, (err, res, payload) => {

        if (!payload) {

            if (retries > 3) {
                return cb(new Error(`too many retries for ${url}`));
            }
            ++retries;
            return Upstream.get(url, options, cb, retries)
        }

        cb(err, res, payload);
    })
}

module.exports = Upstream;
