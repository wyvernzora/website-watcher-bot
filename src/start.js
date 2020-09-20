const Markup = require('telegraf/markup');
const config = require('config');

const start = (db) => async (ctx) => {
    const currentUser = ctx.from.id;
    const userRecord = await db.get('users')
        .find({ id: currentUser })
        .value();
    if (!userRecord) {
        await db.get('users')
            .push({ id: currentUser, notifyFor: [] })
            .write();
        ctx.reply('Welcome to website watcher bot, if you are using this for scalping, FUCK YOU 🖕');
        ctx.reply(`Just wait for the in stock information here, I am checking the store every ${config.get('refreshPeriod')} seconds.`);
        ctx.reply('As a new user, please select the notification you want to receive', Markup
            .keyboard([
                ['🖥 Select notification source'],
                ['🗒 Check current selection']
            ])
            .oneTime()
            .resize()
            .extra());
    } else {
        ctx.reply('You are an active user already.');
    }
};

module.exports = start;
