import { ListSubscriptionsCommand, SNSClient, SubscribeCommand, UnsubscribeCommand } from "@aws-sdk/client-sns";
import { EnableDisableOptions, EnabledStateForRegion } from "../models";
import { DisableRuleCommand, EnableRuleCommand, EventBridgeClient, ListRulesCommand } from "@aws-sdk/client-eventbridge";
import { GetBucketLocationCommand, GetBucketNotificationConfigurationCommand, ListBucketsCommand, PutBucketNotificationConfigurationCommand, S3Client } from "@aws-sdk/client-s3";

export async function disableS3BucketNotifications({ state, dryRun }: EnableDisableOptions) {
    const s3 = new S3Client({ region: state.region });

    const buckets = await s3.send(new ListBucketsCommand({}));
    for (let bucket of (buckets.Buckets || [])) {
        const location = await s3.send(new GetBucketLocationCommand({
            Bucket: bucket.Name
        }));
        if (location.LocationConstraint !== state.region) continue;

        const notificationConfig = await s3.send(new GetBucketNotificationConfigurationCommand({
            Bucket: bucket.Name
        }));
        // NOTE: we are only disabling ones the have Lambda functions attached
        if (notificationConfig.LambdaFunctionConfigurations) {
            debugger;
            state.s3Notifications[bucket.Name!] = notificationConfig;
            const newConfig = {
                ...notificationConfig,
                LambdaFunctionConfigurations: undefined
            }
            console.log(`Disabling ${notificationConfig.LambdaFunctionConfigurations.length} lambda configurations on ${bucket.Name}`);
            if (!dryRun) {
                await s3.send(new PutBucketNotificationConfigurationCommand({
                    Bucket: bucket.Name,
                    NotificationConfiguration: newConfig
                }));
            }
        }
    }
}

export async function reEnableS3BucketNotifications({ state, dryRun }: EnableDisableOptions) {
    const s3 = new S3Client({ region: state.region });

    const buckets = await s3.send(new ListBucketsCommand({}));
    for (let bucket of (buckets.Buckets || [])) {
        const location = await s3.send(new GetBucketLocationCommand({
            Bucket: bucket.Name
        }));
        if (location.LocationConstraint !== state.region) continue;
        const configToReEnable = state.s3Notifications[bucket.Name!];
        if (!(configToReEnable?.LambdaFunctionConfigurations)) continue;
        console.log(`Re-enabling ${configToReEnable.LambdaFunctionConfigurations.length} lambda configurations on ${bucket.Name}`);
        if (!dryRun) {
            await s3.send(new PutBucketNotificationConfigurationCommand({
                Bucket: bucket.Name,
                NotificationConfiguration: configToReEnable
            }));
        }
    }
}

