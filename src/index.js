const low = require('lowdb');
const config = require('config');
const { Telegraf } = require('telegraf');
const interval = require('interval-promise');
const Bottleneck = require('bottleneck');
const FileAsync = require('lowdb/adapters/FileAsync');
const { MenuMiddleware } = require('telegraf-inline-menu');

const ruleLoader = require('./ruleloader');
const checkRule = require('./checkrule');
const logger = require('./logger');
const start = require('./start');

const { selectSourceMenu, setupSelectSourceMenu } = require('./menu/selectSourceMenu');

const adapter = new FileAsync(config.get('db'));

// Create the telegraf bot instance
const bot = new Telegraf(config.get('telegram.token'));

// Rate limiter for refreshing websites
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 3000
});

async function startBot() {
    // Init the db
    const db = await low(adapter);
    await db.defaults({ users: [], enabledRules: [] })
        .write();
    // Load all the check rules
    const rules = await ruleLoader();

    bot.command('start', start(db));

    bot.hears('🖥 Select notification source', (ctx) => {
        notificationSourceMiddleware.replyToContext(ctx);
    });

    setupSelectSourceMenu(db, rules);

    let notificationSourceMiddleware = new MenuMiddleware('/', selectSourceMenu);

    bot.use(notificationSourceMiddleware.middleware());
    bot.launch();

    interval(async () => {
        // Schedule all the refresh
        const enabledRules = db.get('enabledRules').value();
        for (let enabledRule of enabledRules) {
            if (enabledRule.count > 0) {
                const rule = rules[enabledRule.id];
                if (rule) {
                    try {
                        const result = limiter.schedule(() => checkRule(rule));
                        if (result && result.change) {
                            // Notify all the users
                        }
                    } catch (error) {
                        logger.error(`Failed checking rule ${rule.name}`, error);
                    }
                }
            }
        }
    }, parseInt(config.get('refreshPeriod')) * 1000);

}

startBot();
