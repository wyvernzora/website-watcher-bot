import { App, Duration, Stack } from '@aws-cdk/core';
import { LambdaRestApi, RestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda';

export interface Props {
    telegramToken: string
}

export class WatcherBotStack extends Stack {

    handlerLambda: Function;
    handlerApi: RestApi;
    watcherLambda: Function;
    watcherSchedule: Rule;
    usersTable: Table


    constructor(app: App, id: string, props: Props) {
        super(app, id);

        this.createUsersTable();
        this.createRequestHandler(props);
        this.createWatcherLambda();
    }

    private createRequestHandler({ telegramToken }: Props) {
        this.handlerLambda = new Function(this, 'HandlerLambda', {
            code: Code.fromAsset('./dist'),
            handler: 'dist/handler.handleRequest',
            timeout: Duration.seconds(3),
            runtime: Runtime.NODEJS_12_X,
            environment: {
                TELEGRAM_TOKEN: telegramToken,
                USERS_TABLE: this.usersTable.tableName,
            },
        });

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
                USERS_TABLE: this.usersTable.tableName,
            }
        });
    
        this.watcherSchedule = new Rule(this, 'WatchLambdaSchedule', {
            enabled: false,
            schedule: Schedule.expression('rate(1 minute)'),
            targets: [ new LambdaFunction(this.watcherLambda) ]
        });
    }

    private createUsersTable() {
        this.usersTable = new Table(this, 'UsersTable', {
            partitionKey: {
                type: AttributeType.STRING,
                name: 'userId',
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }

}
