import { TelegramTypes } from 'messaging-api-telegram';
import { Metrics } from '../../metrics';
import { Chat } from '../../telegram';
import { TelegramClient } from '../../telegram';
import { CallbackQueryData } from '..';

export async function selectSources(query: TelegramTypes.CallbackQuery, metrics: Metrics): Promise<void> {
    metrics.logCommandInvocation('select-sources');

    const chat = await Chat.get(query.message!.chat.id);
    const data = JSON.parse(query.data!) as CallbackQueryData;

    // Toggle the selection
    if (!!data.target) {
        if (chat.sources.has(data.target)) {
            chat.sources.delete(data.target);
        } else {
            chat.sources.add(data.target);
        }
        await chat.save();
    }

    try {
        await TelegramClient.editMessageReplyMarkup(renderSelectionMenu(chat), {
            chatId: chat.id,
            messageId: (query.message as any).message_id,
        });
    } catch (e) {
    }
    await TelegramClient.answerCallbackQuery(query.id, { });
}

function renderSelectionMenu(chat: Chat): TelegramTypes.InlineKeyboardMarkup {

    const buttons = ['test-source-1', 'test-source-2'].map(i => [{
        text: `${chat.sources.has(i) ? '✅' : '❌'} ${i}`,
        callbackData: JSON.stringify({
            action: 'select-sources',
            target: i,
        }),
    }]);

    return {
        inlineKeyboard: buttons
    };
}
