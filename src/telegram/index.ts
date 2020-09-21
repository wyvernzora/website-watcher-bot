import { TelegramClient } from 'messaging-api-telegram';

const client = new TelegramClient({
    accessToken: process.env.TELEGRAM_TOKEN!,
});
export { client as TelegramClient };

export * from './chat';
export * from './user';
