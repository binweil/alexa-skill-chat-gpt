import Alexa from 'ask-sdk';
import {AskingQuestionIntent} from "./intent-handlers/asking-question-intent/asking-question-intent.js";
import {BuySubsIntent} from "./intent-handlers/buy-subs-intent.js";
import {LaunchRequest} from "./intent-handlers/launch-request.js";
import {ExitHandler} from "./intent-handlers/exit-handler.js";
import {FallbackHandler} from "./intent-handlers/fall-back-handler.js";
import {SessionEndedRequest} from "./intent-handlers/session-ended-handler.js";
import {HelpIntent} from "./intent-handlers/help-intent.js";
import {LocalizationInterceptor} from "./interceptor/localization-interceptor.js";
import {CancelSubIntent} from "./intent-handlers/cancel-sub-intent.js";
import {UnhandledIntent} from "./intent-handlers/unhandled-intent.js";
import {ErrorHandler} from "./intent-handlers/error-handler.js";
import {NoIntentHandler, YesIntentHandler} from "./intent-handlers/yes-no-intent-handler.js";
import {APLUserEventHandler} from "./intent-handlers/apl-user-event-handler.js";
import {ImageSearchIntent} from "./intent-handlers/image-search-intent.js";
import {ClearContextIntentHandler} from "./intent-handlers/clear-context-intent.js";

const skillBuilder = Alexa.SkillBuilders.custom();

export const handler = skillBuilder
    .addRequestHandlers(
        LaunchRequest,
        HelpIntent,
        ImageSearchIntent,
        ClearContextIntentHandler,
        BuySubsIntent,
        CancelSubIntent,
        AskingQuestionIntent,
        YesIntentHandler,
        NoIntentHandler,
        ExitHandler,
        APLUserEventHandler,
        FallbackHandler,
        SessionEndedRequest,
        UnhandledIntent
    )
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();