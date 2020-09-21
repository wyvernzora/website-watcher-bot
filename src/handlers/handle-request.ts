import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import * as Commands from '../commands';
import { Metrics } from '../metrics';


export const handleRequest: APIGatewayProxyHandlerV2<void> = async (event) => {
    return Metrics.scoped(metrics => instrumentedHandleRequest(event, metrics));
};

const instrumentedHandleRequest = async (event: APIGatewayProxyEventV2, metrics: Metrics) => {
    const { message, callback_query } = JSON.parse(event.body || '{}');
    console.log(event.body);

    const command = message?.text || callback_query?.data;

    switch(command) {
        case '/start':
            await Commands.start(message, metrics);
            break;
    }

    return { statusCode: 200 };
};
