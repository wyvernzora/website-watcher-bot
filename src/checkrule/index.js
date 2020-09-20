const checkApi = require('./checkapi');
const checkWebsiteRule = require('./checkwebsite');

async function checkRule(rule) {
    const { type } = rule;
    if (type === 'website') {
        return checkWebsiteRule(rule);
    }
    if (type === 'api') {
        return checkApi(rule);
    }
}

module.exports = checkRule;
