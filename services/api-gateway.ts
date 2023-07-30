import { APIGatewayClient, GetStageCommand, UpdateStageCommand, GetRestApisCommand, GetStagesCommand } from "@aws-sdk/client-api-gateway";
import { EnableDisableOptions } from "../models";

async function setApiGatewayLimits(apigateway: APIGatewayClient, restApiId: string, stageName: string, burstLimit: number, rateLimit: number, dryRun: boolean | undefined) {

    if (!dryRun) {
        const updateResponse = await apigateway.send(new UpdateStageCommand({
            restApiId,
            stageName,
            patchOperations: [{
                op: 'replace',
                path: '/*/*/throttling/burstLimit',
                value: burstLimit.toString()
            },
            {
                op: 'replace',
                path: '/*/*/throttling/rateLimit',
                value: rateLimit.toString()
            },
            ]
        }));
    }
}


async function setAllApiGatewayLimits(region: string, burstLimit: number, rateLimit: number, dryRun: boolean | undefined) {
    const apigateway = new APIGatewayClient({ region });

    const restApis = await apigateway.send(new GetRestApisCommand({}));
    if (!restApis || !restApis.items) {
        console.debug('No API Gateway APIs found');
        return;
    }
    const apiIds = restApis.items.map(a => a.id).filter(x => !!x).map(x => x as string);

    await Promise.all(apiIds.map(async (restApiId: string) => {
        const stages = (await apigateway.send(new GetStagesCommand({
            restApiId
        }))).item;
        if (!stages) return;
        await Promise.all(stages.filter(x => !!x && !!x.stageName).map(stage => setApiGatewayLimits(apigateway, restApiId, stage!.stageName!, burstLimit, rateLimit, dryRun)))
    }))

}

export function disableApiGatways({ state, dryRun }: EnableDisableOptions) {
    return setAllApiGatewayLimits(state.region, 0, 0, dryRun);
}

export function reEnableApiGatways({ state, dryRun }: EnableDisableOptions) {
    return setAllApiGatewayLimits(state.region, 5000, 10000, dryRun);
}