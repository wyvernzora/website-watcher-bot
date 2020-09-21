import { TelegramTypes } from 'messaging-api-telegram';
import { Metrics } from '../metrics';
import { User } from '../telegram';


export async function start(message: TelegramTypes.Message, metrics: Metrics): Promise<void> {
    const chatId = message.chat.id;
    const userId = message.from?.id;
    metrics.logCommandInvocation('start');

    if (!userId) {
        console.log('No UserId available for the invocation');
        return;
    }

    const user = await User.register(userId);
    const chat = await user.addChat(chatId);

    await chat.send('Welcome to website watcher bot, if you are using this for scalping, FUCK YOU 🖕');
    await chat.send(`Just wait for the in stock information here, I am checking the store every 60 seconds.`);
    await chat.send('As a new user, please select the notification you want to receive', {
        replyMarkup: {
            inlineKeyboard: [
                [{ 
                    text: '🖥 Select notification source',
                    callbackData: 'select-source'
                }],
                [{ 
                    text: '🗒 Check current selection',
                    callbackData: 'check-source-selection'
                }],
            ]
        }
    });

}
