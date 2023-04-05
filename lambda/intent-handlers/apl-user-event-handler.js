import {LaunchRequest} from "./launch-request.js";
import {HelpIntent} from "./help-intent.js";
import {AskingQuestionIntent} from "./asking-question-intent.js";
import Alexa from "ask-sdk";
import {ImageSearchIntent} from "./image-search-intent.js";
import {BuySubsIntent} from "./buy-subs-intent.js";
import {ClearContextIntentHandler} from "./clear-context-intent.js";

export const APLUserEventHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent';
    },
    async handle(handlerInput) {
        // The arguments property contains an array of arguments defined in the arguments property of the SendEvent command
        const arg = handlerInput.requestEnvelope.request.arguments[0];
        switch (arg) {
            case ("REDIRECT_LAUNCH_REQUEST"):
                return LaunchRequest.handle(handlerInput);
            case ("REDIRECT_HELP_INTENT"):
                return HelpIntent.handle(handlerInput);
            case ("REDIRECT_ASKING_QUESTION_INTENT"):
                return AskingQuestionIntent.handle(handlerInput, "why sky is blue");
            case ("REDIRECT_IMAGE_SEARCH_INTENT"):
                return ImageSearchIntent.handle(handlerInput, "deep sea animal");
            case ("REDIRECT_CLEAR_CONTEXT_INTENT"):
                return ClearContextIntentHandler.handle(handlerInput);
            case ("REDIRECT_BUY_SUBS_INTENT"):
                return BuySubsIntent.handle(handlerInput);
            default:
                return LaunchRequest.handle(handlerInput);
        }
    }
};