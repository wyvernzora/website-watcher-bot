import { TelegramTypes } from 'messaging-api-telegram';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import * as Commands from '../commands';
import { Metrics } from '../metrics';

interface CallbackData {
    action: 'select-sources' | 'list-sources',
    target?: string,
}

export const handleRequest: APIGatewayProxyHandlerV2<void> = async (event) => {
    return Metrics.scoped(metrics => instrumentedHandleRequest(event, metrics));
};

const instrumentedHandleRequest = async (event: APIGatewayProxyEventV2, metrics: Metrics) => {
    const { message, callback_query } = JSON.parse(event.body || '{}');
    console.log(event.body);

    if (!!message) {
        return await handleIncomingMessage(message, metrics);
    }
    if (!!callback_query) {
        return await handleCallbackQuery(callback_query, metrics);
    }

    return { statusCode: 200 };
};

async function handleIncomingMessage(message: TelegramTypes.Message, metrics: Metrics) {
    switch(message.text) {
        case '/start':
            await Commands.start(message, metrics);
            break;
    }
    return { statusCode: 200 };
}

async function handleCallbackQuery(query: TelegramTypes.CallbackQuery, metrics: Metrics) {
    const data = JSON.parse(query.data!) as CallbackData;
    switch(data.action) {
        case 'select-sources':
            await Commands.selectSources(query, metrics);
            break;
    }
    return { statusCode: 200 };
}
