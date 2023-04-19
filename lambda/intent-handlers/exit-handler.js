import Alexa from "ask-sdk";

export const ExitHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

        return handlerInput.responseBuilder
            .speak(requestAttributes.t('EXIT_MESSAGE'))
            .withShouldEndSession(true)
            .getResponse();
    },
};