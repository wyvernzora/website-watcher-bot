const low = require('lowdb');
const config = require('config');
const { Telegraf } = require('telegraf');
const interval = require('interval-promise');
const Bottleneck = require('bottleneck');
const FileAsync = require('lowdb/adapters/FileAsync');
const { MenuTemplate, MenuMiddleware } = require('telegraf-inline-menu');

const ruleLoader = require('./ruleloader');
const checkRule = require('./checkRule');
const logger = require('./logger');
const start = require('./start');

const adapter = new FileAsync(config.get('db'));

// Create the telegraf bot instance
const bot = new Telegraf(config.get('telegram.token'));

// Rate limiter for refreshing websites
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000
});

let notificationSourceMenu = new MenuTemplate('Please select a notification source to receive from.');
let notificationSourceMiddleware = new MenuMiddleware('/', notificationSourceMenu);

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

    bot.use(notificationSourceMiddleware);
    bot.launch();

    notificationSourceMenu.select('select', rules.map((r) => r.name), {
        set: async (ctx, key) => {
            await ctx.answerCbQuery(`you selected ${key}`)
            return true
        },
        isSet: (_, key) => false
    });


    interval(async () => {
        // Schedule all the refresh
        const enabledRules = db.get('enabledRules').value();
        for (let ruleId of enabledRules) {
            const rule = rules.find((rule) => rule.id === ruleId);
            limiter.schedule(() => checkRule(rule));
        }
    }, parseInt(config.get('refreshPeriod')) * 1000)

}

startBot();
