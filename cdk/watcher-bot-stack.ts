import { App, Duration, Stack } from '@aws-cdk/core';
import { LambdaRestApi, RestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Code, Function, Runtime, Tracing } from '@aws-cdk/aws-lambda';

export interface Props {
    telegramToken: string
}

export class WatcherBotStack extends Stack {

    handlerLambda: Function;
    handlerApi: RestApi;
    watcherLambda: Function;
    watcherSchedule: Rule;
    chatsTable: Table


    constructor(app: App, id: string, props: Props) {
        super(app, id);

        this.createChatsTable();
        this.createRequestHandler(props);
        this.createWatcherLambda();
    }

    private createRequestHandler({ telegramToken }: Props) {
        this.handlerLambda = new Function(this, 'HandlerLambda', {
            code: Code.fromAsset('./dist'),
            handler: 'dist/handler.handleRequest',
            timeout: Duration.seconds(30),
            runtime: Runtime.NODEJS_12_X,
            environment: {
                TELEGRAM_TOKEN: telegramToken,
                CHATS_TABLE: this.chatsTable.tableName,
            },
            tracing: Tracing.ACTIVE,
        });
        this.chatsTable.grantReadWriteData(this.handlerLambda);

        this.handlerApi = new LambdaRestApi(this, 'HandlerApi', {
            handler: this.handlerLambda
        });
    }

    private createWatcherLambda() {
        this.watcherLambda = new Function(this, 'WatcherLambda', {
            code: Code.fromAsset('./dist'),
            handler: 'dist/handler.watchWebsiteChange',
            timeout: Duration.seconds(30),
            runtime: Runtime.NODEJS_12_X,
            environment: {
                CHATS_TABLE: this.chatsTable.tableName,
            },
            tracing: Tracing.ACTIVE,
        });
        this.chatsTable.grantReadData(this.watcherLambda);
    
        this.watcherSchedule = new Rule(this, 'WatchLambdaSchedule', {
            enabled: false,
            schedule: Schedule.expression('rate(1 minute)'),
            targets: [ new LambdaFunction(this.watcherLambda) ]
        });
    }

    private createChatsTable() {
        this.chatsTable = new Table(this, 'ChatsTable', {
            partitionKey: {
                type: AttributeType.NUMBER,
                name: 'chatId',
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }

}
