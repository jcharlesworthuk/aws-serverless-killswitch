import { ListSubscriptionsCommand, SNSClient, SubscribeCommand, UnsubscribeCommand } from "@aws-sdk/client-sns";
import { EnableDisableOptions, EnabledStateForRegion } from "../models";

export async function disableAllSnsSubscriptions({ state, dryRun }: EnableDisableOptions) {
    const sns = new SNSClient({ region: state.region });

    const subscriptions = await sns.send(new ListSubscriptionsCommand({}));
    state.subscriptions = [];
    for (let subscription of (subscriptions.Subscriptions || [])) {
        switch (subscription.Protocol) {
            case "lambda": {
                console.log(`Deleting SNS subscription: ${subscription.SubscriptionArn}`);
                state.subscriptions.push(subscription);
                if (!dryRun) {
                    await sns.send(new UnsubscribeCommand({
                        SubscriptionArn: subscription.SubscriptionArn!
                    }));
                }
                break;
            }
            default: {
                console.log(`Skipping SNS subscription: ${subscription.SubscriptionArn}`);
            }
        }
    }
}

export async function reEnableAllSnsSubscriptions({ state, dryRun }: EnableDisableOptions) {
    const sns = new SNSClient({ region: state.region });

    for(let subscription of state.subscriptions) {
        switch (subscription.Protocol) {
            case "lambda": {
                console.log(`Re-Enabling SNS subscription: ${subscription.SubscriptionArn}`);
                if (!dryRun) {
                    await sns.send(new SubscribeCommand({
                        Protocol: subscription.Protocol,
                        TopicArn: subscription.TopicArn,
                        Endpoint: subscription.Endpoint
                    }));
                }
                break;
            }
            default: {
                throw new Error(`Cannot re-enable subcription of type ${subscription.Protocol}`);
            }
        }
    }
    state.subscriptions = [];
}
