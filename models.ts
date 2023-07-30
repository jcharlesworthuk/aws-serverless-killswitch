import { Rule } from "@aws-sdk/client-eventbridge"
import { EventSourceMappingConfiguration, FunctionUrlConfig } from "@aws-sdk/client-lambda"
import { NotificationConfiguration } from "@aws-sdk/client-s3"
import { ReceiptRule } from "@aws-sdk/client-ses"
import { Subscription } from "@aws-sdk/client-sns"

export type EnabledState = {
    regions: EnabledStateForRegion[]
}

export type EnabledStateForRegion = {
    region: string
    subscriptions: Subscription[]
    rules: Rule[]
    s3Notifications: {
        [bucketName: string]: NotificationConfiguration
    },
    enabledSesRules: ReceiptRule[],
    lambda: {
        [name: string]: {
            urls: FunctionUrlConfig[],
            eventSources: EventSourceMappingConfiguration[]
        },
    }
}

export type EnableDisableOptions = {
    state: EnabledStateForRegion, 
    dryRun?: boolean
}

export type EnableDisableFunction = ({ state, dryRun }: EnableDisableOptions) => Promise<void>;