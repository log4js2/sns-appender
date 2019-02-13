import {Appender, ILogEvent, LogAppender} from "@log4js2/core";
import {ISNSAppenderConfig} from "./appender.config";

const AWS = require('aws-sdk');

interface ISNSRecord {
    application?: string;
    log: string;
    raw: string;
}

@Appender('SNS')
export default class SNSAppender extends LogAppender<ISNSAppenderConfig> {

    private readonly _baseOutput: Pick<ISNSRecord, 'application'>;

    private _runningQueue: ILogEvent[];

    constructor(private _config: ISNSAppenderConfig) {

        super(_config);

        AWS.config.update({region: _config.region});

        this._baseOutput = {};
        if (_config.application) {
            this._baseOutput.application = _config.application;
        }

        this._runningQueue = [];

    }

    /**
     * Appends the log event
     * @param {ILogEvent} logEvent
     */
    public append(logEvent: ILogEvent) {

        // keep last five logs
        this._runningQueue = [
            {...logEvent},
            ...this._runningQueue
        ].slice(0, 5);

        if (logEvent.level <= this.getLogLevel()) {
            this._appendToSNSTopic(logEvent, this._runningQueue.slice());
            this._runningQueue = [];
        }

    }

    private async _appendToSNSTopic(current: ILogEvent, runningQueue: ILogEvent[]) {

        const output: ISNSRecord = {
            ...this._baseOutput,
            log: runningQueue.reverse().map((log) => this.format(log)).join('\n'),
            raw: JSON.stringify(current)
        };

        const {topicArn: TopicArn} = this._config;

        new AWS.SNS({
            apiVersion: '2010-03-31'
        }).publish({
            Message: JSON.stringify(output),
            TopicArn
        }).promise().catch((err: any) => {
            console.error(`Could not publish to SNS topic: ${TopicArn}`, err);
        })

    }

}
