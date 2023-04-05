import Alexa from "ask-sdk";

export const ClearContextIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClearContextIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.chatHistory = [];

        return handlerInput.responseBuilder
            .speak(requestAttributes.t('CONTEXT_CLEAR_RESPONSE'))
            .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
            .getResponse();
    },
};
