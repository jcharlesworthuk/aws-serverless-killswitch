import { EnableDisableFunction, EnableDisableOptions } from "../models";
import { disableApiGatways, reEnableApiGatways } from "./api-gateway";
import { disableCloudfronts, reEnableCloudfronts } from "./cloudfront";
import { disableEventBridgeRules, reEnableEventBridgeRules } from "./eventbridge-rules";
import { disableAllLambdaTriggers, reEnableAllLambdaTriggers } from "./lambda-triggers";
import { disableSesInboundRulesets, reEnableSesInboundRulesets } from "./ses-inbound";
import { disableAllSnsSubscriptions, reEnableAllSnsSubscriptions } from "./sns-triggers";

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
