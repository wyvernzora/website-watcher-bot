import { DynamoDB } from 'aws-sdk';
import { AttributeMap, ScanInput } from 'aws-sdk/clients/dynamodb';
import { TelegramTypes } from 'messaging-api-telegram';
import { TelegramClient } from '.';

const ChatsTableName: string = process.env.CHATS_TABLE!;
const DynamoClient: DynamoDB = new DynamoDB();


export type Source = string;

export class Chat {

    constructor(readonly id: Chat.ID, readonly sources: Set<Source>) { }

    async send(text: string, options?: TelegramTypes.SendMessageOption): Promise<void> {
        console.log(text);
        console.log(options);
        await TelegramClient.sendMessage(this.id, text, options);
    }

}

export namespace Chat {

    export type ID = number;

    export function fromDynamoAttributes(attributes: AttributeMap): Chat {
        const chatId = Number(attributes.chatId.N);
        const sources = new Set(attributes.sources?.SS || []);
        return new Chat(chatId, sources);
    }

    export async function get(chatId: Chat.ID): Promise<Chat> {
        const { Attributes } = await DynamoClient.updateItem({
            TableName: ChatsTableName,
            Key: {
                chatId: { N: String(chatId) }
            },
            ReturnValues: 'ALL_NEW',
        }).promise();
        return Chat.fromDynamoAttributes(Attributes!);
    }

    export async function *getUsersSubscribedToSource(source: Source): AsyncIterableIterator<Chat> {
        const request: ScanInput = {
            TableName: ChatsTableName,
            FilterExpression: 'contains(sources, :source)',
            ExpressionAttributeValues: {
                ':source': { S: source },
            },
        };
        do {
            const response = await DynamoClient.scan(request).promise();
            request.ExclusiveStartKey = response.LastEvaluatedKey;

            for (let item of (response.Items || [])) {
                yield Chat.fromDynamoAttributes(item);
            }
        } while (!!request.ExclusiveStartKey);
    }

}
