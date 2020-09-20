import { App, Duration, Stack } from '@aws-cdk/core';
import { LambdaRestApi, RestApi } from '@aws-cdk/aws-apigateway';
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';

export interface Props {
    telegramToken: string
}

export class WatcherBotStack extends Stack {

    handlerLambda: Function;
    handlerApi: RestApi;
    watcherLambda: Function;
    watcherSchedule: Rule;


    constructor(app: App, id: string, props: Props) {
        super(app, id);

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
        });
    
        this.watcherSchedule = new Rule(this, 'WatchLambdaSchedule', {
            enabled: false,
            schedule: Schedule.expression('rate(1 minute)'),
            targets: [ new LambdaFunction(this.watcherLambda) ]
        });
    }

}
