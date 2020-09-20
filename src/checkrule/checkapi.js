const _ = require('lodash');
const axios = require('axios').default;

const logger = require("../logger");

async function checkApi(rule) {
    const { name, id, url, validatePath, checkPath } = rule;
    logger.info(`Checking rule ${name}`);

    const { data } = await axios.get(url);

    for (let validate of validatePath) {
        const { path, type, value } = validate;
        if (type === 'equal') {
            if (_.get(data, path) !== value) {
                throw new Error(`Failed to validate api: ${path} is not ${value}`);
            }
        }
        if (type === 'notEqual') {
            if (_.get(data, path) === value) {
                throw new Error(`Failed to validate api: ${path} is ${value}`);
            }
        }
    }

    for (let check of checkPath) {
        const { path, type, value } = check;
        if (type === 'equal') {
            if (_.get(data, path) === value) {
                return {
                    name,
                    id,
                    change: true,
                    value
                };
            }
        }
        if (type === 'notEqual') {
            if (_.get(data, path) !== value) {
                return {
                    name,
                    id,
                    change: true,
                    value
                };
            }
        }
    }
    return null;
}

module.exports = checkApi;
