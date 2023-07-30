import { Context, SNSEvent } from "aws-lambda";
import { main } from "./killswitch.js";

debugger;
main({
    Records: [
        {
            Sns: {
                Message: "ENABLE"
            }
        }
    ]
} as SNSEvent, {} as Context).catch(e => {
    console.error(e);
    debugger;
})