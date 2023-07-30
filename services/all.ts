import { EnableDisableFunction, EnableDisableOptions } from "../models.js";
import { disableApiGatways, reEnableApiGatways } from "./api-gateway.js";
import { disableCloudfronts, reEnableCloudfronts } from "./cloudfront.js";
import { disableEventBridgeRules, reEnableEventBridgeRules } from "./eventbridge-rules.js";
import { disableAllLambdaTriggers, reEnableAllLambdaTriggers } from "./lambda-triggers.js";
import { disableSesInboundRulesets, reEnableSesInboundRulesets } from "./ses-inbound.js";
import { disableAllSnsSubscriptions, reEnableAllSnsSubscriptions } from "./sns-triggers.js";

export const allEnableFunctions: EnableDisableFunction[] =[ 
    reEnableCloudfronts,
    reEnableApiGatways,
    reEnableAllSnsSubscriptions,
    reEnableEventBridgeRules,
    reEnableSesInboundRulesets,
    reEnableAllLambdaTriggers
];

export const allDisableFunctions: EnableDisableFunction[] =[ 
    disableCloudfronts,
    disableApiGatways,
    disableAllSnsSubscriptions,
    disableEventBridgeRules,
    disableSesInboundRulesets,
    disableAllLambdaTriggers
];
