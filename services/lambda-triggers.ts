import { CreateEventSourceMappingCommand, DeleteEventSourceMappingCommand, LambdaClient, ListEventSourceMappingsCommand, ListFunctionUrlConfigsCommand, ListFunctionsCommand, ListTagsCommand, UpdateFunctionUrlConfigCommand } from "@aws-sdk/client-lambda";
import { EnableDisableOptions } from "../models";

export async function disableAllLambdaTriggers({ state, dryRun }: EnableDisableOptions) {
    const lambda = new LambdaClient({ region: state.region });


    const functions = await lambda.send(new ListFunctionsCommand({}));

    for (let fn of functions.Functions!) {
        const urlConfigs = await lambda.send(new ListFunctionUrlConfigsCommand({
            FunctionName: fn.FunctionName!
        }));
        state.lambda[fn.FunctionName!] = {
            urls: [],
            eventSources: []
        }

        for (let urlConfig of (urlConfigs.FunctionUrlConfigs || [])) {
            console.log(urlConfig.FunctionUrl);
            if (urlConfig.AuthType !== 'NONE') {
                console.warn(`Cannot disable the function URL for ${fn.FunctionName} by adding IAM auth because it already has IAM auth!`);
                continue;
            }
            state.lambda[fn.FunctionName!].urls.push(urlConfig);
            if (!dryRun) {
                await lambda.send(new UpdateFunctionUrlConfigCommand({
                    FunctionName: fn.FunctionName,
                    AuthType: 'AWS_IAM'
                }));
            }
        }

        // This gets the mappings for ALL functions
        const eventSourceMappings = await lambda.send(new ListEventSourceMappingsCommand({
            FunctionName: fn.FunctionName
        }));
        // NOTE EventBridge and SNS triggers are not returned or set by this
        for (let eventSource of eventSourceMappings.EventSourceMappings!) {
            console.log(`Deleting event source mapping of ${eventSource.EventSourceArn}`);
            delete eventSource.DestinationConfig;
            state.lambda[fn.FunctionName!].eventSources.push(eventSource);
            if (!dryRun) {
                await lambda.send(new DeleteEventSourceMappingCommand({
                    UUID: eventSource.UUID
                }));
            }
        }
    }
}


export async function reEnableAllLambdaTriggers({ state, dryRun }: EnableDisableOptions) {
    const lambda = new LambdaClient({ region: state.region });

    for (let functionName in state.lambda) {
        const enableConfig = state.lambda[functionName];

        for (let url of enableConfig.urls) {
            console.log(`Making Function URL public for ${functionName}`);

            if (!dryRun) {
                await lambda.send(new UpdateFunctionUrlConfigCommand({
                    FunctionName: functionName,
                    AuthType: 'NONE'
                }));
            }
        }

        for(let eventSource of enableConfig.eventSources) {
            console.log(`Adding event source mapping of ${eventSource.EventSourceArn}`);
            if (!dryRun) {
                await lambda.send(new CreateEventSourceMappingCommand({
                    ...eventSource,
                    FunctionName: functionName
                }));
            }
        }


    }


}

