# sns-appender
An appender for [@log4js2/core](https://github.com/log4js2) that sends log events to an SNS topic to be handled by AWS. 

[![Build Status](https://travis-ci.org/log4js2/sns-appender.svg?branch=master)](https://travis-ci.org/log4js2/sns-appender)
[![codecov](https://codecov.io/gh/log4js2/sns-appender/branch/master/graph/badge.svg)](https://codecov.io/gh/log4js2/sns-appender)
[![dependencies](https://david-dm.org/log4js2/sns-appender.svg)](https://david-dm.org/log4js2/sns-appender)

## Installation

```bash
npm install --save @log4js2/core @log4js2/sns-appender
```

## Configuration

Set up the SNS appender in the `configure` method.

```typescript
import {configure, LogLevel} from '@log4js2/core';
import SNSAppender from '@log4js2/sns-appender';

configure({
    layout : '%d [%p] %c - %m %ex',
    appenders : [{
        name: 'sns',
        appender: SNSAppender,
        level: LogLevel.FATAL,
        config: {
            application: 'MyApp', // optional
            protocol: ['email', 'sms'],
            region: 'us-east-1',
            topicArn: 'arn:aws:sns:us-east-1:123456789012:errors'
        }
    }]
});
```

_*Note: it is probably a good idea to only use SNS appending when a high level error occurs, otherwise you can 
pollute your stream with unimportant logs. Use filters and logging levels to ensure logs only are received when necessary._

## Handling the SNS

### SNS Subscriptions
The `SNSAppender` configuration object allows you to configure one or multiple protocols. See the
[SNS subscribe documentation](https://docs.aws.amazon.com/sns/latest/api/API_Subscribe.html) for which protocols can be used.

### Handling raw JSON
The SNS record contains a `log` field, which contains the last five logs, including the one that caused the SNS appender to trigger. It also contains a `raw` field with the unformatted log event (for easier parsing).

```json
{
  "application": "MyApplication",
  "log": "2019-02-12 12:55:32.000 [INFO] Doing something \n ...",
  "raw": {
    "level": 100,
    "error": "An Unexpected Error",
    "message": "An error occurred",
    ...
  }
}
```

## Contributors
Library built and maintained by [Robin Schultz](http://anigenero.com)

If you would like to contribute (aka buy me a beer), you can send funds via PayPal at the link below.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=SLT7SZ2XFNEUQ)
