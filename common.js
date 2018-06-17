'use strict';


exports.formatHeaders = (id, $) => {

    const headers = {};
    const headerTDs = $(`#${id} th`);

    headerTDs.each((i, header) => {

        let value;
        if (header.children[0].children) {
            value = header.children[0].children[0].data;

        }
        else {
            value = header.children[0].data;
        }

        headers[i] = {
            index: i,
            value
        }
    });

    return headers;
};
