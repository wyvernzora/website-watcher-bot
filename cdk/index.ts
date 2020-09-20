import assert from 'assert';
import { App } from '@aws-cdk/core';
import { WatcherBotStack } from './watcher-bot-stack';

const { TELEGRAM_TOKEN } = process.env;
assert(!!TELEGRAM_TOKEN, 'TELEGRAM_TOKEN environment variable is required');

const app = new App();
new WatcherBotStack(app, 'WebsiteWatcherBotStack', {
    telegramToken: TELEGRAM_TOKEN!,
});
app.synth();
