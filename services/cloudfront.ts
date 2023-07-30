import { CloudFrontClient, AssociateAliasCommand, ListDistributionsCommand, GetDistributionConfigCommand, UpdateDistributionCommand } from "@aws-sdk/client-cloudfront";
import { EnableDisableOptions } from "../models";
import Timeout from "await-timeout";

async function setCloudfrontDistributionEnabled(cloudfront: CloudFrontClient, id: string, enabled: boolean, dryRun: boolean | undefined) {

    const config = await cloudfront.send(new GetDistributionConfigCommand({
        Id: id
    }));
    if (!config.DistributionConfig) throw new Error('No config found for CF distribution ' + id);
    const disabledConfig = { ...config.DistributionConfig, Enabled: enabled }
    const updateReq = new UpdateDistributionCommand({
        Id: id,
        DistributionConfig: disabledConfig,
        IfMatch: config.ETag
    });
    console.log('Will update cloudfront using this request:');
    console.log(updateReq);
    if (!dryRun) {
        await cloudfront.send(updateReq);
        await Timeout.set(2000); // CloudFront rate limits requests but not sure how much by!
    }
}


async function setCloudfrontsEnabled({ state, dryRun }: EnableDisableOptions, enabled: boolean) {
    const cloudfront = new CloudFrontClient({ region: state.region });


    const distributions = await cloudfront.send(new ListDistributionsCommand({}));
    if (!distributions || !distributions.DistributionList || !distributions.DistributionList.Items) {
        console.debug('No CF distributions found!');
        return;
    }
    await Promise.all(distributions.DistributionList.Items.map(d => setCloudfrontDistributionEnabled(cloudfront, d.Id!, enabled, dryRun)))
}

export function disableCloudfronts(options: EnableDisableOptions) {
    return setCloudfrontsEnabled(options, false);
}

export function reEnableCloudfronts(options: EnableDisableOptions) {
    return setCloudfrontsEnabled(options, true);
}

