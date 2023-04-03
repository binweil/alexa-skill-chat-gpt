import Alexa from "ask-sdk";

export const YesIntentHandler = {
    canHandle(handlerInput) {
        // handle fallback intent, yes and no when playing a game
        // for yes and no, will only get here if and not caught by the normal intent handler
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent');
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        return handlerInput.responseBuilder
            .speak(requestAttributes.t('YES_MESSAGE'))
            .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
            .getResponse();
    },
};


export const NoIntentHandler = {
    canHandle(handlerInput) {
        // handle fallback intent, yes and no when playing a game
        // for yes and no, will only get here if and not caught by the normal intent handler
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        return handlerInput.responseBuilder
            .speak(requestAttributes.t('EXIT_MESSAGE'))
            .getResponse();
    },
};