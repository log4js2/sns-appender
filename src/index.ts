import {Appender, ILogEvent, LogAppender} from "@log4js2/core";
import {ISNSAppenderConfig} from "./appender.config";
import * as AWS from 'aws-sdk';

@Appender('SNS')
export default class SNSAppender extends LogAppender<ISNSAppenderConfig> {

    private readonly _topicArn: string;

    constructor(config: ISNSAppenderConfig) {

        super(config);

        AWS.config.update({region: config.region});

        this._topicArn = config.topicArn;

    }

    /**
     * Appends the log event
     * @param {ILogEvent} logEvent
     */
    public async append(logEvent: ILogEvent) {
        if (logEvent.level <= this.getLogLevel()) {
            return this._appendToSNSTopic(logEvent);
        }
    }

    private async _appendToSNSTopic(logEvent: ILogEvent) {

        new AWS.SNS({
            apiVersion: '2010-03-31'
        }).publish({
            Message: JSON.stringify({
                log: this.format(logEvent),
                raw: logEvent
            }),
            TopicArn: this._topicArn
        }).promise().catch((err) => {
            console.error(`Could not publish to SNS topic: ${this._topicArn}`, err);
        })

    }

}
