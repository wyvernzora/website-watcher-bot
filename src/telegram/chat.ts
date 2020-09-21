import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import { TelegramTypes } from 'messaging-api-telegram';
import { TelegramClient } from '.';


export class Chat {

    constructor(readonly id: Chat.ID) { }

    async send(text: string, options?: TelegramTypes.SendMessageOption): Promise<void> {
        console.log(text);
        console.log(options);
        await TelegramClient.sendMessage(this.id, text, options);
    }

}

export namespace Chat {

    export type ID = number;

    export function fromDynamoAttributes(attributes: AttributeMap): Chat[] {
        return (attributes.chatIds?.NS || []).map(id => new Chat(Number(id)));
    }

}
