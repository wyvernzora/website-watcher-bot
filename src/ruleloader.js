const yaml = require('yaml');
const path = require('path');
const fs = require('fs').promises;

const logger = require('./logger');

async function loadRules(rulesDir = 'rules') {
    const files = await (await fs.readdir(rulesDir)).filter((filename) => path.extname(filename) === '.yaml');
    const rules = [];
    for (file of files) {
        const yamlContent = await fs.readFile(path.join(rulesDir, file), { encoding: 'utf-8' });
        const parsedRule = yaml.parse(yamlContent);
        logger.info(`Loaded rule: [${parsedRule.name}]`);
        rules.push(parsedRule);
    }
    return rules;
}

module.exports = loadRules;
