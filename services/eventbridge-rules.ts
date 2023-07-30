import { ListSubscriptionsCommand, SNSClient, SubscribeCommand, UnsubscribeCommand } from "@aws-sdk/client-sns";
import { EnableDisableOptions, EnabledStateForRegion } from "../models";
import { DisableRuleCommand, EnableRuleCommand, EventBridgeClient, ListRulesCommand } from "@aws-sdk/client-eventbridge";

export async function disableEventBridgeRules({ state, dryRun }: EnableDisableOptions) {
    const eventbridge = new EventBridgeClient({ region: state.region });

    const rules = await eventbridge.send(new ListRulesCommand({}));
    state.rules = [];
    for (let rule of (rules.Rules || [])) {
        console.log(`Disabling EventBridge rule: ${rule.Name}`);
        state.rules.push(rule);
        if (!dryRun) {
            await eventbridge.send(new DisableRuleCommand({
                Name: rule.Name
            }));
        }
    }
}

export async function reEnableEventBridgeRules({ state, dryRun }: EnableDisableOptions) {
    const eventbridge = new EventBridgeClient({ region: state.region });

    for (let rule of state.rules) {
        if (rule.State === 'ENABLED') {
            console.log(`Enabling EventBridge rule: ${rule.Name}`);
            if (!dryRun) {
                await eventbridge.send(new EnableRuleCommand({
                    Name: rule.Name
                }));
            }
        } else {
            console.log(`Skipping previously disabled EventBridge rule: ${rule.Name}`);
        }
    }
}

