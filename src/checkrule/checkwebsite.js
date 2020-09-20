const puppeteer = require('puppeteer');

const logger = require("../logger");

async function checkWebsiteRule(rule) {
    let checkResult = null;
    const { name, id, url, waitFor, checkFor } = rule;
    logger.info(`Checking rule ${name}`);

    // Create a new page
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });

    // Browse to the site
    await page.goto(url);

    // Wait for the selectors
    for (let waitCondition of waitFor) {
        const { type, condition, selector, value } = waitCondition;
        logger.info(`Checking for wait condition: ${type}`);
        if (type === 'selector') {
            if (condition === 'exists') {
                await page.waitForSelector(selector);
            }
            if (condition === 'value') {
                await page.waitForSelector(selector);
                const expectedValue = await (await page.$(selector)).evaluate((node) => node.innerText);
                if (expectedValue !== value) {
                    throw new Error(`Wait selector failed for ${name}, selector: ${selector}, expected ${value}`);
                }
            }
        }
    }

    // Check for the selectors
    for (let checkCondition of checkFor) {
        const { type, selector, condition, value } = checkCondition;
        logger.info(`Checking for check condition: ${type}`);
        if (type === 'selector') {
            await page.waitForSelector(selector);
            const expectedValue = await (await page.$(selector)).evaluate((node) => node.innerText);
            if (condition === 'notEqual') {
                if (expectedValue !== value) {
                    checkResult = {
                        name,
                        id,
                        change: true,
                        value: expectedValue,
                        screenshot: `${id}.png`
                    };
                }
            }
            if (condition === 'equal') {
                if (expectedValue === value) {
                    checkResult = {
                        name,
                        id,
                        change: true,
                        value: expectedValue,
                        screenshot: `${id}.png`
                    };
                }
            }
        }
    }

    // Take screenshot
    await page.screenshot({ path: `${id}.png` });

    // Close the browser
    await browser.close();

    return checkResult;
}

module.exports = checkWebsiteRule;
