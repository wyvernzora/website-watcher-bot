import assert from 'assert';
import { metricScope, MetricsLogger, Unit } from 'aws-embedded-metrics';

const MetricsNamespace = 'WebsiteWatcherBot';

export class Metrics {

    static scoped<T>(handler: (m: Metrics) => Promise<T>): Promise<T | undefined> {
        return metricScope(logger => () => handler(new Metrics(logger)))();
    }

    constructor(private logger: MetricsLogger) {
        assert(!!logger, 'Metrics: logger is null or undefined');
        logger.setNamespace(MetricsNamespace);
    }

    logCommandInvocation(command: string) {
        console.log({ command });
        this.logger.putMetric(`invocation.${command}`, 1, Unit.Count);
    }


}
export default Metrics;
