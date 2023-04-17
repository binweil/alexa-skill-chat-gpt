import Alexa from "ask-sdk";
import { addCount } from "../services/cloudwatch.js";

const SESSION_END_REQUEST = "SessionEndedRequest";

export const SessionEndedRequest = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        try {
            addCount(SESSION_END_REQUEST);
            const request = handlerInput.requestEnvelope.request;
            console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    
            if (handlerInput.requestEnvelope.request.reason === "ERROR") {
                console.log(`${request.reason}: ${request.error.type}, ${request.error.message}`);
            }
            return handlerInput.responseBuilder.getResponse();
        } catch (err) {
            console.error("SessionEndedRequest Error");
            console.error(err);
        }
    },
};