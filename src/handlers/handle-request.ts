import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const handleRequest: APIGatewayProxyHandlerV2<string> = async (event) => {
    console.log(event.body);
    return {
        statusCode: 200,
        body: 'Hello, World!'
    };
};
