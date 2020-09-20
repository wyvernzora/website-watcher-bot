const fs = require('fs');
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

    bot.command('status', async ctx => {
        const limiterStat = limiter.counts();
        const enabledRules = db.get('enabledRules').value();
        if (enabledRules.length) {
            ctx.reply(`Refreshing for ${enabledRules.join(', ')}`);
        } else {
            ctx.reply('Not refreshing for any rule.');
        }
        ctx.reply(`Uptime: ${process.uptime()}`);
        ctx.reply(`Queued: ${limiterStat.QUEUED || 0}\nRunning: ${limiterStat.RUNNING || 0}\nDone: ${limiterStat.DONE || 0}`);
    });

    bot.hears('🖥 Select notification source', (ctx) => {
        notificationSourceMiddleware.replyToContext(ctx);
    });

    bot.hears('🗒 Check current selection', async (ctx) => {
        const currentUser = ctx.from.id;
        const userRecord = await db.get('users')
            .find({ id: currentUser })
            .value();
        if (userRecord) {
            const { notifyFor } = userRecord;
            if (notifyFor.length) {
                const enabledNotify = notifyFor.map((id) => rules[id].name).join(', ');
                ctx.reply(`You currently have ${enabledNotify} enabled.`);
            } else {
                ctx.reply('You do not have active notification selected');
            }
        } else {
            ctx.reply('You are not a active user, please use /start to activate.');
        }
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
                        const result = await limiter.schedule(() => checkRule(rule));
                        if (result && result.change) {
                            const users = await db.get('users').value();
                            for (let user of users) {
                                const { notifyFor } = user;
                                // If user has that notification set
                                if (notifyFor.includes(enabledRule.id)) {
                                    bot.telegram.sendMessage(user.id, `${rule.name} has changed to ${result.value}.`);
                                    if (result.screenshot) {
                                        bot.telegram.sendPhoto(user.id, { source: fs.createReadStream(result.screenshot) });
                                    }
                                }
                            }
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
