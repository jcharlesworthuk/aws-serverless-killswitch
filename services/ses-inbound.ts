import { ListSubscriptionsCommand, SNSClient, SubscribeCommand, UnsubscribeCommand } from "@aws-sdk/client-sns";
import { EnableDisableOptions, EnabledStateForRegion } from "../models";
import { DisableRuleCommand, EnableRuleCommand, EventBridgeClient, ListRulesCommand, Rule } from "@aws-sdk/client-eventbridge";
import { GetBucketLocationCommand, GetBucketNotificationConfigurationCommand, ListBucketsCommand, PutBucketNotificationConfigurationCommand, S3Client } from "@aws-sdk/client-s3";
import { DescribeActiveReceiptRuleSetCommand, DescribeActiveReceiptRuleSetCommandOutput, ListReceiptRuleSetsCommand, ListReceiptRuleSetsCommandOutput, ReceiptRule, SESClient, UpdateReceiptRuleCommand } from "@aws-sdk/client-ses";
import { ListConfigurationSetsCommand } from "@aws-sdk/client-ses";

export async function disableSesInboundRulesets({ state, dryRun }: EnableDisableOptions) {
    const ses = new SESClient({ region: state.region });

    let ruleSet: DescribeActiveReceiptRuleSetCommandOutput;
    state.enabledSesRules = [];
    try {
        ruleSet = await ses.send(new DescribeActiveReceiptRuleSetCommand({}));
    } catch (e) {
        console.log(`Failed to get receipt rulesets in ${state.region}`);
        return;
    }
    state.enabledSesRules = [...(ruleSet.Rules || []).filter(x => x.Enabled === true)];
    for (let rule of state.enabledSesRules) {
        console.log(`Disabling Inbound SES rule ${rule.Name}`);
        const disabledVersion: ReceiptRule = {
            ...rule,
            Enabled: false
        };
        if (!dryRun) {
            await ses.send(new UpdateReceiptRuleCommand({
                Rule: disabledVersion,
                RuleSetName: ruleSet.Metadata?.Name
            }));
        }
    }
}

export async function reEnableSesInboundRulesets({ state, dryRun }: EnableDisableOptions) {
    const ses = new SESClient({ region: state.region });

    if (state.enabledSesRules.length === 0) return;
    const ruleSet = await ses.send(new DescribeActiveReceiptRuleSetCommand({}));

    for (let rule of state.enabledSesRules) {
        console.log(`Enabling Inbound SES rule ${rule.Name}`);
        if (!dryRun) {
            await ses.send(new UpdateReceiptRuleCommand({
                Rule: rule,
                RuleSetName: ruleSet.Metadata?.Name
            }));
        }
    }
}
