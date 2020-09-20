const { MenuTemplate } = require('telegraf-inline-menu');

let selectSourceMenu = new MenuTemplate('Please select a notification source to receive from.');

function setupSelectSourceMenu(db, rules) {
    selectSourceMenu.select('select', () => {
        const map = {};
        Object.keys(rules).forEach(r => map[r] = rules[r].name);
        return map;
    }, {
        columns: 1,
        set: async (ctx, key) => {
            const currentUser = ctx.from.id;
            const user = await db.get('users').find({ id: currentUser }).value();
            const rule = rules[key];
            if (rule) {
                if (user) {
                    let isAdding = false;
                    if (user.notifyFor && !user.notifyFor.includes(key)) {
                        isAdding = true;
                        const newNotifyFor = user.notifyFor.concat(key);
                        await db.get('users').find({ id: currentUser }).assign({ notifyFor: newNotifyFor }).write();
                        await ctx.answerCbQuery(`You will now receive notification for ${rule.name} ✅`);
                    } else {
                        const newNotifyFor = user.notifyFor.filter((k) => k !== key);
                        await db.get('users').find({ id: currentUser }).assign({ notifyFor: newNotifyFor }).write();
                        await ctx.answerCbQuery(`You will not receive notification for ${rule.name} ❌`);
                    }

                    // Update enabled rules list
                    const enabledKey = db.get('enabledRules').find({ id: key }).value();
                    if (!enabledKey && isAdding) {
                        // Add the key with 1 if not exist
                        await db.get('enabledRules').push({
                            id: key,
                            count: 1
                        }).write();
                    } else {
                        // I am adding 1 to existing key
                        if (isAdding) {
                            await db.get('enabledRules').find({ id: key }).assign({ count: enabledKey.count + 1 }).write();
                        } else {
                            if (enabledKey.count > 1) {
                                await db.get('enabledRules').find({ id: key }).assign({ count: enabledKey.count - 1 }).write();
                            } else {
                                await db.get('enabledRules').remove({ id: key }).write();
                            }
                        }
                    }
                }
            } else {
                await ctx.answerCbQuery(`Rule ${key}, is not found.`);
            }
            return true;
        },
        isSet: async (ctx, key) => {
            const currentUser = ctx.from.id;
            const user = await db.get('users').find({ id: currentUser }).value();
            if (user) {
                if (user.notifyFor && user.notifyFor.includes(key)) {
                    return true;
                }
            }
            return false;
        }
    });

}

module.exports = {
    selectSourceMenu,
    setupSelectSourceMenu
};
