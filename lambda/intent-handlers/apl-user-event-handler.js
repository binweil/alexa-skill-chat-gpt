import {LaunchRequest} from "./launch-request.js";
import {HelpIntent} from "./help-intent.js";
import {AskingQuestionIntent} from "./asking-question-intent.js";
import Alexa from "ask-sdk";
import {ImageSearchIntent} from "./image-search-intent.js";
import {BuySubsIntent} from "./buy-subs-intent.js";

export const APLUserEventHandler = {
    // Since an APL skill might have multiple buttons that generate UserEvents,
    // use the event source ID to determine the button press that triggered
    // this event and use the correct handler.
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent';
            // The source property contains information about the component that triggered the event, including the ID for the component
            // && handlerInput.requestEnvelope.request.source.id === 'buttonWithArguments';
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
            case ("REDIRECT_BUY_SUBS_INTENT"):
                return BuySubsIntent.handle(handlerInput);
            default:
                return LaunchRequest.handle(handlerInput);
        }
    }
};