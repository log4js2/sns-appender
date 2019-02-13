export type Protocol = 'application' | 'email' | 'email-json' | 'http' | 'https' | 'lambda' | 'sms' | 'sqs';

export interface ISNSAppenderConfig {
    application?: string;
    protocol?: Protocol | Protocol[];
    region: string;
    topicArn: string;
}
