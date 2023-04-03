import Alexa from "ask-sdk";
import CloudWatchClient from 'aws-sdk/clients/cloudwatch.js';
export const FallbackHandler = {
    canHandle(handlerInput) {
        // handle fallback intent, yes and no when playing a game
        // for yes and no, will only get here if and not caught by the normal intent handler
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent');
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        const client = new CloudWatchClient({region: "us-west-2"});
        client.putMetricData({
            MetricData: [
                {
                    MetricName: "FallBack Intent",
                    Dimensions: [{
                        Name: "Count",
                        Value: "Number",
                    }],
                    Unit: "Count",
                    Value: 1.0
                }
            ]
        })
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('FALLBACK_MESSAGE'))
            .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
            .getResponse();
    },
};
