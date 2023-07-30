import { Context, SNSEvent } from "aws-lambda";
import { CloudFrontClient, AssociateAliasCommand } from "@aws-sdk/client-cloudfront";
import { APIGatewayClient, GetStageCommand, UpdateStageCommand, GetRestApisCommand, GetStagesCommand } from "@aws-sdk/client-api-gateway";
import { disableApiGatways, reEnableApiGatways } from "./services/api-gateway.js";
import { disableCloudfronts, reEnableCloudfronts } from "./services/cloudfront.js";
import { disableAllLambdaTriggers, reEnableAllLambdaTriggers } from "./services/lambda-triggers.js";
import { disableEventBridgeRules, reEnableEventBridgeRules } from "./services/eventbridge-rules.js";
import { EnableDisableOptions, EnabledState } from "./models.js";
import { disableS3BucketNotifications } from "./services/s3-notifications.js";
import { disableSesInboundRulesets, reEnableSesInboundRulesets } from "./services/ses-inbound.js";
import { disableAllSnsSubscriptions, reEnableAllSnsSubscriptions } from "./services/sns-triggers.js";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { allDisableFunctions, allEnableFunctions } from "./services/all.js";

const regions = process.env.REGION_LIST!.split(',');

const stateFileKey = {
    Bucket: process.env.STATE_BUCKET,
    Key: 'killswitch-state.json',
}

export async function main(event: SNSEvent, context: Context) {
    console.log('EXECUTING FUNCTION...')
    console.log(context);
    console.log(event);
    console.log(event.Records[0].Sns);

    const message = event.Records[0].Sns.Message;
    const setEnabled = message === 'ENABLE';

    const state: EnabledState = setEnabled ? (await loadStateFromS3()) : {
        regions: regions.map(r => ({
            region: r,
            enabledSesRules: [],
            lambda: {},
            rules: [],
            s3Notifications: {},
            subscriptions: []
        })),
    };

    for (let regionState of state.regions) {
        const options: EnableDisableOptions = {
            dryRun: process.env.DRY_RUN !== "false",
            state: regionState
        };
        console.log(`Setting everything in ${regionState.region} to ${setEnabled ? 'enabled' : 'disabled'}`);
        const functions = setEnabled ? allEnableFunctions : allDisableFunctions;
        for (let fn of functions) {
            try {
                await fn(options);
            } catch (e) {
                console.error(e);
            }
        }
    }

    if (!setEnabled) {
        await saveStateInS3(state);
    }
    return 'ok';
};

async function saveStateInS3(state: EnabledState) {
    const s3 = new S3Client({});
    await s3.send(new PutObjectCommand({
        ...stateFileKey,
        Body: JSON.stringify(state)
    }));
}

async function loadStateFromS3() {
    const s3 = new S3Client({});
    const response = await s3.send(new GetObjectCommand({
        ...stateFileKey
    }));
    if (!response?.Body) throw new Error(`No state stored in S3!`);
    const responseString = await response.Body.transformToString();
    const result = JSON.parse(responseString) as EnabledState;
    await s3.send(new DeleteObjectCommand({
        ...stateFileKey
    }));
    return result;
}
