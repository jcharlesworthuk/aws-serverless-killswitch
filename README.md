# Killswitch Function for Serverless Applications on AWS

Deploys a function to AWS Lambda that will disable many of your serverless resources from running.  Link this to a Billing alarm to implement a billing killswitch that turns off your serverless application if your AWS spend goes above a predefined limit.

## Services Affected

The killswitch will disable the following AWS services:

| Service | Disable Method |
| ------- | -------------- |
| CloudFront | Sets all distributions to Disabled |
| API Gateway | Imposes a rate limit of 0, APIs will all return _429 Too Many Requests_ |
| SNS | Deletes AWS Lambda subscriptions from SNS topics |
| EventBridge | Disables all EventBridge rules |
| SES | Disables all SES Inbound rules (since processing inbound emails _might_ be costing you $$$) |
| Lambda | Deletes event source mapping for all AWS Lambda functions (eg DynamoDB streams, S3 events, we try to disable anything that could be triggering Lambda executions) |

## Saved State

Some of the services above might already be disabled in your AWS account, and some of these are destructive deletes.  Therefore in order to restore your AWS services to the enabled state we need to save the previous state of certain things.  These get dumped into a JSON file called `killswitch-state.json` and saved to the S3 bucket you set up in the `STATE_BUCKET` environment variable (below).

When you re-enable the services it will delete this file.  The presence of this file means your services have been disabled.

## Setup

In order to deploy and/or run locally, you will need to create a `.env` file in this directory.

```sh
STATE_BUCKET=<<S3 Bucket Name>>
REGION_LIST=<<Regions>>
```

| Variable | Description |
| ------- | -------------- |
| STATE_BUCKET | The name of an S3 bucket in the same AWS region you are deploying the killswitch to.  The bucket is used to store the deployment `.zip` file, and also to save the state of your services while they are disabled. |
| REGION_LIST | Comma separated list of AWS regions you want to disable services in, eg _eu-west-1,eu-west-2,us-east-1_ |

> NOTE: you may also want to add **AWS_PROFILE** to your `.env` file if you are using AWS CLI profiles.

## Debugging Locally

You should just be able to  `npm install` and then hit F5 in Visual Sudio Code to debug this locally using the NodeJS debugger in VSCode.  The entry point for this is `debug.ts`.

## Re-Enabling

To re-enable your services after the killswitch has been tripped, run the Lambda again with this input:

```json
{
    "Records": [
        {
            "Sns": {
                "Message": "ENABLE"
            }
        }
    ]
}
```

## Deploying to AWS

1. Create your `.env` file as specified above
2. Do an `npm install`
3. Ensure you have the AWS CLI installed
4. `sls deploy --stage prod`

## Linking to an AWS Budget Alert

Follow this guide to set up the AWS Budget Alert: [Configuring AWS Budgets actions
](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html)

The SNS topic will be created in the region you deploy to when you do `sls deploy` (previous step), it will be called **billing-killswitch-triggers**.  You will need to give your Budget alert permission to publish to this topic by appending the policy statement to the Access Policy of the SNS topic.  The policy statement will look like this:

```json
{
  "Sid": "AWSBudgets-notification-1",
  "Effect": "Allow",
  "Principal": {
    "Service": "budgets.amazonaws.com"
  },
  "Action": "SNS:Publish",
  "Resource": "<insert-ARN-here>"
}
```

## Making a Dry Run

There are `if()` statements throughout that respect a flag called `DRY_RUN`.  You can change this to true in the `serverless.yml` file if you like.  It is also created as an environment variable on the Lambda that gets deployed so you can change it when the function has been deployed.  Setting `DRY_RUN` to true will create the logs as if it were triggering the killswitch but not actually make any updates to your services.