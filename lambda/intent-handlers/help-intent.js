import Alexa from "ask-sdk";

const DOCUMENT_ID = "HelpListScreen";

const datasource = {
    "textListData": {
        "type": "object",
        "objectId": "helpListData",
        "listItems": [
            {
                "primaryText": "Chat with AI",
                "secondaryText": "ex. Why sky is blue",
                "primaryAction": [
                    {
                        "type": "SendEvent",
                        "arguments": [
                            "REDIRECT_ASKING_QUESTION_INTENT"
                        ]
                    }
                ]
            },
            {
                "primaryText": "Generate Image - Start your request with \"Show Image for\"",
                "secondaryText": "ex. Show Image for deep sea animal",
                "primaryAction": [
                    {
                        "type": "SendEvent",
                        "arguments": [
                            "REDIRECT_IMAGE_SEARCH_INTENT"
                        ]
                    }
                ]
            },
            {
                "primaryText": "Clear context",
                "secondaryText": "ex. restart",
                "primaryAction": [
                    {
                        "type": "SendEvent",
                        "arguments": [
                            "REDIRECT_CLEAR_CONTEXT_INTENT"
                        ]
                    }
                ]
            },
            {
                "primaryText": "Buy subscription",
                "secondaryText": "say \"buy monthly / yearly subscription\""
            },
            {
                "primaryText": "Cancel subscription",
                "secondaryText": "say \"cancel monthly / yearly subscription\""
            }
        ]
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

export const HelpIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID, datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(requestAttributes.t('HELP_MESSAGE'))
            .reprompt(requestAttributes.t('HELP_REPROMPT'))
            .getResponse();
    },
};
