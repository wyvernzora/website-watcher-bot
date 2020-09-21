import { TelegramTypes } from 'messaging-api-telegram';
import { Metrics } from '../metrics';
import { Chat } from '../telegram';

const MenuMarkup = {
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
};


export async function start(message: TelegramTypes.Message, metrics: Metrics): Promise<void> {
    metrics.logCommandInvocation('start');
    const chat = await Chat.get(message.chat.id);

    await chat.send('Welcome to website watcher bot, if you are using this for scalping, FUCK YOU 🖕');
    await chat.send('Just wait for the in stock information here, I am checking the store every 60 seconds.');
    await chat.send('As a new user, please select the notification you want to receive', { replyMarkup: MenuMarkup });
}
