import {Appender, ILogEvent, LogAppender} from "@log4js2/core";
import {ISNSAppenderConfig} from "./appender.config";
import * as AWS from 'aws-sdk';

@Appender('SNS')
export default class SNSAppender extends LogAppender<ISNSAppenderConfig> {

    private _runningQueue: ILogEvent[];
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

        // keep last five logs
        this._runningQueue = [
            logEvent,
            ...this._runningQueue
        ].slice(0, 5);

        if (logEvent.level <= this.getLogLevel()) {
            await this._appendToSNSTopic(logEvent, [...this._runningQueue]);
            this._runningQueue = [];
        }

    }

    private async _appendToSNSTopic(current: ILogEvent, runningQueue: ILogEvent[]) {

        new AWS.SNS({
            apiVersion: '2010-03-31'
        }).publish({
            Message: JSON.stringify({
                log: runningQueue.reverse().map((evt) => this.format(evt)).join('\n'),
                raw: JSON.stringify(current)
            }),
            TopicArn: this._topicArn
        }).promise().catch((err) => {
            console.error(`Could not publish to SNS topic: ${this._topicArn}`, err);
        })

    }

}
