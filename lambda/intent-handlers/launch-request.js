import Alexa from "ask-sdk";

const DOCUMENT_ID = "HomeScreen";

const datasource = {
    "backgroundImage": {
        "imageSource": "https://d2s5tydsfac9v4.cloudfront.net/homepage.png"
    },
    "bottomPrompt": {
        "text": "Try \"Alexa, why sky is blue\""
    }
};

const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};

export const LaunchRequest = {
    canHandle(handlerInput) {
        return Alexa.isNewSession(handlerInput.requestEnvelope)
            || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        try {
            const { attributesManager } = handlerInput;
            const requestAttributes = attributesManager.getRequestAttributes();
            // const attributes = await attributesManager.getPersistentAttributes() || {};
            attributesManager.setSessionAttributes({
                interaction: 0,
                chatHistory: []
            });

            const speechOutput = requestAttributes.t('LAUNCH_MESSAGE');
            const reprompt = requestAttributes.t('CONTINUE_MESSAGE');

            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                const aplDirective = createDirectivePayload(DOCUMENT_ID, datasource);
                handlerInput.responseBuilder.addDirective(aplDirective);
            }

            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(reprompt)
                .getResponse();
        } catch (error) {
            console.error("Launch Request Error");
            console.error(JSON.stringify(error));
        }
    },
};