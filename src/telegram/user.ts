import { DynamoDB } from 'aws-sdk';
import { AttributeMap, ScanInput } from 'aws-sdk/clients/dynamodb';
import { Chat } from '.';

const UsersTableName: string = process.env.USERS_TABLE!;
const DynamoClient: DynamoDB = new DynamoDB();

export type Source = string;

export class User {

    constructor(
        readonly id: User.ID, 
        readonly chats: Chat[], 
        readonly sources: Set<Source>) {
    }

    async addChat(chatId: Chat.ID): Promise<Chat> {
        await DynamoClient.updateItem({
            TableName: UsersTableName,
            Key: {
                userId: { N: String(this.id) }
            },
            AttributeUpdates: {
                chatIds: {
                    Action: 'ADD',
                    Value: { N: String(chatId) },
                }
            },
        }).promise();
        return new Chat(chatId);
    }

    async updateSources(sources: Set<Source>): Promise<void> {
        await DynamoClient.updateItem({
            TableName: UsersTableName,
            Key: {
                userId: { N: String(this.id) }
            },
            AttributeUpdates: {
                sources: {
                    Action: 'SET',
                    Value: { SS: [...sources] },
                }
            },
        }).promise();
    }

}

export namespace User {

    export type ID = number;

    export function fromDynamoAttributes(attributes: AttributeMap): User {
        const id: User.ID = Number(attributes.userId.N);
        const chats = Chat.fromDynamoAttributes(attributes);
        const sources = new Set(attributes.sources?.SS || []);
        return new User(id, chats, sources);
    }

    export async function register(userId: User.ID): Promise<User> {
        const { Attributes } = await DynamoClient.updateItem({
            TableName: UsersTableName,
            Key: {
                userId: { N: String(userId) },
            },
            ReturnValues: 'ALL_NEW'
        }).promise();
        
        return User.fromDynamoAttributes(Attributes!);
    }

    export async function *getUsersSubscribedToSource(source: Source): AsyncIterableIterator<User> {
        const request: ScanInput = {
            TableName: UsersTableName,
            FilterExpression: 'contains(sources, :source)',
            ExpressionAttributeValues: {
                ':source': { S: source },
            },
        };
        do {
            const response = await DynamoClient.scan(request).promise();
            request.ExclusiveStartKey = response.LastEvaluatedKey;

            for (let item of (response.Items || [])) {
                yield User.fromDynamoAttributes(item);
            }
        } while (!!request.ExclusiveStartKey);
    }

}
