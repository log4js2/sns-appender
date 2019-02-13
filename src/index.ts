import { Appender, ILogEvent, LogAppender } from '@log4js2/core';
import { ISNSAppenderConfig, Protocol } from './appender.config';

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
            this._appendToSNSTopic(logEvent, this._runningQueue.slice().reverse());
            this._runningQueue = [];
        }

    }

    private async _appendToSNSTopic(current: ILogEvent, runningQueue: ILogEvent[]) {

        const {topicArn: TopicArn} = this._config;

        new AWS.SNS({
            apiVersion: '2010-03-31'
        }).publish({
            MessageStructure: 'json',
            Message: JSON.stringify(this._getMessage(current, runningQueue)),
            TopicArn
        }).promise().catch((err: any) => {
            console.error(`Could not publish to SNS topic: ${TopicArn}`, err);
        });

    }

    private _getMessage(current: ILogEvent, runningQueue: ILogEvent[]): { [key in Protocol | 'default']?: string } {

        if (this._config.protocol instanceof Array) {

            return this._config.protocol.reduce((group, protocol) => ({
                ...group,
                [protocol]: this._formatProtocol(current, runningQueue, protocol)
            }), {
                default: this._formatProtocol(current, runningQueue)
            });

        } else {
            return {
                default: this._formatProtocol(current, runningQueue),
                [this._config.protocol]: this._formatProtocol(current, runningQueue, this._config.protocol)
            };
        }

    }

    private _formatProtocol(current: ILogEvent, runningQueue: ILogEvent[], protocol?: Protocol) {
        switch (protocol) {

            case 'email':
            case 'sms': {
                return `${this._config.application} log event\n\n${runningQueue.map((log) => this.format(log)).join('\n')}`;
            }

            case 'application':
            case 'email-json':
            case 'http':
            case 'https':
            case 'lambda':
            case 'sqs':
            default: {
                return JSON.stringify({
                    ...this._baseOutput,
                    log: runningQueue.map((log) => this.format(log)).join('\n'),
                    raw: JSON.stringify(current)
                } as ISNSRecord);
            }

        }
    }
}
