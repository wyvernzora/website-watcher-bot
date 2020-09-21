import { TelegramTypes } from 'messaging-api-telegram';
import { Metrics } from '../metrics';
import { Chat } from '../telegram';

export async function start(message: TelegramTypes.Message, metrics: Metrics): Promise<void> {
    metrics.logCommandInvocation('start');
    const chat = await Chat.get(message.chat.id);

    const MenuMarkup = {
        inlineKeyboard: [
            [{
                text: '🖥 Select notification source',
                callbackData: JSON.stringify({
                    action: 'select-sources'
                })
            }],
            [{
                text: '🗒 Check current selection',
                callbackData: JSON.stringify({
                    action: 'list-sources'
                })
            }],
        ]
    };

    await chat.send('Welcome to website watcher bot, if you are using this for scalping, FUCK YOU 🖕');
    await chat.send('Just wait for the in stock information here, I am checking the store every 60 seconds.');
    await chat.send('As a new user, please select the notification you want to receive', { replyMarkup: MenuMarkup });
}
