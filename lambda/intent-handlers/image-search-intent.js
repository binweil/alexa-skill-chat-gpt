import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import {ChatGPTAPI, openai} from "chatgpt";
import {getAPIDirective} from "./asking-question-intent/multi-modal-render.js";
import {isUserEntitled} from "../utilities/util.js";

const DOCUMENT_ID = "SearchImageScreen";

const datasource = {
    "fr-FR": {
        "imageListData": {
            "type": "object",
            "objectId": "imageList",
            "title": "Rechercher une image",
            "listItems": [
                {
                    "primaryText": "Essayez \"Alexa, montre l'image du trou noir\"",
                    "secondaryText": "",
                    "imageSource": "https://d2o906d8ln7ui1.cloudfront.net/images/templates_v3/paginatedlist/PaginatedList_Dark1.png",
                }
            ]
        }
    },
    "default": {
        "imageListData": {
            "type": "object",
            "objectId": "imageList",
            "title": "Search Image",
            "listItems": [
                {
                    "primaryText": "Try \"Alexa, show image for black hole\"",
                    "secondaryText": "",
                    "imageSource": "https://d2o906d8ln7ui1.cloudfront.net/images/templates_v3/paginatedlist/PaginatedList_Dark1.png",
                }
            ]
        }
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

export const ImageSearchIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SearchImageIntent';
    },
    async handle(handlerInput, imagePrompt) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);

        if (!Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('DEVICE_CAPABILITY_ERROR_MESSAGE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }

        let question = imagePrompt;
        if (imagePrompt == null || imagePrompt.length === 0) {
            question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'user_input');;
        }
        sessionAttributes.interaction += 1;

        const entitled = await isUserEntitled(handlerInput);
        if (sessionAttributes.interaction > 3 && !entitled) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('SUBSCRIPTION_UPSELL'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }

        let secretsManager = new AWS.SecretsManager({region: 'us-west-2'});
        const rawApiKey = await secretsManager.getSecretValue({SecretId: "chatgpt/apikey"}).promise();
        const apiKey = rawApiKey.SecretString;
        const api = new ChatGPTAPI({
            apiKey: apiKey
        });
        try {
            const customHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }

            // Image API Request
            const imageRequest = {
                "prompt": question,
                "n": 1,
                "size": "1024x1024"
            }
            const imageResponsePromise = fetch("https://api.openai.com/v1/images/generations", {
                method: 'POST',
                headers: customHeaders,
                body: JSON.stringify(imageRequest),
            });

            const [imageResponse, chatResponse] =
                await Promise.all([imageResponsePromise]);

            const imageURLData = await imageResponse.json();
            const imageURL = imageURLData.data[0].url
            console.log("Image Response: " + imageURL);

            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                let datasourceWithLocale = datasource.default;
                if (locale != null && datasource.hasOwnProperty(locale)){
                    datasourceWithLocale = datasource[locale];
                }

                datasourceWithLocale.imageListData.listItems[0].imageSource = imageURL;
                const aplDirective = createDirectivePayload(DOCUMENT_ID, datasourceWithLocale);
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('IMAGE_SEARCH_RESPONSE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        } catch (error) {
            console.log(error)
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('OPENAI_ERROR_MESSAGE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }
    }
}