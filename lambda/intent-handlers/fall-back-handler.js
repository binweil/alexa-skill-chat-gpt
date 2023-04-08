import Alexa from "ask-sdk";
import { FALL_BACK_INTENT } from "../constants/cloudwatch-constants.js";
import { addCount } from "../services/cloudwatch.js";

export const FallbackHandler = {
    canHandle(handlerInput) {
        // handle fallback intent, yes and no when playing a game
        // for yes and no, will only get here if and not caught by the normal intent handler
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent');
    },
    handle(handlerInput) {
        addCount(FALL_BACK_INTENT);
        const { attributesManager } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
    
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('FALLBACK_MESSAGE'))
            .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
            .getResponse();
    },
};
